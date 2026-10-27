import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { GeneratedPlanSchema, StudyPlanInputSchema, type GeneratedPlan, type StudyPlanInput } from '../../lib/validation';

export class GeneratePlanError extends Error {}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Revise o formulário.',
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Origem não autorizada.',
  429: 'Limite de gerações atingido. Tente novamente mais tarde.',
  502: 'A IA retornou uma resposta inválida. Tente novamente.',
};

/**
 * Chama a Edge Function `generate-study-plan`. O JWT da sessão é enviado
 * automaticamente pelo supabase-js; a chave do Gemini nunca passa pelo navegador.
 */
export async function generateStudyPlan(input: StudyPlanInput): Promise<GeneratedPlan> {
  const body = StudyPlanInputSchema.parse(input);

  const { data, error } = await supabase.functions.invoke('generate-study-plan', { body });

  if (error) {
    const status = error instanceof FunctionsHttpError ? (error.context as Response).status : 0;
    throw new GeneratePlanError(STATUS_MESSAGES[status] ?? 'Não foi possível gerar o plano agora.');
  }

  // Validação dupla: o frontend também não confia na resposta.
  const parsed = GeneratedPlanSchema.safeParse((data as { plan?: unknown } | null)?.plan);
  if (!parsed.success) {
    throw new GeneratePlanError(STATUS_MESSAGES[502] ?? 'Resposta inválida.');
  }
  return parsed.data;
}
