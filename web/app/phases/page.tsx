"use client";
import { useState } from "react";

type Phase = "Research" | "Design" | "Develop" | "Validate";

export default function PhasesPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [busy, setBusy] = useState<Phase | null>(null);

  async function runPhase(phase: Phase) {
    setBusy(phase);
    setLogs((l) => [
      `${new Date().toLocaleTimeString()} • Starting ${phase}…`,
      ...l,
    ]);
    try {
      const resp = await fetch("/api/phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, provider: 'poe', model: 'GPT-OSS-20B', input: { note: 'demo input' }, autoRender: phase === 'Develop' || phase === 'Validate' }),
      });
      const data = await resp.json();
      setResult(data);
      setLogs((l) => [
        `${new Date().toLocaleTimeString()} • ${phase} → ${data.ok ? "ok" : "error"}`,
        ...l,
      ]);
    } catch (e: any) {
      setLogs((l) => [
        `${new Date().toLocaleTimeString()} • ${phase} failed: ${e?.message || e}`,
        ...l,
      ]);
    } finally {
      setBusy(null);
    }
  }

  const Button = ({ phase }: { phase: Phase }) => (
    <button
      onClick={() => runPhase(phase)}
      disabled={!!busy}
      className={`px-4 py-2 rounded border ${busy ? "opacity-50" : "hover:bg-gray-50"}`}
    >
      {phase}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ALAIN Phases</h1>
        <p className="text-ink-700">Research → Design → Develop → Validate</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button phase="Research" />
        <Button phase="Design" />
        <Button phase="Develop" />
        <Button phase="Validate" />
      </div>
      <div>
        <h2 className="text-lg font-medium">Activity</h2>
        <div className="text-sm text-ink-900 border border-ink-100 rounded-card p-3 h-48 overflow-auto bg-paper-0">
          {logs.length === 0 ? (
            <div className="text-ink-600">No activity yet.</div>
          ) : (
            <ul className="space-y-1">
              {logs.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Response viewer */}
      <div>
        <h2 className="text-lg font-medium">Response</h2>
        {!result ? (
          <div className="text-ink-600 text-sm">No response yet.</div>
        ) : (
          <div className="text-xs bg-paper-0 text-ink-900 border border-ink-100 rounded-card p-3 whitespace-pre-wrap">
            <pre>{pretty(result)}</pre>
            {result?.artifacts && (
              <div className="mt-2 text-ink-700">
                {result.artifacts.lesson_path && (
                  <div>Lesson JSON: <code className="text-ink-900">{result.artifacts.lesson_path}</code></div>
                )}
                {result.artifacts.notebook_path && (
                  <div>Notebook: <code className="text-ink-900">{result.artifacts.notebook_path}</code></div>
                )}
                {result.artifacts.smoke_report_path && (
                  <div>Smoke Report: <code className="text-ink-900">{result.artifacts.smoke_report_path}</code></div>
                )}
                {result.artifacts.smoke && (
                  <div className="mt-2">Smoke Status: <span className="font-mono">{result.artifacts.smoke.status}</span></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function pretty(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}
