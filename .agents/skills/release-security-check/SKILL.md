---
name: release-security-check
description: Executa a lista de verificação pré-deploy para GitHub Pages e Supabase Edge Functions.
---
# Release Security Check

## Checklist de Verificação
1. Execute `npm ci && npm run lint && npm run typecheck && npm test && npm run build`.
2. Execute `npm run check:secrets` para garantir que nenhuma chave privada foi incluída no JavaScript compilado em `dist/`.
3. Execute `npm audit --audit-level=high` e verifique se não há vulnerabilidades críticas ou altas.
4. Execute `supabase test db` (testes pgTAP de RLS e quota).
5. Confirme que os workflows em `.github/workflows/` utilizam `permissions: contents: read` por padrão e privilégio mínimo para o deploy no GitHub Pages.
6. Confirme que o secret `ALLOWED_ORIGINS` da Edge Function contém apenas `https://<usuario>.github.io` (e localhost só em ambiente de desenvolvimento).
7. Confirme no Supabase Auth: Site URL e Redirect URLs restritas ao domínio oficial; confirmação de e-mail ativa.
8. Confirme que "Enforce HTTPS" está ativo no GitHub Pages.
9. Percorra `docs/SECURITY_CHECKLIST.md` e marque cada item com evidência.
