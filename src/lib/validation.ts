import { z } from 'zod';

/**
 * Esquemas compartilhados de validação.
 * IMPORTANTE: mantenha em sincronia com supabase/functions/generate-study-plan/index.ts
 */

export const LIMITS = {
  subject: { min: 3, max: 120 },
  goal: { min: 5, max: 500 },
  hoursPerWeek: { min: 1, max: 80 },
  maxDeadlineDays: 730,
  maxWeeks: 26,
  maxTasksPerWeek: 10,
} as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

function utcMidnight(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Dias entre hoje (UTC) e a data informada, ou `null` se a data for inválida. */
export function daysUntil(isoDate: string, now: Date = new Date()): number | null {
  if (!DATE_RE.test(isoDate)) return null;
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  // Rejeita datas "roladas" como 2026-02-30.
  if (parsed.toISOString().slice(0, 10) !== isoDate) return null;
  return Math.round((parsed.getTime() - utcMidnight(now)) / MS_PER_DAY);
}

export function isDeadlineInRange(isoDate: string, now: Date = new Date()): boolean {
  const days = daysUntil(isoDate, now);
  return days !== null && days >= 0 && days <= LIMITS.maxDeadlineDays;
}

/** Número de semanas que o plano deve cobrir (1..26). */
export function weeksAvailable(isoDate: string, now: Date = new Date()): number {
  const days = daysUntil(isoDate, now) ?? 0;
  return Math.min(LIMITS.maxWeeks, Math.max(1, Math.ceil(days / 7)));
}

// ---------------------------------------------------------------------------
// Entrada do usuário
// ---------------------------------------------------------------------------

export const StudyPlanInputSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(LIMITS.subject.min, `A matéria deve ter pelo menos ${LIMITS.subject.min} caracteres.`)
      .max(LIMITS.subject.max, `A matéria deve ter no máximo ${LIMITS.subject.max} caracteres.`),
    goal: z
      .string()
      .trim()
      .min(LIMITS.goal.min, `O objetivo deve ter pelo menos ${LIMITS.goal.min} caracteres.`)
      .max(LIMITS.goal.max, `O objetivo deve ter no máximo ${LIMITS.goal.max} caracteres.`),
    deadline: z
      .string()
      .regex(DATE_RE, 'Data inválida (use AAAA-MM-DD).')
      .refine((value) => isDeadlineInRange(value), 'O prazo deve estar entre hoje e 2 anos.'),
    hoursPerWeek: z
      .number({ error: 'Informe um número de horas.' })
      .int('Use um número inteiro de horas.')
      .min(LIMITS.hoursPerWeek.min, `Mínimo de ${LIMITS.hoursPerWeek.min} hora por semana.`)
      .max(LIMITS.hoursPerWeek.max, `Máximo de ${LIMITS.hoursPerWeek.max} horas por semana.`),
  })
  .strict();

export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;

// ---------------------------------------------------------------------------
// Saída da IA (LLM10: Improper Output Handling) — nunca confie no modelo.
// ---------------------------------------------------------------------------

const StudyTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    durationHours: z.number().min(0.25).max(40),
  })
  .strict();

const StudyWeekSchema = z
  .object({
    week: z.number().int().min(1).max(LIMITS.maxWeeks),
    focus: z.string().trim().min(1).max(200),
    tasks: z.array(StudyTaskSchema).min(1).max(LIMITS.maxTasksPerWeek),
  })
  .strict();

export const GeneratedPlanSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    summary: z.string().trim().min(1).max(600),
    weeks: z.array(StudyWeekSchema).min(1).max(LIMITS.maxWeeks),
  })
  .strict();

export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

// ---------------------------------------------------------------------------
// Linha do banco (study_plans) — validada também na leitura.
// ---------------------------------------------------------------------------

export const StudyPlanRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  subject: z.string(),
  goal: z.string(),
  deadline: z.string(),
  hours_per_week: z.number().int(),
  plan_json: GeneratedPlanSchema,
  created_at: z.string(),
});

export type StudyPlanRow = z.infer<typeof StudyPlanRowSchema>;

/** Converte erros do Zod em mensagens por campo para o formulário. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
