insert into public.benefits (id, business_id, type, title, description, terms, is_active)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'PERCENTAGE_DISCOUNT', '10% de desconto para membros', 'Uma vantagem exclusiva para membros Clube Ribatejo.', 'Apresente a sua membresia no momento do pagamento.', true)
on conflict (id) do update set title = excluded.title, description = excluded.description, terms = excluded.terms, is_active = true;
