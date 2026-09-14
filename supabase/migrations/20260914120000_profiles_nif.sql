-- Add NIF to profiles
alter table public.profiles
  add column if not exists nif text,
  add constraint profiles_nif_unique unique (nif),
  add constraint profiles_nif_format
    check (nif is null or nif ~ '^\d{9}$');

-- Update the new-user trigger to also sync nif from user_metadata
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, nif)
  values (
    new.id,
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'nif'), '')
  );
  return new;
end;
$$;

-- Allow authenticated users to update nif on their own profile
-- (business rule: can only SET if null — enforced in API layer)
grant update (full_name, phone, nif) on public.profiles to authenticated;