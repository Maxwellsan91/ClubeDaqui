begin;

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint api_rate_limits_key_not_blank check (btrim(rate_key) <> ''),
  constraint api_rate_limits_count_positive check (request_count >= 0)
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  request_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_window_started timestamptz;
  v_count integer;
begin
  if p_key is null or btrim(p_key) = '' then
    raise exception 'Rate limit key is required';
  end if;
  if p_limit is null or p_limit <= 0 then
    raise exception 'Rate limit must be positive';
  end if;
  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'Rate limit window must be positive';
  end if;

  -- Serialize requests for the same key across all API instances.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select r.window_started_at, r.request_count
    into v_window_started, v_count
    from public.api_rate_limits as r
   where r.rate_key = p_key
   for update;

  if v_window_started is null
     or v_window_started + make_interval(secs => p_window_seconds) <= v_now then
    v_window_started := v_now;
    v_count := 1;
    insert into public.api_rate_limits(rate_key, window_started_at, request_count, updated_at)
    values (p_key, v_window_started, v_count, v_now)
    on conflict (rate_key) do update
      set window_started_at = excluded.window_started_at,
          request_count = excluded.request_count,
          updated_at = excluded.updated_at;
    return query select true, 0, v_count;
    return;
  end if;

  v_count := v_count + 1;
  update public.api_rate_limits as r
     set request_count = v_count, updated_at = v_now
   where r.rate_key = p_key;

  return query select
    v_count <= p_limit,
    greatest(1, ceil(extract(epoch from (
      v_window_started + make_interval(secs => p_window_seconds) - v_now
    )))::integer),
    v_count;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
  to service_role;

commit;
