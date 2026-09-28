# Plano de reforço de segurança — Clube Daqui

**Data:** 2026-09-28
**Âmbito:** `apps/api`, `apps/web`, `apps/mobile`, Supabase e CI/CD
**Objetivo:** reduzir o risco de acesso indevido, abuso de endpoints, fuga de
dados e falhas de consistência antes do próximo lançamento público.

Este plano não substitui um pentest externo nem garante segurança absoluta. A
implementação deve ser feita por fases, com validação de cada fase antes de
avançar.

## Critério de pronto para produção

- Nenhuma vulnerabilidade alta conhecida nas dependências de produção, ou uma exceção documentada e aceite.
- Todos os endpoints autenticados têm DTO/runtime validation e testes 401/403.
- Rate limiting funciona entre instâncias e sobrevive a cold starts.
- RLS, grants e funções `SECURITY DEFINER` foram testados no projeto Supabase remoto.
- Webhook Stripe, faturação e refund têm testes de replay/idempotência.
- Logs não contêm tokens, API keys ou PII desnecessária.
- HSTS, CSP e CORS estão configurados para os domínios de produção.
- Existe procedimento documentado para rotação de segredos e resposta a incidentes.

## Fase 0 — preparação e baseline

- Criar branch `security/hardening`.
- Confirmar ambientes separados para desenvolvimento, staging e produção.
- Catalogar secrets, domínios, webhooks, roles e tabelas protegidas.
- Ativar Dependabot/Renovate e `npm audit` no CI, sem upgrades automáticos major.
- Adicionar `SECURITY.md` com contacto de reporte e política de exposição.
- Criar testes de autorização com MEMBER, PARTNER, ADMIN e INFLUENCER.

**Saída:** baseline de dependências, matriz de acessos e checklist de deploy.

## Fase 1 — bloquear abuso e validar inputs (P0)

1. Adicionar `ValidationPipe` global no NestJS com `whitelist`,
   `forbidNonWhitelisted` e `transform`.
2. Criar DTOs para checkout, inquiries, resgates, avaliações, perfil e todos
   os endpoints admin.
3. Substituir o rate limit em memória por Redis/Upstash ou solução equivalente
   partilhada.
4. Criar limites específicos para login, registo, checkout, códigos de
   resgate, webhooks inválidos e formulário público.
5. Proteger `partner-inquiries` com CAPTCHA/Turnstile, validação de contacto,
   deduplicação e limites por IP/email.
6. Adicionar paginação e limites máximos às listagens administrativas.

**Aceitação:** payloads desconhecidos são rejeitados; 100 tentativas rápidas
recebem 429 de forma consistente em duas instâncias; nenhum endpoint público
permite crescimento ilimitado.

## Fase 2 — reduzir privilégios e fechar autorização (P0)

1. Auditar cada uso de `createAdminClient()`; substituir operações de membro
   por cliente com token/RLS ou RPC mínima.
2. Manter `service_role` apenas em webhook Stripe, jobs fiscais e operações
   administrativas explicitamente protegidas.
3. Confirmar autorização por role no servidor para `/admin`, `/parceiros` e
   operações de membro; manter a proteção também na base de dados.
4. Criar uma política de superadmin para atribuição de `ADMIN`.
5. Registar auditoria de alterações de role, estado de conta, perfil,
   membership, benefícios e documentos fiscais.
6. Garantir revogação/expiração de sessões quando uma conta é desativada ou a
   role é alterada.

**Aceitação:** cada endpoint tem teste positivo e negativo por role; um membro
não consegue ler ou alterar dados de outro; nenhum endpoint de membro depende
do service role sem justificação documentada.

## Fase 3 — pagamentos, faturação e consistência (P0)

1. No webhook Stripe, validar `price_id`, moeda, valor, modo live/test e
   associação entre sessão, payment e membership.
2. Impedir a criação ilimitada de memberships/payments pendentes e limpar ou
   reutilizar checkouts abandonados.
3. Testar replay do mesmo evento, eventos fora de ordem e eventos incompatíveis.
4. Confirmar que retry fiscal nunca cria documentos duplicados e que falhas do
   InvoiceXpress não alteram o estado do pagamento.
5. Implementar o fluxo de refund/credit note apenas depois de testar a ligação
   à fatura original.
6. Verificar que URLs PDF/permalinks não dão acesso a documentos de terceiros.

**Aceitação:** um evento repetido gera uma única membership e uma única fatura;
valores/moedas/preços inesperados são rejeitados e ficam auditados.

## Fase 4 — Supabase e dados (P0/P1)

1. Aplicar todas as migrations numa branch/staging antes de produção.
2. Executar testes de RLS como anon, authenticated, MEMBER, PARTNER e ADMIN.
3. Rever grants de todas as funções `SECURITY DEFINER` e manter `search_path` explícito.
4. Corrigir e documentar a policy de `partner_inquiries`.
5. Confirmar que tabelas novas, como `fiscal_documents`, não têm grants de escrita para `anon` ou `authenticated`.
6. Executar Supabase Security Advisor e corrigir findings críticos/altos.
7. Definir retenção, exportação e eliminação de PII, incluindo NIF, contactos, pagamentos e logs.

**Aceitação:** relatório de grants/policies versionado sem dados pessoais e
nenhum teste atravessa o limite de propriedade entre utilizadores.

## Fase 5 — dependências e cliente mobile (P1)

1. Atualizar Expo/Expo Router e dependências transitivas sinalizadas pelo
   `npm audit`, primeiro numa branch de upgrade.
2. Corrigir `image-size`, PostCSS, `uuid`, `query-string` e dependências
   associadas através de upgrades suportados, evitando overrides arbitrários.
3. Executar build Android/iOS, testes de autenticação e resgate após cada upgrade.
4. Confirmar que tokens continuam exclusivamente no Secure Store e nunca em logs, deep links ou AsyncStorage.

**Aceitação:** `npm audit --omit=dev` sem vulnerabilidades altas; build mobile e fluxos Auth passam em staging.

## Fase 6 — headers, observabilidade e resposta (P1)

- Ativar HSTS no domínio HTTPS de produção.
- Remover gradualmente `unsafe-eval` e `unsafe-inline` da CSP usando nonces ou hashes quando possível.
- Restringir CORS a origens de produção e desenvolvimento explicitamente necessárias.
- Normalizar logs com request ID, duração, status e código de erro, sem tokens, API keys, NIF ou emails completos.
- Criar alertas para 401/403 anormais, falhas de webhook, retries fiscais, brute force e erros 5xx.
- Documentar rotação de chaves Stripe, Supabase, InvoiceXpress, Resend e Google Maps.

## Fase 7 — validação final

- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm run build`
- testes unitários e de integração da API
- testes E2E de Auth, resgate, pagamento e fatura
- testes RLS no Supabase remoto
- `npm audit --omit=dev`
- scan de secrets no Git e no CI
- revisão manual de CORS/CSP/HSTS
- pentest externo ou revisão independente antes do lançamento

## Ordem recomendada de execução

1. Fase 0 — baseline
2. Fase 1 — validation e rate limiting
3. Fase 2 — privilégios e autorização
4. Fase 3 — pagamentos/faturação
5. Fase 4 — Supabase/RLS
6. Fase 5 — dependências mobile
7. Fase 6 — observabilidade e headers
8. Fase 7 — release gate

Cada fase deve terminar com testes, revisão do diff e atualização do diário em
`DEVELOPMENT_CONTEXT.md`. Nenhuma chave real deve ser adicionada ao repositório.
