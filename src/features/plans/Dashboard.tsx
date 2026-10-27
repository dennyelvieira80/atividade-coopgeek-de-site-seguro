import { useEffect, useState } from 'react';
import { Alert } from '../../components/Alert';
import { GeneratePlanError, generateStudyPlan } from '../ai/generatePlan';
import type { GeneratedPlan, StudyPlanInput, StudyPlanRow } from '../../lib/validation';
import { PlanForm } from './PlanForm';
import { PlanList } from './PlanList';
import { PlanView } from './PlanView';
import { deletePlan, listPlans, PlansApiError, savePlan } from './plansApi';

interface Draft {
  input: StudyPlanInput;
  plan: GeneratedPlan;
}

function messageOf(err: unknown): string {
  if (err instanceof GeneratePlanError || err instanceof PlansApiError) return err.message;
  return 'Ocorreu um erro inesperado.';
}

export function Dashboard() {
  const [plans, setPlans] = useState<StudyPlanRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listPlans()
      .then((rows) => {
        if (active) setPlans(rows);
      })
      .catch((err: unknown) => {
        if (active) setError(messageOf(err));
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleGenerate(input: StudyPlanInput) {
    setError(null);
    setGenerating(true);
    try {
      const plan = await generateStudyPlan(input);
      setDraft({ input, plan });
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setError(null);
    setSaving(true);
    try {
      const row = await savePlan(draft.input, draft.plan);
      setPlans((current) => [row, ...current]);
      setDraft(null);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deletePlan(id);
      setPlans((current) => current.filter((p) => p.id !== id));
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <div className="dashboard">
      <PlanForm busy={generating} onSubmit={handleGenerate} />

      {error && <Alert kind="error">{error}</Alert>}

      {draft && (
        <section className="card" aria-labelledby="draft-title">
          <h2 id="draft-title">Prévia gerada pela IA</h2>
          <PlanView plan={draft.plan} />
          <div className="row">
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar cronograma'}
            </button>
            <button type="button" className="secondary" onClick={() => setDraft(null)}>
              Descartar
            </button>
          </div>
        </section>
      )}

      <section aria-labelledby="my-plans-title">
        <h2 id="my-plans-title">Meus cronogramas</h2>
        <PlanList plans={plans} onDelete={handleDelete} />
      </section>
    </div>
  );
}
