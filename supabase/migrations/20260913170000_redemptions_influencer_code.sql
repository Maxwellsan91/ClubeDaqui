alter table public.redemptions
  add column if not exists influencer_code text;

comment on column public.redemptions.influencer_code
  is 'Código do influencer que originou este resgate (preenchido no momento do resgate pelo membro).';