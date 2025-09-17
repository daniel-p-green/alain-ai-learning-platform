"use client";
import { Button } from "./Button";
import { backendUrl } from "../lib/backend";

type ModelMaker = { name: string; org_type: string; homepage?: string|null; license?: string|null; repo?: string|null };
type Preview = { title: string; description: string; learning_objectives: string[]; first_step?: { title: string; content: string } | null; model_maker?: ModelMaker | null };

type Props = {
  tutorialId: number | string;
  preview?: Preview;
  repaired?: boolean;
  onExport: (suggestedName: string) => Promise<void> | void;
  exporting?: boolean;
};

export function PreviewPanel({ tutorialId, preview, repaired, onExport, exporting = false }: Props) {
  if (!preview) return null;
  return (
    <div className="mt-4 border border-ink-100 rounded-card p-4 bg-paper-0 space-y-3 shadow-alain-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Preview</h2>
        {repaired && (
          <span className="text-xs px-2 py-0.5 rounded-alain-lg bg-alain-yellow text-alain-blue border border-alain-stroke/20">Repaired</span>
        )}
      </div>
      <div className="text-alain-text font-medium">{preview.title}</div>
      <div className="text-ink-700">{preview.description}</div>
      {preview.model_maker && (
        <div className="text-sm text-ink-700 border border-ink-100 rounded-card p-3 bg-alain-card">
          <div className="font-medium text-alain-text mb-1">Model Maker</div>
          <div>{preview.model_maker.name} ({preview.model_maker.org_type})</div>
          <div className="flex gap-2 mt-1">
            {preview.model_maker.homepage && <a className="text-brand-blue hover:underline" href={preview.model_maker.homepage} target="_blank">Homepage</a>}
            {preview.model_maker.repo && <a className="text-brand-blue hover:underline" href={preview.model_maker.repo} target="_blank">Repo</a>}
            {preview.model_maker.license && <span className="text-ink-600">License: {preview.model_maker.license}</span>}
          </div>
        </div>
      )}
      {Array.isArray(preview.learning_objectives) && preview.learning_objectives.length > 0 && (
        <div className="text-sm text-ink-700">
          <div className="font-medium text-alain-text mb-1">Objectives</div>
          <ul className="list-disc pl-5">
            {preview.learning_objectives.slice(0,3).map((o: string, i: number) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}
      {preview.first_step && (
        <div className="text-sm text-ink-700">
          <div className="font-medium text-alain-text mb-1">Step 1: {preview.first_step.title}</div>
          <div className="whitespace-pre-wrap text-ink-700">{preview.first_step.content}</div>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => { window.location.href = `/tutorial/${tutorialId}`; }}>Open Manual</Button>
        <Button
          variant="secondary"
          disabled={exporting}
          onClick={async () => {
            const suggested = (preview.title || 'lesson').replace(/\s+/g,'_');
            await onExport(suggested);
          }}
        >{exporting ? 'Exporting…' : 'Export Notebook'}</Button>
        <Button variant="secondary" onClick={async () => {
          try {
            const id = String(tutorialId);
            let lesson: any = null;
            if (id.startsWith('local-')) {
              const res = await fetch(`/api/tutorials/local/${id}`);
              lesson = await res.json();
            } else {
              const res = await fetch(backendUrl(`/tutorials/${id}`));
              lesson = await res.json();
            }
            const lessonBlob = new Blob([JSON.stringify(lesson, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(lessonBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(preview.title || 'lesson').replace(/\s+/g,'_')}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch {}
        }}>Download JSON</Button>
      </div>
    </div>
  );
}
