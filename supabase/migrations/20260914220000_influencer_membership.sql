-- INFLUENCERs get a complimentary membership created automatically on first
-- benefit usage. This replaces the hard "Active membership required" error
-- for users with role=INFLUENCER.

create or replace function public.create_redemption_attempt(
  p_benefit_id uuid,
  p_business_location_id uuid
)
returns table (
  redemption_id uuid,
  token text,
  manual_code text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership public.memberships%rowtype;
  v_benefit public.benefits%rowtype;
  v_rules public.benefit_rules%rowtype;
  v_local_now timestamp;
  v_token text;
  v_manual_code text;
  v_redemption_id uuid;
  v_expires_at timestamptz;
  v_redeemed_count integer;
  v_profile_role text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  -- Check the user's role so INFLUENCERs can use benefits without paying
  select p.role::text into v_profile_role
  from public.profiles p
  where p.id = (select auth.uid());

  -- Find active membership
  select m.*
  into v_membership
  from public.memberships m
  where m.profile_id = (select auth.uid())
    and m.status = 'active'
    and m.starts_at <= now()
    and m.ends_at > now()
  order by m.ends_at desc
  limit 1
  for update;

  if not found then
    -- INFLUENCERs receive a complimentary 10-year membership on first use
    if v_profile_role = 'INFLUENCER' then
      insert into public.memberships (profile_id, status, source, starts_at, ends_at)
      values (
        (select auth.uid()),
        'active',
        'INFLUENCER_GRANT',
        now(),
        now() + interval '10 years'
      )
      returning * into v_membership;
    else
      raise exception 'Active membership required' using errcode = 'P0001';
    end if;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_membership.id::text || ':' || p_benefit_id::text, 0)
  );

  select b.*
  into v_benefit
  from public.benefits b
  join public.businesses bus on bus.id = b.business_id
  where b.id = p_benefit_id
    and b.is_active
    and bus.is_active;

  if not found then
    raise exception 'Benefit not available' using errcode = 'P0002';
  end if;

  select br.*
  into v_rules
  from public.benefit_rules br
  where br.benefit_id = p_benefit_id;

  if found then
    v_local_now := (now() at time zone coalesce(v_rules.timezone, 'UTC'))::timestamp;

    if v_rules.valid_from is not null and v_local_now::date < v_rules.valid_from then
      raise exception 'Benefit outside its validity period' using errcode = 'P0003';
    end if;
    if v_rules.valid_until is not null and v_local_now::date > v_rules.valid_until then
      raise exception 'Benefit outside its validity period' using errcode = 'P0003';
    end if;

    if v_rules.valid_days is not null then
      if not (extract(isodow from v_local_now)::int = any(v_rules.valid_days)) then
        raise exception 'Benefit not available today' using errcode = 'P0004';
      end if;
    end if;

    if v_rules.time_start is not null and v_local_now::time < v_rules.time_start then
      raise exception 'Benefit not available at this time' using errcode = 'P0005';
    end if;
    if v_rules.time_end is not null and v_local_now::time > v_rules.time_end then
      raise exception 'Benefit not available at this time' using errcode = 'P0005';
    end if;

    select count(*)::int
    into v_redeemed_count
    from public.redemptions r
    where r.membership_id = v_membership.id
      and r.benefit_id = p_benefit_id
      and r.status = 'redeemed';

    if v_redeemed_count >= v_rules.membership_cycle_limit then
      raise exception 'Benefit usage limit reached for this membership cycle'
        using errcode = 'P0006';
    end if;
  end if;

  -- Expire any pending codes for this member+benefit
  update public.redemptions
  set status = 'expired', updated_at = now()
  where membership_id = v_membership.id
    and benefit_id = p_benefit_id
    and status = 'pending';

  v_token := encode(pg_catalog.gen_random_bytes(16), 'hex');
  v_manual_code := lpad((floor(random() * 1000000))::text, 6, '0');
  v_expires_at := now() + interval '5 minutes';
  v_redemption_id := gen_random_uuid();

  insert into public.redemptions (
    id,
    membership_id,
    benefit_id,
    business_location_id,
    status,
    token,
    manual_code,
    expires_at
  ) values (
    v_redemption_id,
    v_membership.id,
    p_benefit_id,
    p_business_location_id,
    'pending',
    v_token,
    v_manual_code,
    v_expires_at
  );

  return query select v_redemption_id, v_token, v_manual_code, v_expires_at;
end;
$$;