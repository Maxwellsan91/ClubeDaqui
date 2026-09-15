-- Keep the user profile endpoint on the authenticated client/RLS path while
-- enforcing the NIF immutability rule at the database boundary as well.
create or replace function private.prevent_nif_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.nif is not null and new.nif is distinct from old.nif then
    raise exception 'NIF cannot be changed once set';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_nif_change on public.profiles;
create trigger profiles_prevent_nif_change
before update of nif on public.profiles
for each row execute function private.prevent_nif_change();
