import { useState, type FormEvent } from 'react';
import { LIMITS, StudyPlanInputSchema, fieldErrors, type StudyPlanInput } from '../../lib/validation';

interface PlanFormProps {
  busy: boolean;
  onSubmit: (input: StudyPlanInput) => void;
}

export function PlanForm({ busy, onSubmit }: PlanFormProps) {
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('5');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = StudyPlanInputSchema.safeParse({
      subject,
      goal,
      deadline,
      hoursPerWeek: hoursPerWeek === '' ? Number.NaN : Number(hoursPerWeek),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate aria-labelledby="plan-form-title">
      <h2 id="plan-form-title">Novo cronograma</h2>

      <label>
        Matéria
        <input
          name="subject"
          maxLength={LIMITS.subject.max}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          aria-invalid={Boolean(errors.subject)}
        />
        {errors.subject && <span className="field-error">{errors.subject}</span>}
      </label>

      <label>
        Objetivo
        <textarea
          name="goal"
          rows={3}
          maxLength={LIMITS.goal.max}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          aria-invalid={Boolean(errors.goal)}
        />
        <span className="muted small">
          {goal.length}/{LIMITS.goal.max}
        </span>
        {errors.goal && <span className="field-error">{errors.goal}</span>}
      </label>

      <div className="row">
        <label>
          Prazo
          <input
            type="date"
            name="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            aria-invalid={Boolean(errors.deadline)}
          />
          {errors.deadline && <span className="field-error">{errors.deadline}</span>}
        </label>

        <label>
          Horas por semana
          <input
            type="number"
            name="hoursPerWeek"
            min={LIMITS.hoursPerWeek.min}
            max={LIMITS.hoursPerWeek.max}
            step={1}
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(e.target.value)}
            aria-invalid={Boolean(errors.hoursPerWeek)}
          />
          {errors.hoursPerWeek && <span className="field-error">{errors.hoursPerWeek}</span>}
        </label>
      </div>

      <button type="submit" disabled={busy}>
        {busy ? 'Gerando com IA…' : 'Gerar cronograma'}
      </button>
    </form>
  );
}
