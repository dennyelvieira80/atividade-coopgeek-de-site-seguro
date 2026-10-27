import type { StudyPlanRow } from '../../lib/validation';
import { PlanView } from './PlanView';

interface PlanListProps {
  plans: StudyPlanRow[];
  onDelete: (id: string) => void;
}

export function PlanList({ plans, onDelete }: PlanListProps) {
  if (plans.length === 0) {
    return <p className="muted">Você ainda não salvou nenhum cronograma.</p>;
  }

  return (
    <ul className="plan-list">
      {plans.map((plan) => (
        <li key={plan.id} className="card">
          <details>
            <summary>
              <strong>{plan.title}</strong>{' '}
              <span className="muted">
                — {plan.subject} · prazo {plan.deadline} · {plan.hours_per_week} h/semana
              </span>
            </summary>
            <PlanView plan={plan.plan_json} />
          </details>
          <button
            type="button"
            className="danger"
            onClick={() => {
              if (window.confirm('Excluir este cronograma?')) onDelete(plan.id);
            }}
          >
            Excluir
          </button>
        </li>
      ))}
    </ul>
  );
}
