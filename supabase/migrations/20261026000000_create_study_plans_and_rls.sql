-- =============================================================================
-- StudyFlow AI — tabelas, RLS e quota de uso da IA
-- Auditar com a skill `supabase-rls-audit`; testes em supabase/tests/rls.test.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. study_plans: cronogramas do usuário
-- -----------------------------------------------------------------------------
create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  subject text not null check (char_length(subject) between 3 and 120),
  goal text not null check (char_length(goal) between 5 and 500),
  deadline date not null,
  hours_per_week integer not null check (hours_per_week between 1 and 80),
  plan_json jsonb not null check (
    jsonb_typeof(plan_json) = 'object' and pg_column_size(plan_json) <= 32768
  ),
  created_at timestamptz not null default now()
);

comment on table public.study_plans is 'Cronogramas de estudo; isolados por usuário via RLS.';

create index idx_study_plans_user_id on public.study_plans (user_id, created_at desc);

alter table public.study_plans enable row level security;

-- Privilégio mínimo: anon não acessa; authenticated só DML básico (sem TRUNCATE etc.).
revoke all on public.study_plans from anon, authenticated;
grant select, insert, update, delete on public.study_plans to authenticated;

create policy "Users can view own study plans"
  on public.study_plans for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own study plans"
  on public.study_plans for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own study plans"
  on public.study_plans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own study plans"
  on public.study_plans for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Limite de registros por usuário (evita abuso de armazenamento).
create function public.enforce_study_plans_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.study_plans where user_id = new.user_id) >= 100 then
    raise exception 'Limite de 100 cronogramas por usuário atingido.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_study_plans_limit() from public, anon, authenticated;

create trigger study_plans_limit
  before insert on public.study_plans
  for each row execute function public.enforce_study_plans_limit();

-- -----------------------------------------------------------------------------
-- 2. ai_usage: registro interno para rate limiting (LLM10 Unbounded Consumption)
--    Nenhuma política => nenhum acesso direto via API. Só a função abaixo grava.
-- -----------------------------------------------------------------------------
create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_ai_usage_user_created on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Consome 1 unidade da quota do usuário autenticado.
-- Limites: 5 gerações por hora e 20 por dia. Retorna false se excedido.
create function public.consume_ai_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_last_hour integer;
  v_last_day integer;
begin
  if v_uid is null then
    raise exception 'Não autenticado.' using errcode = '42501';
  end if;

  -- Serializa chamadas concorrentes do mesmo usuário (evita corrida na contagem).
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  select
    count(*) filter (where created_at > now() - interval '1 hour'),
    count(*)
  into v_last_hour, v_last_day
  from public.ai_usage
  where user_id = v_uid
    and created_at > now() - interval '1 day';

  if v_last_hour >= 5 or v_last_day >= 20 then
    return false;
  end if;

  insert into public.ai_usage (user_id) values (v_uid);
  return true;
end;
$$;

revoke execute on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
