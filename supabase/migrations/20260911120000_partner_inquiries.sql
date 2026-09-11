create table if not exists public.partner_inquiries (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  contact text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'archived')),
  created_at timestamptz not null default now()
);
alter table public.partner_inquiries enable row level security;
create index if not exists partner_inquiries_status_idx on public.partner_inquiries(status);
create index if not exists partner_inquiries_created_at_idx on public.partner_inquiries(created_at desc);
