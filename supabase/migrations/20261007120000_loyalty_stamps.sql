-- Selos Daqui — loyalty / fidelização por parceiro.
--
-- Camada independente dos benefícios principais. Modelo cumulativo: as
-- recompensas NÃO consomem selos. Toda a lógica transaccional vive em funções
-- security definer + triggers (mesmo padrão de redemptions), para garantir
-- idempotência e manter os controllers NestJS finos.

begin;

create type public.loyalty_stamp_rule_type as enum (
  'VISIT',
  'MINIMUM_SPEND'
);
create type public.loyalty_reward_type as enum (
  'PERCENTAGE_DISCOUNT',
  'FIXED_DISCOUNT',
  'FREE_ITEM',
  'BUY_ONE_GET_ONE',
  'CUSTOM'
);
create type public.loyalty_visit_source as enum (
  'MAIN_BENEFIT',
  'REGULAR_VISIT',
  'LOYALTY_REWARD',
  'MANUAL'
);
create type public.loyalty_visit_status as enum (
  'pending',
  'validated',
  'cancelled',
  'flagged'
);
create type public.loyalty_stamp_status as enum (
  'active',
  'consumed',
  'cancelled'
);
create type public.loyalty_reward_redemption_status as enum (
  'available',
  'reserved',
  'redeemed',
  'expired',
  'cancelled'
);

-- 1. Programa de fidelização do parceiro -------------------------------------
create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default false,
  stamp_rule_type public.loyalty_stamp_rule_type not null default 'VISIT',
  minimum_spend numeric(10, 2),
  max_stamps_per_day integer not null default 1,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_programs_name_not_blank check (btrim(name) <> ''),
  constraint loyalty_programs_max_stamps_positive check (max_stamps_per_day > 0),
  constraint loyalty_programs_minimum_spend_non_negative
    check (minimum_spend is null or minimum_spend >= 0),
  constraint loyalty_programs_minimum_spend_rule
    check (stamp_rule_type <> 'MINIMUM_SPEND' or minimum_spend is not null),
  constraint loyalty_programs_valid_period
    check (ends_at is null or starts_at is null or ends_at > starts_at),
  unique (id, business_id)
);

-- 2. Recompensas do programa -------------------------------------------------
create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  loyalty_program_id uuid not null references public.loyalty_programs (id) on delete cascade,
  title text not null,
  description text,
  required_stamps integer not null,
  reward_type public.loyalty_reward_type not null,
  percentage_discount numeric(5, 2),
  fixed_discount numeric(10, 2),
  free_item_description text,
  custom_description text,
  is_active boolean not null default true,
  validity_days_after_unlock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_rewards_title_not_blank check (btrim(title) <> ''),
  constraint loyalty_rewards_required_stamps_positive check (required_stamps > 0),
  constraint loyalty_rewards_percentage_range
    check (percentage_discount is null or percentage_discount between 0 and 100),
  constraint loyalty_rewards_fixed_non_negative
    check (fixed_discount is null or fixed_discount >= 0),
  constraint loyalty_rewards_validity_positive
    check (validity_days_after_unlock is null or validity_days_after_unlock > 0)
);

-- 3. Visitas validadas -------------------------------------------------------
create table public.loyalty_visits (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.loyalty_programs (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  validated_by_partner_user_id uuid references public.profiles (id) on delete restrict,
  visit_date date,
  validated_at timestamptz,
  bill_amount numeric(10, 2),
  source_type public.loyalty_visit_source not null default 'REGULAR_VISIT',
  source_redemption_id uuid references public.redemptions (id) on delete set null,
  status public.loyalty_visit_status not null default 'pending',
  token_hash text,
  manual_code text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_visits_token_hash_format
    check (token_hash is null or token_hash ~ '^[a-f0-9]{64}$'),
  constraint loyalty_visits_manual_code_format
    check (manual_code is null or manual_code ~ '^[0-9]{6}$'),
  constraint loyalty_visits_bill_non_negative
    check (bill_amount is null or bill_amount >= 0),
  constraint loyalty_visits_validated_fields check (
    (status <> 'validated')
    or (status = 'validated' and validated_at is not null and visit_date is not null)
  )
);

-- 4. Selos emitidos ----------------------------------------------------------
create table public.loyalty_stamps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.loyalty_programs (id) on delete restrict,
  visit_id uuid not null unique references public.loyalty_visits (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  issued_at timestamptz not null default now(),
  status public.loyalty_stamp_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Desbloqueio/utilização de recompensas -----------------------------------
create table public.loyalty_reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.loyalty_rewards (id) on delete restrict,
  program_id uuid not null references public.loyalty_programs (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  business_id uuid not null references public.businesses (id) on delete restrict,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  redeemed_at timestamptz,
  expires_at timestamptz,
  status public.loyalty_reward_redemption_status not null default 'available',
  validation_token_hash text,
  manual_code text,
  token_expires_at timestamptz,
  validated_by_partner_user_id uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_reward_redemptions_token_hash_format
    check (validation_token_hash is null or validation_token_hash ~ '^[a-f0-9]{64}$'),
  constraint loyalty_reward_redemptions_manual_code_format
    check (manual_code is null or manual_code ~ '^[0-9]{6}$'),
  constraint loyalty_reward_redemptions_redeemed_fields check (
    (status <> 'redeemed')
    or (status = 'redeemed' and redeemed_at is not null
        and validated_by_partner_user_id is not null)
  ),
  -- Cada reward só pode ser desbloqueada uma vez por ciclo (membership).
  unique (reward_id, membership_id)
);

-- Índices --------------------------------------------------------------------
create unique index loyalty_programs_one_active_per_business_uidx
  on public.loyalty_programs (business_id)
  where is_active;
create index loyalty_programs_business_idx
  on public.loyalty_programs (business_id);

create index loyalty_rewards_program_idx
  on public.loyalty_rewards (loyalty_program_id);
create unique index loyalty_rewards_program_required_stamps_uidx
  on public.loyalty_rewards (loyalty_program_id, required_stamps);

create index loyalty_visits_program_user_idx
  on public.loyalty_visits (program_id, user_id);
create index loyalty_visits_business_validated_idx
  on public.loyalty_visits (business_id, validated_at)
  where status = 'validated';
create index loyalty_visits_expiry_idx
  on public.loyalty_visits (expires_at)
  where status = 'pending';
create unique index loyalty_visits_source_redemption_uidx
  on public.loyalty_visits (source_redemption_id)
  where source_redemption_id is not null;
create unique index loyalty_visits_pending_manual_code_uidx
  on public.loyalty_visits (manual_code)
  where status = 'pending';

create index loyalty_stamps_program_user_active_idx
  on public.loyalty_stamps (program_id, user_id)
  where status = 'active';
create index loyalty_stamps_user_issued_idx
  on public.loyalty_stamps (user_id, issued_at);
create index loyalty_stamps_business_issued_idx
  on public.loyalty_stamps (business_id, issued_at)
  where status = 'active';

create index loyalty_reward_redemptions_user_status_idx
  on public.loyalty_reward_redemptions (user_id, status);
create index loyalty_reward_redemptions_program_idx
  on public.loyalty_reward_redemptions (program_id, status);
create unique index loyalty_reward_redemptions_reserved_manual_code_uidx
  on public.loyalty_reward_redemptions (manual_code)
  where status = 'reserved';

-- updated_at triggers --------------------------------------------------------
create trigger loyalty_programs_set_updated_at before update on public.loyalty_programs
  for each row execute function private.set_updated_at();
create trigger loyalty_rewards_set_updated_at before update on public.loyalty_rewards
  for each row execute function private.set_updated_at();
create trigger loyalty_visits_set_updated_at before update on public.loyalty_visits
  for each row execute function private.set_updated_at();
create trigger loyalty_stamps_set_updated_at before update on public.loyalty_stamps
  for each row execute function private.set_updated_at();
create trigger loyalty_reward_redemptions_set_updated_at before update on public.loyalty_reward_redemptions
  for each row execute function private.set_updated_at();

-- Helpers --------------------------------------------------------------------

-- Programa activo (dentro da janela) de um business, ou null.
create function private.active_loyalty_program(p_business_id uuid)
returns setof public.loyalty_programs
language sql
stable
security definer
set search_path = ''
as $$
  select lp.*
  from public.loyalty_programs lp
  where lp.business_id = p_business_id
    and lp.is_active
    and (lp.starts_at is null or lp.starts_at <= now())
    and (lp.ends_at is null or lp.ends_at > now())
  order by lp.created_at desc
  limit 1;
$$;

-- Nº de selos activos de um membro num programa.
create function private.count_active_stamps(p_program_id uuid, p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.loyalty_stamps s
  where s.program_id = p_program_id
    and s.user_id = p_user_id
    and s.status = 'active';
$$;

-- Trigger central: ao validar uma visita, emite selo (se as regras passarem) e
-- desbloqueia recompensas. Idempotente via unique(visit_id) e
-- unique(reward_id, membership_id). Modelo cumulativo: não consome selos.
create function private.handle_loyalty_visit_validated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_today date;
  v_stamps_today integer;
  v_rowcount integer;
  v_current_stamps integer;
  v_reward public.loyalty_rewards%rowtype;
begin
  if new.status <> 'validated' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status is not distinct from new.status then
    return new;
  end if;

  select * into v_program
  from public.loyalty_programs lp
  where lp.id = new.program_id;

  if not found or not v_program.is_active then
    return new;
  end if;

  -- Regra de valor mínimo de conta.
  if v_program.stamp_rule_type = 'MINIMUM_SPEND'
    and (new.bill_amount is null or new.bill_amount < v_program.minimum_spend) then
    return new;
  end if;

  v_today := pg_catalog.timezone('Europe/Lisbon', now())::date;

  -- Limite de selos por dia por parceiro.
  select count(*)::integer into v_stamps_today
  from public.loyalty_stamps s
  where s.program_id = new.program_id
    and s.user_id = new.user_id
    and s.status = 'active'
    and pg_catalog.timezone('Europe/Lisbon', s.issued_at)::date = v_today;

  if v_stamps_today >= v_program.max_stamps_per_day then
    return new;
  end if;

  insert into public.loyalty_stamps (
    program_id, visit_id, user_id, business_id
  )
  values (
    new.program_id, new.id, new.user_id, new.business_id
  )
  on conflict (visit_id) do nothing;

  get diagnostics v_rowcount = row_count;
  if v_rowcount = 0 then
    return new;
  end if;

  -- Desbloqueia recompensas atingidas neste ciclo (cumulativo).
  v_current_stamps := private.count_active_stamps(new.program_id, new.user_id);

  for v_reward in
    select r.*
    from public.loyalty_rewards r
    where r.loyalty_program_id = new.program_id
      and r.is_active
      and r.required_stamps <= v_current_stamps
  loop
    insert into public.loyalty_reward_redemptions (
      reward_id, program_id, user_id, business_id, membership_id, expires_at
    )
    values (
      v_reward.id,
      new.program_id,
      new.user_id,
      new.business_id,
      new.membership_id,
      case
        when v_reward.validity_days_after_unlock is null then null
        else now() + make_interval(days => v_reward.validity_days_after_unlock)
      end
    )
    on conflict (reward_id, membership_id) do nothing;
  end loop;

  return new;
end;
$$;

create trigger loyalty_visits_issue_stamp
  after insert or update of status on public.loyalty_visits
  for each row execute function private.handle_loyalty_visit_validated();

-- Trigger de integração: benefício principal resgatado -> visita MAIN_BENEFIT.
-- Corre dentro da transacção de confirm_redemption. Idempotente via
-- unique(source_redemption_id); a visita validada cascateia para o selo.
create function private.handle_redemption_loyalty()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_business_id uuid;
  v_profile_id uuid;
begin
  if new.status <> 'redeemed'
    or (tg_op = 'UPDATE' and old.status is not distinct from new.status) then
    return new;
  end if;

  select b.business_id into v_business_id
  from public.benefits b
  where b.id = new.benefit_id;

  if v_business_id is null then
    return new;
  end if;

  select * into v_program from private.active_loyalty_program(v_business_id);
  if not found then
    return new;
  end if;

  select m.profile_id into v_profile_id
  from public.memberships m
  where m.id = new.membership_id;

  insert into public.loyalty_visits (
    program_id, business_id, user_id, membership_id,
    validated_by_partner_user_id, visit_date, validated_at,
    source_type, source_redemption_id, status
  )
  values (
    v_program.id, v_business_id, v_profile_id, new.membership_id,
    new.validated_by,
    pg_catalog.timezone('Europe/Lisbon', now())::date,
    now(),
    'MAIN_BENEFIT', new.id, 'validated'
  )
  on conflict (source_redemption_id) where source_redemption_id is not null
  do nothing;

  return new;
end;
$$;

create trigger redemptions_issue_loyalty_visit
  after update of status on public.redemptions
  for each row execute function private.handle_redemption_loyalty();

-- RPC: membro gera QR/código de visita normal ---------------------------------
create function public.create_loyalty_visit_attempt(
  p_business_id uuid
)
returns table (
  visit_id uuid,
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
  v_program public.loyalty_programs%rowtype;
  v_token text;
  v_manual_code text;
  v_visit_id uuid;
  v_expires_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select m.* into v_membership
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

  select * into v_program from private.active_loyalty_program(p_business_id);
  if not found then
    raise exception 'Loyalty program is not available' using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_membership.id::text || ':loyalty:' || v_program.id::text, 0)
  );

  -- Expira pendentes anteriores do mesmo membro no mesmo programa.
  update public.loyalty_visits
  set status = 'cancelled'
  where user_id = (select auth.uid())
    and program_id = v_program.id
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
      from public.loyalty_visits lv
      where lv.manual_code = v_manual_code
        and lv.status = 'pending'
    );
  end loop;

  insert into public.loyalty_visits (
    program_id, business_id, user_id, membership_id,
    source_type, status, token_hash, manual_code, expires_at
  )
  values (
    v_program.id, p_business_id, (select auth.uid()), v_membership.id,
    'REGULAR_VISIT', 'pending',
    pg_catalog.encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_manual_code,
    now() + interval '5 minutes'
  )
  returning id, public.loyalty_visits.expires_at
  into v_visit_id, v_expires_at;

  return query select v_visit_id, v_token, v_manual_code, v_expires_at;
end;
$$;

-- RPC: parceiro pré-visualiza visita -----------------------------------------
create function public.get_loyalty_visit_preview(
  p_token text default null,
  p_manual_code text default null
)
returns table (
  visit_id uuid,
  member_name text,
  program_name text,
  business_name text,
  current_stamps integer,
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
    lv.id,
    p.full_name,
    lp.name,
    bus.name,
    private.count_active_stamps(lv.program_id, lv.user_id),
    lv.expires_at
  from public.loyalty_visits lv
  join public.loyalty_programs lp on lp.id = lv.program_id
  join public.businesses bus on bus.id = lv.business_id
  join public.profiles p on p.id = lv.user_id
  where lv.status = 'pending'
    and lv.expires_at > now()
    and private.is_partner_for_business(lv.business_id)
    and (
      (p_token is not null and lv.token_hash = pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex'))
      or (p_manual_code is not null and lv.manual_code = p_manual_code)
    );
end;
$$;

-- RPC: parceiro valida visita (emite selo via trigger) ------------------------
create function public.confirm_loyalty_visit(
  p_token text default null,
  p_manual_code text default null,
  p_bill_amount numeric default null
)
returns table (
  visit_id uuid,
  visit_status public.loyalty_visit_status,
  stamp_issued boolean,
  current_stamps integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visit public.loyalty_visits%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_membership public.memberships%rowtype;
  v_stamp_issued boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (p_token is null) = (p_manual_code is null) then
    raise exception 'Provide either token or manual code' using errcode = '22023';
  end if;

  select lv.* into v_visit
  from public.loyalty_visits lv
  where lv.status = 'pending'
    and (
      (p_token is not null and lv.token_hash = pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex'))
      or (p_manual_code is not null and lv.manual_code = p_manual_code)
    )
  for update;

  if not found then
    raise exception 'Pending visit not found' using errcode = 'P0001';
  end if;

  if v_visit.expires_at <= now() then
    raise exception 'Visit token has expired' using errcode = 'P0001';
  end if;

  if not private.is_partner_for_business(v_visit.business_id) then
    raise exception 'Partner is not associated with this business'
      using errcode = '42501';
  end if;

  select * into v_program from public.loyalty_programs where id = v_visit.program_id;
  if not found or not v_program.is_active then
    raise exception 'Loyalty program is not active' using errcode = 'P0001';
  end if;

  select m.* into v_membership
  from public.memberships m
  where m.id = v_visit.membership_id;

  if v_membership.status <> 'active'
    or v_membership.starts_at > now()
    or v_membership.ends_at <= now() then
    raise exception 'Membership is not active' using errcode = 'P0001';
  end if;

  update public.loyalty_visits lv
  set
    status = 'validated',
    validated_at = now(),
    visit_date = pg_catalog.timezone('Europe/Lisbon', now())::date,
    validated_by_partner_user_id = (select auth.uid()),
    bill_amount = p_bill_amount
  where lv.id = v_visit.id
    and lv.status = 'pending';

  if not found then
    raise exception 'Visit was already processed' using errcode = 'P0001';
  end if;

  v_stamp_issued := exists (
    select 1 from public.loyalty_stamps s where s.visit_id = v_visit.id
  );

  return query
  select
    v_visit.id,
    'validated'::public.loyalty_visit_status,
    v_stamp_issued,
    private.count_active_stamps(v_visit.program_id, v_visit.user_id);
end;
$$;

-- RPC: membro reserva/gera token para usar recompensa -------------------------
create function public.reserve_loyalty_reward(
  p_reward_redemption_id uuid
)
returns table (
  reward_redemption_id uuid,
  token text,
  manual_code text,
  token_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.loyalty_reward_redemptions%rowtype;
  v_membership public.memberships%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_token text;
  v_manual_code text;
  v_token_expires_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_row
  from public.loyalty_reward_redemptions
  where id = p_reward_redemption_id
    and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Reward not found' using errcode = 'P0001';
  end if;

  if v_row.status not in ('available', 'reserved')
    or (v_row.status = 'reserved' and v_row.token_expires_at > now()) then
    raise exception 'Reward is not available' using errcode = 'P0001';
  end if;

  if v_row.expires_at is not null and v_row.expires_at <= now() then
    update public.loyalty_reward_redemptions
    set status = 'expired'
    where id = v_row.id;
    raise exception 'Reward has expired' using errcode = 'P0001';
  end if;

  select m.* into v_membership
  from public.memberships m
  where m.id = v_row.membership_id;

  if v_membership.profile_id <> (select auth.uid())
    or v_membership.status <> 'active'
    or v_membership.starts_at > now()
    or v_membership.ends_at <= now() then
    raise exception 'Active membership required' using errcode = 'P0001';
  end if;

  select * into v_program from public.loyalty_programs where id = v_row.program_id;
  if not found or not v_program.is_active then
    raise exception 'Loyalty program is not active' using errcode = 'P0001';
  end if;

  v_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');

  loop
    v_manual_code := pg_catalog.lpad(
      pg_catalog.floor(pg_catalog.random() * 1000000)::integer::text,
      6,
      '0'
    );
    exit when not exists (
      select 1 from public.loyalty_reward_redemptions r
      where r.manual_code = v_manual_code and r.status = 'reserved'
    );
  end loop;

  update public.loyalty_reward_redemptions
  set
    status = 'reserved',
    validation_token_hash = pg_catalog.encode(extensions.digest(v_token, 'sha256'), 'hex'),
    manual_code = v_manual_code,
    token_expires_at = now() + interval '5 minutes'
  where id = v_row.id
  returning public.loyalty_reward_redemptions.token_expires_at into v_token_expires_at;

  return query select v_row.id, v_token, v_manual_code, v_token_expires_at;
end;
$$;

-- RPC: parceiro valida utilização de recompensa -------------------------------
create function public.confirm_loyalty_reward(
  p_token text default null,
  p_manual_code text default null
)
returns table (
  reward_redemption_id uuid,
  reward_status public.loyalty_reward_redemption_status,
  redeemed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.loyalty_reward_redemptions%rowtype;
  v_membership public.memberships%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_reward public.loyalty_rewards%rowtype;
  v_redeemed_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if (p_token is null) = (p_manual_code is null) then
    raise exception 'Provide either token or manual code' using errcode = '22023';
  end if;

  select * into v_row
  from public.loyalty_reward_redemptions
  where status = 'reserved'
    and (
      (p_token is not null and validation_token_hash = pg_catalog.encode(extensions.digest(p_token, 'sha256'), 'hex'))
      or (p_manual_code is not null and manual_code = p_manual_code)
    )
  for update;

  if not found then
    raise exception 'Reserved reward not found' using errcode = 'P0001';
  end if;

  if v_row.token_expires_at is null or v_row.token_expires_at <= now() then
    raise exception 'Reward token has expired' using errcode = 'P0001';
  end if;

  if not private.is_partner_for_business(v_row.business_id) then
    raise exception 'Partner is not associated with this business'
      using errcode = '42501';
  end if;

  if v_row.expires_at is not null and v_row.expires_at <= now() then
    update public.loyalty_reward_redemptions set status = 'expired' where id = v_row.id;
    raise exception 'Reward has expired' using errcode = 'P0001';
  end if;

  select * into v_program from public.loyalty_programs where id = v_row.program_id;
  if not found or not v_program.is_active then
    raise exception 'Loyalty program is not active' using errcode = 'P0001';
  end if;

  select * into v_reward from public.loyalty_rewards where id = v_row.reward_id;
  if not found or not v_reward.is_active then
    raise exception 'Reward is not active' using errcode = 'P0001';
  end if;

  select m.* into v_membership from public.memberships m where m.id = v_row.membership_id;
  if v_membership.status <> 'active'
    or v_membership.starts_at > now()
    or v_membership.ends_at <= now() then
    raise exception 'Membership is not active' using errcode = 'P0001';
  end if;

  update public.loyalty_reward_redemptions
  set
    status = 'redeemed',
    redeemed_at = now(),
    validated_by_partner_user_id = (select auth.uid())
  where id = v_row.id
    and status = 'reserved'
  returning public.loyalty_reward_redemptions.redeemed_at into v_redeemed_at;

  if not found then
    raise exception 'Reward was already processed' using errcode = 'P0001';
  end if;

  return query select v_row.id, 'redeemed'::public.loyalty_reward_redemption_status, v_redeemed_at;
end;
$$;

-- RPC: resumo de todos os programas do membro ---------------------------------
create function public.get_member_loyalty_overview()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result json;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(json_agg(program_json order by program_json ->> 'businessName'), '[]'::json)
  into v_result
  from (
    select json_build_object(
      'programId', lp.id,
      'businessId', bus.id,
      'businessName', bus.name,
      'businessSlug', bus.slug,
      'programName', lp.name,
      'currentStamps', private.count_active_stamps(lp.id, (select auth.uid())),
      'nextReward', (
        select json_build_object(
          'rewardId', r.id,
          'title', r.title,
          'requiredStamps', r.required_stamps,
          'stampsRemaining', greatest(
            r.required_stamps - private.count_active_stamps(lp.id, (select auth.uid())), 0
          )
        )
        from public.loyalty_rewards r
        where r.loyalty_program_id = lp.id
          and r.is_active
          and r.required_stamps > private.count_active_stamps(lp.id, (select auth.uid()))
        order by r.required_stamps
        limit 1
      ),
      'availableRewardsCount', (
        select count(*)::integer
        from public.loyalty_reward_redemptions rr
        where rr.program_id = lp.id
          and rr.user_id = (select auth.uid())
          and rr.status = 'available'
      )
    ) as program_json
    from public.loyalty_programs lp
    join public.businesses bus on bus.id = lp.business_id
    where lp.is_active
      and (
        exists (
          select 1 from public.loyalty_stamps s
          where s.program_id = lp.id and s.user_id = (select auth.uid()) and s.status = 'active'
        )
        or exists (
          select 1 from public.loyalty_reward_redemptions rr
          where rr.program_id = lp.id and rr.user_id = (select auth.uid())
        )
      )
  ) programs;

  return v_result;
end;
$$;

-- RPC: detalhe de um programa para o membro -----------------------------------
create function public.get_member_loyalty_detail(p_business_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_uid uuid := (select auth.uid());
  v_current integer;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_program from private.active_loyalty_program(p_business_id);
  if not found then
    return null;
  end if;

  v_current := private.count_active_stamps(v_program.id, v_uid);

  return json_build_object(
    'programId', v_program.id,
    'programName', v_program.name,
    'description', v_program.description,
    'currentStamps', v_current,
    'nextReward', (
      select json_build_object(
        'rewardId', r.id, 'title', r.title, 'requiredStamps', r.required_stamps,
        'stampsRemaining', greatest(r.required_stamps - v_current, 0)
      )
      from public.loyalty_rewards r
      where r.loyalty_program_id = v_program.id
        and r.is_active and r.required_stamps > v_current
      order by r.required_stamps limit 1
    ),
    'rewards', (
      select coalesce(json_agg(json_build_object(
        'rewardId', r.id, 'title', r.title, 'description', r.description,
        'requiredStamps', r.required_stamps, 'rewardType', r.reward_type,
        'reached', r.required_stamps <= v_current
      ) order by r.required_stamps), '[]'::json)
      from public.loyalty_rewards r
      where r.loyalty_program_id = v_program.id and r.is_active
    ),
    'availableRewards', (
      select coalesce(json_agg(json_build_object(
        'rewardRedemptionId', rr.id, 'rewardId', rr.reward_id, 'title', r.title,
        'unlockedAt', rr.unlocked_at, 'expiresAt', rr.expires_at
      ) order by rr.unlocked_at desc), '[]'::json)
      from public.loyalty_reward_redemptions rr
      join public.loyalty_rewards r on r.id = rr.reward_id
      where rr.program_id = v_program.id and rr.user_id = v_uid and rr.status = 'available'
    ),
    'redeemedRewards', (
      select coalesce(json_agg(json_build_object(
        'rewardRedemptionId', rr.id, 'title', r.title, 'redeemedAt', rr.redeemed_at
      ) order by rr.redeemed_at desc), '[]'::json)
      from public.loyalty_reward_redemptions rr
      join public.loyalty_rewards r on r.id = rr.reward_id
      where rr.program_id = v_program.id and rr.user_id = v_uid and rr.status = 'redeemed'
    ),
    'history', (
      select coalesce(json_agg(json_build_object(
        'visitId', lv.id, 'visitDate', lv.visit_date, 'sourceType', lv.source_type,
        'stampIssued', exists (select 1 from public.loyalty_stamps s where s.visit_id = lv.id)
      ) order by lv.validated_at desc), '[]'::json)
      from public.loyalty_visits lv
      where lv.program_id = v_program.id and lv.user_id = v_uid and lv.status = 'validated'
    )
  );
end;
$$;

-- RPC: resumo público do programa (bloco na página do parceiro) ----------------
create function public.get_business_loyalty_summary(p_business_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_program public.loyalty_programs%rowtype;
  v_uid uuid := (select auth.uid());
begin
  select * into v_program from private.active_loyalty_program(p_business_id);
  if not found then
    return null;
  end if;

  return json_build_object(
    'programId', v_program.id,
    'programName', v_program.name,
    'description', v_program.description,
    'currentStamps', case when v_uid is null then null
      else private.count_active_stamps(v_program.id, v_uid) end,
    'rewards', (
      select coalesce(json_agg(json_build_object(
        'title', r.title, 'description', r.description, 'requiredStamps', r.required_stamps
      ) order by r.required_stamps), '[]'::json)
      from public.loyalty_rewards r
      where r.loyalty_program_id = v_program.id and r.is_active
    )
  );
end;
$$;

-- RPC: dashboard de métricas para o parceiro ----------------------------------
create function public.get_partner_loyalty_dashboard()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select pu.business_id into v_business_id
  from public.partner_users pu
  join public.profiles p on p.id = pu.profile_id
  where pu.profile_id = (select auth.uid())
    and p.role = 'PARTNER'
  limit 1;

  if v_business_id is null then
    raise exception 'Partner is not associated with any business' using errcode = '42501';
  end if;

  return json_build_object(
    'businessId', v_business_id,
    'hasProgram', exists (select 1 from private.active_loyalty_program(v_business_id)),
    'totalVisits', (
      select count(*)::integer from public.loyalty_visits lv
      where lv.business_id = v_business_id and lv.status = 'validated'
    ),
    'stampsIssued', (
      select count(*)::integer from public.loyalty_stamps s
      where s.business_id = v_business_id and s.status = 'active'
    ),
    'rewardsRedeemed', (
      select count(*)::integer from public.loyalty_reward_redemptions rr
      where rr.business_id = v_business_id and rr.status = 'redeemed'
    ),
    'repeatCustomers', (
      select count(*)::integer from (
        select lv.user_id from public.loyalty_visits lv
        where lv.business_id = v_business_id and lv.status = 'validated'
        group by lv.user_id having count(*) > 1
      ) repeat_users
    )
  );
end;
$$;

-- Grants ---------------------------------------------------------------------
grant execute on function private.active_loyalty_program(uuid) to authenticated;
grant execute on function private.count_active_stamps(uuid, uuid) to authenticated;

revoke all on function public.create_loyalty_visit_attempt(uuid) from public, anon;
revoke all on function public.get_loyalty_visit_preview(text, text) from public, anon;
revoke all on function public.confirm_loyalty_visit(text, text, numeric) from public, anon;
revoke all on function public.reserve_loyalty_reward(uuid) from public, anon;
revoke all on function public.confirm_loyalty_reward(text, text) from public, anon;
revoke all on function public.get_member_loyalty_overview() from public, anon;
revoke all on function public.get_member_loyalty_detail(uuid) from public, anon;
revoke all on function public.get_partner_loyalty_dashboard() from public, anon;

grant execute on function public.create_loyalty_visit_attempt(uuid) to authenticated;
grant execute on function public.get_loyalty_visit_preview(text, text) to authenticated;
grant execute on function public.confirm_loyalty_visit(text, text, numeric) to authenticated;
grant execute on function public.reserve_loyalty_reward(uuid) to authenticated;
grant execute on function public.confirm_loyalty_reward(text, text) to authenticated;
grant execute on function public.get_member_loyalty_overview() to authenticated;
grant execute on function public.get_member_loyalty_detail(uuid) to authenticated;
grant execute on function public.get_business_loyalty_summary(uuid) to anon, authenticated;
grant execute on function public.get_partner_loyalty_dashboard() to authenticated;

-- RLS ------------------------------------------------------------------------
alter table public.loyalty_programs enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_visits enable row level security;
alter table public.loyalty_stamps enable row level security;
alter table public.loyalty_reward_redemptions enable row level security;

grant select on public.loyalty_programs, public.loyalty_rewards to anon, authenticated;
grant select on public.loyalty_visits, public.loyalty_stamps,
  public.loyalty_reward_redemptions to authenticated;

create policy "public reads active programs"
on public.loyalty_programs for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.businesses b
    where b.id = loyalty_programs.business_id and b.is_active
  )
);
create policy "partners read own programs"
on public.loyalty_programs for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read programs"
on public.loyalty_programs for select to authenticated
using ((select private.is_admin()));

create policy "public reads active rewards"
on public.loyalty_rewards for select to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.loyalty_programs lp
    join public.businesses b on b.id = lp.business_id
    where lp.id = loyalty_rewards.loyalty_program_id
      and lp.is_active and b.is_active
  )
);
create policy "partners read own rewards"
on public.loyalty_rewards for select to authenticated
using (exists (
  select 1 from public.loyalty_programs lp
  where lp.id = loyalty_rewards.loyalty_program_id
    and private.is_partner_for_business(lp.business_id)
));
create policy "admins read rewards"
on public.loyalty_rewards for select to authenticated
using ((select private.is_admin()));

create policy "members read own visits"
on public.loyalty_visits for select to authenticated
using (user_id = (select auth.uid()));
create policy "partners read associated visits"
on public.loyalty_visits for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read visits"
on public.loyalty_visits for select to authenticated
using ((select private.is_admin()));

create policy "members read own stamps"
on public.loyalty_stamps for select to authenticated
using (user_id = (select auth.uid()));
create policy "partners read associated stamps"
on public.loyalty_stamps for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read stamps"
on public.loyalty_stamps for select to authenticated
using ((select private.is_admin()));

create policy "members read own reward redemptions"
on public.loyalty_reward_redemptions for select to authenticated
using (user_id = (select auth.uid()));
create policy "partners read associated reward redemptions"
on public.loyalty_reward_redemptions for select to authenticated
using ((select private.is_partner_for_business(business_id)));
create policy "admins read reward redemptions"
on public.loyalty_reward_redemptions for select to authenticated
using ((select private.is_admin()));

commit;