---
name: supabase-rls-audit
description: Audita migrations SQL, permissões e políticas de Row Level Security (RLS) no Supabase PostgreSQL.
---
# Supabase RLS Audit

## Procedimento
1. Verifique se `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;` está presente em todas as tabelas expostas.
2. Confirme que o papel `anon` não possui permissões de leitura ou escrita em tabelas privadas.
3. Verifique se as políticas de `SELECT`, `INSERT` (`WITH CHECK`), `UPDATE` (`USING` e `WITH CHECK`) e `DELETE` exigem `(select auth.uid()) = user_id`.
4. Verifique se existe índice em `user_id` para evitar degradação de desempenho nas consultas com RLS.
5. Funções `SECURITY DEFINER` devem ter `SET search_path = ''`, usar `auth.uid()` internamente e ter `EXECUTE` revogado de `public`/`anon`.
6. Confirme a existência de testes SQL em `supabase/tests/rls.test.sql` validando isolamento entre Usuário A, Usuário B e usuário anônimo, e rode `supabase test db`.
