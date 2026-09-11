insert into public.categories (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Comer', 'comer'),
  ('10000000-0000-0000-0000-000000000002', 'Dormir', 'dormir'),
  ('10000000-0000-0000-0000-000000000003', 'Lazer', 'lazer')
on conflict (slug) do update set name = excluded.name;

insert into public.businesses (id, name, slug, description, is_active) values
  ('20000000-0000-0000-0000-000000000001', 'A Tasca do Bronze', 'a-tasca-do-bronze', 'Uma descoberta do nosso roteiro local.', true),
  ('20000000-0000-0000-0000-000000000002', 'A Adega', 'a-adega', 'Uma morada para descobrir a cozinha portuguesa.', true),
  ('20000000-0000-0000-0000-000000000003', 'Adega Novo Conceito', 'adega-novo-conceito', 'Produtos e ambiente com identidade local.', true),
  ('20000000-0000-0000-0000-000000000004', 'Experiências do Tejo', 'experiencias-do-tejo', 'Descubra a paisagem e o ritmo do Tejo.', true),
  ('20000000-0000-0000-0000-000000000005', 'Casa Ribatejana', 'casa-ribatejana', 'Uma estadia tranquila em Almeirim.', true)
on conflict (id) do update set name = excluded.name, description = excluded.description, is_active = true;

insert into public.business_locations (business_id, name, slug, address_line_1, postal_code, locality, municipality, latitude, longitude, is_active)
values
  ('20000000-0000-0000-0000-000000000001', 'A Tasca do Bronze', 'a-tasca-do-bronze', 'Rua de Coruche, 141', '2080-094', 'Almeirim', 'Almeirim', 39.2028305, -8.6281241, true),
  ('20000000-0000-0000-0000-000000000002', 'A Adega', 'a-adega', 'Fazendas de Almeirim', '2080-562', 'Fazendas de Almeirim', 'Almeirim', 39.1767872, -8.5833777, true),
  ('20000000-0000-0000-0000-000000000003', 'Adega Novo Conceito', 'adega-novo-conceito', 'Rua João de Deus, 80', '2080-576', 'Fazendas de Almeirim', 'Almeirim', 39.1791369, -8.5922863, true),
  ('20000000-0000-0000-0000-000000000004', 'Experiências do Tejo', 'experiencias-do-tejo', 'Almeirim', '2080-000', 'Almeirim', 'Almeirim', null, null, true),
  ('20000000-0000-0000-0000-000000000005', 'Casa Ribatejana', 'casa-ribatejana', 'Almeirim', '2080-000', 'Almeirim', 'Almeirim', null, null, true);

insert into public.business_categories (business_id, category_id)
select b.id, c.id from public.businesses b cross join public.categories c
where (b.slug, c.slug) in (('a-tasca-do-bronze','comer'), ('a-adega','comer'), ('adega-novo-conceito','comer'), ('experiencias-do-tejo','lazer'), ('casa-ribatejana','dormir'))
on conflict do nothing;
