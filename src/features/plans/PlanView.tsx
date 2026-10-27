import type { GeneratedPlan } from '../../lib/validation';

interface PlanViewProps {
  plan: GeneratedPlan;
}

/**
 * Renderiza o plano gerado pela IA SOMENTE como nós de texto JSX.
 * O React escapa automaticamente qualquer HTML/script vindo do modelo (LLM10).
 */
export function PlanView({ plan }: PlanViewProps) {
  return (
    <article className="plan-view">
      <h3>{plan.title}</h3>
      <p>{plan.summary}</p>
      <ol className="weeks">
        {plan.weeks.map((week) => (
          <li key={week.week} className="week">
            <h4>
              Semana {week.week}: {week.focus}
            </h4>
            <ul>
              {week.tasks.map((task, index) => (
                <li key={index}>
                  {task.title} <span className="muted">({task.durationHours} h)</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </article>
  );
}
