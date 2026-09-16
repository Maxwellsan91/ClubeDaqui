alter table public.businesses
  add column if not exists price_min numeric(10,2),
  add column if not exists price_max numeric(10,2),
  add column if not exists price_currency text not null default 'EUR',
  add column if not exists price_source text not null default 'manual';

alter table public.businesses
  add constraint businesses_price_range_valid
  check (price_min is null or price_min >= 0)
  not valid;

alter table public.businesses
  add constraint businesses_price_range_ordered
  check (price_max is null or price_min is null or price_max >= price_min)
  not valid;

update public.businesses set price_min = 15, price_max = 40
where slug = 'a-adega' and price_min is null;

update public.businesses set price_min = 12, price_max = 35
where slug = 'a-tasca-do-bronze' and price_min is null;
