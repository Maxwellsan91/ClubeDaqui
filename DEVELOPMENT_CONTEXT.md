# Clube Ribatejo — Checklist e diário de desenvolvimento

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

O Clube Ribatejo é uma aplicação web responsiva para descobrir
estabelecimentos locais e usufruir de benefícios exclusivos no Ribatejo. O
produto começa por Santarém e Almeirim, com o inventário atual focado no
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
- Integração de Stripe e Resend antes de existir um fluxo que as utilize.

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
- [ ] Fluxo de autenticação completo.
- [ ] Catálogo navegável de estabelecimentos ligado ao Supabase.
- [ ] Fluxo de benefícios e resgates ligado à interface.
- [ ] Área de parceiro.
- [ ] Sistema de avaliações dos clientes em produção.

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
  produzidos pelos clientes do Clube Ribatejo.
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

1. Fechar o recorte piloto de Almeirim e os primeiros estabelecimentos de cada
   grupo: comer, dormir e lazer.
2. Rever os 115 estabelecimentos sem correspondência OSM e os 3 possíveis
   duplicados do inventário de restauração.
3. Decidir o modelo de proveniência para `businesses` e
   `business_locations`.
4. Criar uma migration de importação apenas para estabelecimentos validados.
5. Expor o catálogo através da API e ligá-lo à página web.
6. Criar fichas públicas e uma chamada para ação de parceria/reivindicação.
7. Implementar benefícios, resgates e avaliações próprias dos clientes.

## Diário

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
