"use client";
import { Button } from "./Button";

type ModelMaker = { name: string; org_type: string; homepage?: string|null; license?: string|null; repo?: string|null };
type Preview = { title: string; description: string; learning_objectives: string[]; first_step?: { title: string; content: string } | null; model_maker?: ModelMaker | null };

type Props = {
  tutorialId: number;
  preview?: Preview;
  repaired?: boolean;
  onExport: (suggestedName: string) => Promise<void> | void;
};

export function PreviewPanel({ tutorialId, preview, repaired, onExport }: Props) {
  if (!preview) return null;
  return (
    <div className="mt-4 border border-gray-800 rounded-lg p-4 bg-gray-900 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Preview</h2>
        {repaired && (
          <span className="text-xs px-2 py-0.5 rounded bg-yellow-800 text-yellow-200 border border-yellow-700">Repaired</span>
        )}
      </div>
      <div className="text-white font-medium">{preview.title}</div>
      <div className="text-gray-300">{preview.description}</div>
      {preview.model_maker && (
        <div className="text-sm text-gray-300 border border-gray-800 rounded p-3 bg-gray-950/40">
          <div className="font-medium text-gray-200 mb-1">Model Maker</div>
          <div>{preview.model_maker.name} ({preview.model_maker.org_type})</div>
          <div className="flex gap-2 mt-1">
            {preview.model_maker.homepage && <a className="text-brand-blue hover:underline" href={preview.model_maker.homepage} target="_blank">Homepage</a>}
            {preview.model_maker.repo && <a className="text-brand-blue hover:underline" href={preview.model_maker.repo} target="_blank">Repo</a>}
            {preview.model_maker.license && <span className="text-gray-400">License: {preview.model_maker.license}</span>}
          </div>
        </div>
      )}
      {Array.isArray(preview.learning_objectives) && preview.learning_objectives.length > 0 && (
        <div className="text-sm text-gray-400">
          <div className="font-medium text-gray-300 mb-1">Objectives</div>
          <ul className="list-disc pl-5">
            {preview.learning_objectives.slice(0,3).map((o: string, i: number) => <li key={i}>{o}</li>)}
          </ul>
        </div>
      )}
      {preview.first_step && (
        <div className="text-sm text-gray-300">
          <div className="font-medium text-gray-300 mb-1">Step 1: {preview.first_step.title}</div>
          <div className="whitespace-pre-wrap text-gray-400">{preview.first_step.content}</div>
        </div>
      )}
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={() => { window.location.href = `/tutorial/${tutorialId}`; }}
        >Open Tutorial</Button>
        <Button
          variant="secondary"
          onClick={async () => {
            const suggested = (preview.title || 'lesson').replace(/\s+/g,'_');
            await onExport(suggested);
          }}
        >Export Notebook</Button>
      </div>
    </div>
  );
}

