# Modelo de Ameaças — StudyFlow AI

Metodologia: STRIDE + OWASP Top 10 (2025) + OWASP LLM Top 10 (2026). Atualize este documento com a skill `threat-model` a cada nova funcionalidade.

## Ativos

| Ativo | Onde vive | Sensibilidade |
| --- | --- | --- |
| `GEMINI_API_KEY` | Supabase Secrets | Crítica (custo / abuso) |
| Chave `service_role` / `sb_secret_*` | Painel Supabase (não usada pelo app) | Crítica |
| JWT de sessão | `localStorage` do navegador | Alta |
| Cronogramas do usuário | `public.study_plans` | Média |
| E-mail do usuário | `auth.users` | Média (dado pessoal — LGPD) |
| Cota da API Gemini | Conta Google AI Studio | Alta (financeira) |

## Fronteiras de confiança

1. Navegador ↔ GitHub Pages (conteúdo estático público)
2. Navegador ↔ Supabase Auth / PostgREST (JWT + RLS)
3. Navegador ↔ Edge Function (JWT + CORS)
4. Edge Function ↔ Gemini API (chave secreta; saída não confiável)

## Ameaças, controles e evidências

| ID | Ameaça | Categoria | Controle | Evidência |
| --- | --- | --- | --- | --- |
| T1 | Chave do Gemini ou `service_role` exposta no JS | Info Disclosure / LLM02 | Chave só em Supabase Secrets; regra 1; nenhum `VITE_` secreto | `src/test/forbidden-patterns.test.ts`, `npm run check:secrets` (CI) |
| T2 | IDOR: usuário lê/altera planos de outro | Broken Access Control (A01) | RLS com `auth.uid() = user_id` em todas as operações | `supabase/tests/rls.test.sql` (A×B) |
| T3 | Inserção de plano em nome de outro usuário | Spoofing / Mass assignment | `WITH CHECK`, `default auth.uid()`, Zod `.strict()` | `rls.test.sql` ("A NÃO consegue inserir…"), `validation.test.ts` |
| T4 | Acesso anônimo aos dados | A01 | `revoke all … from anon` | `rls.test.sql` (anon 42501) |
| T5 | XSS via saída da IA ou dados do banco | Injection (A05) / LLM05 | Render só como texto JSX; ESLint proíbe `dangerouslySetInnerHTML`/`innerHTML`; CSP sem `unsafe-inline` | `PlanView.test.tsx`, `forbidden-patterns.test.ts`, `tests/e2e/smoke.spec.ts` (CSP) |
| T6 | Prompt injection (usuário tenta mudar o comportamento) | LLM01 | `systemInstruction` separada; dados delimitados em JSON; saída presa a `responseSchema` + Zod strict; IA sem ferramentas | Revisão de código + Zod strict na Edge Function |
| T7 | Saída malformada/excessiva da IA | LLM05 Improper Output Handling | Zod com limites de tamanho e `.strict()` na função e no cliente | `validation.test.ts` (GeneratedPlanSchema) |
| T8 | Abuso de custo (chamadas em massa à IA) | LLM10 Unbounded Consumption | `consume_ai_quota()` 5/h e 20/dia com advisory lock; `maxOutputTokens`; timeout 30 s; corpo ≤ 4 KB | `rls.test.sql` (6ª chamada = false) |
| T9 | IA executa ações indevidas | LLM06 Excessive Agency | IA só gera JSON; sem function calling; sem acesso ao banco | Revisão de código |
| T10 | Chamada da Edge Function a partir de outro site | CSRF / CORS | Allowlist `ALLOWED_ORIGINS`; JWT obrigatório (`verify_jwt = true`) | Revisão + teste manual (ver checklist) |
| T11 | Enumeração de usuários no login | Info Disclosure | Mensagens genéricas de erro | `AuthForm.tsx` |
| T12 | Open redirect após confirmação de e-mail | A01 | `emailRedirectTo` fixo; Redirect URLs restritas no painel | Checklist de release |
| T13 | Dependência vulnerável | A06 Supply chain | `npm audit` no CI, Dependabot, CodeQL, lockfile | `ci.yml`, `codeql.yml`, `dependabot.yml` |
| T14 | Abuso de armazenamento | DoS | CHECK de tamanho (`plan_json` ≤ 32 KB), máx. 100 planos/usuário, `max_rows` | Migration (trigger + CHECK) |
| T15 | Vazamento em logs | Info Disclosure | Logs só com códigos de erro, sem conteúdo do usuário/chaves | Revisão de `index.ts` |
| T16 | Workflow comprometido publica código malicioso | Tampering | `permissions: contents: read`; deploy com `pages: write` só no job de deploy; `persist-credentials: false` | `deploy.yml` |

## Riscos residuais e limitações do GitHub Pages

- **Sem cabeçalhos HTTP customizados**: não há `Content-Security-Policy` via header, `frame-ancestors`, `X-Frame-Options`, `HSTS` customizado ou `Permissions-Policy`. A CSP via `<meta>` não suporta `frame-ancestors` → **clickjacking** permanece possível (impacto baixo: ações destrutivas pedem confirmação). Mitigação futura: Cloudflare/Netlify na frente.
- **JWT em `localStorage`**: um XSS bem-sucedido roubaria a sessão. Mitigado por CSP estrita + render como texto, mas não eliminado.
- **Chave anon pública**: qualquer pessoa pode chamar a API do Supabase diretamente; a proteção depende 100% do RLS e da quota.
- **Prompt injection não é 100% evitável**: o impacto é limitado porque a IA não tem agência e a saída é validada, mas o conteúdo do plano pode ser de baixa qualidade ou impróprio.
- **Rate limit por usuário, não por IP**: um atacante pode criar várias contas. Mitigar com confirmação de e-mail, CAPTCHA do Supabase Auth (hCaptcha/Turnstile) e alerta de orçamento no Google Cloud.
- **Domínio compartilhado `*.github.io`**: outros sites no mesmo domínio-pai não compartilham origem, mas cookies de domínio não devem ser usados.
- **Revisão por IA não é prova**: a segurança só é considerada verificada quando os testes listados acima passam no CI.
