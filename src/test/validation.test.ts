import { describe, expect, it } from 'vitest';
import {
  GeneratedPlanSchema,
  StudyPlanInputSchema,
  daysUntil,
  isDeadlineInRange,
  weeksAvailable,
} from '../lib/validation';

const NOW = new Date('2026-10-26T12:00:00Z');

function isoInDays(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const validInput = {
  subject: 'Matemática',
  goal: 'Passar na prova de cálculo I',
  deadline: isoInDays(30),
  hoursPerWeek: 6,
};

const validPlan = {
  title: 'Plano de Cálculo',
  summary: 'Revisão de limites e derivadas.',
  weeks: [{ week: 1, focus: 'Limites', tasks: [{ title: 'Lista 1', durationHours: 2 }] }],
};

describe('StudyPlanInputSchema', () => {
  it('aceita uma entrada válida', () => {
    expect(StudyPlanInputSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejeita matéria curta demais e longa demais', () => {
    expect(StudyPlanInputSchema.safeParse({ ...validInput, subject: 'ab' }).success).toBe(false);
    expect(StudyPlanInputSchema.safeParse({ ...validInput, subject: 'x'.repeat(121) }).success).toBe(false);
  });

  it('rejeita objetivo acima de 500 caracteres', () => {
    expect(StudyPlanInputSchema.safeParse({ ...validInput, goal: 'x'.repeat(501) }).success).toBe(false);
  });

  it('rejeita horas fora do intervalo ou não inteiras', () => {
    for (const hoursPerWeek of [0, 81, 2.5, Number.NaN]) {
      expect(StudyPlanInputSchema.safeParse({ ...validInput, hoursPerWeek }).success).toBe(false);
    }
  });

  it('rejeita prazo no passado ou além de 2 anos', () => {
    expect(StudyPlanInputSchema.safeParse({ ...validInput, deadline: isoInDays(-1) }).success).toBe(false);
    expect(StudyPlanInputSchema.safeParse({ ...validInput, deadline: isoInDays(800) }).success).toBe(false);
  });

  it('rejeita campos extras (mass assignment, ex.: user_id)', () => {
    const result = StudyPlanInputSchema.safeParse({ ...validInput, user_id: 'outro-usuario' });
    expect(result.success).toBe(false);
  });

  it('remove espaços nas pontas', () => {
    const result = StudyPlanInputSchema.parse({ ...validInput, subject: '  Física  ' });
    expect(result.subject).toBe('Física');
  });
});

describe('datas', () => {
  it('calcula dias até a data', () => {
    expect(daysUntil('2026-10-26', NOW)).toBe(0);
    expect(daysUntil('2026-11-02', NOW)).toBe(7);
  });

  it('rejeita datas inexistentes ou mal formatadas', () => {
    expect(daysUntil('2026-02-30', NOW)).toBeNull();
    expect(daysUntil('26/10/2026', NOW)).toBeNull();
    expect(isDeadlineInRange('2026-02-30', NOW)).toBe(false);
  });

  it('limita semanas entre 1 e 26', () => {
    expect(weeksAvailable('2026-10-26', NOW)).toBe(1);
    expect(weeksAvailable('2026-11-09', NOW)).toBe(2);
    expect(weeksAvailable('2028-01-01', NOW)).toBe(26);
  });
});

describe('GeneratedPlanSchema (saída da IA)', () => {
  it('aceita um plano válido', () => {
    expect(GeneratedPlanSchema.safeParse(validPlan).success).toBe(true);
  });

  it('rejeita campos inesperados vindos do modelo', () => {
    const result = GeneratedPlanSchema.safeParse({ ...validPlan, sql: 'drop table study_plans' });
    expect(result.success).toBe(false);
  });

  it('rejeita textos longos demais e semanas demais', () => {
    expect(GeneratedPlanSchema.safeParse({ ...validPlan, summary: 'x'.repeat(601) }).success).toBe(false);
    const weeks = Array.from({ length: 27 }, (_, i) => ({ ...validPlan.weeks[0], week: (i % 26) + 1 }));
    expect(GeneratedPlanSchema.safeParse({ ...validPlan, weeks }).success).toBe(false);
  });

  it('rejeita tipos errados', () => {
    const bad = { ...validPlan, weeks: [{ week: '1', focus: 'x', tasks: [] }] };
    expect(GeneratedPlanSchema.safeParse(bad).success).toBe(false);
  });
});
