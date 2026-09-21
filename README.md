# Clube Daqui

MVP de uma web app responsiva para descoberta de estabelecimentos e benefícios exclusivos no Ribatejo, inicialmente focada em Santarém e Almeirim.

## Arquitetura

O repositório é um monorepo simples com npm workspaces:

```text
apps/
  web/                  # Next.js, interface e sessão SSR
  api/                  # NestJS, API e regras de aplicação
supabase/
  migrations/           # schema, constraints, funções e RLS
```

- O Next.js é responsável pela interface, SEO e sessão web.
- O NestJS é a API central para regras de negócio e integrações.
- O Supabase fornece PostgreSQL, Auth, Storage e RLS.
- Operações críticas permanecem atómicas no PostgreSQL.

Stripe (checkout e webhook) e Resend (email de boas-vindas) integram o fluxo de adesão em modo de teste.

## Requisitos

- Node.js 22.13 ou superior; a versão está definida em `.nvmrc`.
- npm.
- Um projeto Supabase.

## Instalação

```bash
nvm use
npm install
```

Crie os ambientes locais:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Preencha as credenciais do mesmo projeto Supabase nos dois ficheiros. A chave `SUPABASE_SERVICE_ROLE_KEY` é exclusivamente do backend e nunca deve ser adicionada ao ambiente do Next.js.

## Desenvolvimento

Execute cada aplicação num terminal:

```bash
npm run dev:web
npm run dev:api
```

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001/api](http://localhost:3001/api)

## Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```

## Qualidade e builds

```bash
npm run lint
npm run typecheck
npm run format:check
npm run check
npm run build
```

## Inventário de restauração

O inventário inicial de restaurantes, cafés e espaços semelhantes pode ser
reconstruído de forma auditável com:

```bash
npm run data:food-inventory
```

O comando utiliza o diretório público do `almeirim.city` como semente e cruza
os estabelecimentos com o OpenStreetMap através do Overpass. Os resultados são
gravados em `data/food-directory/` nos formatos JSON e CSV, acompanhados por um
relatório de correspondências e possíveis duplicados. O comando não escreve no
Supabase.

Classificações, contagens e textos de avaliações, fotografias e descrições de
terceiros são deliberadamente descartados. As avaliações da aplicação são
exclusivamente as submetidas por clientes do Clube Daqui.

Scripts de workspace também podem ser executados isoladamente:

```bash
npm run build --workspace @clube-daqui/web
npm run build --workspace @clube-daqui/api
```

## Supabase no frontend

O frontend possui clientes separados para browser e Server Components em `apps/web/src/lib/supabase`. Estes clientes destinam-se à sessão Supabase Auth. O acesso às regras de negócio deve passar pela API NestJS.

### Registo e confirmação de email

O percurso de um novo membro começa em `/registar`: nome, email e palavra-passe
são enviados ao Supabase Auth, que cria o utilizador e envia a confirmação. O
trigger `on_auth_user_created` cria o respetivo registo em `public.profiles`. O
callback `/auth/callback` aceita tanto o código PKCE como `token_hash`, cria a
sessão em cookies e redireciona para `/conta`.

No painel do Supabase, confirme antes de testar:

- Authentication → Providers → Email: novos registos permitidos e `Confirm
Email` ativo.
- Authentication → URL Configuration: `Site URL` com o domínio da web e
  `Redirect URLs` com `http://localhost:3000/auth/callback` e o callback do
  domínio publicado.
- Authentication → Attack Protection: proteção contra palavras-passe expostas
  ativa antes de produção.

Se o template “Confirm signup” for personalizado para SSR, o link pode apontar
para:

```text
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/conta
```

O login posterior é feito em `/entrar` com email e palavra-passe. Uma conta não
confirmada não deve obter sessão.

## Supabase na API

`SupabaseService` disponibiliza duas criações explícitas de cliente:

- `createUserClient(accessToken)`: encaminha o JWT do utilizador e mantém as políticas RLS.
- `createAdminClient()`: utiliza `service_role` apenas para operações internas previamente autorizadas no servidor.

Não utilize o cliente administrativo como cliente padrão de pedidos autenticados.

## Validação de benefícios pelo parceiro

Um utilizador associado a um parceiro pode abrir `/parceiros/validar`, rever um
código manual de seis dígitos apresentado pelo membro e confirmar a utilização.
A interface usa os endpoints autenticados
`POST /api/partner/redemptions/preview` e
`POST /api/partner/redemptions/confirm`. A associação ao estabelecimento e as
regras do benefício são novamente verificadas pelas funções transacionais do
PostgreSQL antes da confirmação.

Depois da confirmação, a área `/conta` apresenta a utilização em “Economias
por registar”. O formulário fica associado ao `redemption_id` real e desaparece
quando a fatura e o desconto são guardados. O registo manual em `localStorage`
só é disponibilizado quando a API de membro não está acessível.

## Base de dados

A migration inicial está em:

```text
supabase/migrations/20260910183000_initial_schema.sql
```

Ela cria as entidades do MVP, índices, constraints, políticas RLS e as operações transacionais:

- `create_redemption_attempt`
- `get_redemption_preview`
- `confirm_redemption`

Os tokens QR são devolvidos apenas no momento da criação; o banco armazena o respetivo hash SHA-256. A confirmação utiliza locks transacionais e volta a validar assinatura, benefício, estabelecimento, horário e quotas.

A migration deve ser aplicada primeiro num ambiente de desenvolvimento ou branch do Supabase, nunca diretamente em produção sem validação.

## Deploy na Vercel

Crie dois projetos Vercel ligados ao mesmo repositório:

1. Web com Root Directory `apps/web`.
2. API com Root Directory `apps/api`. A API expõe `api/[...path].ts` como
   função Serverless e mantém o arranque local com `npm run dev:api`.

Configure as variáveis de ambiente de cada aplicação no respetivo projeto. A região da API deve ficar próxima da região do projeto Supabase.

Na API, configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (quando forem usadas operações administrativas) e
`WEB_URL` com o domínio publicado do frontend. O endpoint de health pode
arrancar sem as variáveis Supabase, mas qualquer funcionalidade que consulte a
base de dados exige as credenciais correspondentes.

Em produção, use `https://clube-daqui-web.vercel.app` em `WEB_URL` e
`https://clube-daqui-api.vercel.app` em `NEXT_PUBLIC_API_URL`.

## Supabase MCP no Codex

Este projeto está registado globalmente no Codex como `supabase-clube-ribatejo`. Depois de reiniciar a sessão do Codex, use `/mcp` para confirmar que a ligação está disponível.

## Serena no Codex

O projeto Serena está configurado em `.serena/project.yml` com suporte TypeScript. O servidor está registado globalmente no Codex com deteção automática do projeto pelo diretório atual:

```bash
serena start-mcp-server --context=codex --project-from-cwd
```

O Codex inicia o servidor automaticamente ao abrir uma sessão. Para verificar a configuração e o language server:

```bash
codex mcp get serena
serena project health-check .
```
