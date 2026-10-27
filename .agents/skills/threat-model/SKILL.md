---
name: threat-model
description: Analisa fluxos de dados, fronteiras de confiança e superfícies de ataque antes de implementar novas funcionalidades.
---
# Threat Modeling Procedure

## Passos Obrigatórios
1. Identifique os ativos envolvidos (dados do usuário, tokens de sessão, cota da API Gemini).
2. Mapeie as fronteiras de confiança (Navegador -> GitHub Pages -> Supabase Auth/DB -> Edge Function -> Gemini API).
3. Avalie ameaças segundo STRIDE, o OWASP Top 10 e o OWASP LLM Top 10 2026 (Prompt Injection, IDOR/Broken Access Control, XSS, Unbounded Consumption, Improper Output Handling).
4. Defina controles técnicos concretos e o teste automatizado que comprovará cada mitigação em `docs/THREAT_MODEL.md`.
5. Registre riscos residuais aceitos e o motivo.

## Formato de Saída
Tabela com: ID, ameaça, ativo, fronteira, controle, evidência (teste/arquivo), status.
