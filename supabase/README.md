# Supabase

As migrations SQL versionadas ficam em `supabase/migrations`.

Convenção de nome: `YYYYMMDDHHMMSS_descricao.sql`.

A primeira migration contém o schema aprovado, políticas RLS e funções transacionais do fluxo de utilização.

Antes de aplicar em produção, execute-a num projeto de desenvolvimento ou numa branch Supabase e valide as políticas com utilizadores `MEMBER`, `PARTNER` e `ADMIN`.
