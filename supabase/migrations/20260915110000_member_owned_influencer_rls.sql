-- Allow an authenticated influencer/member to read only their own influencer
-- record and referrals, without exposing these tables through service-role.
grant select on public.influencers to authenticated;
grant select, insert on public.referrals to authenticated;

create policy "influencers read own profile"
on public.influencers for select to authenticated
using (email = (select auth.jwt() ->> 'email'));

create policy "members read own referrals"
on public.referrals for select to authenticated
using (member_id = (select auth.uid()));

create policy "members create own referrals"
on public.referrals for insert to authenticated
with check (member_id = (select auth.uid()));
