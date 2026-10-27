# Security Rules — StudyFlow AI

1. **Zero Segredos no Frontend**: Nunca adicione `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, chaves `sb_secret_*` ou credenciais privadas em arquivos dentro de `src/`, `public/` ou com prefixo `VITE_`. Só `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (chave pública/publishable) são permitidas.
2. **RLS Obrigatório**: Toda tabela criada no schema `public` do Supabase deve ter `ENABLE ROW LEVEL SECURITY` e políticas explícitas para `SELECT`, `INSERT`, `UPDATE` e `DELETE` vinculadas a `auth.uid()` (ou nenhuma política + `REVOKE` quando a tabela for de uso interno).
3. **Validação Dupla**: Valide todas as entradas do usuário e todas as respostas JSON do Gemini usando esquemas estritos (Zod) tanto na Edge Function quanto no frontend.
4. **Renderização Segura**: Nunca utilize `dangerouslySetInnerHTML`, `eval()`, `new Function()` ou `innerHTML` para exibir ou processar conteúdos vindos do modelo de IA ou do banco de dados.
5. **Verificação Baseada em Evidências**: Nunca afirme que uma funcionalidade está segura sem criar e executar o teste correspondente (Vitest, Playwright ou pgTAP no `supabase test db`).
6. **Privilégio Mínimo**: A Edge Function usa o JWT do próprio usuário (respeitando RLS). Não use a `service_role` sem justificativa documentada no threat model.
7. **IA sem Agência**: O modelo apenas gera JSON. Ele nunca executa SQL, chama ferramentas ou decide autorização.
8. **Logs sem Dados Sensíveis**: Não registre tokens, chaves, e-mails ou o conteúdo digitado pelo usuário em logs.
