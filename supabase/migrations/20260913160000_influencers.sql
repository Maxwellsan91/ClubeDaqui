create table public.influencers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  unique_code text not null unique,
  commission_rate numeric(5,2) not null default 10.00,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.influencers enable row level security;
-- Accessible only via service-role (admin client); no browser-side access needed.