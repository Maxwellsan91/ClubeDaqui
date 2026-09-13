create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  influencer_code text not null,
  member_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VALIDATED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  validates_at timestamptz not null,
  cancelled_at timestamptz,
  unique (influencer_code, member_id)
);

comment on table public.referrals is
  'Regista cada novo membro que aderiu com código de influencer. '
  'validates_at = created_at + 15 dias (carência). '
  'Após validates_at sem cancelamento, a comissão é considerada válida.';

alter table public.referrals enable row level security;
-- Acesso exclusivo via admin client (service role).