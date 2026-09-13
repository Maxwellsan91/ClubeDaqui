-- Add INFLUENCER to app_role enum
do $$ begin
  alter type public.app_role add value 'INFLUENCER';
exception when duplicate_object then null; end $$;

-- Active/inactive flag on profiles (default true)
alter table public.profiles
  add column if not exists is_active boolean not null default true;

-- Source of membership: paid, admin-granted, influencer-granted
alter table public.memberships
  add column if not exists source text not null default 'PAID'
  check (source in ('PAID', 'ADMIN_GRANT', 'INFLUENCER_GRANT'));

-- Audit log for profile status changes
create table if not exists public.profile_status_logs (
  id          uuid        primary key default gen_random_uuid(),
  profile_id  uuid        not null references public.profiles(id) on delete cascade,
  changed_by_id   uuid   not null,
  changed_by_name text    not null default 'Admin',
  previous_active boolean not null,
  new_active      boolean not null,
  reason          text    not null,
  created_at  timestamptz not null default now()
);

alter table public.profile_status_logs enable row level security;