---
name: secure-code-review
description: Revisa alterações de código em busca de falhas de segurança, exposição de segredos, brechas de autorização e tratamento inseguro de saídas.
---
# Secure Code Review

## Procedimento
1. Inspecione fronteiras de confiança e verifique autenticação e autorização no backend (Edge Functions e RLS).
2. Procure chaves de API, tokens, senhas ou segredos hardcoded no código ou nos arquivos de configuração.
3. Verifique se o acesso ao banco de dados respeita as políticas de RLS sem usar a chave `service_role` indevidamente.
4. Confira a validação de entrada (tamanho máximo, tipos) e a sanitização/validação da saída da IA.
5. Verifique riscos de XSS, redirecionamento aberto (Open Redirect) e exposição de dados sensíveis em logs.
6. Exija testes positivos (acesso permitido) e negativos (acesso negado para outro usuário ou anônimo).

## Formato de Saída
Classifique cada achado como Critical, High, Medium ou Low indicando: arquivo afetado, evidência, impacto, correção recomendada e teste de verificação.
