# Testes SQL — Selos Daqui

Teste funcional de ponta a ponta do programa de fidelização (triggers + RPC),
executável contra um Postgres descartável em Docker, sem depender do Supabase.

## Como correr

```bash
# a partir da raiz do repositório
SP=$(mktemp -d)

# 1. Bundle: stubs do Supabase (auth.uid, roles, pgcrypto) + todas as migrations
cp supabase/tests/00_bootstrap.sql "$SP/bundle.sql"
for f in $(ls supabase/migrations/*.sql | sort); do cat "$f" >> "$SP/bundle.sql"; done

# 2. Postgres descartável
docker run -d --name pgtest -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=app postgres:16
until docker exec pgtest pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done

# 3. Aplicar schema e correr os testes
docker cp "$SP/bundle.sql" pgtest:/bundle.sql
docker cp supabase/tests/loyalty_flow_test.sql pgtest:/test.sql
docker exec pgtest psql -U postgres -d app -v ON_ERROR_STOP=1 -q -f /bundle.sql
docker exec pgtest psql -U postgres -d app -q -f /test.sql

docker rm -f pgtest
```

Sucesso = `TODOS OS TESTES PASSARAM`. Qualquer `FAIL`/`ERROR` aborta.

## Cenários cobertos (13)

| # | Cenário |
|---|---------|
| t1 | Visita validada gera exatamente 1 selo |
| t2 | 3 selos desbloqueiam a recompensa de 3 |
| t3 | 5 selos desbloqueiam a de 5; recompensa não duplica; selos não são consumidos |
| t4 | Recompensa reservada + validada → `redeemed` (selos intactos) |
| t5 | Benefício principal resgatado → 1 visita + 1 selo, idempotente |
| t6 | Segundo selo no mesmo dia respeita `max_stamps_per_day` |
| t7 | `minimum_spend`: conta abaixo não gera selo, acima gera |
| t8 | `get_member_loyalty_overview` devolve os programas com progresso |
| t9a | Parceiro não pode validar visita de outro negócio |
| t9b | QR/código expirado é rejeitado |
| t9 | Membership inativa bloqueia novas visitas |
| t10 | Selos, visitas e recompensas persistem após a membership expirar |

> `00_bootstrap.sql` existe apenas para os testes locais — recria os stubs que o
> Supabase fornece em produção (`auth`, `auth.uid()`, roles, `pgcrypto`).