"use client";
import React from 'react';

type Assessment = {
  id: number;
  question: string;
  options: string[];
  correct_index: number; // not used client-side for grading; server validates
  explanation?: string | null;
};

export default function StepAssessments({ tutorialId, stepOrder }: { tutorialId: number | string; stepOrder: number }) {
  const [items, setItems] = React.useState<Assessment[] | null>(null);
  const [selected, setSelected] = React.useState<Record<number, number | null>>({});
  const [result, setResult] = React.useState<Record<number, { correct: boolean; explanation?: string }>>({});
  const [loadingId, setLoadingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tutorials/${encodeURIComponent(String(tutorialId))}/assessments?step=${stepOrder}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Load failed (${res.status})`);
        const j = await res.json();
        if (!alive) return;
        const arr: Assessment[] = Array.isArray(j?.assessments) ? j.assessments : [];
        setItems(arr);
        const sel: Record<number, number | null> = {};
        for (const a of arr) sel[a.id] = null;
        setSelected(sel);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Failed to load assessments');
        setItems([]);
      }
    })();
    return () => { alive = false; };
  }, [tutorialId, stepOrder]);

  if (items == null) return null;
  if (items.length === 0) return null;

  async function grade(id: number) {
    const choice = selected[id];
    if (choice == null || choice < 0) return;
    setLoadingId(id);
    try {
      const resp = await fetch('/api/assessments/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id, choice })
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j?.error || `HTTP ${resp.status}`);
      setResult((r) => ({ ...r, [id]: { correct: !!j.correct, explanation: j.explanation } }));
    } catch (e: any) {
      setResult((r) => ({ ...r, [id]: { correct: false, explanation: e?.message || 'Failed to grade' } }));
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="mt-3 p-3 rounded border border-ink-100 bg-paper-0">
      <div className="font-medium text-alain-text mb-2">Knowledge Check</div>
      {error && <div className="text-xs text-red-700 mb-2">{error}</div>}
      <ol className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="p-2 rounded border border-ink-100 bg-white">
            <div className="text-sm font-medium mb-1">{a.question}</div>
            <div className="space-y-1">
              {a.options.map((opt, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`a-${a.id}`}
                    checked={selected[a.id] === idx}
                    onChange={() => setSelected((s) => ({ ...s, [a.id]: idx }))}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="h-8 px-3 rounded bg-alain-blue text-white font-semibold text-sm hover:bg-alain-blue/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/40"
                disabled={loadingId === a.id || selected[a.id] == null}
                onClick={() => grade(a.id)}
              >
                {loadingId === a.id ? 'Grading…' : 'Grade'}
              </button>
              {result[a.id] && (
                <span className={`text-xs ${result[a.id].correct ? 'text-green-700' : 'text-red-700'}`}>
                  {result[a.id].correct ? 'Correct' : 'Incorrect'}
                </span>
              )}
            </div>
            {result[a.id]?.explanation && (
              <div className="mt-1 text-xs text-ink-700">Explanation: {result[a.id]?.explanation}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
