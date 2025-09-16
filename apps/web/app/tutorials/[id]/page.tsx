import React from 'react';
import TryPrompt from '@/components/TryPrompt';
import MarkCompleteButton from '@/components/MarkCompleteButton';
import StepRunner from '@/components/StepRunner';
import StepAssessments from '@/components/StepAssessments';

type Step = { id: number; step_order: number; title: string; content: string; code_template?: string | null; expected_output?: string | null };
type Maker = { name?: string; org_type?: string; homepage?: string | null; license?: string | null; repo?: string | null };
type Tutorial = { id: number; title: string; description: string; model: string; provider: string; difficulty: string; tags: string[]; created_at: string; steps: Step[]; model_maker?: Maker | null };

async function fetchTutorial(id: string): Promise<Tutorial | null> {
  const res = await fetch(`/api/tutorials/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return await res.json();
}

async function fetchProgress(id: string): Promise<{ current_step: number; completed_steps: number[] } | null> {
  try {
    const res = await fetch(`/api/tutorials/${encodeURIComponent(id)}/progress`, { cache: 'no-store' });
    if (!res.ok) return null;
    const j = await res.json();
    return { current_step: Number(j.current_step || 0), completed_steps: Array.isArray(j.completed_steps) ? j.completed_steps : [] };
  } catch { return null; }
}

export default async function TutorialPage({ params }: { params: { id: string } }) {
  const t = await fetchTutorial(params.id);
  if (!t) return <div className="max-w-4xl mx-auto p-6">Manual not found.</div>;
  const prog = await fetchProgress(params.id);
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div className="text-sm text-ink-600">{t.model} · {t.provider} · <span className="uppercase">{t.difficulty}</span> · {new Date(t.created_at).toLocaleString()}</div>
        <p className="text-ink-800 mt-2 whitespace-pre-wrap">{t.description}</p>
        {t.model_maker && (
          <div className="mt-3 p-3 rounded border bg-white/70 text-sm">
            <div className="font-medium">Model Maker</div>
            <div className="text-ink-800">{t.model_maker?.name} · {t.model_maker?.org_type}</div>
            <div className="text-ink-700">
              {t.model_maker?.homepage && <a href={t.model_maker?.homepage} className="underline" target="_blank">Homepage</a>}
              {t.model_maker?.repo && <span> · <a href={t.model_maker?.repo} className="underline" target="_blank">Repo</a></span>}
              {t.model_maker?.license && <span> · License: {t.model_maker?.license}</span>}
            </div>
          </div>
        )}
      </header>
      {/* Progress bar */}
      {(() => {
        const total = Math.max(1, t.steps.length);
        const done = Math.min(total, (prog?.completed_steps?.length || 0));
        const pct = Math.round((done / total) * 100);
        return (
          <div className="p-3 rounded border bg-white/70">
            <div className="text-xs text-ink-700 mb-1">Progress: {done}/{total} steps ({pct}%)</div>
            <div className="h-2 w-full bg-ink-100 rounded overflow-hidden">
              <div className="h-2 bg-alain-blue" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })()}
      <ol className="space-y-4">
        {t.steps.map(s => (
          <li key={s.id} className="border rounded p-4 bg-white/70">
            <div className="font-medium">{s.step_order}. {s.title}</div>
            <div className="prose prose-sm max-w-none mt-2 whitespace-pre-wrap">{s.content}</div>
            {s.code_template && (
              <div className="mt-3">
                <StepRunner
                  provider={t.provider}
                  model={t.model}
                  codeTemplate={s.code_template || ''}
                  temperature={0.7}
                  maxTokens={300}
                />
              </div>
            )}
            {s.expected_output && (
              <div className="text-xs text-ink-700 mt-2">Expected: {s.expected_output}</div>
            )}
            {/* Inline assessments for this step (MCQs) */}
            <div className="mt-4">
              <StepAssessments tutorialId={t.id} stepOrder={s.step_order} />
            </div>
            <MarkCompleteButton tutorialId={t.id} stepOrder={s.step_order} />
          </li>
        ))}
      </ol>
      {/* Minimal Try-a-Prompt panel */}
      <TryPrompt provider={t.provider} model={t.model} />
    </div>
  );
}
