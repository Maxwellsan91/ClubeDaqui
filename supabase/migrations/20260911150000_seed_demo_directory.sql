with demo(slug, name, category) as (values
 ('restaurante-ribatejo-01','Casa do Tejo','Comer'),('restaurante-ribatejo-02','O Cantinho da Várzea','Comer'),('restaurante-ribatejo-03','Mesa da Lezíria','Comer'),('restaurante-ribatejo-04','Sabores de Almeirim','Comer'),('restaurante-ribatejo-05','A Grelha Ribatejana','Comer'),('restaurante-ribatejo-06','Páteo das Oliveiras','Comer'),('restaurante-ribatejo-07','Cozinha da Praça','Comer'),('restaurante-ribatejo-08','Forno da Vila','Comer'),('restaurante-ribatejo-09','O Mercado Velho','Comer'),('restaurante-ribatejo-10','Tacho do Campo','Comer'),('restaurante-ribatejo-11','Sabor a Sul','Comer'),('restaurante-ribatejo-12','A Cabana do Tejo','Comer'),('restaurante-ribatejo-13','Entrevinhas','Comer'),('restaurante-ribatejo-14','Olaria Restaurante','Comer'),('restaurante-ribatejo-15','Varanda Ribatejana','Comer'),('restaurante-ribatejo-16','Raízes da Terra','Comer'),('restaurante-ribatejo-17','Petisco Local','Comer'),('restaurante-ribatejo-18','Aromas do Campo','Comer'),('restaurante-ribatejo-19','Tradição à Mesa','Comer'),('restaurante-ribatejo-20','Rota dos Sabores','Comer'),
 ('hotel-ribatejo-01','Hotel Lezíria','Dormir'),('hotel-ribatejo-02','Quinta do Tejo','Dormir'),('hotel-ribatejo-03','Casa das Oliveiras','Dormir'),('hotel-ribatejo-04','Solar de Almeirim','Dormir'),('hotel-ribatejo-05','Estação Ribatejana','Dormir'),('hotel-ribatejo-06','Aldeia do Campo','Dormir'),('hotel-ribatejo-07','Pátio das Laranjeiras','Dormir'),('hotel-ribatejo-08','Herdade do Vale','Dormir'),('hotel-ribatejo-09','Casa do Largo','Dormir'),('hotel-ribatejo-10','Refúgio do Tejo','Dormir'),
 ('cafe-ribatejo-01','Café da Praça','Comer'),('cafe-ribatejo-02','Doce Lezíria','Comer'),('cafe-ribatejo-03','Ponto de Encontro','Comer'),('cafe-ribatejo-04','Café Central','Comer'),('cafe-ribatejo-05','A Pastelaria Ribatejana','Comer'),('cafe-ribatejo-06','Grão da Vila','Comer'),('cafe-ribatejo-07','Café do Jardim','Comer'),('cafe-ribatejo-08','Migalha Doce','Comer'),('cafe-ribatejo-09','Pausa para Café','Comer'),('cafe-ribatejo-10','O Cantinho do Bolo','Comer'))
insert into public.businesses (id,name,slug,description,is_active)
select md5('demo-'||slug)::uuid, name, slug, 'Estabelecimento demonstrativo do piloto Clube Ribatejo.', true from demo
on conflict (slug) do update set name=excluded.name, description=excluded.description, is_active=true;

insert into public.business_locations (business_id,name,slug,address_line_1,postal_code,locality,municipality,is_active)
select id,name,slug,'Almeirim','2080-000','Almeirim','Almeirim',true from public.businesses where slug like 'restaurante-ribatejo-%' or slug like 'hotel-ribatejo-%' or slug like 'cafe-ribatejo-%'
on conflict (business_id,slug) do nothing;

insert into public.business_categories (business_id, category_id)
select b.id, c.id from public.businesses b join public.categories c on c.slug = case when b.slug like 'hotel-%' then 'dormir' else 'comer' end
where b.slug like 'restaurante-ribatejo-%' or b.slug like 'hotel-ribatejo-%' or b.slug like 'cafe-ribatejo-%'
on conflict do nothing;
