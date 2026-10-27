# StudyFlow AI

Gerador de cronogramas de estudo com IA, construído com **React + TypeScript + Vite**, **Supabase** (Auth, PostgreSQL com RLS, Edge Functions) e **Gemini API**, publicado no **GitHub Pages** — com segurança por padrão e verificação baseada em testes.

> Planejamento e decisões: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Ameaças: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) · Checklist: [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) · Privacidade: [docs/PRIVACY.md](docs/PRIVACY.md)

## Funcionalidades

- Cadastro/login por e-mail e senha (Supabase Auth, PKCE).
- Formulário tipado (matéria, objetivo, prazo, horas/semana) validado com Zod.
- Geração do cronograma pela Edge Function com Gemini (JSON estruturado, validado no servidor e no cliente).
- Área pessoal: salvar, listar e excluir cronogramas — isolamento garantido por RLS.
- Limite de 5 gerações/hora e 20/dia por usuário.

## Estrutura

```text
.agents/            Regras e skills do Antigravity (security, threat-model, ...)
.github/workflows/  CI (lint, tipos, testes, e2e, pgTAP, Deno), deploy Pages, CodeQL
docs/               Arquitetura, modelo de ameaças, checklist, privacidade
scripts/            check-bundle-secrets.mjs (varre dist/ por segredos)
src/                Frontend React (app, components, features, lib, test)
supabase/           config, migrations (RLS + quota), functions (Gemini), tests (pgTAP)
tests/e2e/          Playwright (fumaça + CSP)
```

## Pré-requisitos

- Node.js 20+ (testado com 22)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e Docker (para banco local e `supabase test db`)
- Conta no [Google AI Studio](https://aistudio.google.com/) para a chave Gemini

## Rodando localmente

```bash
npm install
cp .env.example .env.local        # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev                       # http://localhost:5173
```

Backend local (opcional):

```bash
supabase start                    # sobe Postgres/Auth locais e aplica as migrations
supabase test db                  # testes de RLS
cp supabase/functions/.env.example supabase/functions/.env   # preencha GEMINI_API_KEY
supabase functions serve generate-study-plan --env-file supabase/functions/.env
```

## Verificação

```bash
npm run verify     # lint + typecheck + testes + build + varredura de segredos
npm run test:e2e   # requer: npx playwright install chromium
```

## Publicação

1. **Supabase (produção)**
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   supabase secrets set GEMINI_API_KEY=<chave> ALLOWED_ORIGINS=https://<usuario>.github.io
   supabase functions deploy generate-study-plan
   ```
   No painel: Auth → URL Configuration → Site URL e Redirect URLs = `https://<usuario>.github.io/<repo>/`.
2. **GitHub**
   - Settings → Pages → Source: **GitHub Actions**; marque **Enforce HTTPS**.
   - Settings → Secrets and variables → Actions → **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (valores públicos).
   - Ative Secret Scanning, Push Protection e Dependabot.
3. Faça push na `main` — o workflow `deploy.yml` publica o site.
4. Percorra o [checklist de segurança](docs/SECURITY_CHECKLIST.md).

## Segurança

- A chave do Gemini **nunca** chega ao navegador; a `service_role` não é usada pela aplicação.
- Todo acesso a dados passa por RLS (`auth.uid() = user_id`), comprovado por testes pgTAP.
- Conteúdo da IA é validado (Zod strict) e renderizado apenas como texto; CSP sem `unsafe-inline`.
- Limitações conhecidas do GitHub Pages estão em [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md#riscos-residuais-e-limitações-do-github-pages).

## Trabalhando com agentes de IA

Leia [AGENTS.md](AGENTS.md). As regras permanentes estão em `.agents/rules/security.md` e as skills em `.agents/skills/`.
