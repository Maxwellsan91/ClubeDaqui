begin;

create table public.redemption_financials (
  id uuid primary key default gen_random_uuid(),
  redemption_id uuid not null unique references public.redemptions (id) on delete cascade,
  total_bill_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) not null,
  savings_recorded_at timestamptz not null default now(),
  savings_recorded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint redemption_financials_bill_non_negative check (total_bill_amount >= 0),
  constraint redemption_financials_discount_non_negative check (discount_amount >= 0),
  constraint redemption_financials_discount_lte_bill check (discount_amount <= total_bill_amount)
);

create index redemption_financials_recorded_by_idx
  on public.redemption_financials (savings_recorded_by, savings_recorded_at desc);

create trigger redemption_financials_set_updated_at
  before update on public.redemption_financials
  for each row execute function private.set_updated_at();

alter table public.redemption_financials enable row level security;

create policy "members read own redemption financials"
on public.redemption_financials for select to authenticated
using (exists (
  select 1
  from public.redemptions r
  join public.memberships m on m.id = r.membership_id
  where r.id = redemption_financials.redemption_id
    and m.profile_id = (select auth.uid())
));

create policy "members record own redemption financials"
on public.redemption_financials for insert to authenticated
with check (
  savings_recorded_by = (select auth.uid())
  and exists (
    select 1
    from public.redemptions r
    join public.memberships m on m.id = r.membership_id
    where r.id = redemption_financials.redemption_id
      and m.profile_id = (select auth.uid())
      and r.status = 'redeemed'
  )
);

create policy "admins manage redemption financials"
on public.redemption_financials for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

commit;
