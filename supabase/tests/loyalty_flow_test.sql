\set ON_ERROR_STOP on

-- ================== SEED ==================
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111','member@test.pt','{"full_name":"Ana Membro"}'),
  ('22222222-2222-2222-2222-222222222222','partner@test.pt','{"full_name":"Pedro Parceiro"}'),
  ('33333333-3333-3333-3333-333333333333','partner2@test.pt','{"full_name":"Rui Rival"}');
update public.profiles set role='PARTNER', phone='910000000' where id='22222222-2222-2222-2222-222222222222';
update public.profiles set role='PARTNER', phone='910000002' where id='33333333-3333-3333-3333-333333333333';
update public.profiles set phone='910000001' where id='11111111-1111-1111-1111-111111111111';

insert into public.businesses (id, name, slug, is_active) values
  ('b1b1b1b1-1111-1111-1111-111111111111','Biz Um','biz-um',true),
  ('b2b2b2b2-2222-2222-2222-222222222222','Biz Dois','biz-dois',true),
  ('b3b3b3b3-3333-3333-3333-333333333333','Biz Tres','biz-tres',true);
insert into public.business_locations (id, business_id, name, slug, address_line_1, postal_code, locality, municipality, is_active) values
  ('c1c1c1c1-1111-1111-1111-111111111111','b1b1b1b1-1111-1111-1111-111111111111','Loja 1','loja-1','R 1','2000-000','Almeirim','Almeirim',true);
insert into public.partner_users (profile_id, business_id) values
  ('22222222-2222-2222-2222-222222222222','b1b1b1b1-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222','b2b2b2b2-2222-2222-2222-222222222222'),
  ('22222222-2222-2222-2222-222222222222','b3b3b3b3-3333-3333-3333-333333333333');
insert into public.memberships (id, profile_id, starts_at, ends_at, status) values
  ('f1f1f1f1-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111', now()-interval '10 days', now()+interval '300 days','active');
insert into public.loyalty_programs (id, business_id, name, is_active, stamp_rule_type, max_stamps_per_day, minimum_spend) values
  ('d1d1d1d1-1111-1111-1111-111111111111','b1b1b1b1-1111-1111-1111-111111111111','Selos Biz Um',true,'VISIT',10,null),
  ('d2d2d2d2-2222-2222-2222-222222222222','b2b2b2b2-2222-2222-2222-222222222222','Selos Biz Dois',true,'VISIT',1,null),
  ('d3d3d3d3-3333-3333-3333-333333333333','b3b3b3b3-3333-3333-3333-333333333333','Selos Biz Tres',true,'MINIMUM_SPEND',10,20);
insert into public.loyalty_rewards (id, loyalty_program_id, title, required_stamps, reward_type) values
  ('e1e1e1e1-1111-1111-1111-111111111111','d1d1d1d1-1111-1111-1111-111111111111','50% no segundo prato',3,'PERCENTAGE_DISCOUNT'),
  ('e2e2e2e2-2222-2222-2222-222222222222','d1d1d1d1-1111-1111-1111-111111111111','2x1 em pratos',5,'BUY_ONE_GET_ONE');
insert into public.benefits (id, business_id, type, title, is_active) values
  ('a1a1a1a1-1111-1111-1111-111111111111','b1b1b1b1-1111-1111-1111-111111111111','PERCENTAGE_DISCOUNT','2x1',true);

-- ================== SCENARIOS (server-side, with impersonation) ==================
do $$
declare
  c_member constant uuid := '11111111-1111-1111-1111-111111111111';
  c_partner constant uuid := '22222222-2222-2222-2222-222222222222';
  c_partner2 constant uuid := '33333333-3333-3333-3333-333333333333';
  c_biz1 constant uuid := 'b1b1b1b1-1111-1111-1111-111111111111';
  c_biz2 constant uuid := 'b2b2b2b2-2222-2222-2222-222222222222';
  c_biz3 constant uuid := 'b3b3b3b3-3333-3333-3333-333333333333';
  c_rewardA constant uuid := 'e1e1e1e1-1111-1111-1111-111111111111';
  c_rewardB constant uuid := 'e2e2e2e2-2222-2222-2222-222222222222';
  c_prog1 constant uuid := 'd1d1d1d1-1111-1111-1111-111111111111';
  v_code text; v_tok text; v_si boolean; v_cs integer; v_rrid uuid; v_rst text;
  v_a int; v_b int; v_stamps int; v_visits int; v_njson int;

  function_run_visit text; -- placeholder to keep structure clear
begin
  -- helper inline via nested procedure not available; do steps explicitly.

  -- ---- TEST 1: 1 visita validada = 1 selo ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select stamp_issued, current_stamps into v_si, v_cs from public.confirm_loyalty_visit(null, v_code, null);
  if not v_si or v_cs <> 1 then raise exception 'FAIL t1: si=% cs=%', v_si, v_cs; end if;
  raise notice 'OK t1: 1 visita = 1 selo (current=%)', v_cs;

  -- ---- build up to 3 stamps -> reward A unlocks ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  perform public.confirm_loyalty_visit(null, v_code, null);

  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select current_stamps into v_cs from public.confirm_loyalty_visit(null, v_code, null);

  select count(*) into v_a from public.loyalty_reward_redemptions where reward_id=c_rewardA and status='available';
  if v_cs <> 3 or v_a <> 1 then raise exception 'FAIL t2: cs=% availA=%', v_cs, v_a; end if;
  raise notice 'OK t2: 3 selos -> reward A desbloqueada';

  -- ---- build up to 5 stamps -> reward B unlocks; A not duplicated; stamps not consumed ----
  for i in 1..2 loop
    perform set_config('request.jwt.claim.sub', c_member::text, true);
    select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
    perform set_config('request.jwt.claim.sub', c_partner::text, true);
    select current_stamps into v_cs from public.confirm_loyalty_visit(null, v_code, null);
  end loop;
  select count(*) into v_a from public.loyalty_reward_redemptions where reward_id=c_rewardA;
  select count(*) into v_b from public.loyalty_reward_redemptions where reward_id=c_rewardB and status='available';
  select private.count_active_stamps(c_prog1, c_member) into v_stamps;
  if v_cs<>5 or v_a<>1 or v_b<>1 or v_stamps<>5 then
    raise exception 'FAIL t3: cs=% A=% B=% stamps=%', v_cs, v_a, v_b, v_stamps; end if;
  raise notice 'OK t3: reward B aos 5, reward A unica, selos mantidos (=%)', v_stamps;

  -- ---- TEST 4: reservar + validar recompensa ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select id into v_rrid from public.loyalty_reward_redemptions where reward_id=c_rewardA and status='available';
  select manual_code into v_code from public.reserve_loyalty_reward(v_rrid);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select reward_status::text into v_rst from public.confirm_loyalty_reward(null, v_code);
  if v_rst <> 'redeemed' then raise exception 'FAIL t4: status=%', v_rst; end if;
  select private.count_active_stamps(c_prog1, c_member) into v_stamps;
  if v_stamps <> 5 then raise exception 'FAIL t4: recompensa consumiu selos (=%)', v_stamps; end if;
  raise notice 'OK t4: recompensa REDEEMED, selos intactos';

  -- ---- TEST 5: beneficio principal -> selo, idempotente ----
  insert into public.redemptions (id, membership_id, benefit_id, business_location_id, status, token_hash, manual_code, expires_at)
  values ('a9a9a9a9-1111-1111-1111-111111111111','f1f1f1f1-1111-1111-1111-111111111111','a1a1a1a1-1111-1111-1111-111111111111','c1c1c1c1-1111-1111-1111-111111111111','pending', repeat('a',64),'123456', now()+interval '5 min');
  update public.redemptions set status='redeemed', redeemed_at=now(), validated_by=c_partner where id='a9a9a9a9-1111-1111-1111-111111111111';
  update public.redemptions set status='redeemed', redeemed_at=now(), validated_by=c_partner where id='a9a9a9a9-1111-1111-1111-111111111111';
  select count(*) into v_visits from public.loyalty_visits where source_redemption_id='a9a9a9a9-1111-1111-1111-111111111111';
  select count(*) into v_stamps from public.loyalty_stamps s join public.loyalty_visits v on v.id=s.visit_id where v.source_redemption_id='a9a9a9a9-1111-1111-1111-111111111111';
  if v_visits<>1 or v_stamps<>1 then raise exception 'FAIL t5: visits=% stamps=%', v_visits, v_stamps; end if;
  raise notice 'OK t5: beneficio -> 1 visita + 1 selo (idempotente)';

  -- ---- TEST 6: limite diario (Biz Dois, max=1) ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz2);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select stamp_issued into v_si from public.confirm_loyalty_visit(null, v_code, null);
  if not v_si then raise exception 'FAIL t6: 1a visita sem selo'; end if;
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz2);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select stamp_issued into v_si from public.confirm_loyalty_visit(null, v_code, null);
  if v_si then raise exception 'FAIL t6: 2a visita gerou selo apesar do limite'; end if;
  raise notice 'OK t6: limite diario respeitado';

  -- ---- TEST 7: minimum_spend (Biz Tres, min 20) ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz3);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select stamp_issued into v_si from public.confirm_loyalty_visit(null, v_code, 10);
  if v_si then raise exception 'FAIL t7: conta 10 gerou selo'; end if;
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz3);
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  select stamp_issued into v_si from public.confirm_loyalty_visit(null, v_code, 25);
  if not v_si then raise exception 'FAIL t7: conta 25 nao gerou selo'; end if;
  raise notice 'OK t7: minimum_spend respeitado (10 nao, 25 sim)';

  -- ---- TEST 8: overview JSON ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select json_array_length(public.get_member_loyalty_overview()) into v_njson;
  if v_njson < 1 then raise exception 'FAIL t8: overview vazio'; end if;
  raise notice 'OK t8: overview devolve % programas', v_njson;

  -- ---- TEST 9a: parceiro nao pode validar business de outro parceiro ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
  perform set_config('request.jwt.claim.sub', c_partner2::text, true);
  begin
    perform public.confirm_loyalty_visit(null, v_code, null);
    raise exception 'FAIL t9a: parceiro alheio validou visita';
  exception when others then
    if sqlerrm not like '%not associated%' then raise; end if;
    raise notice 'OK t9a: parceiro alheio bloqueado';
  end;

  -- ---- TEST 9b: QR expirado falha ----
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  select manual_code into v_code from public.create_loyalty_visit_attempt(c_biz1);
  update public.loyalty_visits set expires_at = now() - interval '1 minute'
    where manual_code = v_code and status = 'pending';
  perform set_config('request.jwt.claim.sub', c_partner::text, true);
  begin
    perform public.confirm_loyalty_visit(null, v_code, null);
    raise exception 'FAIL t9b: QR expirado foi aceite';
  exception when others then
    if sqlerrm not like '%expired%' then raise; end if;
    raise notice 'OK t9b: QR expirado rejeitado';
  end;

  -- ---- TEST 9: membership inativa bloqueia ----
  update public.memberships set status='expired' where id='f1f1f1f1-1111-1111-1111-111111111111';
  perform set_config('request.jwt.claim.sub', c_member::text, true);
  begin
    perform public.create_loyalty_visit_attempt(c_biz1);
    raise exception 'FAIL t9: deveria ter bloqueado';
  exception when others then
    if sqlerrm not like '%Active membership%' then raise; end if;
    raise notice 'OK t9: membership inativa bloqueada';
  end;

  -- ---- TEST 10: histórico/selos persistem após membership expirar ----
  select private.count_active_stamps(c_prog1, c_member) into v_stamps;
  select count(*) into v_visits from public.loyalty_visits
    where user_id = c_member and status = 'validated';
  select count(*) into v_a from public.loyalty_reward_redemptions
    where user_id = c_member and status = 'redeemed';
  if v_stamps < 5 or v_visits < 1 or v_a < 1 then
    raise exception 'FAIL t10: historico perdido stamps=% visits=% redeemed=%', v_stamps, v_visits, v_a;
  end if;
  raise notice 'OK t10: selos(%), visitas(%) e recompensa redimida(%) mantidos apos expirar', v_stamps, v_visits, v_a;

  raise notice '=========== TODOS OS TESTES PASSARAM ===========';
end $$;
