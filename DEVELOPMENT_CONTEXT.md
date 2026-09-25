# Clube Daqui — Checklist e diário de desenvolvimento

Este ficheiro é o contexto operacional do projeto. Deve ser lido no início de
cada sessão do Codex e atualizado no fim de cada tarefa relevante.

## Como usar no início de uma sessão

- Ler este ficheiro do princípio ao fim.
- Confirmar a secção **Estado atual**.
- Verificar `git status --short` e preservar alterações existentes.
- Consultar as memórias Serena com `serena memories check`.
- Confirmar a tarefa prioritária na secção **Próximas ações**.
- Não assumir que uma tarefa marcada como concluída continua válida sem
  verificar o código e os dados atuais.

## Como atualizar no fim de uma sessão

- Marcar apenas itens realmente verificados como concluídos.
- Registar comandos executados e respetivo resultado.
- Registar bloqueios ou decisões na secção **Diário**.
- Atualizar **Estado atual** e **Próximas ações**.
- Nunca guardar chaves API, tokens, passwords ou dados pessoais neste ficheiro.

## Escopo do projeto

### Visão

O **Clube Daqui** é uma aplicação web responsiva para descobrir
estabelecimentos locais e usufruir de benefícios exclusivos no Ribatejo.
Tagline: **"Descobre o melhor daqui."**
O produto começa por Santarém e Almeirim, com o inventário atual focado no
concelho de Almeirim.

### Utilizadores e valor

- Membros: descobrem restaurantes, cafés, lojas e parceiros; consultam
  benefícios; fazem resgates; deixam avaliações baseadas na experiência real.
- Parceiros: gerem o seu estabelecimento e benefícios, validam resgates e
  acompanham atividade relevante.
- Administração: mantém o catálogo, categorias, benefícios, parceiros,
  moderação e auditoria.

### MVP dentro do escopo

- Catálogo pesquisável de estabelecimentos e localizações.
- Categorias, moradas, contactos, coordenadas e proveniência dos dados.
- Contas e sessão de membros.
- Benefícios associados a parceiros e localizações.
- Resgate seguro de benefícios com QR/token e validação transacional.
- Favoritos e histórico de resgates.
- Avaliações próprias dos clientes após um resgate, com moderação.
- Área mínima de parceiro para gerir benefícios e validar resgates.
- SEO e interface responsiva para web.

### Fora do escopo atual

- Copiar ou republicar avaliações, fotografias, ratings ou descrições de
  terceiros.
- Criar um substituto do Google Maps ou uma plataforma geral de mapas.
- Marketplace, pagamentos de consumo em restaurantes ou entrega de comida.
- Chat em tempo real, rede social ou programa de pontos complexo.
- Expansão nacional antes de validar o MVP no Ribatejo.
- Integração de Resend antes de existir um fluxo que a utilize.

### Limites técnicos

- `apps/web`: interface, SEO e sessão SSR.
- `apps/api`: regras de negócio, integrações e autorização.
- Supabase: PostgreSQL, Auth, Storage e RLS.
- Migrations SQL são a fonte de verdade do modelo de dados.
- Operações críticas de resgate permanecem atómicas no PostgreSQL.
- Dados externos devem ter proveniência e data de atualização por campo.

### Critério de pronto do MVP

O MVP está pronto quando um membro consegue criar sessão, encontrar um
estabelecimento ativo, consultar um benefício válido, fazer um resgate único e
seguro, e deixar uma avaliação após o resgate; o parceiro consegue validar esse
resgate; e a administração consegue auditar os dados e estados principais.

### Estratégia da primeira demo comercial

Construir primeiro uma versão funcional e demonstrável da app, em vez de
tentar completar já um guia regional abrangente. O recorte inicial usa Almeirim
como território piloto e apresenta três grupos de descoberta:

- Comer: restaurantes, cafés e pastelarias (fonte de dados já iniciada).
- Dormir: hotéis, alojamentos e turismo rural.
- Lazer: atrações, experiências e atividades.

A primeira demo deve provar o ciclo público de descoberta: pesquisa/filtros,
lista, ficha detalhada, localização, contacto, fontes e chamada para ação de
benefício/parceria. A gestão completa de contas, resgates QR e avaliações será
implementada logo depois do catálogo navegável, mas não deve bloquear a
apresentação comercial inicial.

Objetivo comercial da demo: permitir contactar estabelecimentos com uma página
real sobre o negócio, explicar o futuro benefício exclusivo e recolher os
primeiros parceiros-piloto. Cada estabelecimento deve poder ser corrigido ou
reivindicado antes de ser apresentado como parceiro.

## Estado atual

### Produto

- [x] Monorepo npm criado com `apps/web`, `apps/api` e `supabase`.
- [x] Estrutura inicial de autenticação, negócios, benefícios, parceiros,
      referências e avaliações criada.
- [x] Migration inicial do Supabase criada com RLS e operações transacionais.
- [x] Página inicial responsiva do frontend criada.
- [x] Health checks web e API criados.
- [x] Fluxo de autenticação completo.
- [x] Interface de registo, confirmação SSR e login por palavra-passe
      implementada; entrega de email e redirect para área de membro validados em produção.
- [x] Catálogo navegável de estabelecimentos ligado ao Supabase (via rotas
      Next.js API a partir de 2026-09-17).
- [x] Fluxo de benefícios e resgates ligado à interface.
- [x] Validação transacional de códigos por utilizadores parceiros ligada à
      interface.
- [x] Auditoria técnica de fluxos, roles, segurança e desempenho documentada em
      `docs/APP_AUDIT_2026-09-15.md`.
- [x] App web autónoma — não depende do servidor NestJS para o fluxo de membro.
- [ ] Área de parceiro (rotas Next.js em implementação; validar precisa de teste).
- [ ] Sistema de avaliações dos clientes em produção.
- [x] Checkout Stripe de teste criado no backend com webhook idempotente e
      botão de adesão anual na página do Clube; falta configurar o webhook no
      Stripe e validar um pagamento de teste.
- [x] Conta de teste solicitada em 2026-09-22 removida do Auth e das tabelas
      funcionais associadas; ausência dos registos confirmada após a operação.
- [x] Fluxo Stripe, modelos de pagamento/membership e requisitos InvoiceXpress
      auditados; proposta de schema documentada, ainda sem implementação.
- [x] Núcleo da integração direta NestJS → InvoiceXpress implementado com
      idempotência, persistência, retry manual, PDF e testes mockados.
- [ ] Aplicar/testar a migration fiscal numa branch Supabase e configurar a
      sequência e o enquadramento de IVA/isenção antes de ativar a emissão real.
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` no `apps/web/.env.local` para
      rotas admin funcionarem.

### Inventário de estabelecimentos

- [x] Extrator reproduzível do diretório `almeirim.city`.
- [x] Filtro de entradas não relacionadas com restauração.
- [x] Cruzamento inicial com OpenStreetMap através do Overpass.
- [x] Deteção de possíveis duplicados.
- [x] Inventário JSON/CSV e relatório auditável gerados em
      `data/food-directory/`.
- [x] Ratings, fotografias, descrições e avaliações de terceiros excluídos do
      inventário da aplicação.
- [ ] Rever manualmente as 115 correspondências OSM pendentes.
- [ ] Definir autorização/licença de reutilização dos dados do almeirim.city.
- [ ] Modelar os campos de proveniência no Supabase.
- [ ] Importar estabelecimentos validados para uma branch de desenvolvimento.

### Política de dados

- Dados externos servem como descoberta e validação de factos básicos.
- OpenStreetMap é a fonte geográfica preferencial quando existe correspondência.
- Google Maps/Places pode fornecer validação e `place_id`; não copiar a
  interface, fotografias, ratings ou avaliações.
- As avaliações, classificações, fotografias e comentários do produto serão
  produzidos pelos clientes do Clube Daqui.
- Guardar a origem e a data de atualização de cada campo importado.

## Checklist técnico por tarefa

### Antes de alterar código

- [ ] Ler este ficheiro e o `README.md`.
- [ ] Consultar Serena (`initial_instructions` quando necessário).
- [ ] Inspecionar a arquitetura e os ficheiros diretamente relacionados.
- [ ] Confirmar que a alteração não expõe `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Definir como testar a alteração antes de editar.

### Implementação

- [ ] Manter TypeScript estrito e validação de ambiente com Zod.
- [ ] Colocar regras de negócio e integrações na API NestJS.
- [ ] Manter clientes Supabase web separados para browser e servidor.
- [ ] Respeitar RLS e usar cliente administrativo apenas no backend autorizado.
- [ ] Registar proveniência dos dados externos.
- [ ] Não importar conteúdo de terceiros que não faça parte da política de dados.
- [ ] Atualizar documentação ou este ficheiro quando a decisão for durável.

### Dados e base de dados

- [ ] Gerar primeiro um artefacto de pré-visualização/auditoria.
- [ ] Rever duplicados e correspondências com baixa confiança.
- [ ] Testar migrations numa branch/ambiente de desenvolvimento.
- [ ] Validar constraints, índices e políticas RLS.
- [ ] Só depois importar para o Supabase.

### Validação final

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run format:check`
- [ ] `npm run check`
- [ ] `npm run build` (ou documentar bloqueio específico do ambiente)
- [ ] Health check ou teste funcional relevante.
- [ ] `git diff --check`
- [ ] Atualizar o diário abaixo.

## Comandos principais

```bash
npm run dev:web
npm run dev:api
npm run data:food-inventory
npm run check
npm run build
serena project health-check .
serena memories check
```

## Próximas ações

### Produto / Homepage

1. Substituir imagens de placeholder (Unsplash) no carrossel de parceiros por
   fotografias reais dos estabelecimentos.
2. Ligar os dados do carrossel à API `/api/businesses` (actualmente estáticos).
3. Reavaliar inclusão de barra de pesquisa no hero da homepage (existia no
   design anterior e foi removida na redesign).

### Mobile (Expo)

4. Executar `pod install` localmente e compilar o development build iOS para
   testar mapas nativos e fluxo de resgate no simulador.
5. Configurar variáveis de ambiente no EAS (`preview` e `production`) e obter
   os SHA-1 Android para restringir a chave Google Maps.
6. Commit das alterações mobile pendentes (ver git status).

### Infra / Segurança

7. Adicionar `SUPABASE_SERVICE_ROLE_KEY` ao `apps/web/.env.local` (e variáveis
   de ambiente do deployment) para activar as rotas admin Next.js.
8. Validar de ponta a ponta o fluxo membro → parceiro → economia com uma adesão
   ativa e um utilizador parceiro de teste no ambiente publicado.
9. Ativar proteção contra palavras-passe expostas no Supabase Auth.
10. ~~Corrigir os erros de lint preexistentes~~ — **concluído** (sessão 2026-09-17).
11. Configurar `STRIPE_WEBHOOK_SECRET` no backend, publicar a API e validar o
    fluxo Checkout → webhook → adesão ativa com o cartão de teste.

### Marca / Domínio

- Registar o domínio `clubedaqui.pt`.
- Verificar disponibilidade dos usernames nas redes sociais (@clubedaqui).
- Pesquisar disponibilidade da marca no INPI/EUIPO antes de fechar oficialmente.
- Integrar os logotipos finais (`Logotipo/`) na app: substituir placeholder
  favicon, og:image e app icon mobile.

### Inventário / Dados

10. Rever manualmente as 115 correspondências OSM pendentes.
11. Decidir modelo de proveniência para `businesses`/`business_locations` e
    criar a migration de importação validada.

## Diário

### 2026-09-23 — Integração direta InvoiceXpress implementada localmente

- Decidido não instalar a aplicação InvoiceXpress by Kapta para evitar emissão
  duplicada e manter a lógica fiscal no NestJS.
- Criado o módulo `invoicing` com provider abstrato, client HTTPS centralizado,
  timeout/retry, mapper e implementação InvoiceXpress.
- Criada a migration `20260923120000_invoicing.sql` com eventos Stripe,
  clientes externos, documentos fiscais, constraints/RLS e RPC atómica para
  pagamento, membership e criação do trabalho fiscal.
- O webhook passou a usar `amount_total`/`currency` confirmados pelo Stripe,
  ativar 12 meses a partir do pagamento e emitir fora da transação.
- Adicionados endpoints protegidos de membro/admin, PDF sob demanda e retry
  manual; suporte de nota de crédito e email ficou preparado.
- Validação: lint, typecheck e build da API passaram; 13 testes unitários com
  InvoiceXpress mockado passaram. A suite precisou de execução fora do sandbox
  devido ao socket IPC do `tsx`.
- A Supabase CLI não está instalada e a tentativa segura de validar a migration
  remotamente dentro de uma transação com `ROLLBACK` ficou bloqueada porque o
  conector Supabase exige reautenticação; nenhuma alteração remota foi feita.
- Próximo passo: renomear a variável local para `INVOICEXPRESS_API_KEY`,
  preencher account/sequence/tax, aplicar a migration numa branch e executar
  um pagamento Stripe de teste.
- Decisão posterior: `INVOICEXPRESS_SEQUENCE_ID` ficou opcional para contas de
  demonstração; quando vazio, o provider deixa o InvoiceXpress usar a série
  predefinida `INVOICEXPRESSDEMO`.
- Auditoria do `.env` da API: API key, imposto e restantes campos estão
  presentes sem expor valores; `INVOICEXPRESS_ACCOUNT_NAME` foi preenchido com
  um URL completo e precisa conter apenas o identificador da conta.

### 2026-09-23 — Conectividade InvoiceXpress validada

- Executada uma verificação HTTPS apenas de leitura usando a configuração local
  da API; não foram criados documentos nem alterados dados.
- Os endpoints `taxes.json` e `sequences.json` responderam HTTP 200, confirmando
  conectividade, conta acessível e autenticação aceite pela API.
- A configuração local ainda deve ser corrigida para que
  `INVOICEXPRESS_ACCOUNT_NAME` contenha apenas o subdomínio da conta, sem
  `https://` nem `.app.invoicexpress.com`.

### 2026-09-23 — Conta InvoiceXpress corrigida e revalidada

- `INVOICEXPRESS_ACCOUNT_NAME` atualizado para `clubedaqui`.
- Nova verificação read-only ao endpoint `taxes.json` respondeu HTTP 200; a
  conta e a autenticação continuam acessíveis com o formato correto.

### 2026-09-23 — Diagnóstico de compra sem documento fiscal

- Stripe confirmou sessões Checkout pagas em modo teste; os eventos
  `checkout.session.completed` estão configurados e sem entregas pendentes.
- O endpoint público da API (`/api/health`) está disponível, mas não foi
  possível consultar o estado fiscal no Supabase porque o MCP exige
  reautenticação.
- A configuração local ainda tem `SUPABASE_SERVICE_ROLE_KEY` vazia e a migration
  fiscal permanece por aplicar; validar estes dois pontos no ambiente publicado
  antes de repetir a compra.

### 2026-09-25 — Auditoria antes do teste ponta a ponta

- A compra Stripe em modo teste está a ser aceite e o endpoint publicado está
  configurado para os eventos de Checkout relevantes.
- A integração fiscal e a migration continuam como alterações locais não
  commitadas (`apps/api/src/modules/invoicing/` e
  `supabase/migrations/20260923120000_invoicing.sql`); por isso ainda não estão
  disponíveis no deployment que recebe o webhook.
- Na configuração local, `SUPABASE_SERVICE_ROLE_KEY` está vazia. A migration
  fiscal também ainda não foi aplicada no Supabase, e o conector MCP continua a
  exigir reautenticação.
- Validação local da API: lint, typecheck, build e `git diff --check` passaram.
- Para testar o fluxo real, falta: aplicar a migration, configurar as variáveis
  no ambiente Production da API, fazer commit/deploy da API e só então repetir
  uma compra Stripe de teste.

### 2026-09-25 — Revalidação de configuração Supabase

- `SUPABASE_SERVICE_ROLE_KEY` está preenchida localmente, mas o valor tem
  prefixo de segredo de webhook Stripe (`whsec_`), não de chave administrativa
  Supabase; consultas read-only ao REST responderam HTTP 401.
- A variável deve ser substituída pela chave `service_role`/secret do projeto
  Supabase, sem registar o valor neste ficheiro.

### 2026-09-25 — Chave Supabase corrigida; migration ainda pendente

- A nova `SUPABASE_SERVICE_ROLE_KEY` tem formato JWT válido e foi aceite pelo
  endpoint REST do projeto.
- `public.fiscal_documents` e `public.stripe_webhook_events` responderam HTTP
  404 (`PGRST205`), confirmando que a migration fiscal ainda não foi aplicada
  no Supabase remoto.

### 2026-09-25 — Tentativa de aplicar migration bloqueada

- A aplicação remota de `20260923120000_invoicing.sql` foi tentada após pedido
  explícito, mas o conector MCP respondeu que requer reautenticação.
- Nenhum SQL foi executado e nenhuma alteração remota foi feita.

### 2026-09-25 — Migration fiscal aplicada no Supabase

- O MCP Supabase foi reautenticado via OAuth e a migration
  `20260923120000_invoicing.sql` foi aplicada com sucesso.
- Verificação read-only confirmou as tabelas `public.fiscal_documents`,
  `public.stripe_webhook_events` e `public.invoicing_customers`, todas com RLS
  ativo e sem documentos fiscais existentes.
- Próximo bloqueio: publicar/confirmar o código atual da API e as variáveis de
  produção antes de repetir o pagamento Stripe.

### 2026-09-25 — Remoção da conta de teste para novo fluxo

- Confirmada a conta `maxwellsanrosa@gmail.com` com 1 perfil, 1 membership e 1
  pagamento; não existia documento fiscal emitido.
- Removidos numa transação os registos de teste associados e o utilizador de
  `auth.users`, sem afetar outras contas.
- Verificação final: `auth.users` = 0 para a conta, sem perfis órfãos nem
  memberships sem utilizador.

### 2026-09-25 — Diagnóstico de `Load failed` no checkout

- `https://clube-daqui-api.vercel.app/api/health` respondeu HTTP 500 com
  `FUNCTION_INVOCATION_FAILED`.
- O alias antigo `https://clube-ribatejo-api.vercel.app/api/health` respondeu
  HTTP 404.
- O `apps/web/.env.local` ainda aponta para o alias antigo da API. É necessário
  atualizar `NEXT_PUBLIC_API_URL` no projeto Web da Vercel e corrigir as
  variáveis Production da API antes de repetir o checkout.

### 2026-09-25 — Revalidação das variáveis e URL do frontend

- As variáveis necessárias estão preenchidas localmente e a série InvoiceXpress
  permanece opcional para a conta demo.
- Corrigido `apps/web/.env.local` para apontar para
  `https://clube-daqui-api.vercel.app`.
- O health da API publicada continua HTTP 500 (`FUNCTION_INVOCATION_FAILED`),
  portanto a configuração Production da Vercel ou o deployment ainda precisa
  ser corrigido; valores locais não confirmam as variáveis da Vercel.

### 2026-09-25 — Falha de função no checkout publicado

- O browser está a chamar o domínio novo correto da API, mas recebe “No
  response headers”; o health público continua HTTP 500 com
  `FUNCTION_INVOCATION_FAILED`.
- Conclusão: a função NestJS falha no arranque/execução na Vercel antes de
  responder, devendo ser consultados os logs da deployment e as variáveis
  Production. Nenhum token de sessão ou dado pessoal foi registado aqui.

### 2026-09-25 — Pagamento confirmado, webhook pendente

- A Checkout Session do teste está `paid`/`complete` no Stripe, com evento
  `checkout.session.completed` ainda com `pending_webhooks=1`.
- No Supabase, a payment e a membership permanecem `pending` e não existe
  `fiscal_document`; o redirect para `/clube` é consequência desse estado.
- Após o novo deployment, `/api/health` respondeu HTTP 200. O evento Stripe
  precisa ser reenviado/reprocessado no Dashboard (ou aguardar o retry) para
  atualizar a membership e iniciar a emissão InvoiceXpress.

### 2026-09-25 — Correção de cliente InvoiceXpress duplicado

- Após o reprocessamento do webhook, a membership foi ativada, mas a emissão
  ficou `FAILED` porque `clients.json` respondeu HTTP 422.
- Verificação read-only confirmou que já existia um cliente InvoiceXpress com o
  mesmo NIF; o provider procurava apenas pelo `code` estável e tentava criar um
  duplicado.
- O provider foi corrigido para reutilizar também um cliente encontrado pelo
  NIF, evitando duplicação e permitindo o retry da fatura.

### 2026-09-25 — Limpeza da conta para novo teste fiscal

- Confirmada a conta `maxwellsanrosa@gmail.com` com 2 memberships, 2 payments e
  1 documento fiscal falhado.
- Removidos numa transação todos os registos associados e o utilizador Auth,
  sem afetar outras contas.
- Verificação final: utilizador, perfis órfãos, memberships órfãs e documentos
  fiscais órfãos = 0.

### 2026-09-23 — Auditoria InvoiceXpress e proposta de schema

- Auditados o webhook Stripe, `payments`, `memberships`, perfil fiscal, guards,
  configuração da API e ausência atual de queue/testes fiscais.
- Documentada em `docs/INVOICEXPRESS_AUDIT_AND_SCHEMA.md` a proposta para
  eventos Stripe, clientes por provider, documentos fiscais, RLS, RPC atómica,
  retry, PDF, email e futuras notas de crédito.
- Confirmado apenas o nome da variável local `INVOICE_XPRESS_API`; o segredo
  não foi lido nem registado. O nome canónico proposto é
  `INVOICEXPRESS_API_KEY`.
- A documentação oficial confirma `proprietary_uid` para deduplicação, criação
  inicial em draft, finalização separada e geração assíncrona do PDF.
- Não foram criadas migrations nem feitas chamadas à API real.
- Próximo passo: validar o schema e confirmar sequência/taxa/isenção antes de
  implementar.

### 2026-09-22 — Limpeza de conta de teste concluída

- Identificada de forma inequívoca a única conta correspondente ao pedido.
- Eliminados numa transação o registo Auth, perfil, adesão e dados de teste
  associados (resgate, poupança e avaliação); não existiam pagamentos.
- Verificação final confirmou zero registos no Auth, sessões, perfil e tabelas
  funcionais diretamente associadas ao utilizador.
- A conta pode voltar a percorrer o fluxo de registo desde o início.

### 2026-09-19 — Limpeza de conta de teste Stripe

- Sessão MCP do Supabase renovada com escopos válidos.
- Eliminada, após confirmação explícita, a conta de teste
  `maxwellsanrosa@gmail.com` e os dados associados à adesão e aos resgates.
- Verificação final: utilizador, perfil, adesão e resgates ficaram a zero.

### 2026-09-19 — Email de boas-vindas após pagamento

- O webhook Stripe passou a enviar um email de boas-vindas via API Resend após
  ativar a adesão, com proteção contra reprocessamento do mesmo pagamento.
- A confirmação de email continua a ser enviada pelo Supabase Auth através do
  SMTP Resend configurado no projeto.
- O backend requer `RESEND_API_KEY` e `EMAIL_FROM` para o email adicional.

### 2026-09-19 — CTA de adesão

- O botão “Aderir por 59 €” agora envia visitantes para `/registar?redirect=/clube`.
- O redirect do email de confirmação preserva esse destino; utilizadores já
  autenticados continuam a abrir diretamente o Checkout.
- Typecheck web passou; o build local ficou bloqueado apenas pelo acesso
  offline às fontes Google usadas por `next/font`.

### 2026-09-19 — Acesso condicionado à adesão

- O middleware passou a exigir uma adesão `active` e não expirada para
  `/conta` e `/ofertas`.
- Clientes autenticados sem pagamento são redirecionados para `/clube`; a
  exploração pública permanece acessível.
- Admins e parceiros ficam fora desta regra e mantêm acesso às respetivas
  áreas operacionais.

### 2026-09-17 — Correções de lint, login, modo escuro e renomeação da marca

**Erros de lint — todos corrigidos (0 erros, 0 typecheck, Prettier limpo):**

- API: desativado `@typescript-eslint/no-unnecessary-type-assertion` no
  `eslint.config.mjs` para padrões de tipagem explícita do Supabase; removido
  directivo eslint orphan no `admin.controller.ts`.
- Web — `page.tsx` (homepage): 6 chamadas `useInView` refatoradas para
  destructuring no call-site (`const { ref: statsRef, visible: statsVisible }`)
  para cumprir a regra `react-hooks/refs`; entidades HTML não escapadas corrigidas.
- Web — páginas admin/explorar/conta: `<a>` substituídos por `<Link>` do Next.js;
  `eslint-disable-next-line react-hooks/set-state-in-effect` adicionado em padrões
  legítimos de fetch-on-mount; constante não usada removida.
- Prettier: adicionadas exclusões para `apps/mobile/ios/`, `android/`, `.expo/`,
  `.claude/` e `supabase/.temp/` ao `.prettierignore`; 119 ficheiros gerados
  deixaram de ser verificados.
- Commits: `0a811e8`.

**Bug de login duplo — corrigido:**

- Causa raiz: `router.refresh() + router.replace(next)` desencadeava navegação
  SSR antes de os cookies de sessão do Supabase serem visíveis pelo middleware.
- Fix: substituído por `window.location.href = next` (reload completo garante
  que os cookies são enviados na próxima request). Ficheiro: `entrar/page.tsx`.

**Modo escuro — redesenhado (3 iterações):**

- Problema original: `--color-olive-900` era invertido para cream (`#f2f0e8`),
  tornando o footer, sidebar admin, botões e cards todos brancos/cream.
- Fix 1 (`3c88150`): `olive-900` mantido near-white para `text-olive-900`, mas
  `bg-olive-900` explicitamente sobreposto para `#1b2a1f`; `text-cream-50`
  corrigido nas dark cards; overlays modais, inputs, sombras e scrollbar cobertos.
- Fix 2 (`0f6f56a`): Footer — tokens `cream-50/100` re-scopados dentro de
  `html.dark footer {}` para que as variantes de opacidade
  (`text-cream-100/70`, `/65`, `/40`) resolvam near-white em vez de near-black.
  Secções "Descubra por categoria" e "Membros" — inline
  `style={{ background: "#f6f0e4" }}` substituídos por `bg-cream-100`
  (dark mode: `#18221b`, subtilmente mais claro que o fundo `#0d120f`).

**Renomeação da marca — Clube Ribatejo → Clube Daqui (`273a7de`):**

- Nova identidade: **Clube Daqui** · tagline **"Descobre o melhor daqui."**
- 35 ficheiros alterados: packages (`@clube-daqui/*`), i18n PT+EN, header,
  footer, login, registo, admin, clube, ofertas, parceiros, conta, erro de auth,
  homepage hero, mobile (nome, slug, scheme, bundle ID `pt.clubedaqui.app`,
  ecrãs), API (health IDs, CORS, User-Agent, fonte de reviews), localStorage key.
- Referências geográficas ao Ribatejo como região preservadas.
- Pasta `Logotipo/` já existia com 7 ficheiros de logo finais.

### 2026-09-17 — Review da sessão e atualização do diário

- Revisto o estado do projeto após a sessão de homepage e mobile.
- Atualizada a secção **Próximas ações** com prioridades organizadas por área:
  produto/homepage, mobile, infra/segurança e inventário/dados.
- Alterações mobile não-comprometidas: `app.config.js`, `mapa.tsx`, `eas.json`,
  `expo-env.d.ts`, `package.json`, metro config, projetos nativos iOS/Android
  e `.gitignore`. Aguardam commit separado após validação local.

### 2026-09-16 — Redesign editorial da homepage

- Análise do concorrente town4two.com: design Wix genérico, sem preços visíveis,
  sem animações de scroll, sem testemunhos; identificadas vantagens competitivas.
- Homepage reescrita de raiz em `apps/web/src/app/page.tsx` com:
  - Hero editorial full-bleed, `min-h-[92vh]`, headline Cormorant Garamond,
    fundo parallax com mutação directa do DOM (sem estado React), `scale-110`
    para evitar margens em branco durante o parallax.
  - Secção de stats com count-up animado (`requestAnimationFrame`, easing
    cubic ease-out), formatação portuguesa (1 200 em vez de 1200).
  - "Como funciona" — 3 passos com números dourados visíveis (gold 35% opacity);
    antes estavam quase invisíveis (olive 8%).
  - Carrossel de parceiros (9 cards, scroll-snap, sem setas, fade lateral) com
    cards em modo landscape `w-40 h-[100px]` mobile, `w-64 h-[160px]` desktop,
    correspondendo ao estilo da página `/conta`.
  - CTA de adesão com preço €59,90/ano e promessa de poupança de €1 500/ano.
  - Secção de testemunhos (3 cards) com fade-up escalonado.
  - Secção B2B com botão wine-700.
- Animações de scroll implementadas sem dependências externas: `IntersectionObserver`
  (dispara uma vez e desconecta), `requestAnimationFrame`, transições CSS via
  `style` prop tipado como `React.CSSProperties`.
- Footer mobile simplificado: grelha 2 colunas compacta, `py-8` vs `py-16`
  desktop, removida etiqueta "localContent".
- Commits: `d4320e6`, `0bd90d6`, `c74642c`, `27fa760`.

### 2026-09-16 — Perfil iOS Simulator

- Adicionado o perfil `ios-simulator` ao `apps/mobile/eas.json` para gerar uma
  build destinada ao simulador iOS sem Apple Developer Program pago.
- Validado `npx expo config --type public` e a presença da opção
  `ios.simulator` no perfil EAS.
- A build do simulador requer macOS com Xcode; não pode ser instalada num
  iPhone físico sem assinatura Apple válida.

### 2026-09-16 — Diagnóstico do arranque Android

- Captura guardada em `apps/Screenshot 2026-09-16 at 18.21.51.png` mostrou
  erro Hermes `[runtime not ready]: TypeError: property is not writable`.
- Reinstaladas as dependências com `npm install`; o workspace mobile mantém
  React 19.1.0 e React Native 0.81.5 conforme Expo SDK 54.
- O typecheck do mobile continua a passar. Falta recompilar o development
  build Android e confirmar o arranque no emulador.
- Adicionado `apps/mobile/metro.config.js` para impedir que o Metro use as
  versões React/React Native da raiz do monorepo; arranque do Metro validado.
- Definido `ios.deploymentTarget` como `16.4` no `app.config.js`, compatível
  com o Xcode 27 e os runtimes atuais.
- Iniciada atualização para Expo SDK 57.0.23 com React Native 0.86.3 e
  `expo-build-properties`; ativado `ios.enableSceneSupport` para Xcode 27.
- Corrigido `StyleSheet.absoluteFillObject` para `StyleSheet.absoluteFill`;
  typecheck passa. `expo prebuild` regenerou os projetos nativos; `pod install`
  ficou bloqueado pela permissão do ambiente e deve ser executado localmente.

### 2026-09-11 — Inventário inicial

- Criado o comando `npm run data:food-inventory`.
- Extraídos 137 estabelecimentos de restauração do almeirim.city.
- Consultados 88 candidatos do OpenStreetMap; 22 correspondências automáticas.
- Sinalizados 3 possíveis duplicados para revisão.
- Gerados `inventory.json`, `inventory.csv` e `report.json` em
  `data/food-directory/`.
- Nenhuma escrita foi feita no Supabase.
- Lint, typecheck, Prettier e builds da API/web (Webpack) passaram.
- O build web com Turbopack apresentou `EPERM` ao abrir uma porta temporária;
  não parece relacionado com o código da funcionalidade.

### 2026-09-11 — Decisão de produto: demo comercial primeiro

- Decisão: priorizar uma demo funcional da app sobre um guia regional completo.
- Território piloto: Almeirim.
- Primeiros grupos: comer, dormir e lazer.
- A demo deve provar descoberta, ficha, localização/contacto e chamada para
  benefício/parceria.
- A gestão completa de resgates e avaliações continua no escopo, mas não
  bloqueia a primeira apresentação aos estabelecimentos.

### 2026-09-11 — Diagnóstico do deployment da API

- `https://clube-ribatejo-api.vercel.app/api/health` estava a devolver
  `FUNCTION_INVOCATION_FAILED`.
- A API foi adaptada para Vercel com `apps/api/api/[...path].ts`, mantendo o
  arranque local NestJS separado.
- O projeto Vercel deve usar Root Directory `apps/api`; sem isso, a Vercel não
  descobre o diretório `/api` da função.
- A configuração final deve incluir `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` quando aplicável e
  `WEB_URL`.
- Próxima verificação: redeploy do commit mais recente e teste de
  `/api/health`.

### 2026-09-11 — Primeira homepage da demo comercial

- Criada uma homepage navegável com pesquisa visual, grupos Comer/Dormir/Lazer
  e primeiras descobertas do piloto de Almeirim.
- Conteúdo inicial demonstrativo usa estabelecimentos do inventário local; não
  foram importadas fotografias, avaliações ou descrições de terceiros.
- Validações `npm run check` passaram.
- Commit publicado: `2eb2845`.
- Próximo passo: criar o catálogo pesquisável e ligar os dados validados à API.

### 2026-09-11 — Catálogo navegável da demo

- Criada a rota `/explorar` com pesquisa por nome/local/categoria e filtros
  Comer, Dormir e Lazer.
- Ligado o CTA Explorar da Home ao catálogo.
- Conteúdo ainda demonstrativo, pronto para ser substituído pela API.
- `npm run check` passou; commit publicado: `3e958e2`.
- Próximo passo: disponibilizar o catálogo validado através da API.

### 2026-09-11 — Endpoint inicial de estabelecimentos

- Criado `GET /api/businesses` com o recorte piloto de Almeirim (5 entradas).
- Adicionado `BusinessesModule` na API NestJS.
- `npm run check` e build da API passaram.
- Commit publicado: `fd40145`.
- Próximo passo: fazer `/explorar` consumir a resposta da API e depois trocar
  o recorte estático pelo inventário validado.

### 2026-09-11 — Catálogo ligado à API

- `/explorar` passou a consumir `NEXT_PUBLIC_API_URL/api/businesses`.
- Mantido fallback demonstrativo local se a API estiver indisponível.
- `npm run check` passou; commit publicado: `6e9b46a`.
- Próximo passo: criar fichas públicas individuais e adicionar morada/contacto
  com proveniência.

### 2026-09-11 — Fichas públicas individuais

- Criado `GET /api/businesses/:id` com resposta 404 para IDs inexistentes.
- Adicionadas fichas navegáveis em `/explorar/[slug]` com chamada para parceria.
- Validações passaram; commit publicado: `48127ea`.

### 2026-09-11 — Autenticação do MCP Supabase

- Autenticado com sucesso o servidor MCP `supabase` para o projeto configurado.
- O primeiro login falhou porque os scopes OAuth implícitos não eram aceites pelo
  servidor; a repetição com os scopes de gestão suportados foi concluída.
- Nenhuma credencial, token ou URL temporária de autorização foi guardada neste
  ficheiro.

### 2026-09-11 — Evolução de UX/UI e Clube

- Integrado `next-intl` com idioma persistente PT-PT/EN.
- Criados componentes reutilizáveis `BusinessCard`, `RatingDisplay`,
  `ClubBenefitCard`, `SectionHeader` e `EmptyState`.
- Melhorados Home, Explorar, fichas de estabelecimento e Parceiros.
- Criada página `/clube` com proposta de valor, adesão de 12 meses, fluxo e FAQ.
- Adicionado middleware Supabase para redirecionar `/conta` sem autenticação.
- Mantidos fallbacks sem inventar avaliações, pratos, preços ou dados externos.
- `npm run check` passou; aviso existente apenas sobre navegação em `/conta`.
- Próximo passo: expandir tradução para todas as páginas e ligar benefícios reais.

### 2026-09-11 — Área de membros e economias

- `/conta` passou a apresentar resumo do Clube, total poupado, média,
  distribuição por categoria e histórico agrupado por mês.
- Criados componentes `MemberSummary`, `SavingsOverview`,
  `SavingsByCategory`, `SavingsHistory` e `RecordSavingsForm`.
- O formulário valida valores em EUR e impede desconto superior à fatura.
- Adicionado fallback localStorage apenas para a demo; a persistência definitiva
  fica preparada para os endpoints NestJS e não substitui a validação da API.
- Criados contratos frontend em `src/types/member-api.ts`.
- Criada e aplicada no Supabase a tabela `redemption_financials`, com RLS para
  membros e administradores.
- `npm run check` passou sem erros.

### 2026-09-11 — API de membro e economias

- Criado `MembersModule` NestJS com autenticação Bearer validada pelo Supabase.
- Adicionados `GET /api/me/summary`, `GET /api/me/savings`,
  `GET /api/me/redemptions` e `POST /api/me/redemptions/:id/financials`.
- Aplicadas validações de valores e proteção contra desconto superior à fatura.
- A área `/conta` tenta carregar resumo/histórico da API e mantém fallback local
  apenas quando a API ainda não tem dados.
- `npm run check` passou sem erros.

### 2026-09-11 — Fluxo de utilização e registo financeiro

- Adicionado `POST /api/me/redemptions/attempt`, autenticado com Bearer token,
  usando a função Supabase `create_redemption_attempt`.
- A ficha de estabelecimento passou a iniciar utilizações reais quando existe
  benefício e localização válidos.
- Criado `RedeemBenefitButton` com código manual temporário e mensagens de
  estado.
- O formulário pós-utilização grava fatura e desconto em
  `POST /api/me/redemptions/:id/financials` quando existe `redemption_id`.
- Mantido fallback local apenas para cenários de demonstração sem utilização
  real criada.
- `npm run check` passou; commit publicado: `7b422d0`.
- Próximo passo: ligar o histórico financeiro da área `/conta` a dados reais de
  utilizações e validar o fluxo completo com uma adesão ativa de teste.

### 2026-09-12 — Reautenticação do MCP Supabase

- Renovada com sucesso a autenticação OAuth do servidor MCP `supabase`.
- Usados explicitamente os scopes de gestão suportados pelo servidor.
- `codex mcp list` confirmou o servidor ativo e associado ao `project_ref`
  configurado; o comando de login terminou com código 0.
- Nenhuma credencial, token ou URL temporária de autorização foi registada.

### 2026-09-12 — Validação de benefícios pelo parceiro

- Criados endpoints autenticados para pré-visualizar e confirmar códigos
  manuais através das funções transacionais existentes no PostgreSQL.
- Criada a rota protegida `/parceiros/validar`, com revisão dos dados antes da
  confirmação e acesso a partir da página de parceiros.
- O login por magic link preserva agora o destino protegido solicitado.
- A autorização continua a ser imposta pela associação do utilizador ao
  estabelecimento e pelas políticas/funções do Supabase; não é usado cliente
  administrativo neste fluxo.
- `npm run check`, build da API e build web com Webpack passaram.
- O build web padrão continua bloqueado no sandbox pelo erro conhecido `EPERM`
  do Turbopack ao tentar abrir uma porta.
- Próximo passo: executar o ciclo completo com contas de teste de membro e
  parceiro e depois expor utilizações sem registo financeiro em `/conta`.

### 2026-09-12 — Economias reais pendentes na área de membro

- `GET /api/me/redemptions` passou a devolver todas as utilizações confirmadas,
  incluindo a existência ou ausência do respetivo registo financeiro.
- `/conta` apresenta formulários associados ao `redemption_id` para utilizações
  confirmadas que ainda não têm fatura e desconto registados.
- Uma resposta válida e vazia da API substitui agora dados antigos do fallback
  local; o formulário livre em `localStorage` só aparece quando a API está
  indisponível.
- Depois de guardar uma economia real, a utilização sai da lista pendente e o
  histórico e totais são atualizados imediatamente.
- `npm run check`, build da API e build web com Webpack passaram.
- O teste funcional completo continua dependente de contas de teste com adesão
  ativa e associação de parceiro válidas no Supabase.
- Próximo passo: preparar essas contas e validar o ciclo completo no ambiente de
  desenvolvimento antes do deployment.

### 2026-09-12 — Registo e confirmação de novos membros

- Criada a rota `/registar` com nome completo, email, palavra-passe, validação de
  confirmação e estado de espera pela confirmação do email.
- O callback de autenticação aceita código PKCE e `token_hash`, grava a sessão em
  cookies e redireciona de forma segura para `/conta`.
- Criada uma página própria para links de confirmação inválidos ou expirados.
- `/entrar` passou a autenticar apenas contas existentes com email e
  palavra-passe; deixou de poder criar utilizadores implicitamente.
- A API devolve o nome de `public.profiles`, usado na saudação da área de membro.
- CTAs do Clube, catálogo e rodapé encaminham novos utilizadores para o registo.
- O MCP confirmou que a migration inicial e o trigger remoto
  `on_auth_user_created` estão aplicados.
- O advisor de segurança indicou que a proteção contra palavras-passe expostas
  está desativada; deve ser ativada no painel antes de produção.
- `npm run check`, build da API e build web com Webpack passaram.
- Falta confirmar os Redirect URLs, manter `Confirm Email` ativo e executar o
  teste real com um endereço de email controlado.

### 2026-09-12 — Auditoria da configuração de autenticação

- O endpoint público do Supabase Auth confirmou que novos registos estão
  permitidos, o provider de email está ativo e a confirmação de email é
  obrigatória (`mailer_autoconfirm` desativado).
- O MCP confirmou anteriormente a migration inicial e o trigger remoto de
  criação de perfis.
- Os Redirect URLs e o Site URL não são expostos pelo endpoint público nem pelas
  ferramentas MCP disponíveis e continuam a exigir confirmação no painel.
- Não existem ficheiros locais `apps/web/.env.local`, `apps/web/.env` ou
  `apps/api/.env`, e as variáveis necessárias também não estão presentes no
  processo atual; o fluxo não pode ser testado localmente neste estado.
- Detetada inconsistência em `apps/web/.env.example`: `NEXT_PUBLIC_API_URL`
  termina em `/api`, mas os consumidores já acrescentam `/api` aos caminhos,
  podendo gerar URLs com `/api/api`.
- A proteção contra palavras-passe expostas continua desativada segundo o
  advisor de segurança do Supabase.
- Próximo passo: confirmar Site URL/Redirect URLs no painel, corrigir o exemplo
  da URL da API e criar os ambientes locais sem guardar segredos no repositório.

### 2026-09-12 — Preparação dos ambientes locais

- Corrigido `NEXT_PUBLIC_API_URL` no exemplo da web para não duplicar o prefixo
  `/api` gerado pelos consumidores.
- Criados `apps/web/.env.local` e `apps/api/.env` com o URL e a chave pública do
  projeto confirmados pelo MCP; ambos estão abrangidos pelo `.gitignore`.
- `SUPABASE_SERVICE_ROLE_KEY` ficou vazia por decisão de segurança e porque não é
  necessária no fluxo de registo/login.
- `npm run check` passou com a configuração preparada.
- O arranque em modo watch foi bloqueado pelo `EPERM` do sandbox ao criar o
  socket interno do `tsx`; o ambiente atual usa ainda Node `22.12.0`, abaixo do
  mínimo `22.13.0` indicado pelo projeto.
- Continuam pendentes a confirmação dos Redirect URLs no painel e o teste real
  do email de registo.

### 2026-09-12 — Fluxo de autenticação validado em produção

- Objetivo: confirmar registo, envio de email e acesso à área de membro.
- O `emailRedirectTo` com query string codificada (`?next=...`) era rejeitado
  silenciosamente pelo Supabase por não corresponder à lista de Redirect URLs.
- Corrigido para usar apenas `/auth/callback`, que já estava na lista permitida.
- Teste confirmado: registo → email de confirmação Resend → link → `/conta`.
- Fluxo de autenticação completo marcado como concluído.
- Próximo passo: validar ciclo completo membro → resgate → parceiro com contas
  de teste com adesão ativa.

### 2026-09-15 — Auditoria técnica e revisão cruzada

- Produzido `docs/APP_AUDIT_2026-09-15.md` com fluxo de uso, matriz de páginas
  por role, achados de segurança, desempenho e roadmap priorizado.
- Confirmado no código que `/admin` valida `ADMIN` no layout e na API, enquanto
  as páginas de parceiro validam sessão mas não role antes de renderizar.
- Identificado uso excessivo de `createAdminClient()` em endpoints de membro e
  endpoint administrativo de alteração de role sem proteção contra
  autoelevação.
- `npm run check` foi executado e falhou com erros de lint existentes (17 na
  API e 10 na web, além de avisos); não foram feitas alterações corretivas nesta
  tarefa de análise.
- MCP Supabase não conseguiu renovar o OAuth nesta sessão, logo advisors e
  estado remoto atual devem ser repetidos quando a ligação estiver disponível.
- Claude CLI foi tentado duas vezes em modo read-only não interativo, sem
  resposta; o relatório não atribui conclusões ao Claude.
- Próximo passo: corrigir autorização por role e privilégios service-role,
  ativar proteção contra palavras-passe expostas e criar testes E2E/RLS.

### 2026-09-15 — Primeira correção P0 de autorização

- Criado `PartnerAuthGuard`, com validação de sessão e role `PARTNER` via RLS;
  endpoints de resgate do parceiro deixaram de usar apenas `MemberAuthGuard`.
- Middleware web passou a redirecionar sessões sem role `PARTNER` antes de abrir
  dashboard/validação.
- A área `/conta` passou a mostrar a role atual com etiqueta legível.
- Endpoint administrativo de role passou a impedir autoalteração e atribuição
  direta de `ADMIN`.
- Typecheck e Prettier dos ficheiros alterados passaram; o lint global continua
  bloqueado pelos erros preexistentes documentados na auditoria.
- Próximo passo: remover `createAdminClient()` dos endpoints de membro e criar
  testes automatizados para a matriz MEMBER/PARTNER/ADMIN/INFLUENCER.

### 2026-09-15 — Remoção de service-role no perfil de membro

- `GET/PATCH /api/me/profile` passou a usar o cliente autenticado com RLS;
  deixou de consultar `auth.admin.getUserById` e de escrever com service-role.
- Adicionada migration `20260915100000_member_profile_security.sql` com trigger
  de base de dados que impede alterar ou limpar um NIF depois de definido.
- O email devolvido pelo perfil usa a identidade já validada pelo guard.
- Typecheck da API e Prettier do controller passaram; migration ainda precisa
  ser aplicada/testada numa branch Supabase antes de produção.
- O uso de service-role permanece deliberado nos endpoints de influenciador,
  referrals e reviews publicados, que ficam para uma revisão separada.
- Próximo passo: criar testes de autorização e rever esses restantes usos
  administrativos por endpoint.

### 2026-09-15 — Redução adicional de privilégios em membro

- Reviews submetidas por membros passaram a ser inseridas como `pending` pelo
  cliente autenticado, respeitando a policy RLS; deixaram de ser publicadas via
  service-role.
- Criada migration `20260915110000_member_owned_influencer_rls.sql` com acesso
  autenticado apenas ao próprio perfil de influencer e referrals do próprio
  membro.
- Endpoints `/api/me/influencer` e `/api/me/referral` passaram a usar o cliente
  autenticado; códigos de referral têm validação de formato.
- Typecheck da API, Prettier e `git diff --check` passaram.
- As migrations aguardam aplicação/teste numa branch Supabase antes de
  produção.
- Próximo passo: aplicar as migrations numa branch e validar RLS com contas de
  membro/influencer, incluindo tentativa de leitura cruzada.

### 2026-09-15 — Fecho da P0 de autorização

- `MemberAuthGuard` passou a rejeitar contas com `profiles.is_active = false`;
  a regra aplica-se a todos os endpoints `/api/me`.
- `PartnerAuthGuard` e `AdminAuthGuard` também rejeitam perfis desativados,
  mantendo a validação de role correspondente.
- Typecheck dos workspaces, Prettier dos guards e `git diff --check` passaram.
- A P0 de autorização fica implementada no código: autenticação, role,
  associação de parceiro, estado ativo e proteção da alteração de role.
- Pendência operacional: aplicar as migrations 20260915100000 e
  20260915110000 numa branch Supabase e executar testes reais de 401/403/RLS.
- Próxima prioridade: robustez P1 (DTOs/ValidationPipe, rate limiting,
  headers de segurança e observabilidade).

### 2026-09-15 — Implementação P1 de robustez

- API passou a emitir `X-Request-Id` e headers de segurança básicos em todas as
  respostas, incluindo `nosniff`, `DENY`, Referrer-Policy e Permissions-Policy.
- Adicionado rate limiting em memória por IP/rota para POSTs sensíveis
  (Auth/inquiries/resgates), com resposta 429 e `Retry-After`.
- A configuração mantém compatibilidade de arranque com o comportamento anterior;
  os clientes Supabase falham apenas quando uma operação que exige credenciais
  é executada.
- `partner-inquiries` ganhou limites de tamanho e deixa de guardar pedidos em
  memória quando a persistência falha em produção.
- Web adicionou headers de segurança globais via `next.config.ts`.
- Typecheck dos workspaces e Prettier passaram; o rate limit em memória deve ser
  substituído por Redis/KV quando houver múltiplas instâncias.
- A validação de DTOs continua parcialmente manual nos controllers; deve ser
  consolidada com `ValidationPipe` + schemas quando as dependências forem
  adicionadas.
- O rate limiter limpa entradas expiradas quando o mapa cresce, reduzindo risco
  de abuso/memória.
- Próximo passo: testar os headers/429 em ambiente de staging e rever CSP com
  os domínios finais de Auth, imagens e API.

### 2026-09-15 — Verificação das migrations Supabase

- Tentada verificação remota das migrations, trigger e advisors através do MCP
  Supabase após o utilizador indicar que a aplicação foi concluída.
- Todas as chamadas (`list_migrations`, `execute_sql` e advisors) continuam a
  falhar antes da consulta por erro de renovação OAuth; não foi possível obter
  confirmação independente do estado remoto nesta sessão.
- Nenhuma alteração local foi feita às migrations; o commit `2299c34` contém a
  versão que deve estar aplicada.

### 2026-09-15 — Migrations confirmadas no Supabase

- Renovado o login MCP com scopes válidos `projects:read`, `database:read` e
  `database:write` após recriar a entrada global do servidor.
- `list_migrations` confirmou as versões `20260915100000` e `20260915110000`
  aplicadas no projeto remoto.
- Query SQL confirmou o trigger `profiles_prevent_nif_change` e as três
  policies de acesso próprio para `influencers`/`referrals`.
- Advisors continuam a reportar como pendentes: proteção contra passwords
  comprometidas desativada, funções `SECURITY DEFINER` executáveis por
  authenticated, tabelas RLS sem policies intencionais e alguns índices/FKs.

### 2026-09-15 — Correção de regressão no deploy da API

- O deployment `clube-ribatejo-api.vercel.app` devolvia
  `FUNCTION_INVOCATION_FAILED` após as alterações de segurança.
- Identificada a validação fail-fast de ambiente como regressão provável e
  restaurado o comportamento de arranque compatível no commit `3794c3a`.
- O commit foi enviado para `origin/main`.
- Após o redeploy, `https://clube-ribatejo-api.vercel.app/api/health` respondeu
  HTTP 200 com `service: clube-ribatejo-api`.
- Próximo passo: testar novamente as áreas membro, parceiro e admin no frontend.

### 2026-09-16 — Correção do resgate com erro de timezone

- Diagnóstico confirmou que `20260914220000_influencer_membership` referenciava
  campos inexistentes em `benefit_rules` (`timezone`, `valid_days`,
  `time_start/time_end`).
- Criada e aplicada no Supabase a migration
  `20260916100000_fix_influencer_redemption_rules`, alinhando a função com
  `allowed_weekdays`, `starts_at`, `ends_at` e as datas do benefício.
- Query remota confirmou que a função publicada já não contém as referências
  inválidas.
- Migration committed e enviada para GitHub no commit `faee346`.
- Próximo passo: testar resgate de membro/influencer e confirmação do parceiro
  no frontend publicado.

### 2026-09-16 — Integração Google Maps Embed

- As fichas de estabelecimento passaram a usar Google Maps Embed API quando
  `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` está configurada.
- Mantido fallback OpenStreetMap para desenvolvimento ou ausência da chave.
- CSP passou a permitir frames Google Maps; `.env.example` documenta a nova
  variável pública.
- Typecheck web, Prettier e `git diff --check` passaram.

### 2026-09-16 — Marcador da localização no mapa de membro

- O Embed API não suporta marcador dinâmico da posição do utilizador; criado o
  componente `MemberGoogleMap` com Maps JavaScript API.
- `/conta` agora desenha um marcador “Você” na posição obtida pelo browser;
  usa `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` e mantém fallback Embed/OSM.
- CSP permite `maps.googleapis.com` para carregar o SDK.
- Typecheck web e `git diff --check` passaram.

### 2026-09-16 — Primeira vista de mapa semelhante à referência 06

- `/explorar` ganhou modo de mapa com Google Maps JavaScript API, marcadores dos
  parceiros com coordenadas e painel inferior/lista alternável.
- Mantidos pesquisa, filtros e ordenação por proximidade; o mapa centra na
  localização do utilizador quando disponível.
- Criado `ExploreGoogleMap` com carregamento lazy do SDK e tema escuro.
- Typecheck web, Prettier e `git diff --check` passaram.
- O mapa centra na localização do utilizador quando disponível e apresenta o
  marcador destacado “Você”.
- Próximo passo: personalizar pins, bottom navigation e painel visual para
  aproximar ainda mais o screenshot 06.
- A chave browser deve ter `Maps JavaScript API` autorizada, além de restrição
  por referrer do domínio web.
- A chave deve ser configurada na Vercel com restrição por websites e apenas à
  Maps Embed API.

### 2026-09-16 — Localização em tempo real no catálogo

- `/explorar` passou a pedir localização apenas após ação explícita do
  utilizador, usando `navigator.geolocation.watchPosition` em HTTPS.
- A posição fica apenas no browser; não é enviada para a API nesta primeira
  versão.
- Parceiros com coordenadas são ordenados por distância aproximada (Haversine)
  e mostram os quilómetros até ao utilizador.
- O watch é limpo ao parar a funcionalidade ou desmontar a página; quando a
  API não devolve coordenadas, são usados os dados estáticos conhecidos.
- Typecheck web, Prettier e `git diff --check` passaram.
- Próximo passo: mapa geral com Google Maps JavaScript API e marcadores, seguido
  de Routes API para distância real por estrada quando necessário.

### 2026-09-16 — Mapa da área de membro e permissão de localização

- Corrigido o mapa de `/conta`: deixou de usar sempre OpenStreetMap e usa
  Google Maps Embed quando `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` existe.
- O botão `Ver mapa` agora solicita a localização do browser ao ser clicado,
  centra o mapa na posição obtida e apresenta estado de carregamento/erro.
- Mantido fallback OpenStreetMap e centro de Almeirim quando a chave ou a
  permissão não estão disponíveis.
- Typecheck web, Prettier e `git diff --check` passaram.

### 2026-09-16 — Diagnóstico de mapa sem carregamento

- O mapa de `/explorar` passou a expor estados de carregamento, chave ausente e
  erro do SDK, evitando uma tela preta silenciosa quando a chave Google Maps ou
  a restrição do domínio impede o carregamento.
- Typecheck web, Prettier e `git diff --check` passaram.
- Publicado no commit `86046f7` em `origin/main`.

### 2026-09-16 — Correção da CSP do Google Maps JavaScript

- A CSP bloqueava o SDK porque `maps.googleapis.com` não estava em
  `script-src`; também foram autorizados os domínios de tiles em `img-src` e
  `connect-src`.
- Próximo passo: redeploy da aplicação e validação do mapa no domínio publicado.

### 2026-09-16 — Cobertura dos lugares no mapa

- Foram adicionadas coordenadas aos restantes lugares estáticos do catálogo,
  para que todos os parceiros apresentados na lista tenham marcador na vista
  de mapa.

### 2026-09-16 — Mapa no detalhe do parceiro

- A página `/explorar/[slug]` passou a usar o mesmo mapa escuro da exploração,
  centrado e com marcador do parceiro.
- O botão “Abrir no Google Maps” usa coordenadas para abrir diretamente a rota
  no Google Maps/GPS.

### 2026-09-16 — Faixa de preço persistida por parceiro

- Criada migration `20260916120000_business_price_ranges` com valores mínimo,
  máximo, moeda e origem manual, evitando consultas recorrentes ao Google.
- API e frontend passam a apresentar a faixa em euros no catálogo e no detalhe;
  a integração Places poderá ser usada apenas para preenchimento administrativo.
- Typechecks web/API, Prettier e `git diff --check` passaram.

### 2026-09-16 — Correção dos links dos parceiros

- O fallback da API não incluía `slug`, causando links `/explorar/undefined`
  quando uma consulta remota falhava.
- Os dados fallback agora têm slugs reais e o detalhe aceita pesquisa por slug
  ou id.

### 2026-09-16 — Mapa de parceiros na área de membro

- `/conta` passou a reutilizar o mapa Google da exploração, com marcadores de
  todos os parceiros, localização do membro e painel com links para os detalhes.
- As coordenadas dos parceiros foram incluídas no carregamento da área de membro.
- Typecheck web, Prettier e `git diff --check` passaram.

### 2026-09-16 — Destaque da validação para parceiros

- O dashboard de parceiros ganhou um CTA amplo e destacado para “Validar
  código do membro”, responsivo para mobile e desktop.
- O botão principal da página de validação passou a usar maior altura, peso e
  contraste visual.

### 2026-09-16 — CSP para fontes do Google Maps

- Autorizadas `fonts.googleapis.com` em `style-src` e `fonts.gstatic.com` em
  `font-src`, eliminando os bloqueios das fontes internas do Maps.
- Corrigida também a `Permissions-Policy` para permitir geolocalização no
  próprio domínio (`geolocation=(self)`).

### 2026-09-16 — Ponto de equilíbrio da subscrição

- O card de poupanças da `/conta` passou a mostrar o valor pago na subscrição,
  usando o último pagamento registado (com fallback de 59 €).
- A barra fica amarela até recuperar o investimento e verde depois do ponto de
  equilíbrio, com marcador e legenda explicativos.

- Simplificado o marcador do ponto de equilíbrio para mostrar apenas o valor,
  evitando sobreposição com o gráfico.
- Removido o balão do valor poupado sobre a barra; o valor da subscrição fica
  agora diretamente sobre a linha de equilíbrio.

### 2026-09-16 — Remoção de informação interna da área de membro

- Removido o texto `Role: Membro` da interface `/conta`; a role continua
  disponível apenas para controlo interno de permissões e navegação.

### 2026-09-16 — Plano de migração mobile Expo

- Criado `MOBILE_EXPO_MIGRATION_PLAN.md` com arquitetura, fases, segurança,
  mapas, autenticação, testes e publicação iOS/Android.

### 2026-09-16 — Fundação do workspace mobile

- Criado `apps/mobile` como workspace React Native + Expo Router.
- Configurados `app.json`, TypeScript, EAS-ready bundle IDs e clientes base
  para Supabase SecureStore e API NestJS.
- Primeiro ecrã Expo e rota `/explorar` criados como ponto de partida.
- Typecheck mobile passou.

### 2026-09-16 — Primeira navegação mobile em desenvolvimento

- Adicionados AuthProvider com sessão Supabase, login e proteção das tabs.
- Criado shell Expo Router com Início, Explorar e Conta.
- Explorar já consulta `/api/businesses` e mantém fallback local, com links para
  detalhes de parceiros.
- Typecheck mobile passou.
- Ainda não foi criado commit: aguardamos uma versão mobile utilizável conforme
  decisão do utilizador.

### 2026-09-16 — Primeiro MVP mobile utilizável

- Implementados login, registo com confirmação de email e proteção de tabs.
- Explorar consulta a API com fallback; detalhe real do parceiro mostra
  benefício e abre navegação Google Maps.
- Conta mostra sessão, poupança acumulada e valor da subscrição.
- Typecheck mobile passou; esta versão está pronta para validação em Expo Go.

### 2026-09-16 — Funcionalidades móveis críticas

- Adicionado mapa nativo com `expo-location` e `react-native-maps`, incluindo
  parceiros e posição do utilizador.
- Detalhe do parceiro permite iniciar resgate e mostrar o código ao parceiro.
- Criado fluxo mobile de validação para parceiros (preview e confirmação).
- Typecheck mobile passou; alterações aguardam validação manual em Expo Go.

### 2026-09-16 — Configuração de chaves mobile

- Criado `apps/mobile/app.config.ts` para injetar chaves nativas Google Maps por
  plataforma durante o build Expo.
- Criado `apps/mobile/.env.example` com API, Supabase e chaves Android/iOS;
  nenhum valor real foi guardado no repositório.
- Pendente: depois de gerar os development/preview/production builds EAS,
  recolher os respetivos certificados SHA-1 Android e restringir
  `GOOGLE_MAPS_ANDROID_KEY` ao package `pt.cluberibatejo.app`.

### 2026-09-16 — Perfis EAS para builds mobile

- Criado `apps/mobile/eas.json` com perfis development, preview e production,
  canais separados e distribuição interna para testes.
- Adicionado `expo-dev-client` para testar mapas nativos fora do Expo Go.

### 2026-09-16 — Config plugin nativo de Google Maps

- O Expo Doctor detetou que `react-native-maps` não expõe config plugin próprio.
- Criado `apps/mobile/plugins/withGoogleMaps.js` para injetar as chaves Android
  e iOS no Manifest/Info.plist durante o build EAS.
- `expo config --json` passou; as chaves continuam apenas no `.env`/EAS.
- Projeto EAS ligado manualmente no `app.config.js` com o project ID
  `60279e41-ac9e-4098-bbef-d799f680e64d`, porque o CLI não pode editar uma
  configuração dinâmica automaticamente.
- O build preview iOS reconheceu o projeto; falta configurar variáveis no
  ambiente EAS `preview` e credenciais Apple para distribuição interna.

### 2026-09-17 — Integração dos logotipos finais e modo escuro

**Logotipos (`dde7960`, `8619f92`):**

- A pasta `Logotipo/` já existia com 7 ficheiros finais; foram mapeados para
  os destinos corretos:
  - `Logo3.png` → `apps/web/public/logo-light.png` (horizontal, fundo claro)
  - `Logo.png` → `apps/web/public/logo-dark.png` (horizontal, fundo escuro)
  - `Logo2.png` → `apps/web/public/logo-icon.png`, `app/icon.png`,
    `app/apple-icon.png` (Next.js auto-wires favicon)
  - `Logo6.png` → `apps/web/public/og-image.png`
  - `LogoMobile.png` → `apps/mobile/assets/icon.png` e `adaptive-icon.png`
  - `Logo3.png` → `apps/mobile/assets/splash-icon.png`
- Header, footer, login, registo e admin passaram a usar `<Image>` do Next.js
  com `dark:hidden` / `hidden dark:block` para trocar logo claro/escuro.
- `app.config.js` mobile atualizado: `name: "Clube Daqui"`, slug, scheme,
  bundle IDs, splash e adaptive icon.
- Logo ligeiramente maior: `height: "42px"` no header (era 36px).

**Modo escuro — revisão da sessão anterior:**

- Tokens `--color-cream-100` tornavam-se near-black em dark mode; fix:
  re-scope `html.dark footer { --color-cream-100: #e4eae4 }` para que todas
  as variantes de opacidade no footer resolvam near-white.
- Secções "Descubra por categoria" e "Membros" tinham
  `style={{ background: "#f6f0e4" }}` (inline, não sobreposto por CSS);
  substituídas por `className="bg-cream-100"`.

### 2026-09-17 — Diagnóstico e correção da carga de dados

**Causa raiz identificada:**

- `NEXT_PUBLIC_API_URL=http://localhost:3001` aponta para o servidor NestJS;
  quando este não está em execução, os fetches falham e a app mostra estados
  de erro em vez de dados ou fallback estático.
- `/explorar` mostrava "Não foi possível carregar os lugares" (error state).
- `/conta` ficava sem dados de membro (API status = fallback).

**Solução — rotas Next.js API (commit `457f1ef`):**

Criadas 14 rotas em `apps/web/src/app/api/` que replicam os controladores
NestJS consultando o Supabase diretamente a partir do servidor Next.js. A
autenticação nas rotas protegidas usa os cookies da sessão Supabase (via
`createClient()` do `@/lib/supabase/server`) em vez de tokens Bearer.

- **Públicas:** `businesses/`, `businesses/[slug]/`, `businesses/[slug]/benefits/`,
  `businesses/[slug]/reviews/`, `benefits/`
- **Membro (auth via cookie):** `me/summary/`, `me/savings/`, `me/redemptions/`,
  `me/redemptions/attempt/`, `me/redemptions/[id]/financials/`,
  `me/redemptions/[id]/review/`, `me/influencer/`, `me/referral/`, `me/profile/`

10 páginas/componentes atualizados para usar URLs relativas (`/api/...`) sem
passar tokens Bearer manualmente.

**Arquitectura resultante:**

- A app web é agora autónoma para o fluxo de membro: não precisa do servidor
  NestJS em execução para carregar dados de explorar/conta/parceiro.
- O NestJS continua em `apps/api` para uso futuro (mobile, deployment Vercel).
- As rotas admin no Next.js precisam de `SUPABASE_SERVICE_ROLE_KEY` no
  `apps/web/.env.local` — a chave está atualmente vazia.

**Rotas de parceiro e admin — em implementação:**

- `api/partner/redemptions/preview`, `confirm`, `stats`
- `api/partner-inquiries/`
- `api/admin/*` (stats, businesses, users, influencers, referrals)
- Páginas `parceiros/validar`, `parceiros/dashboard`, `parceiros/page`,
  admin/* actualizadas para usar URLs relativas.

**Nota operacional:**

Para que as rotas admin funcionem, adicionar ao `apps/web/.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=<service_role_key do painel Supabase>
```
(Project Settings → API → `service_role`)

### Modelo para entradas futuras

```text
### AAAA-MM-DD — Título curto

- Objetivo:
- Alterações:
- Decisões:
- Comandos/testes:
- Bloqueios:
- Próximo passo:
```

### 2026-09-19 — Sessão inválida no botão de adesão

- Objetivo: evitar que um token Supabase antigo bloqueie o checkout Stripe.
- Causa provável: a conta de teste foi removida, mas o navegador ainda mantinha
  a sessão dessa conta; a API rejeita corretamente o token como `Invalid session`.
- Alteração: `CheckoutButton` agora faz `signOut` e redireciona para o registo
  quando o endpoint de checkout responde 401.
- Validação: pendente de teste no browser após limpar a sessão e criar/confirmar
  novamente o utilizador.
- Próximo passo: fazer logout/limpar os dados do site, registar o utilizador de
  novo, confirmar o email e testar o botão “Aderir por 59 €”.

### 2026-09-19 — Confirmação de email e Price ID Stripe

- Diagnóstico: `price_prod_...` é um Product ID incorretamente prefixado; o
  Stripe exige o Price ID real, que começa por `price_` e é obtido no preço
  associado ao produto.
- Alterações: validação da configuração rejeita `price_prod_...`; o checkout
  devolve uma mensagem orientadora em vez do erro técnico bruto; o registo
  passou a permitir reenviar o email de confirmação.
- Validação: `npm run typecheck --workspace apps/api` e `npm run typecheck --workspace apps/web` passaram.
- Bloqueio operacional: é necessário substituir `STRIPE_PRICE_ID` na Vercel
  pelo Price ID correto e fazer novo deploy. Links antigos de confirmação podem
  estar expirados ou já utilizados; deve ser usado o email mais recente.

### 2026-09-19 — Remoção do utilizador de teste

- Pedido: apagar `maxwellsanrosa@gmail.com`, confirmado pelo utilizador como
  conta exclusivamente de teste.
- Ação: removidos os registos associados de memberships, payments, referrals,
  redemptions, reviews, dados financeiros e perfil; depois removido o utilizador
  de `auth.users`.
- Verificação: `auth.users`, `profiles`, `memberships`, `payments` e
  `redemptions` ficaram com zero registos para este utilizador.

- A conta foi recriada durante os testes e removida novamente em 2026-09-19;
  a verificação final confirmou zero registos em `auth.users` e `profiles`.

### 2026-09-19 — Diagnóstico dos links de confirmação

- Causa provável: o template padrão de confirmação do Supabase usa o fluxo
  implícito com token no fragmento da URL, enquanto a web usa SSR/PKCE.
- O callback da aplicação já aceita `code` e `token_hash`; para o fluxo SSR é
  necessário configurar o template **Confirm signup** para apontar para
  `/auth/callback?token_hash={{ .TokenHash }}&type=email`.
- Também é necessário autorizar `https://clube-ribatejo-web.vercel.app/auth/callback`
  em Authentication → URL Configuration → Redirect URLs.
- Próximo passo: guardar o template/configuração, aguardar o limite de envio do
  Supabase e testar apenas o email de confirmação mais recente.

- Correção adicional: o callback `/auth/callback` passou a ser executado no
  browser e aceita os formatos `code`, `token_hash` e tokens no fragmento da
  URL, cobrindo templates padrão e templates SSR do Supabase.
- Validação: `npm run typecheck --workspace apps/web` passou após regenerar o
  cache `.next`.

- A conta de teste foi removida novamente em 2026-09-19 após novo ciclo de
  validação; confirmação final: zero registos em `auth.users` e `profiles`.

- A conta de teste e a adesão ativa foram removidas novamente em 2026-09-19
  para repetir o fluxo completo de registo e pagamento; verificação final sem
  utilizador nem perfil associado.

- A conta de teste foi removida mais uma vez em 2026-09-19 antes de repetir o
  checkout com o `WEB_URL` de produção corrigido; verificação final: zero em
  `auth.users` e `profiles`.

### 2026-09-19 — Proteção do redirect Stripe em produção

- Problema: o Checkout continuava a gerar `localhost:3000` quando o deployment
  da API ainda tinha `WEB_URL` antigo ou configurado no ambiente errado.
- Alteração: se um pedido vier do domínio oficial da web e `WEB_URL` estiver
  acidentalmente em localhost, o backend usa o origin oficial para o
  `success_url`/`cancel_url` dessa sessão.
- Validação: `npm run typecheck --workspace apps/api` passou.

- A conta `maxwellsanrosa@gmail.com` foi removida novamente em 2026-09-19 para
  repetir o fluxo após o novo deploy; confirmação final: zero em `auth.users` e
  `profiles`.

### 2026-09-19 — Fecho da sessão Stripe/Auth

- Resultado: o fluxo completo de registo, confirmação de email e pagamento
  Stripe em modo de teste foi validado com sucesso.
- Correções concluídas: callback de confirmação compatível com `code`,
  `token_hash` e fragmento; página protegida por `Suspense`; Price ID Stripe
  validado; redirect de Checkout protegido contra `localhost` em produção.
- Configuração operacional: `WEB_URL` deve permanecer como
  `https://clube-ribatejo-web.vercel.app` no ambiente Production da API; o
  webhook ativo é `https://clube-ribatejo-api.vercel.app/api/payments/webhook`.
- Estado dos testes: a conta `maxwellsanrosa@gmail.com` foi removida após a
  validação, sem dados de teste pendentes.
- Próxima sessão: continuar as melhorias do produto a partir do checklist,
  começando por rever o fluxo pós-pagamento e a experiência da área de membro.

### 2026-09-21 — Renomeação técnica para ClubeDaqui

- GitHub: repositório renomeado de `ClubeRibatejo` para `ClubeDaqui`; remote
  local atualizado para `https://github.com/Maxwellsan91/ClubeDaqui.git`.
- Vercel: projetos renomeados para `clube-daqui-web` e `clube-daqui-api`.
- Domínios: a Vercel manteve os aliases públicos existentes
  (`clube-ribatejo-web.vercel.app` e `clube-ribatejo-api.vercel.app`), evitando
  quebra imediata de Supabase, Stripe, Google Maps e variáveis de ambiente.
- Documentação: README alinhado com a marca Clube Daqui e os nomes atuais dos
  workspaces.

### 2026-09-21 — Migração dos domínios Vercel

- Domínios novos configurados pelo utilizador:
  `clube-daqui-web.vercel.app` e `clube-daqui-api.vercel.app`.
- Código atualizado: CORS da API aceita o novo frontend; o fallback do checkout
  reconhece o novo origin; plano mobile e README usam o novo domínio da API.
- Configuração externa pendente: atualizar `NEXT_PUBLIC_API_URL` no projeto
  web, `WEB_URL` no projeto API, Redirect URLs/Site URL do Supabase, endpoint
  do webhook Stripe e restrições de website do Google Maps.
- Validação: `npm run typecheck --workspace apps/api` passou.
- Decisão temporária: as chaves Web do Google Maps permanecem sem restrições
  durante os testes; configurar restrições de domínio e API antes da publicação
  definitiva.

- A conta de teste `maxwellsanrosa@gmail.com` foi removida novamente em
  2026-09-21 para novo teste do fluxo completo; verificação final: zero em
  `auth.users` e `profiles`.

- A conta parceira de teste `aadega@mail.com` foi identificada como `PARTNER`
  ativa e recebeu uma password temporária para validação manual; a password não
  é guardada neste ficheiro.

### 2026-09-19 — Cadastro encaminha diretamente para pagamento

- Objetivo: eliminar o segundo clique no `/clube` e tornar o percurso uniforme
  a partir de qualquer formulário de registo.
- Alterações: novo `/checkout` inicia o Checkout Stripe automaticamente; o
  registo usa `/checkout` como destino padrão e preserva esse destino após a
  confirmação do email; o botão de adesão aponta para o mesmo fluxo.
- Resultado esperado: cadastro → confirmação de email (quando exigida) →
  Checkout Stripe → `/conta?payment=success`.
- Validação: typecheck web e API passaram.

### 2026-09-21 — Preparação de novo teste do fluxo

- Removida a conta de teste `maxwellsanrosa@gmail.com` e os dados associados
  (adesão, pagamentos, resgates, avaliações e referências).
- A sessão OAuth do conector Supabase precisou ser renovada antes da operação.
- Verificação final: zero registos em `auth.users` e `profiles` para a conta.

### 2026-09-21 — Confirmação de email encaminha para pagamento

- Ajuste: quando uma confirmação de registo não traz `next`, o callback agora
  usa `/checkout` como destino padrão para os tipos `signup` e `email`.
- Resultado esperado: confirmar email → abrir automaticamente o Checkout Stripe;
  `/conta` continua reservado para o retorno após pagamento.
- Validação: `npm run typecheck --workspace apps/web` passou.

- A conta `maxwellsanrosa@gmail.com` foi removida novamente em 2026-09-21 para
  repetir o fluxo após o ajuste; confirmação final: zero em `auth.users` e
  `profiles`.

### 2026-09-21 — Sheet de resgate responsivo no mobile

- Problema: ao preencher valores da visita e avaliação, o bottom sheet podia
  exceder a altura do viewport e deslocar a página.
- Alteração: sheet limitado à altura da viewport (`100dvh`), com overflow e
  overscroll controlados internamente; scroll do `html` e `body` bloqueado
  enquanto está aberto; conteúdo com largura máxima para evitar deslocamento
  horizontal.
- Validação: `npm run typecheck --workspace apps/web` passou.

### 2026-09-21 — Sheet de resgate em ecrã inteiro no mobile

- Refinamento: no mobile, o painel de valores e feedback passou a ocupar toda a
  viewport (`100dvh`) e a página de fundo permanece fixa; o scroll, quando
  necessário, acontece apenas dentro do painel.
- Em ecrãs maiores, foi preservado o comportamento de bottom sheet para não
  alterar a experiência desktop.
- Validação: `npm run typecheck --workspace apps/web` e `git diff --check`
  passaram.

### 2026-09-21 — Limpeza da conta de teste para novo fluxo

- Removida novamente a conta de teste `maxwellsanrosa@gmail.com`, incluindo os
  registos associados de adesão, pagamentos, resgates e dados financeiros.
- Verificação final no Supabase: `auth.users`, `profiles` e `memberships` sem
  registos para essa conta.

### 2026-09-19 — Correção do build do callback

- Causa: a página `/auth/callback` usava `useSearchParams()` diretamente numa
  página prerenderizada, exigindo um limite `Suspense` no Next.js.
- Alteração: separado o conteúdo do callback e envolvido em `Suspense` com
  fallback de confirmação.
- Validação: `npm run typecheck --workspace apps/web` passou.
