# InvoiceXpress — auditoria e proposta de schema

Data da auditoria: 2026-09-23

Este documento começou como auditoria e desenho. A implementação local do
núcleo foi concluída em 2026-09-23; a migration ainda precisa de ser aplicada e
testada numa branch Supabase e a integração real precisa das configurações
fiscais confirmadas.

## Estado atual

### Fluxo de pagamentos

- `PaymentsService.createCheckout()` cria primeiro uma `membership` pendente e
  um `payment` pendente, depois cria a Checkout Session Stripe.
- O preço guardado antes do checkout está hardcoded em `5900` cêntimos.
- O webhook valida a assinatura Stripe e aceita
  `checkout.session.completed` e `checkout.session.async_payment_succeeded`.
- A primeira atualização que encontra o pagamento em `pending` marca-o como
  `paid`; webhooks seguintes deixam de continuar. Isto oferece idempotência
  básica para o fluxo atual.
- A ativação da membership é uma segunda atualização independente. O erro
  dessa atualização não é verificado.
- A membership começa a contar no momento em que o checkout é criado, não no
  momento em que o pagamento é confirmado.
- Depois da ativação é enviado um email de boas-vindas pelo Resend.

### Modelo de dados existente

- `memberships` pertence a `profiles`, tem período, estado e origem.
- Existe um índice único parcial que permite apenas uma membership `active`
  por perfil.
- `payments` pertence a `memberships`; os IDs Stripe da Checkout Session e do
  Payment Intent são únicos.
- `payments.amount_cents` é inteiro e a moeda é um código de três letras.
- `profiles.nif` é opcional, tem formato de nove dígitos, é único e não pode
  ser alterado depois de preenchido.
- Não existem morada fiscal, documentos fiscais, histórico de eventos Stripe,
  queue/worker, cron fiscal ou testes automatizados na API.

### Configuração

- O `.env` local da API está ignorado pelo Git e contém a variável
  `INVOICE_XPRESS_API`. O valor não foi lido nem registado.
- O nome canónico proposto para o código é `INVOICEXPRESS_API_KEY`.
- Ainda falta `INVOICEXPRESS_ACCOUNT_NAME` e
  `INVOICEXPRESS_DEFAULT_TAX_NAME` e, quando aplicável,
  `INVOICEXPRESS_TAX_EXEMPTION_CODE`.
- A validação Zod atual não é fail-fast: qualquer erro faz a função devolver
  um ambiente mínimo. Antes da integração, a validação deve voltar a lançar um
  erro explícito para configurações inválidas, sem impedir que health checks
  arranquem nos ambientes onde as integrações opcionais estejam desativadas.

## Riscos a corrigir antes da emissão

1. **Valor confirmado:** a fatura não pode usar o `5900` guardado antes do
   checkout. O webhook deve persistir `session.amount_total` e
   `session.currency`, depois de validar a Checkout Session correspondente.
2. **Atomicidade local:** pagamento pago, membership ativa e criação do trabalho
   fiscal têm de ser gravados por uma única função PostgreSQL. Não haverá uma
   transação aberta durante chamadas HTTP.
3. **Falha parcial atual:** se o pagamento for marcado `paid` e a ativação da
   membership falhar, um webhook repetido já não repara o estado.
4. **Idempotência externa:** uma constraint local não basta quando a criação no
   InvoiceXpress termina e a resposta se perde. Cada criação deve enviar
   `proprietary_uid` determinístico e uma `reference` interna pesquisável.
5. **Estado do documento:** criar `invoice_receipt` devolve um draft. É
   necessário mudar o estado para `finalized`; para uma fatura-recibo essa
   transição leva o documento de draft a settled.
6. **IVA e total:** o `unit_price` do InvoiceXpress é a base antes de imposto.
   A taxa configurada deve ser resolvida por `GET /taxes.json`; o mapper calcula
   a base líquida a partir do total bruto pago no Stripe e confirma que o total
   devolvido pelo provider coincide com o pagamento.
7. **Clientes existentes:** ao reutilizar um cliente pelo `code`, os restantes
   campos enviados na criação do documento podem ser ignorados. O cliente deve
   ser encontrado/criado/atualizado explicitamente antes da emissão.

## Schema proposto

### `stripe_webhook_events`

Registo técnico mínimo, sem guardar o payload completo nem dados de pagamento.

```sql
create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  stripe_object_id text,
  livemode boolean not null,
  status text not null check (status in ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);
```

### `invoicing_customers`

Mapeamento neutro entre o utilizador e qualquer provider futuro. Evita colocar
uma coluna específica do InvoiceXpress em `profiles`.

```sql
create table public.invoicing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  provider text not null,
  external_client_id text,
  external_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider),
  unique (provider, external_code),
  unique (provider, external_client_id)
);
```

Para InvoiceXpress, `external_code` será `CLUBE_USER_{profile_id}`. A recuperação
após falha usa `GET /clients/find-by-code.json` antes de tentar criar outro
cliente.

### `fiscal_documents`

```sql
create type public.fiscal_document_type as enum (
  'INVOICE_RECEIPT',
  'CREDIT_NOTE'
);

create type public.fiscal_document_status as enum (
  'PENDING',
  'ISSUING',
  'ISSUED',
  'FAILED',
  'CANCELLED',
  'CREDITED'
);

create table public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  membership_id uuid not null references public.memberships (id) on delete restrict,
  payment_id uuid not null references public.payments (id) on delete restrict,
  original_document_id uuid references public.fiscal_documents (id) on delete restrict,

  provider text not null,
  document_type public.fiscal_document_type not null,
  status public.fiscal_document_status not null default 'PENDING',

  idempotency_key uuid not null default gen_random_uuid(),
  source_reference text not null,
  external_document_id text,
  external_client_id text,
  document_number text,
  sequence_id text,

  subtotal numeric(12, 2),
  tax_amount numeric(12, 2),
  total_amount numeric(12, 2),
  currency text not null,

  pdf_url text,
  permalink text,
  issued_at timestamptz,

  retry_count integer not null default 0 check (retry_count >= 0),
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  processing_started_at timestamptz,
  last_error_code text,
  last_error_message text,

  email_status text not null default 'NOT_REQUESTED'
    check (email_status in ('NOT_REQUESTED', 'PENDING', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN')),
  email_sent_at timestamptz,
  last_email_error text,

  customer_snapshot jsonb not null,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fiscal_documents_currency_iso check (currency ~ '^[A-Z]{3}$'),
  constraint fiscal_documents_amounts_non_negative check (
    (subtotal is null or subtotal >= 0)
    and (tax_amount is null or tax_amount >= 0)
    and (total_amount is null or total_amount >= 0)
  ),
  constraint fiscal_documents_credit_owner check (
    (document_type = 'INVOICE_RECEIPT' and original_document_id is null)
    or (document_type = 'CREDIT_NOTE' and original_document_id is not null)
  ),
  unique (provider, idempotency_key),
  unique (provider, source_reference)
);

create unique index fiscal_documents_one_invoice_per_payment_uidx
  on public.fiscal_documents (payment_id)
  where document_type = 'INVOICE_RECEIPT';

create unique index fiscal_documents_external_id_uidx
  on public.fiscal_documents (provider, external_document_id)
  where external_document_id is not null;

create index fiscal_documents_user_issued_idx
  on public.fiscal_documents (user_id, issued_at desc);

create index fiscal_documents_retry_idx
  on public.fiscal_documents (status, next_retry_at)
  where status in ('PENDING', 'FAILED');
```

`source_reference` será `stripe:payment:<payment_id>` na fatura-recibo e
`stripe:refund:<stripe_refund_id>` numa nota de crédito. Assim ficam suportados
vários reembolsos parciais sem apagar nem substituir a fatura original.

`customer_snapshot` conserva exatamente os dados usados no documento. A API de
membro nunca devolve `provider_response`; ambos os campos devem ter acesso
restrito e política de retenção adequada.

### Dados fiscais do perfil

O MVP atual já permite nome, email e NIF opcional. Morada, cidade, código postal
e país devem ser adicionados numa migration separada como perfil fiscal (1:1
com `profiles`) quando a interface permitir recolhê-los. A emissão não deve
inventar esses dados. O documento guarda sempre um snapshot imutável dos campos
realmente usados.

## Transação local proposta

Criar uma RPC PostgreSQL acessível apenas à `service_role`, por exemplo
`record_stripe_payment_succeeded`, que numa única transação:

1. insere/obtém `stripe_webhook_events` pelo `stripe_event_id`;
2. bloqueia o `payment` e a `membership` esperados;
3. confirma a associação entre payment, membership e Checkout Session;
4. atualiza `payments.amount_cents`, `currency`, `paid_at`, Payment Intent e
   estado a partir dos dados Stripe assinados;
5. define `memberships.starts_at = paid_at`, `ends_at = paid_at + 12 months` e
   estado `active`;
6. insere `fiscal_documents` em `PENDING` com `ON CONFLICT` idempotente;
7. marca o evento como `PROCESSED` e devolve os IDs resultantes.

Não existe qualquer chamada HTTP dentro desta função.

Também deve existir uma RPC curta para reclamar trabalho fiscal. Ela faz um
`UPDATE ... WHERE status IN ('PENDING', 'FAILED') ... RETURNING`, muda o estado
para `ISSUING` e permite recuperar locks `ISSUING` abandonados após um timeout.

## Fluxo de emissão proposto

```text
Stripe webhook com assinatura válida
  -> RPC atómica: payment PAID + membership ACTIVE + documento PENDING
  -> commit PostgreSQL
  -> claim curto: documento ISSUING
  -> find/create/update cliente InvoiceXpress por code estável
  -> resolver e validar taxa configurada
  -> POST /invoice_receipts.json com proprietary_uid = idempotency_key
  -> persistir imediatamente o external_document_id do draft
  -> PUT change-state com state=finalized
  -> GET do documento final e validação total == Stripe amount_total
  -> documento ISSUED
```

A `reference` externa deve incluir o ID interno do pagamento. Se houver timeout
depois do POST, o retry usa primeiro o ID externo já guardado; na ausência desse
ID procura pela referência e reutiliza `proprietary_uid`, em vez de emitir com
uma chave nova.

No MVP, o webhook pode tentar processar o documento depois do commit. Falhas do
InvoiceXpress são gravadas como `FAILED` e não alteram `payments.status`. O
endpoint administrativo de retry usa exatamente o mesmo claim. Um cron/worker
pode ser acrescentado depois sem mudar a regra de negócio.

## PDF, email e reembolsos

- PDF: `GET /api/pdf/:document-id.json` pode devolver `202`; o endpoint NestJS
  deve fazer polling limitado ou devolver estado de preparação, nunca expor a
  API key e nunca aceitar um ID pertencente a outro utilizador.
- Email inicial: usar o InvoiceXpress é a opção mais simples. Para cumprir
  “não enviar duas vezes”, só enviar documentos `ISSUED`, reclamar o estado
  `PENDING -> SENDING` atomicamente e não repetir automaticamente um resultado
  ambíguo (`UNKNOWN`). O admin reconcilia esses casos.
- Refund: criar `CREDIT_NOTE` ligada por `original_document_id` e enviar
  `owner_invoice_id` ao InvoiceXpress. A fatura original permanece `ISSUED` ou
  passa a `CREDITED` depois da nota final; nunca é apagada.

## RLS e endpoints

- Ativar RLS nas três tabelas novas.
- Membros podem selecionar apenas documentos cujo `user_id = auth.uid()` e
  apenas colunas seguras.
- Nenhum utilizador autenticado pode inserir/alterar documentos fiscais.
- Admin usa `AdminAuthGuard`; membro usa `MemberAuthGuard` e filtragem por
  `user_id` mesmo com RLS.
- Endpoints previstos:
  - `GET /api/v1/admin/fiscal-documents/:id`
  - `POST /api/v1/admin/fiscal-documents/:id/retry`
  - `GET /api/v1/me/fiscal-documents`
  - `GET /api/v1/me/fiscal-documents/:id/pdf`

O prefixo atual da API é `/api`, sem versionamento. A introdução de `/v1` deve
ser decidida globalmente; não se deve versionar apenas este módulo por acidente.

## Configuração proposta

```env
INVOICEXPRESS_ACCOUNT_NAME=
INVOICEXPRESS_API_KEY=
INVOICEXPRESS_SEQUENCE_ID=
INVOICEXPRESS_DEFAULT_TAX_NAME=
INVOICEXPRESS_TAX_EXEMPTION_CODE=
INVOICEXPRESS_BASE_URL=
```

`INVOICEXPRESS_BASE_URL` é opcional e, quando ausente, será construído como
`https://{ACCOUNT_NAME}.app.invoicexpress.com`. URLs não HTTPS devem ser
rejeitados. `INVOICE_XPRESS_API` pode ser aceite durante uma única fase de
transição, com aviso sem valor, mas a configuração final deve usar
`INVOICEXPRESS_API_KEY`.

Antes de habilitar a emissão, um preflight deve confirmar que a sequência e a
taxa existem. Se a taxa resolvida for 0%, o código de isenção configurado é
obrigatório. O sistema não escolhe nem inventa esse código.

## Ordem recomendada de implementação

1. Confirmar com contabilista a taxa/isenção e a sequência fiscal.
2. Criar e testar a migration, RLS e RPC transacional numa branch Supabase.
3. Corrigir a validação de ambiente e adicionar o módulo/provider abstrato.
4. Refatorar o webhook para usar valores Stripe confirmados e a RPC.
5. Implementar emissão/finalização/reconciliação com mocks.
6. Adicionar endpoints de membro/admin, PDF e retry.
7. Adicionar envio por email apenas após validar a emissão completa.
8. Preparar o handler Stripe de refund e a criação da nota de crédito.

## Referências oficiais consultadas

- [Autenticação da API](https://invoicexpress.com/api-v2/documentation/authentication/)
- [Criação de documentos](https://invoicexpress.com/api-v2/invoices/create)
- [Mudança de estado](https://invoicexpress.com/api-v2/invoices/change-state/)
- [Geração de PDF](https://invoicexpress.com/api-v2/invoices/generate-pdf/)
- [Pesquisa de cliente por código](https://invoicexpress.com/api-v2/clients/find-by-code/)
- [Lista de impostos](https://invoicexpress.com/api-v2/taxes/list-all-7/)
- [Envio de documento por email](https://invoicexpress.com/api-v2/invoices/send-by-email/)
