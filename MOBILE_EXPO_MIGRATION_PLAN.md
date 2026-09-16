# Plano de evolução mobile — Clube Ribatejo

## Objetivo

Levar o Clube Ribatejo para uma aplicação iOS e Android com React Native +
Expo, mantendo o `apps/api` (NestJS), o Supabase e as regras de negócio atuais.
A app mobile será um novo cliente do mesmo backend; não devemos duplicar regras
de resgate, permissões ou acesso à base de dados no dispositivo.

## Decisão técnica

- React Native com Expo e TypeScript.
- Expo Router para navegação baseada em ficheiros.
- EAS Build/Submit/Update para builds, TestFlight, Google Play e atualizações
  OTA.
- `@supabase/supabase-js` com `expo-secure-store` para sessão persistente.
- TanStack Query para cache, invalidação e estados de rede.
- React Hook Form + Zod para formulários.
- Google Maps através de `react-native-maps`/SDK nativo, com uma chave Android
  e outra iOS; não reutilizar a chave pública web sem restrições adequadas.

## O que será reaproveitado

- `apps/api`: endpoints, guards, RPCs transacionais, validações e auditoria.
- Supabase Auth: email, confirmação, sessão e recuperação de palavra-passe.
- Supabase PostgreSQL/RLS: fonte única dos membros, parceiros, benefícios,
  resgates, avaliações e poupanças.
- Contratos TypeScript dos endpoints, convertidos para um pacote partilhado
  (`packages/contracts`) com schemas Zod.
- Identidade visual: cores, tipografia, estados de erro e textos em português.

## O que será refeito para mobile

- Navegação inferior: Início, Explorar, Mapa, Benefícios e Conta.
- Ecrãs nativos para login, registo, confirmação de email e sessão expirada.
- Lista/cartões de parceiros com pesquisa, filtros, favoritos e proximidade.
- Mapa com localização em tempo real, pins, detalhe do parceiro e botão de
  navegação externa para Google Maps.
- Fluxo de resgate com QR/manual code, polling de confirmação, poupança e
  avaliação.
- Área do parceiro separada por role, com validação de código em destaque.
- Estados offline, loading, erro, permissões e acessibilidade para toque.

## Arquitetura proposta

```text
apps/mobile (Expo Router)
  ├─ lib/api.ts              cliente HTTP + token Supabase
  ├─ lib/supabase.ts         sessão SecureStore
  ├─ features/auth
  ├─ features/explore
  ├─ features/redemptions
  ├─ features/member
  ├─ features/partner
  └─ components/ui

apps/api (NestJS) ─── Supabase Auth/Postgres/RLS
```

Criar o workspace `apps/mobile` e, quando os contratos estiverem estáveis,
`packages/contracts`. O mobile deve chamar a API; chamadas diretas ao Supabase
ficam limitadas à autenticação e a operações explicitamente autorizadas.

## Fases de implementação

### P0 — Fundação

- [ ] Criar `apps/mobile` com Expo Router, TypeScript e lint/prettier.
- [ ] Configurar EAS project, bundle IDs Android/iOS e ambientes
      development/preview/production.
- [ ] Criar cliente Supabase com SecureStore e auto-refresh de sessão.
- [ ] Criar cliente API com timeout, bearer token, refresh e tratamento 401.
- [ ] Implementar providers de tema, query cache, safe area e notificações.
- [ ] Adicionar pipeline CI para typecheck, lint e build Expo.

### P1 — Autenticação e shell

- [ ] Splash screen enquanto a sessão é restaurada.
- [ ] Registo, confirmação de email, login, logout e recuperação de password.
- [ ] Guards de navegação por sessão e role (MEMBER/PARTNER/ADMIN/INFLUENCER).
- [ ] Deep link para confirmação de email e links de resgate.
- [ ] Ecrã de sessão expirada e reautenticação.

### P2 — Experiência do membro

- [ ] Início com categorias e carrosséis ligados à API.
- [ ] Explorar com pesquisa, filtros, favoritos e ordenação por distância.
- [ ] Mapa Google com todos os parceiros e marcador “Você”.
- [ ] Detalhe do parceiro, benefício, preços persistidos e navegação GPS.
- [ ] Resgate atómico, código de 6 dígitos/QR, confirmação e expiração.
- [ ] Registo de fatura, poupanças, ponto de equilíbrio da subscrição e reviews.

### P3 — Experiência do parceiro

- [ ] Dashboard com CTA principal “Validar código do membro”.
- [ ] Scanner QR com `expo-camera`, além de entrada manual.
- [ ] Preview seguro antes da confirmação e feedback háptico/sonoro.
- [ ] Estatísticas e histórico provenientes da API.

### P4 — Qualidade e publicação

- [ ] Testes unitários de hooks, reducers e transformadores.
- [ ] Testes de integração para auth, resgate e permissões.
- [ ] E2E em dispositivo/emulador (Maestro ou Detox).
- [ ] Testes em iOS/Android reais, redes lentas e modo offline.
- [ ] Crash reporting, analytics de produto sem dados pessoais e logs mínimos.
- [ ] TestFlight, Internal Testing Play Store, Privacy Manifest e Data Safety.
- [ ] Publicação faseada e atualizações OTA apenas para JS/assets compatíveis.

## Mapas e localização

- Usar `expo-location` apenas após ação explícita do utilizador.
- Pedir permissões separadamente no contexto em que são necessárias.
- Guardar a posição apenas em memória, salvo consentimento explícito.
- Usar coordenadas próprias dos parceiros para pins; não geocodificar a cada
  visita.
- Usar Routes API apenas para pedidos iniciados pelo utilizador ou para cache
  controlado; nunca calcular distância de estrada em cada renderização.
- Configurar chaves separadas e restritas por package/bundle ID:
  `GOOGLE_MAPS_ANDROID_KEY` e `GOOGLE_MAPS_IOS_KEY`.

## Segurança

- Nunca incluir service role key, secrets Google server-side ou tokens em bundle.
- Guardar refresh token em SecureStore, nunca em AsyncStorage.
- Manter autorização no backend e RLS; o mobile não decide se pode resgatar.
- Validar payloads com Zod no cliente e DTOs/guards no backend.
- Redação de dados pessoais em logs; não enviar localização sem necessidade.
- Usar deep links universais/app links com domínios controlados.
- Ativar proteção de screenshots apenas em ecrãs com código, se necessário.

## Variáveis de ambiente

Exemplo (sem valores reais):

```env
EXPO_PUBLIC_API_URL=https://clube-ribatejo-api.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_MAPS_ANDROID_KEY=...
GOOGLE_MAPS_IOS_KEY=...
```

As chaves públicas devem ser restringidas no Google Cloud. Secrets usados em
sincronizações Places ou tarefas administrativas ficam exclusivamente na API/
EAS secrets, nunca em `EXPO_PUBLIC_*`.

## Critérios de aceitação do MVP mobile

- Um utilizador instala a app, cria conta, confirma email e entra na área certa.
- Um membro encontra um parceiro, vê mapa/preço/benefício e abre navegação.
- O resgate é único, seguro e confirmável pelo parceiro.
- A poupança e o ponto de equilíbrio são atualizados após a visita.
- Um parceiro valida um código em menos de três interações.
- A app funciona com loading/erro/offline e não expõe secrets.

## Ordem recomendada imediata

1. Criar `apps/mobile` e configurar EAS/dev builds.
2. Extrair contratos API para `packages/contracts`.
3. Implementar sessão Supabase + shell de navegação.
4. Migrar Explorar/Conta e validar mapas em dispositivos reais.
5. Migrar resgate do membro e, por fim, o fluxo do parceiro.
6. Fechar testes, privacidade e publicação nas lojas.
