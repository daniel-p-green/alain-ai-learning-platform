import React from 'react';

type Step = { id: number; step_order: number; title: string; content: string; code_template?: string | null; expected_output?: string | null };
type Tutorial = { id: number; title: string; description: string; model: string; provider: string; difficulty: string; tags: string[]; created_at: string; steps: Step[] };

async function fetchTutorial(id: string): Promise<Tutorial | null> {
  const res = await fetch(`/api/tutorials/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return await res.json();
}

export default async function TutorialPage({ params }: { params: { id: string } }) {
  const t = await fetchTutorial(params.id);
  if (!t) return <div className="max-w-4xl mx-auto p-6">Tutorial not found.</div>;
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div className="text-sm text-ink-600">{t.model} · {t.provider} · <span className="uppercase">{t.difficulty}</span> · {new Date(t.created_at).toLocaleString()}</div>
        <p className="text-ink-800 mt-2 whitespace-pre-wrap">{t.description}</p>
      </header>
      <ol className="space-y-4">
        {t.steps.map(s => (
          <li key={s.id} className="border rounded p-4 bg-white/70">
            <div className="font-medium">{s.step_order}. {s.title}</div>
            <div className="prose prose-sm max-w-none mt-2 whitespace-pre-wrap">{s.content}</div>
            {s.code_template && (
              <pre className="mt-3 text-xs bg-ink-50 p-3 rounded overflow-x-auto"><code>{s.code_template}</code></pre>
            )}
            {s.expected_output && (
              <div className="text-xs text-ink-700 mt-2">Expected: {s.expected_output}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

