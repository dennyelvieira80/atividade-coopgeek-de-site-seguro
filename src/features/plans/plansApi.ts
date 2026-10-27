import { supabase } from '../../lib/supabase';
import {
  StudyPlanRowSchema,
  type GeneratedPlan,
  type StudyPlanInput,
  type StudyPlanRow,
} from '../../lib/validation';

const COLUMNS = 'id, title, subject, goal, deadline, hours_per_week, plan_json, created_at';

export class PlansApiError extends Error {}

function parseRows(rows: unknown[]): StudyPlanRow[] {
  // Linhas que não passam na validação são descartadas em vez de renderizadas.
  return rows.flatMap((row) => {
    const parsed = StudyPlanRowSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
}

/** O RLS garante que apenas os planos do usuário autenticado sejam retornados. */
export async function listPlans(): Promise<StudyPlanRow[]> {
  const { data, error } = await supabase
    .from('study_plans')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new PlansApiError('Não foi possível carregar seus planos.');
  return parseRows(data ?? []);
}

/** `user_id` NÃO é enviado: o banco usa `default auth.uid()` e o RLS valida. */
export async function savePlan(input: StudyPlanInput, plan: GeneratedPlan): Promise<StudyPlanRow> {
  const { data, error } = await supabase
    .from('study_plans')
    .insert({
      title: plan.title,
      subject: input.subject,
      goal: input.goal,
      deadline: input.deadline,
      hours_per_week: input.hoursPerWeek,
      plan_json: plan,
    })
    .select(COLUMNS)
    .single();

  if (error || !data) throw new PlansApiError('Não foi possível salvar o plano.');
  const [row] = parseRows([data]);
  if (!row) throw new PlansApiError('Plano salvo em formato inesperado.');
  return row;
}

export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('study_plans').delete().eq('id', id);
  if (error) throw new PlansApiError('Não foi possível excluir o plano.');
}
