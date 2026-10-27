-- =============================================================================
-- Testes pgTAP de isolamento (RLS) e quota — execute com: supabase test db
-- Cenários: Usuário A, Usuário B e anônimo.
-- =============================================================================
begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- ---------------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------------
select ok(
  (select relrowsecurity from pg_class where oid = 'public.study_plans'::regclass),
  'RLS habilitado em study_plans'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.ai_usage'::regclass),
  'RLS habilitado em ai_usage'
);
select ok(
  not has_table_privilege('anon', 'public.study_plans', 'SELECT'),
  'anon sem privilégio SELECT em study_plans'
);
select ok(
  not has_table_privilege('authenticated', 'public.ai_usage', 'SELECT'),
  'authenticated sem acesso direto a ai_usage'
);
select ok(
  not has_function_privilege('anon', 'public.consume_ai_quota()', 'EXECUTE'),
  'anon não pode executar consume_ai_quota'
);

-- ---------------------------------------------------------------------------
-- Usuários de teste
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role)
values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', 'authenticated', 'authenticated');

-- ---------------------------------------------------------------------------
-- Usuário A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ insert into public.study_plans (title, subject, goal, deadline, hours_per_week, plan_json)
     values ('Plano A', 'Matemática', 'Passar em cálculo', current_date + 30, 6, '{"title":"Plano A"}') $$,
  'A cria o próprio plano (user_id = auth.uid() por padrão)'
);

select is(
  (select user_id from public.study_plans where title = 'Plano A'),
  '11111111-1111-1111-1111-111111111111'::uuid,
  'user_id preenchido automaticamente com o id de A'
);

select is((select count(*)::int from public.study_plans), 1, 'A vê apenas o próprio plano');

select throws_ok(
  $$ insert into public.study_plans (user_id, title, subject, goal, deadline, hours_per_week, plan_json)
     values ('22222222-2222-2222-2222-222222222222', 'Forjado', 'Física', 'Plano em nome de B', current_date, 2, '{}') $$,
  '42501',
  null,
  'A NÃO consegue inserir plano em nome de B'
);

select throws_ok(
  $$ insert into public.study_plans (title, subject, goal, deadline, hours_per_week, plan_json)
     values ('Plano X', 'Matemática', 'Objetivo válido', current_date, 999, '{}') $$,
  '23514',
  null,
  'CHECK constraint rejeita hours_per_week fora do intervalo'
);

-- Quota: 5 por hora
select is(public.consume_ai_quota(), true, 'quota 1/5');
select is(public.consume_ai_quota(), true, 'quota 2/5');
select is(public.consume_ai_quota(), true, 'quota 3/5');
select is(public.consume_ai_quota(), true, 'quota 4/5');
select is(public.consume_ai_quota(), true, 'quota 5/5');
select is(public.consume_ai_quota(), false, '6ª geração na mesma hora é bloqueada');

-- ---------------------------------------------------------------------------
-- Usuário B
-- ---------------------------------------------------------------------------
set local request.jwt.claims to '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is((select count(*)::int from public.study_plans), 0, 'B NÃO vê o plano de A');

select is_empty(
  $$ update public.study_plans set title = 'Hackeado' returning id $$,
  'B NÃO consegue alterar o plano de A'
);

select is_empty(
  $$ delete from public.study_plans returning id $$,
  'B NÃO consegue excluir o plano de A'
);

select is(public.consume_ai_quota(), true, 'quota de B é independente da de A');

-- ---------------------------------------------------------------------------
-- Anônimo
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims to '{"role":"anon"}';

select throws_ok(
  $$ select * from public.study_plans $$,
  '42501',
  null,
  'anon NÃO consegue ler study_plans'
);

-- ---------------------------------------------------------------------------
-- Volta para A: dados intactos
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select title from public.study_plans limit 1),
  'Plano A',
  'Plano de A permanece intacto após tentativas de B'
);

select * from finish();
rollback;
