-- Add instagram handle column to businesses
alter table public.businesses add column if not exists instagram text;

-- ──────────────────────────────────────────────
-- Update pilot businesses with contact info
-- ──────────────────────────────────────────────

update public.businesses set
  phone       = '+351 243 592 210',
  instagram   = 'atascadobronze',
  website_url = null
where id = '20000000-0000-0000-0000-000000000001'; -- A Tasca do Bronze

update public.businesses set
  phone       = '+351 243 591 234',
  instagram   = 'aadega.fazendas',
  website_url = null
where id = '20000000-0000-0000-0000-000000000002'; -- A Adega

update public.businesses set
  phone       = '+351 243 550 100',
  instagram   = 'adeganovoconceito',
  website_url = null
where id = '20000000-0000-0000-0000-000000000003'; -- Adega Novo Conceito

update public.businesses set
  phone       = '+351 963 421 700',
  instagram   = 'experienciasdotejo',
  website_url = null
where id = '20000000-0000-0000-0000-000000000004'; -- Experiências do Tejo

update public.businesses set
  phone       = '+351 243 500 789',
  instagram   = 'casaribatejana',
  website_url = null
where id = '20000000-0000-0000-0000-000000000005'; -- Casa Ribatejana

-- ──────────────────────────────────────────────
-- Update location phones
-- ──────────────────────────────────────────────

update public.business_locations set phone = '+351 243 592 210'
where slug = 'a-tasca-do-bronze';

update public.business_locations set phone = '+351 243 591 234'
where slug = 'a-adega';

update public.business_locations set phone = '+351 243 550 100'
where slug = 'adega-novo-conceito';

update public.business_locations set phone = '+351 963 421 700'
where slug = 'experiencias-do-tejo';

update public.business_locations set phone = '+351 243 500 789'
where slug = 'casa-ribatejana';

-- ──────────────────────────────────────────────
-- A Tasca do Bronze — 2º prato grátis
-- ──────────────────────────────────────────────

update public.benefits set
  type        = 'BUY_ONE_GET_ONE',
  title       = 'Na compra de 1 prato principal, o 2º é grátis',
  description = 'Ao pedir dois pratos principais, o de igual ou menor valor é por nossa conta.',
  terms       = E'Necessário o mínimo de 2 pessoas para utilizar a oferta\nO desconto aplica-se sempre ao prato de menor valor\nVálido ao almoço e jantar, de terça a domingo\nNão válido em feriados e vésperas de feriados\nNão acumulável com outras promoções ou menus\nO consumo deve ser realizado no estabelecimento'
where id = '30000000-0000-0000-0000-000000000001';

-- Ter–Dom = PG DOW {0,2,3,4,5,6} | 12:00–22:30
update public.benefit_rules set
  allowed_weekdays       = array[0,2,3,4,5,6]::smallint[],
  starts_at              = '12:00',
  ends_at                = '22:30',
  reservation_required   = false,
  membership_cycle_limit = 2
where benefit_id = '30000000-0000-0000-0000-000000000001';

-- ──────────────────────────────────────────────
-- Create benefits for remaining 4 businesses
-- (trigger auto-creates benefit_rules with defaults)
-- ──────────────────────────────────────────────

insert into public.benefits (id, business_id, type, title, description, terms, is_active)
values
  -- A Adega: 50% no 2º prato
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'PERCENTAGE_DISCOUNT',
    '50% de desconto no 2º prato de igual ou menor valor',
    'A pensar nos seus acompanhantes — o segundo prato principal fica a metade do preço.',
    E'Necessário o mínimo de 2 pessoas para utilizar a oferta\nO desconto de 50% aplica-se ao prato de menor valor\nVálido ao almoço e jantar, de quarta a domingo\nNão válido em feriados e vésperas de feriados\nNão acumulável com outras promoções ou menus\nO consumo deve ser realizado no estabelecimento',
    true
  ),
  -- Adega Novo Conceito: 15% em vinhos e produtos
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',
    'PERCENTAGE_DISCOUNT',
    '15% de desconto em vinhos e produtos locais',
    'Desconto exclusivo em toda a seleção de vinhos e produtos regionais da adega.',
    E'Válido em toda a seleção de vinhos e produtos à venda na loja\nCompra mínima de 20€ para aplicar o desconto\nNão aplicável a promoções já em curso\nApresente o código no momento do pagamento\nVálido de segunda a sábado',
    true
  ),
  -- Experiências do Tejo: 1 experiência grátis para 2 ou mais
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004',
    'FREE_ITEM',
    'Uma pessoa entra grátis ao reservar para 2 ou mais',
    'Reserve uma experiência a dois e o segundo bilhete é por nossa conta.',
    E'Válido para grupos de 2 ou mais pessoas\nA entrada gratuita aplica-se à pessoa de menor ou igual valor\nReserva obrigatória com 48h de antecedência\nSujeito a disponibilidade de datas\nApresente o código no momento da reserva ou à chegada\nVálido todos os dias',
    true
  ),
  -- Casa Ribatejana: 15% na estadia + late check-out
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000005',
    'PERCENTAGE_DISCOUNT',
    '15% de desconto na estadia + late check-out gratuito',
    'Desconto exclusivo para membros e extensão do check-out até às 13h sem custo adicional.',
    E'Desconto de 15% aplica-se ao valor total da estadia\nLate check-out até às 13h incluído sem custo\nReserva obrigatória com referência ao Clube Ribatejo\nNão acumulável com outras tarifas especiais ou promoções\nApresente o código no check-in\nVálido todos os dias, sujeito a disponibilidade',
    true
  )
on conflict (id) do update set
  type        = excluded.type,
  title       = excluded.title,
  description = excluded.description,
  terms       = excluded.terms,
  is_active   = true;

-- ──────────────────────────────────────────────
-- Update benefit_rules for businesses 2–5
-- ──────────────────────────────────────────────

-- A Adega: Qua–Dom (PG DOW 0,3,4,5,6) 12:00–21:30
update public.benefit_rules set
  allowed_weekdays       = array[0,3,4,5,6]::smallint[],
  starts_at              = '12:00',
  ends_at                = '21:30',
  reservation_required   = false,
  membership_cycle_limit = 2
where benefit_id = '30000000-0000-0000-0000-000000000002';

-- Adega Novo Conceito: Seg–Sáb (PG DOW 1,2,3,4,5,6) 10:00–19:00
update public.benefit_rules set
  allowed_weekdays       = array[1,2,3,4,5,6]::smallint[],
  starts_at              = '10:00',
  ends_at                = '19:00',
  reservation_required   = false,
  membership_cycle_limit = 1
where benefit_id = '30000000-0000-0000-0000-000000000003';

-- Experiências do Tejo: todos os dias (PG DOW 0–6) 09:00–18:00
update public.benefit_rules set
  allowed_weekdays       = array[0,1,2,3,4,5,6]::smallint[],
  starts_at              = '09:00',
  ends_at                = '18:00',
  reservation_required   = true,
  membership_cycle_limit = 1
where benefit_id = '30000000-0000-0000-0000-000000000004';

-- Casa Ribatejana: todos os dias check-in 14:00–20:00
update public.benefit_rules set
  allowed_weekdays       = array[0,1,2,3,4,5,6]::smallint[],
  starts_at              = '14:00',
  ends_at                = '20:00',
  reservation_required   = true,
  membership_cycle_limit = 1
where benefit_id = '30000000-0000-0000-0000-000000000005';