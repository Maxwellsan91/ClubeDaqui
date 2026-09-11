begin;

create schema if not exists extensions;
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('MEMBER', 'PARTNER', 'ADMIN');
create type public.membership_status as enum (
  'pending',
  'active',
  'expired',
  'cancelled',
  'refunded'
);
create type public.benefit_type as enum (
  'BUY_ONE_GET_ONE',
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FREE_ITEM',
  'SPECIAL_PRICE',
  'CUSTOM'
);
create type public.redemption_status as enum ('pending', 'redeemed', 'expired');
create type public.review_status as enum ('pending', 'published', 'hidden');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'MEMBER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_not_blank
    check (full_name is null or btrim(full_name) <> ''),
  constraint profiles_phone_not_blank
    check (phone is null or btrim(phone) <> '')
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.membership_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_valid_period check (ends_at > starts_at)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete restrict,
  provider text not null default 'stripe',
  provider_checkout_session_id text unique,
  provider_payment_intent_id text unique,
  amount_cents bigint not null,
  currency text not null default 'EUR',
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_supported check (provider = 'stripe'),
  constraint payments_amount_non_negative check (amount_cents >= 0),
  constraint payments_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint payments_status_not_blank check (btrim(status) <> ''),
  unique (id, membership_id)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website_url text,
  email text,
  phone text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_name_not_blank check (btrim(name) <> ''),
  constraint businesses_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  name text not null,
  slug text not null,
  address_line_1 text not null,
  address_line_2 text,
  postal_code text not null,
  locality text not null,
  municipality text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  phone text,
  email text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_locations_name_not_blank check (btrim(name) <> ''),
  constraint business_locations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint business_locations_latitude_range
    check (latitude is null or latitude between -90 and 90),
  constraint business_locations_longitude_range
    check (longitude is null or longitude between -180 and 180),
  constraint business_locations_coordinates_pair
    check ((latitude is null) = (longitude is null)),
  unique (business_id, slug),
  unique (id, business_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.business_categories (
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (business_id, category_id)
);

create table public.partner_users (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, business_id)
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete restrict,
  business_location_id uuid,
  type public.benefit_type not null,
  title text not null,
  description text,
  terms text,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benefits_location_belongs_to_business
    foreign key (business_location_id, business_id)
    references public.business_locations (id, business_id)
    on delete restrict,
  constraint benefits_title_not_blank check (btrim(title) <> ''),
  constraint benefits_valid_period
    check (valid_until is null or valid_from is null or valid_until > valid_from)
);

create table public.benefit_rules (
  benefit_id uuid primary key references public.benefits (id) on delete cascade,
  allowed_weekdays smallint[] not null default array[0, 1, 2, 3, 4, 5, 6]::smallint[],
  starts_at time,
  ends_at time,
  reservation_required boolean not null default false,
  excluded_dates date[] not null default '{}',
  daily_limit integer,
  membership_cycle_limit integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benefit_rules_weekdays_valid
    check (
      cardinality(allowed_weekdays) > 0
      and allowed_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    ),
  constraint benefit_rules_time_pair
    check ((starts_at is null) = (ends_at is null)),
  constraint benefit_rules_daily_limit_positive
    check (daily_limit is null or daily_limit > 0),
  constraint benefit_rules_cycle_limit_positive check (membership_cycle_limit > 0)
);

create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete restrict,
  benefit_id uuid not null references public.benefits (id) on delete restrict,
  business_location_id uuid not null references public.business_locations (id) on delete restrict,
  status public.redemption_status not null default 'pending',
  token_hash text not null unique,
  manual_code text not null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  validated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint redemptions_token_hash_format check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint redemptions_manual_code_format check (manual_code ~ '^[0-9]{6}$'),
  constraint redemptions_expiry_after_creation check (expires_at > created_at),
  constraint redemptions_status_fields check (
    (
      status in ('pending', 'expired')
      and redeemed_at is null
      and validated_by is null
    )
    or (
      status = 'redeemed'
      and redeemed_at is not null
      and validated_by is not null
    )
  )
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  redemption_id uuid not null unique references public.redemptions (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  business_location_id uuid not null references public.business_locations (id) on delete restrict,
  food_rating smallint not null,
  service_rating smallint not null,
  ambience_rating smallint not null,
  value_rating smallint not null,
  recommended_item text,
  comment text,
  status public.review_status not null default 'pending',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_food_rating_range check (food_rating between 1 and 5),
  constraint reviews_service_rating_range check (service_rating between 1 and 5),
  constraint reviews_ambience_rating_range check (ambience_rating between 1 and 5),
  constraint reviews_value_rating_range check (value_rating between 1 and 5),
  constraint reviews_recommended_item_not_blank
    check (recommended_item is null or btrim(recommended_item) <> ''),
  constraint reviews_comment_not_blank check (comment is null or btrim(comment) <> ''),
  constraint reviews_published_at_consistent check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

create table public.favorites (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, business_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  business_location_id uuid references public.business_locations (id) on delete restrict,
  title text not null,
  slug text not null unique,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  external_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_title_not_blank check (btrim(title) <> ''),
  constraint events_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint events_valid_period check (ends_at is null or ends_at > starts_at)
);

create table public.referral_partners (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_partners_name_not_blank check (btrim(name) <> '')
);

create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  referral_partner_id uuid not null references public.referral_partners (id) on delete restrict,
  code text not null,
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_codes_uppercase check (code = upper(code)),
  constraint referral_codes_format check (code ~ '^[A-Z0-9_-]+$'),
  constraint referral_codes_valid_period
    check (valid_until is null or valid_from is null or valid_until > valid_from),
  unique (id, referral_partner_id)
);

create unique index referral_codes_code_lower_uidx
  on public.referral_codes (lower(code));

create table public.referral_conversions (
  id uuid primary key default gen_random_uuid(),
  referral_partner_id uuid not null references public.referral_partners (id) on delete restrict,
  referral_code_id uuid not null,
  membership_id uuid not null unique references public.memberships (id) on delete restrict,
  payment_id uuid not null unique,
  converted_at timestamptz not null default now(),
  constraint referral_conversions_code_partner
    foreign key (referral_code_id, referral_partner_id)
    references public.referral_codes (id, referral_partner_id)
    on delete restrict,
  constraint referral_conversions_payment_membership
    foreign key (payment_id, membership_id)
    references public.payments (id, membership_id)
    on delete restrict
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  referral_conversion_id uuid not null unique
    references public.referral_conversions (id) on delete restrict,
  amount_cents bigint not null,
  currency text not null default 'EUR',
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commissions_amount_non_negative check (amount_cents >= 0),
  constraint commissions_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint commissions_status_not_blank check (btrim(status) <> '')
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> '')
);

create unique index memberships_one_active_per_profile_uidx
  on public.memberships (profile_id)
  where status = 'active';

create index memberships_profile_status_idx
  on public.memberships (profile_id, status);
create index payments_membership_idx on public.payments (membership_id);
create index business_locations_discovery_idx
  on public.business_locations (municipality, locality)
  where is_active;
create index business_locations_business_idx
  on public.business_locations (business_id);
create index business_categories_category_idx
  on public.business_categories (category_id, business_id);
create index partner_users_business_idx
  on public.partner_users (business_id, profile_id);
create index benefits_business_active_idx
  on public.benefits (business_id, business_location_id)
  where is_active;
create index redemptions_membership_status_idx
  on public.redemptions (membership_id, status);
create index redemptions_benefit_redeemed_idx
  on public.redemptions (benefit_id, redeemed_at)
  where status = 'redeemed';
create index redemptions_location_redeemed_idx
  on public.redemptions (business_location_id, redeemed_at)
  where status = 'redeemed';
create index redemptions_expiry_idx
  on public.redemptions (expires_at)
  where status = 'pending';
create unique index redemptions_one_pending_per_cycle_benefit_uidx
  on public.redemptions (membership_id, benefit_id)
  where status = 'pending';
create unique index redemptions_pending_manual_code_uidx
  on public.redemptions (manual_code)
  where status = 'pending';
create index reviews_location_published_idx
  on public.reviews (business_location_id, published_at desc)
  where status = 'published';
create index favorites_business_idx on public.favorites (business_id);
create index events_published_starts_idx
  on public.events (starts_at)
  where is_published;
create index referral_codes_partner_idx
  on public.referral_codes (referral_partner_id);
create index audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx
  on public.audit_logs (actor_profile_id, created_at desc);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger memberships_set_updated_at before update on public.memberships
  for each row execute function private.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function private.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses
  for each row execute function private.set_updated_at();
create trigger business_locations_set_updated_at before update on public.business_locations
  for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger benefits_set_updated_at before update on public.benefits
  for each row execute function private.set_updated_at();
create trigger benefit_rules_set_updated_at before update on public.benefit_rules
  for each row execute function private.set_updated_at();
create trigger redemptions_set_updated_at before update on public.redemptions
  for each row execute function private.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function private.set_updated_at();
create trigger events_set_updated_at before update on public.events
  for each row execute function private.set_updated_at();
create trigger referral_partners_set_updated_at before update on public.referral_partners
  for each row execute function private.set_updated_at();
create trigger referral_codes_set_updated_at before update on public.referral_codes
  for each row execute function private.set_updated_at();
create trigger commissions_set_updated_at before update on public.commissions
  for each row execute function private.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.validate_review_redemption()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.redemptions r
    join public.memberships m on m.id = r.membership_id
    where r.id = new.redemption_id
      and r.status = 'redeemed'
      and m.profile_id = new.profile_id
      and r.business_location_id = new.business_location_id
  ) then
    raise exception 'Review requires a matching redeemed benefit'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger reviews_validate_redemption
  before insert or update of redemption_id, profile_id, business_location_id
  on public.reviews
  for each row execute function private.validate_review_redemption();

create function private.create_default_benefit_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.benefit_rules (benefit_id) values (new.id);
  return new;
end;
$$;

create trigger benefits_create_default_rules
  after insert on public.benefits
  for each row execute function private.create_default_benefit_rules();

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'ADMIN'
  );
$$;

create function private.is_partner_for_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.partner_users pu
    join public.profiles p on p.id = pu.profile_id
    where pu.profile_id = (select auth.uid())
      and pu.business_id = p_business_id
      and p.role = 'PARTNER'
  );
$$;

create function private.is_partner_for_location(p_location_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_locations bl
    where bl.id = p_location_id
      and private.is_partner_for_business(bl.business_id)
  );
$$;

create function public.create_redemption_attempt(
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
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

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
    raise exception 'Active membership required' using errcode = 'P0001';
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
    and bus.is_active
  for update of b;

  if not found then
    raise exception 'Benefit is not available' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.business_locations bl
    where bl.id = p_business_location_id
      and bl.business_id = v_benefit.business_id
      and bl.is_active
      and (
        v_benefit.business_location_id is null
        or v_benefit.business_location_id = bl.id
      )
  ) then
    raise exception 'Business location is not available for this benefit'
      using errcode = 'P0001';
  end if;

  if (v_benefit.valid_from is not null and v_benefit.valid_from > now())
    or (v_benefit.valid_until is not null and v_benefit.valid_until <= now()) then
    raise exception 'Benefit is outside its validity period' using errcode = 'P0001';
  end if;

  select br.* into strict v_rules
  from public.benefit_rules br
  where br.benefit_id = v_benefit.id;

  v_local_now := pg_catalog.timezone('Europe/Lisbon', now());

  if not (extract(dow from v_local_now)::smallint = any(v_rules.allowed_weekdays)) then
    raise exception 'Benefit is not available today' using errcode = 'P0001';
  end if;

  if v_local_now::date = any(v_rules.excluded_dates) then
    raise exception 'Benefit is excluded on this date' using errcode = 'P0001';
  end if;

  if v_rules.starts_at is not null then
    if v_rules.starts_at <= v_rules.ends_at then
      if v_local_now::time < v_rules.starts_at
        or v_local_now::time > v_rules.ends_at then
        raise exception 'Benefit is not available at this time' using errcode = 'P0001';
      end if;
    elsif v_local_now::time < v_rules.starts_at
      and v_local_now::time > v_rules.ends_at then
      raise exception 'Benefit is not available at this time' using errcode = 'P0001';
    end if;
  end if;

  select count(*)::integer
  into v_redeemed_count
  from public.redemptions r
  where r.membership_id = v_membership.id
    and r.benefit_id = v_benefit.id
    and r.status = 'redeemed';

  if v_redeemed_count >= v_rules.membership_cycle_limit then
    raise exception 'Benefit usage limit reached for this membership cycle'
      using errcode = 'P0001';
  end if;

  if v_rules.daily_limit is not null then
    select count(*)::integer
    into v_redeemed_count
    from public.redemptions r
    where r.benefit_id = v_benefit.id
      and r.status = 'redeemed'
      and pg_catalog.timezone('Europe/Lisbon', r.redeemed_at)::date = v_local_now::date;

    if v_redeemed_count >= v_rules.daily_limit then
      raise exception 'Benefit daily limit reached' using errcode = 'P0001';
    end if;
  end if;

  update public.redemptions
  set status = 'expired'
  where membership_id = v_membership.id
    and benefit_id = v_benefit.id
    and status = 'pending';

  v_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');

  loop
    v_manual_code := pg_catalog.lpad(
      pg_catalog.floor(pg_catalog.random() * 1000000)::integer::text,
      6,
      '0'
    );
    exit when not exists (
      select 1
      from public.redemptions r
      where r.manual_code = v_manual_code
        and r.status = 'pending'
    );
  end loop;

  insert into public.redemptions (
    membership_id,
    benefit_id,
    business_location_id,
    token_hash,
    manual_code,
    expires_at
  )
  values (
    v_membership.id,
    v_benefit.id,
    p_business_location_id,
    pg_catalog.encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_manual_code,
    now() + interval '5 minutes'
  )
  returning id, public.redemptions.expires_at
  into v_redemption_id, v_expires_at;

  return query select v_redemption_id, v_token, v_manual_code, v_expires_at;
end;
$$;

create function public.get_redemption_preview(
  p_token text default null,
  p_manual_code text default null
)
returns table (
  redemption_id uuid,
  member_name text,
  benefit_title text,
  benefit_terms text,
  business_location_name text,
  reservation_required boolean,
  allowed_weekdays smallint[],
  starts_at time,
  ends_at time,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (p_token is null) = (p_manual_code is null) then
    raise exception 'Provide either token or manual code' using errcode = '22023';
  end if;

  return query
  select
    r.id,
    p.full_name,
    b.title,
    b.terms,
    bl.name,
    br.reservation_required,
    br.allowed_weekdays,
    br.starts_at,
    br.ends_at,
    r.expires_at
  from public.redemptions r
  join public.memberships m on m.id = r.membership_id
  join public.profiles p on p.id = m.profile_id
  join public.benefits b on b.id = r.benefit_id
  join public.benefit_rules br on br.benefit_id = b.id
  join public.business_locations bl on bl.id = r.business_location_id
  where r.status = 'pending'
    and r.expires_at > now()
    and private.is_partner_for_business(bl.business_id)
    and (
      (p_token is not null and r.token_hash = pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex'))
      or (p_manual_code is not null and r.manual_code = p_manual_code)
    );
end;
$$;

create function public.confirm_redemption(
  p_token text default null,
  p_manual_code text default null
)
returns table (
  redemption_id uuid,
  redemption_status public.redemption_status,
  benefit_id uuid,
  business_location_id uuid,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_redemption public.redemptions%rowtype;
  v_membership public.memberships%rowtype;
  v_benefit public.benefits%rowtype;
  v_rules public.benefit_rules%rowtype;
  v_location public.business_locations%rowtype;
  v_local_now timestamp;
  v_redeemed_count integer;
  v_redeemed_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (p_token is null) = (p_manual_code is null) then
    raise exception 'Provide either token or manual code' using errcode = '22023';
  end if;

  select r.*
  into v_redemption
  from public.redemptions r
  where r.status = 'pending'
    and (
      (p_token is not null and r.token_hash = pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex'))
      or (p_manual_code is not null and r.manual_code = p_manual_code)
    )
  for update;

  if not found then
    raise exception 'Pending redemption not found' using errcode = 'P0001';
  end if;

  if v_redemption.expires_at <= now() then
    raise exception 'Redemption has expired' using errcode = 'P0001';
  end if;

  select bl.* into strict v_location
  from public.business_locations bl
  where bl.id = v_redemption.business_location_id;

  if not private.is_partner_for_business(v_location.business_id) then
    raise exception 'Partner is not associated with this business'
      using errcode = '42501';
  end if;

  select m.* into strict v_membership
  from public.memberships m
  where m.id = v_redemption.membership_id
  for update;

  select b.* into strict v_benefit
  from public.benefits b
  where b.id = v_redemption.benefit_id
  for update;

  select br.* into strict v_rules
  from public.benefit_rules br
  where br.benefit_id = v_benefit.id;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_membership.id::text || ':' || v_benefit.id::text, 0)
  );

  if v_membership.status <> 'active'
    or v_membership.starts_at > now()
    or v_membership.ends_at <= now() then
    raise exception 'Membership is not active' using errcode = 'P0001';
  end if;

  if not v_benefit.is_active
    or not v_location.is_active
    or v_benefit.business_id <> v_location.business_id
    or (
      v_benefit.business_location_id is not null
      and v_benefit.business_location_id <> v_location.id
    )
    or not exists (
      select 1 from public.businesses bus
      where bus.id = v_benefit.business_id and bus.is_active
    ) then
    raise exception 'Benefit or business is not active' using errcode = 'P0001';
  end if;

  if (v_benefit.valid_from is not null and v_benefit.valid_from > now())
    or (v_benefit.valid_until is not null and v_benefit.valid_until <= now()) then
    raise exception 'Benefit is outside its validity period' using errcode = 'P0001';
  end if;

  v_local_now := pg_catalog.timezone('Europe/Lisbon', now());

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_benefit.id::text || ':' || v_local_now::date::text, 0)
  );

  if not (extract(dow from v_local_now)::smallint = any(v_rules.allowed_weekdays))
    or v_local_now::date = any(v_rules.excluded_dates) then
    raise exception 'Benefit is not available today' using errcode = 'P0001';
  end if;

  if v_rules.starts_at is not null then
    if v_rules.starts_at <= v_rules.ends_at then
      if v_local_now::time < v_rules.starts_at
        or v_local_now::time > v_rules.ends_at then
        raise exception 'Benefit is not available at this time' using errcode = 'P0001';
      end if;
    elsif v_local_now::time < v_rules.starts_at
      and v_local_now::time > v_rules.ends_at then
      raise exception 'Benefit is not available at this time' using errcode = 'P0001';
    end if;
  end if;

  select count(*)::integer into v_redeemed_count
  from public.redemptions r
  where r.membership_id = v_membership.id
    and r.benefit_id = v_benefit.id
    and r.status = 'redeemed';

  if v_redeemed_count >= v_rules.membership_cycle_limit then
    raise exception 'Benefit usage limit reached for this membership cycle'
      using errcode = 'P0001';
  end if;

  if v_rules.daily_limit is not null then
    select count(*)::integer into v_redeemed_count
    from public.redemptions r
    where r.benefit_id = v_benefit.id
      and r.status = 'redeemed'
      and pg_catalog.timezone('Europe/Lisbon', r.redeemed_at)::date = v_local_now::date;

    if v_redeemed_count >= v_rules.daily_limit then
      raise exception 'Benefit daily limit reached' using errcode = 'P0001';
    end if;
  end if;

  update public.redemptions r
  set
    status = 'redeemed',
    redeemed_at = now(),
    validated_by = (select auth.uid())
  where r.id = v_redemption.id
    and r.status = 'pending'
  returning r.redeemed_at into v_redeemed_at;

  if not found then
    raise exception 'Redemption was already processed' using errcode = 'P0001';
  end if;

  return query
  select
    v_redemption.id,
    'redeemed'::public.redemption_status,
    v_redemption.benefit_id,
    v_redemption.business_location_id,
    v_redeemed_at;
end;
$$;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_partner_for_business(uuid) to authenticated;
grant execute on function private.is_partner_for_location(uuid) to authenticated;

revoke all on function public.create_redemption_attempt(uuid, uuid) from public, anon;
revoke all on function public.get_redemption_preview(text, text) from public, anon;
revoke all on function public.confirm_redemption(text, text) from public, anon;
grant execute on function public.create_redemption_attempt(uuid, uuid) to authenticated;
grant execute on function public.get_redemption_preview(text, text) to authenticated;
grant execute on function public.confirm_redemption(text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.businesses enable row level security;
alter table public.business_locations enable row level security;
alter table public.categories enable row level security;
alter table public.business_categories enable row level security;
alter table public.partner_users enable row level security;
alter table public.benefits enable row level security;
alter table public.benefit_rules enable row level security;
alter table public.redemptions enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.events enable row level security;
alter table public.referral_partners enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_conversions enable row level security;
alter table public.commissions enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;

grant select on public.businesses, public.business_locations, public.categories,
  public.business_categories, public.benefits, public.benefit_rules,
  public.events to anon, authenticated;
grant select (
  id,
  business_location_id,
  food_rating,
  service_rating,
  ambience_rating,
  value_rating,
  recommended_item,
  comment,
  status,
  published_at,
  created_at
) on public.reviews to anon;
grant select on public.reviews to authenticated;
grant select on public.profiles, public.memberships, public.payments,
  public.partner_users, public.redemptions, public.favorites,
  public.referral_partners, public.referral_codes, public.referral_conversions,
  public.commissions, public.audit_logs to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant insert, delete on public.favorites to authenticated;
grant insert on public.reviews to authenticated;
grant update (
  food_rating,
  service_rating,
  ambience_rating,
  value_rating,
  recommended_item,
  comment
) on public.reviews to authenticated;

create policy "members read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy "members update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
create policy "admins read profiles"
on public.profiles for select to authenticated
using ((select private.is_admin()));

create policy "members read own memberships"
on public.memberships for select to authenticated
using ((select auth.uid()) = profile_id);
create policy "admins read memberships"
on public.memberships for select to authenticated
using ((select private.is_admin()));

create policy "members read own payments"
on public.payments for select to authenticated
using (exists (
  select 1 from public.memberships m
  where m.id = payments.membership_id
    and m.profile_id = (select auth.uid())
));
create policy "admins read payments"
on public.payments for select to authenticated
using ((select private.is_admin()));

create policy "public reads active businesses"
on public.businesses for select to anon, authenticated
using (is_active);
create policy "partners read associated businesses"
on public.businesses for select to authenticated
using ((select private.is_partner_for_business(id)));
create policy "admins read businesses"
on public.businesses for select to authenticated
using ((select private.is_admin()));

create policy "public reads active business locations"
on public.business_locations for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.businesses b
    where b.id = business_locations.business_id and b.is_active
  )
);
create policy "partners read associated business locations"
on public.business_locations for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read business locations"
on public.business_locations for select to authenticated
using ((select private.is_admin()));

create policy "public reads categories"
on public.categories for select to anon, authenticated
using (true);

create policy "public reads categories of active businesses"
on public.business_categories for select to anon, authenticated
using (exists (
  select 1 from public.businesses b
  where b.id = business_categories.business_id and b.is_active
));
create policy "partners read associated business categories"
on public.business_categories for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read business categories"
on public.business_categories for select to authenticated
using ((select private.is_admin()));

create policy "partners read own associations"
on public.partner_users for select to authenticated
using (profile_id = (select auth.uid()));
create policy "admins read partner associations"
on public.partner_users for select to authenticated
using ((select private.is_admin()));

create policy "public reads active benefits"
on public.benefits for select to anon, authenticated
using (
  is_active
  and (valid_from is null or valid_from <= now())
  and (valid_until is null or valid_until > now())
  and exists (
    select 1 from public.businesses b
    where b.id = benefits.business_id and b.is_active
  )
  and (
    business_location_id is null
    or exists (
      select 1 from public.business_locations bl
      where bl.id = benefits.business_location_id and bl.is_active
    )
  )
);
create policy "partners read associated benefits"
on public.benefits for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read benefits"
on public.benefits for select to authenticated
using ((select private.is_admin()));

create policy "public reads rules of active benefits"
on public.benefit_rules for select to anon, authenticated
using (exists (
  select 1 from public.benefits b
  join public.businesses bus on bus.id = b.business_id
  where b.id = benefit_rules.benefit_id
    and b.is_active
    and bus.is_active
    and (b.valid_from is null or b.valid_from <= now())
    and (b.valid_until is null or b.valid_until > now())
));
create policy "partners read associated benefit rules"
on public.benefit_rules for select to authenticated
using (exists (
  select 1 from public.benefits b
  where b.id = benefit_rules.benefit_id
    and private.is_partner_for_business(b.business_id)
));
create policy "admins read benefit rules"
on public.benefit_rules for select to authenticated
using ((select private.is_admin()));

create policy "members read own redemptions"
on public.redemptions for select to authenticated
using (exists (
  select 1 from public.memberships m
  where m.id = redemptions.membership_id
    and m.profile_id = (select auth.uid())
));
create policy "partners read associated redemptions"
on public.redemptions for select to authenticated
using ((select private.is_partner_for_location(business_location_id)));
create policy "admins read redemptions"
on public.redemptions for select to authenticated
using ((select private.is_admin()));

create policy "public reads published reviews"
on public.reviews for select to anon, authenticated
using (status = 'published');
create policy "members read own reviews"
on public.reviews for select to authenticated
using (profile_id = (select auth.uid()));
create policy "admins read reviews"
on public.reviews for select to authenticated
using ((select private.is_admin()));
create policy "members create verified reviews"
on public.reviews for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and status = 'pending'
  and published_at is null
  and exists (
    select 1
    from public.redemptions r
    join public.memberships m on m.id = r.membership_id
    where r.id = reviews.redemption_id
      and r.status = 'redeemed'
      and m.profile_id = (select auth.uid())
      and r.business_location_id = reviews.business_location_id
  )
);
create policy "members update own pending reviews"
on public.reviews for update to authenticated
using (profile_id = (select auth.uid()) and status = 'pending')
with check (profile_id = (select auth.uid()) and status = 'pending');

create policy "members read own favorites"
on public.favorites for select to authenticated
using (profile_id = (select auth.uid()));
create policy "members create own favorites"
on public.favorites for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and exists (
    select 1 from public.businesses b
    where b.id = favorites.business_id and b.is_active
  )
);
create policy "members delete own favorites"
on public.favorites for delete to authenticated
using (profile_id = (select auth.uid()));
create policy "admins read favorites"
on public.favorites for select to authenticated
using ((select private.is_admin()));

create policy "public reads published events"
on public.events for select to anon, authenticated
using (is_published);
create policy "partners read associated events"
on public.events for select to authenticated
using (
  business_location_id is not null
  and (select private.is_partner_for_location(business_location_id))
);
create policy "admins read events"
on public.events for select to authenticated
using ((select private.is_admin()));

create policy "referral partners read own record"
on public.referral_partners for select to authenticated
using (profile_id = (select auth.uid()));
create policy "admins read referral partners"
on public.referral_partners for select to authenticated
using ((select private.is_admin()));

create policy "referral partners read own codes"
on public.referral_codes for select to authenticated
using (exists (
  select 1 from public.referral_partners rp
  where rp.id = referral_codes.referral_partner_id
    and rp.profile_id = (select auth.uid())
));
create policy "admins read referral codes"
on public.referral_codes for select to authenticated
using ((select private.is_admin()));

create policy "referral partners read own conversions"
on public.referral_conversions for select to authenticated
using (exists (
  select 1 from public.referral_partners rp
  where rp.id = referral_conversions.referral_partner_id
    and rp.profile_id = (select auth.uid())
));
create policy "admins read referral conversions"
on public.referral_conversions for select to authenticated
using ((select private.is_admin()));

create policy "referral partners read own commissions"
on public.commissions for select to authenticated
using (exists (
  select 1
  from public.referral_conversions rc
  join public.referral_partners rp on rp.id = rc.referral_partner_id
  where rc.id = commissions.referral_conversion_id
    and rp.profile_id = (select auth.uid())
));
create policy "admins read commissions"
on public.commissions for select to authenticated
using ((select private.is_admin()));

create policy "admins read audit logs"
on public.audit_logs for select to authenticated
using ((select private.is_admin()));

commit;
