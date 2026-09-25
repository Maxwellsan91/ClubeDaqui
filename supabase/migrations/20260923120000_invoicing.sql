begin;

create type public.fiscal_document_type as enum ('INVOICE_RECEIPT', 'CREDIT_NOTE');
create type public.fiscal_document_status as enum (
  'PENDING', 'ISSUING', 'ISSUED', 'FAILED', 'CANCELLED', 'CREDITED'
);

alter table public.memberships
  add constraint memberships_id_profile_unique unique (id, profile_id);

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  stripe_object_id text,
  livemode boolean not null,
  status text not null check (status in ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.invoicing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  provider text not null check (btrim(provider) <> ''),
  external_client_id text,
  external_code text not null check (btrim(external_code) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider),
  unique (provider, external_code),
  unique (provider, external_client_id)
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  membership_id uuid not null,
  payment_id uuid not null,
  original_document_id uuid references public.fiscal_documents (id) on delete restrict,
  provider text not null check (btrim(provider) <> ''),
  document_type public.fiscal_document_type not null,
  status public.fiscal_document_status not null default 'PENDING',
  idempotency_key uuid not null default gen_random_uuid(),
  source_reference text not null check (btrim(source_reference) <> ''),
  external_document_id text,
  external_client_id text,
  document_number text,
  sequence_id text,
  subtotal numeric(12, 2),
  tax_amount numeric(12, 2),
  total_amount numeric(12, 2),
  currency text not null,
  pdf_url text,
  permalink text,
  issued_at timestamptz,
  retry_count integer not null default 0 check (retry_count >= 0),
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  processing_started_at timestamptz,
  last_error_code text,
  last_error_message text,
  email_status text not null default 'NOT_REQUESTED'
    check (email_status in ('NOT_REQUESTED', 'PENDING', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN')),
  email_sent_at timestamptz,
  last_email_error text,
  customer_snapshot jsonb not null,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fiscal_documents_user_membership_fk
    foreign key (membership_id, user_id)
    references public.memberships (id, profile_id) on delete restrict,
  constraint fiscal_documents_payment_membership_fk
    foreign key (payment_id, membership_id)
    references public.payments (id, membership_id) on delete restrict,
  constraint fiscal_documents_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint fiscal_documents_amounts_non_negative check (
    (subtotal is null or subtotal >= 0)
    and (tax_amount is null or tax_amount >= 0)
    and (total_amount is null or total_amount >= 0)
  ),
  constraint fiscal_documents_credit_owner check (
    (document_type = 'INVOICE_RECEIPT' and original_document_id is null)
    or (document_type = 'CREDIT_NOTE' and original_document_id is not null)
  ),
  unique (provider, idempotency_key),
  unique (provider, source_reference)
);

create unique index fiscal_documents_one_invoice_per_payment_uidx
  on public.fiscal_documents (payment_id)
  where document_type = 'INVOICE_RECEIPT';
create unique index fiscal_documents_external_id_uidx
  on public.fiscal_documents (provider, external_document_id)
  where external_document_id is not null;
create index fiscal_documents_user_issued_idx
  on public.fiscal_documents (user_id, issued_at desc);
create index fiscal_documents_retry_idx
  on public.fiscal_documents (status, next_retry_at)
  where status in ('PENDING', 'FAILED');

create trigger stripe_webhook_events_set_updated_at
  before update on public.stripe_webhook_events
  for each row execute function private.set_updated_at();
create trigger invoicing_customers_set_updated_at
  before update on public.invoicing_customers
  for each row execute function private.set_updated_at();
create trigger fiscal_documents_set_updated_at
  before update on public.fiscal_documents
  for each row execute function private.set_updated_at();

create or replace function public.record_stripe_payment_succeeded(
  p_stripe_event_id text,
  p_event_type text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_payment_id uuid,
  p_membership_id uuid,
  p_amount_cents bigint,
  p_currency text,
  p_paid_at timestamptz,
  p_customer_email text,
  p_livemode boolean
)
returns table (
  payment_id uuid,
  membership_id uuid,
  fiscal_document_id uuid,
  already_processed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments%rowtype;
  v_membership public.memberships%rowtype;
  v_document_id uuid;
  v_event_status text;
  v_profile public.profiles%rowtype;
begin
  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'Confirmed Stripe amount must be positive';
  end if;
  if upper(p_currency) !~ '^[A-Z]{3}$' then
    raise exception 'Invalid Stripe currency';
  end if;

  insert into public.stripe_webhook_events (
    stripe_event_id, event_type, stripe_object_id, livemode, status
  ) values (
    p_stripe_event_id, p_event_type, p_checkout_session_id, p_livemode, 'RECEIVED'
  )
  on conflict (stripe_event_id) do update
    set attempt_count = public.stripe_webhook_events.attempt_count + 1
  returning status into v_event_status;

  select * into v_payment
  from public.payments
  where id = p_payment_id and membership_id = p_membership_id
  for update;
  if not found then raise exception 'Payment does not match membership'; end if;
  if v_payment.provider_checkout_session_id is distinct from p_checkout_session_id then
    raise exception 'Checkout session does not match payment';
  end if;

  select * into v_membership
  from public.memberships
  where id = p_membership_id
  for update;
  if not found then raise exception 'Membership not found'; end if;

  select * into v_profile from public.profiles where id = v_membership.profile_id;

  if v_payment.status = 'paid' then
    if v_payment.amount_cents <> p_amount_cents
      or v_payment.currency <> upper(p_currency)
    then
      raise exception 'Confirmed payment data does not match stored payment';
    end if;
    select id into v_document_id from public.fiscal_documents
    where provider = 'invoicexpress'
      and source_reference = 'stripe:payment:' || p_payment_id::text;
    update public.stripe_webhook_events set
      status = 'PROCESSED', processed_at = coalesce(processed_at, now()), last_error = null
    where stripe_event_id = p_stripe_event_id;
    return query select p_payment_id, p_membership_id, v_document_id, true;
    return;
  end if;
  if v_payment.status <> 'pending' or v_membership.status <> 'pending' then
    raise exception 'Payment or membership is not pending';
  end if;

  update public.payments set
    status = 'paid',
    amount_cents = p_amount_cents,
    currency = upper(p_currency),
    paid_at = coalesce(paid_at, p_paid_at),
    provider_payment_intent_id = coalesce(provider_payment_intent_id, p_payment_intent_id)
  where id = p_payment_id;

  update public.memberships set
    status = 'active',
    starts_at = p_paid_at,
    ends_at = p_paid_at + interval '12 months'
  where id = p_membership_id and status in ('pending', 'active');

  insert into public.fiscal_documents (
    user_id, membership_id, payment_id, provider, document_type, status,
    source_reference, currency, customer_snapshot
  ) values (
    v_membership.profile_id, p_membership_id, p_payment_id, 'invoicexpress',
    'INVOICE_RECEIPT', 'PENDING', 'stripe:payment:' || p_payment_id::text,
    upper(p_currency),
    jsonb_strip_nulls(jsonb_build_object(
      'name', v_profile.full_name,
      'email', p_customer_email,
      'fiscal_id', v_profile.nif,
      'code', 'CLUBE_USER_' || v_membership.profile_id::text
    ))
  )
  on conflict (provider, source_reference) do nothing;

  select id into v_document_id from public.fiscal_documents
  where provider = 'invoicexpress'
    and source_reference = 'stripe:payment:' || p_payment_id::text;

  update public.stripe_webhook_events set
    status = 'PROCESSED', processed_at = coalesce(processed_at, now()), last_error = null
  where stripe_event_id = p_stripe_event_id;

  return query select p_payment_id, p_membership_id, v_document_id,
    v_event_status = 'PROCESSED';
end;
$$;

create or replace function public.claim_fiscal_document(
  p_document_id uuid,
  p_force boolean default false
)
returns setof public.fiscal_documents
language sql
security definer
set search_path = ''
as $$
  update public.fiscal_documents
  set status = 'ISSUING',
      retry_count = retry_count + 1,
      last_attempt_at = now(),
      processing_started_at = now(),
      next_retry_at = null,
      last_error_code = null,
      last_error_message = null
  where id = p_document_id
    and (
      status = 'PENDING'
      or (status = 'FAILED' and (p_force or next_retry_at is null or next_retry_at <= now()))
      or (status = 'ISSUING' and processing_started_at < now() - interval '15 minutes')
    )
  returning *;
$$;

revoke all on function public.record_stripe_payment_succeeded(
  text, text, text, text, uuid, uuid, bigint, text, timestamptz, text, boolean
) from public, anon, authenticated;
revoke all on function public.claim_fiscal_document(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.record_stripe_payment_succeeded(
  text, text, text, text, uuid, uuid, bigint, text, timestamptz, text, boolean
) to service_role;
grant execute on function public.claim_fiscal_document(uuid, boolean) to service_role;

alter table public.stripe_webhook_events enable row level security;
alter table public.invoicing_customers enable row level security;
alter table public.fiscal_documents enable row level security;

grant select (
  id, membership_id, payment_id, provider, document_type, status,
  document_number, subtotal, tax_amount, total_amount, currency,
  permalink, issued_at, created_at, updated_at
) on public.fiscal_documents to authenticated;

create policy "members read own fiscal documents"
on public.fiscal_documents for select to authenticated
using (user_id = (select auth.uid()));
create policy "admins read fiscal documents"
on public.fiscal_documents for select to authenticated
using ((select private.is_admin()));

commit;
