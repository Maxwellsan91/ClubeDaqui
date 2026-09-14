-- Partner dashboard stats RPC
create function public.get_partner_dashboard()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid;
  v_business_name text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select pu.business_id, bus.name
  into v_business_id, v_business_name
  from public.partner_users pu
  join public.businesses bus on bus.id = pu.business_id
  join public.profiles p on p.id = pu.profile_id
  where pu.profile_id = (select auth.uid())
    and p.role = 'PARTNER'
  limit 1;

  if v_business_id is null then
    raise exception 'Partner not associated with any business' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'businessName', v_business_name,
      'totalRedemptions', (
        select count(*)::int
        from public.redemptions r
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id and r.status = 'redeemed'
      ),
      'thisMonthRedemptions', (
        select count(*)::int
        from public.redemptions r
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id
          and r.status = 'redeemed'
          and date_trunc('month', r.redeemed_at) = date_trunc('month', now())
      ),
      'lastMonthRedemptions', (
        select count(*)::int
        from public.redemptions r
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id
          and r.status = 'redeemed'
          and date_trunc('month', r.redeemed_at) = date_trunc('month', now() - interval '1 month')
      ),
      'uniqueMembers', (
        select count(distinct r.membership_id)::int
        from public.redemptions r
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id and r.status = 'redeemed'
      ),
      'totalRevenue', (
        select coalesce(sum(rf.total_bill_amount), 0)::numeric
        from public.redemption_financials rf
        join public.redemptions r on r.id = rf.redemption_id
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id and r.status = 'redeemed'
      ),
      'avgBillAmount', (
        select coalesce(round(avg(rf.total_bill_amount), 2), 0)::numeric
        from public.redemption_financials rf
        join public.redemptions r on r.id = rf.redemption_id
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id and r.status = 'redeemed'
      ),
      'totalDiscount', (
        select coalesce(sum(rf.discount_amount), 0)::numeric
        from public.redemption_financials rf
        join public.redemptions r on r.id = rf.redemption_id
        join public.business_locations bl on bl.id = r.business_location_id
        where bl.business_id = v_business_id and r.status = 'redeemed'
      ),
      'monthlySeries', (
        select coalesce(
          json_agg(
            json_build_object('month', ms.month, 'count', ms.count)
            order by ms.sort_month
          ),
          '[]'::json
        )
        from (
          select
            to_char(gs.month, 'Mon') as month,
            gs.month as sort_month,
            count(r.id)::int as count
          from generate_series(
            date_trunc('month', now() - interval '5 months'),
            date_trunc('month', now()),
            interval '1 month'
          ) as gs(month)
          left join public.redemptions r on
            date_trunc('month', r.redeemed_at) = gs.month
            and r.status = 'redeemed'
            and r.business_location_id in (
              select id from public.business_locations where business_id = v_business_id
            )
          group by gs.month
        ) ms
      ),
      'recentRedemptions', (
        select coalesce(json_agg(rr), '[]'::json)
        from (
          select
            r.id,
            p.full_name as "memberName",
            b.title as "benefitTitle",
            r.redeemed_at as "redeemedAt",
            rf.total_bill_amount as "billAmount",
            rf.discount_amount as "discountAmount"
          from public.redemptions r
          join public.memberships m on m.id = r.membership_id
          join public.profiles p on p.id = m.profile_id
          join public.benefits b on b.id = r.benefit_id
          join public.business_locations bl on bl.id = r.business_location_id
          left join public.redemption_financials rf on rf.redemption_id = r.id
          where bl.business_id = v_business_id
            and r.status = 'redeemed'
          order by r.redeemed_at desc
          limit 20
        ) rr
      )
    )
  );
end;
$$;

revoke all on function public.get_partner_dashboard() from public, anon;
grant execute on function public.get_partner_dashboard() to authenticated;

-- Member benefit usage check
create function public.get_member_benefit_used(p_benefit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.redemptions r
    join public.memberships m on m.id = r.membership_id
    where m.profile_id = (select auth.uid())
      and m.status = 'active'
      and m.starts_at <= now()
      and m.ends_at > now()
      and r.benefit_id = p_benefit_id
      and r.status = 'redeemed'
  );
$$;

revoke all on function public.get_member_benefit_used(uuid) from public, anon;
grant execute on function public.get_member_benefit_used(uuid) to authenticated;