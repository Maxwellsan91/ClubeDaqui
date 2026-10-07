# Selos Daqui — Programa de Fidelização por Parceiro

Camada de fidelização **independente** dos benefícios principais do Clube. O
benefício principal leva o cliente ao estabelecimento uma vez; os Selos Daqui
incentivam o regresso. Cada parceiro define o seu programa e as suas
recompensas; o Clube fornece apenas a infraestrutura (sem custo financeiro
direto para o Clube).

## Arquitetura

Segue o padrão existente do projeto: **lógica transaccional em PL/pgSQL
(`security definer`) + triggers + RLS**, com os controllers NestJS finos a
chamar RPCs via `supabase.rpc(...)`. Sem camada de serviço nem EventEmitter —
os "eventos de domínio" são triggers de base de dados, garantindo idempotência.

```
Membro usa benefício principal → parceiro valida (confirm_redemption)
   └─ trigger redemptions_issue_loyalty_visit → cria loyalty_visit (MAIN_BENEFIT, validated)
        └─ trigger loyalty_visits_issue_stamp → emite selo + desbloqueia recompensas
Membro regressa → "Registar visita" (QR) → parceiro valida (confirm_loyalty_visit)
   └─ mesmo trigger → +1 selo → ao atingir N selos, recompensa fica available
Membro usa recompensa (reserve_loyalty_reward) → parceiro valida (confirm_loyalty_reward) → redeemed
```

Decisões (confirmadas com o cliente):
- Rotas sob `/api/me`, `/api/partner`, `/api/admin` (sem `/v1`, como o resto).
- Token temporário **embutido na linha** (`token_hash` + `manual_code` +
  `expires_at`), igual a `redemptions` — sem tabela/serviço de tokens novo.
- Modelo **cumulativo**: recompensas **não** consomem selos.
- Recompensa desbloqueável **uma vez por ciclo** (membership) — `UNIQUE(reward_id, membership_id)`.

## Migration

`supabase/migrations/20261007120000_loyalty_stamps.sql` (validada ponta a ponta
num Postgres real).

**Enums:** `loyalty_stamp_rule_type`, `loyalty_reward_type`,
`loyalty_visit_source`, `loyalty_visit_status`, `loyalty_stamp_status`,
`loyalty_reward_redemption_status`.

**Tabelas:**
- `loyalty_programs` — 1 programa ativo por negócio (`unique … where is_active`), `max_stamps_per_day`, `minimum_spend`.
- `loyalty_rewards` — `required_stamps`, tipo, descontos, `validity_days_after_unlock`.
- `loyalty_visits` — visita; carrega o token; `unique(source_redemption_id)` e `unique(manual_code) where pending`.
- `loyalty_stamps` — `unique(visit_id)` (1 visita = no máx. 1 selo).
- `loyalty_reward_redemptions` — `unique(reward_id, membership_id)`.

**Triggers:** `redemptions_issue_loyalty_visit`, `loyalty_visits_issue_stamp`
(emite selo respeitando `max_stamps_per_day`/`minimum_spend` e desbloqueia
recompensas), `*_set_updated_at`.

**RPC:** `create_loyalty_visit_attempt`, `get_loyalty_visit_preview`,
`confirm_loyalty_visit`, `reserve_loyalty_reward`, `confirm_loyalty_reward`,
`get_member_loyalty_overview`, `get_member_loyalty_detail`,
`get_business_loyalty_summary`, `get_partner_loyalty_dashboard`.

**RLS:** membro vê só o seu (`user_id = auth.uid()`); parceiro via
`private.is_partner_for_business(business_id)`; admin via `private.is_admin()`;
estrutura do programa (programs/rewards) legível publicamente para negócios ativos.

## Endpoints (NestJS)

**Membro** (`MemberAuthGuard`)
- `GET  /api/me/loyalty` — resumo de todos os programas com progresso
- `GET  /api/me/loyalty/:businessId` — detalhe (selos, histórico, recompensas)
- `POST /api/me/loyalty/:businessId/visits` — gera QR/código de visita
- `POST /api/me/loyalty/rewards/:rewardRedemptionId/use` — gera código de recompensa

**Parceiro** (`PartnerAuthGuard`)
- `GET  /api/partner/loyalty/program` · `GET /api/partner/loyalty/dashboard` · `GET /api/partner/loyalty/visits`
- `POST /api/partner/loyalty/visits/preview` · `POST /api/partner/loyalty/visits/validate`
- `POST /api/partner/loyalty/rewards/validate`

**Admin** (`AdminAuthGuard`, service-role)
- `POST  /api/admin/businesses/:id/loyalty-program` · `PATCH /api/admin/loyalty-programs/:id`
- `POST  /api/admin/loyalty-programs/:id/rewards` · `PATCH /api/admin/loyalty-rewards/:id`

**Público**
- `GET /api/businesses/:businessId/loyalty` — resumo do programa (sem auth)

## Componentes frontend

`apps/web/src/components/loyalty/` — `StampProgress`, `LoyaltyCard`,
`MyLoyaltySection` (secção "Os meus Selos" na conta), `CodeTicket`,
`LoyaltyVisitButton`, `UseRewardButton`, `RewardCard`, `LoyaltyHistory`,
`BusinessLoyaltyBlock` (bloco na página do parceiro),
`PartnerLoyaltyValidator` (validação visita/recompensa) e
`PartnerLoyaltyStats` (métricas no dashboard).

Integrados em: `app/conta/page.tsx`, `app/explorar/[slug]/page.tsx`,
`app/parceiros/validar/page.tsx`, `app/parceiros/dashboard/page.tsx`.

## Regras antifraude

- 1 selo por visita (`unique(visit_id)`), limite diário configurável (`max_stamps_per_day`).
- Token hashed (SHA-256), uso único, expira em 5 min, `for update` + advisory locks.
- Validação revalida: membro ativo, negócio correto (`is_partner_for_business`), token válido/não expirado.
- Benefício→selo idempotente (`unique(source_redemption_id)`) — webhooks/repetições não duplicam.
- Mutações sempre via RPC `security definer`/service-role; RLS nega acesso direto.

## Testes

`supabase/tests/loyalty_flow_test.sql` — 13 cenários (ver `supabase/tests/README.md`).
Todos passam contra um Postgres real com a cadeia completa de migrations.

## Próximos passos sugeridos

1. UI de admin para criar/editar programas e recompensas (os endpoints já existem).
2. Notificações ("falta 1 selo", "recompensa desbloqueada") — já há pontos de evento nos triggers.
3. Job de expiração de visitas pendentes antigas (índice `loyalty_visits_expiry_idx` já existe).
4. Validade de selos (`validity_days`) e recompensas recorrentes — arquitetura já preparada.
5. Métricas B2B avançadas (média de visitas/membro, coorte de recorrência).
6. Suporte a múltiplos programas ativos por negócio (atualmente limitado a 1).