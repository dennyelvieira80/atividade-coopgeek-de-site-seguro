# Privacidade — StudyFlow AI

Documento de transparência (base para uma política de privacidade alinhada à LGPD).

## Dados coletados

| Dado | Finalidade | Onde fica | Retenção |
| --- | --- | --- | --- |
| E-mail e hash de senha | Autenticação | Supabase Auth | Até exclusão da conta |
| Matéria, objetivo, prazo, horas/semana | Gerar e salvar cronogramas | `study_plans` | Até o usuário excluir |
| Cronograma gerado | Exibição ao usuário | `study_plans.plan_json` | Até o usuário excluir |
| Registro de uso da IA (id do usuário + horário) | Limite de uso / prevenção de abuso | `ai_usage` | Recomenda-se expurgo após 30 dias |

## Compartilhamento com terceiros

- **Google (Gemini API)**: recebe **apenas** matéria, objetivo, número de semanas e horas por semana. Nunca recebe e-mail, id do usuário ou tokens. Consulte os termos da Gemini API sobre uso de dados (no plano gratuito os dados podem ser usados para melhoria dos modelos).
- **Supabase**: operador de infraestrutura (autenticação e banco).
- **GitHub Pages**: hospeda os arquivos estáticos; pode registrar IP de acesso.

## Orientações ao usuário

- Não insira dados pessoais sensíveis (saúde, documentos, senhas) nos campos de estudo.
- A exclusão de um cronograma o remove permanentemente.
- Exclusão da conta remove todos os dados em cascata (`on delete cascade`).

## Pendências

- [ ] Rotina de expurgo de `ai_usage` (ex.: `pg_cron` diário removendo registros > 30 dias)
- [ ] Funcionalidade de autoexclusão de conta na interface
- [ ] Página pública de política de privacidade
