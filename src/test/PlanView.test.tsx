import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlanView } from '../features/plans/PlanView';
import type { GeneratedPlan } from '../lib/validation';

describe('PlanView — renderização segura (XSS / LLM10)', () => {
  it('exibe HTML malicioso vindo da IA como texto, sem criar elementos', () => {
    const malicious: GeneratedPlan = {
      title: '<img src=x onerror="alert(1)">',
      summary: '<script>alert("xss")</script>',
      weeks: [
        {
          week: 1,
          focus: '<a href="javascript:alert(1)">clique</a>',
          tasks: [{ title: '<iframe src="https://evil.example"></iframe>', durationHours: 1 }],
        },
      ],
    };

    const { container } = render(<PlanView plan={malicious} />);

    expect(container.querySelector('img, script, iframe, a')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
    expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
  });
});
