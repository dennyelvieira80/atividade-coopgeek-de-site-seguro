# AGENTS.md — StudyFlow AI

Instruções persistentes para qualquer agente de IA (Antigravity, Gemini, Claude etc.) que trabalhe neste repositório.

## Contexto do projeto

- **Produto**: StudyFlow AI — gerador de cronogramas de estudo com IA.
- **Stack**: React + TypeScript + Vite (frontend estático no GitHub Pages), Supabase Auth, PostgreSQL com RLS, Supabase Edge Functions (Deno) e Gemini API.
- **Objetivo pedagógico**: projeto simples, documentado, testável e seguro por padrão.

## Fronteiras de confiança

```
Navegador (público) -> GitHub Pages (estático) -> Supabase Auth / PostgREST (RLS) -> Edge Function (JWT + Zod + quota) -> Gemini API (segredo no servidor)
```

Tudo o que está em `src/`, `public/` ou em variáveis `VITE_*` é **público**.

## Regras obrigatórias

1. Leia e cumpra `.agents/rules/security.md` em toda tarefa.
2. Antes de implementar uma funcionalidade nova, use a skill `threat-model` e atualize `docs/THREAT_MODEL.md`.
3. Antes de concluir qualquer alteração de código, use a skill `secure-code-review`.
4. Toda alteração em `supabase/migrations/` exige a skill `supabase-rls-audit` e testes em `supabase/tests/`.
5. Antes de publicar, use a skill `release-security-check`.
6. Não instale dependências novas sem justificar (necessidade, manutenção, licença, `npm audit`).
7. Não execute comandos destrutivos (`rm -rf`, `git push --force`, `supabase db reset` em produção) sem aprovação explícita.
8. Não leia nem escreva arquivos fora deste diretório.
9. Nunca declare algo "seguro" sem evidência: cite o teste ou a verificação automatizada que comprova.

## Comandos de verificação

```bash
npm run lint
npm run typecheck
npm test
npm run build && npm run check:secrets
npm run test:e2e
supabase test db
```

## Convenções

- Código em inglês; textos de interface e documentação em português.
- Validação com Zod nas duas pontas (`src/lib/validation.ts` e `supabase/functions/generate-study-plan/index.ts`) — mantenha os esquemas sincronizados.
- Conteúdo vindo da IA ou do banco é renderizado somente como texto JSX.
