"use client";
import { useMemo } from "react";
import NotebookViewer from "./NotebookViewer";
import { Button } from "./Button";

export type WorkspaceState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; notebook: any; meta?: any };

type Preview = {
  title?: string;
  description?: string;
  learning_objectives?: string[];
  first_step?: { title?: string; content?: string | null } | null;
  model_maker?: { name?: string; org_type?: string; homepage?: string | null; repo?: string | null; license?: string | null } | null;
};

export type ExportUiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; url: string; filename: string }
  | { status: "error"; message: string };

type NotebookWorkspaceProps = {
  workspace: WorkspaceState;
  preview?: Preview | null;
  repaired?: boolean;
  tutorialId?: string | number;
  progressActive: boolean;
  progressLabel?: string;
  exportState: ExportUiState;
  onExport: (suggestedName: string) => Promise<void> | void;
  onDownloadJson: () => Promise<void> | void;
  onCopyExportLink: () => void;
  onDismissExportState: () => void;
  copyStatus: "idle" | "success" | "error";
  onOpenManual: () => void;
  onRemix: () => void;
};

export default function NotebookWorkspace({
  workspace,
  preview,
  repaired,
  tutorialId,
  progressActive,
  progressLabel,
  exportState,
  onExport,
  onDownloadJson,
  onCopyExportLink,
  onDismissExportState,
  copyStatus,
  onOpenManual,
  onRemix,
}: NotebookWorkspaceProps) {
  const learningList = useMemo(() => {
    if (!preview?.learning_objectives || preview.learning_objectives.length === 0) return null;
    return preview.learning_objectives.slice(0, 3);
  }, [preview?.learning_objectives]);

  const suggestedFilename = useMemo(() => {
    const base = preview?.title?.trim();
    if (!base || base.length === 0) return "lesson";
    return base.replace(/\s+/g, "_").toLowerCase();
  }, [preview?.title]);

  const renderBlankState = () => (
    <div className="flex h-full flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-ink-200 bg-white/80 p-8 text-center text-ink-700">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-ink-900">Your manual workspace</h2>
        <p className="text-sm">
          Fill in the generator on the left. As soon as ALAIN assembles the lesson, the full notebook will appear here for review, export, and remix.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-ink-700">
        <li>• See every step, code cell, and assessment before sharing.</li>
        <li>• Export to Colab/Jupyter or download JSON without leaving this view.</li>
        <li>• Remix or edit once the notebook lands (editing coming soon).</li>
      </ul>
      <Button variant="secondary" onClick={() => { const el = document.querySelector('[data-generator-form-root="true"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
        Jump to generator
      </Button>
    </div>
  );

  const renderErrorState = (message: string) => (
    <div className="flex h-full flex-col items-center justify-center gap-4 rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center text-red-800">
      <div className="text-base font-semibold">We couldn’t load the notebook preview</div>
      <p className="text-sm">
        {message}
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <Button variant="secondary" onClick={onOpenManual}>Open full manual</Button>
        <Button variant="secondary" onClick={onDownloadJson}>Download JSON</Button>
      </div>
    </div>
  );

  const renderNotebook = () => {
    if (workspace.status === "ready") {
      return (
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-auto rounded-2xl border border-ink-100 bg-ink-900/90 p-4">
            <NotebookViewer nb={workspace.notebook} />
          </div>
        </div>
      );
    }

    if (workspace.status === "loading") {
      return (
        <div className="flex h-full flex-col justify-center rounded-2xl border border-ink-100 bg-white/70 p-6">
          <div className="mx-auto flex flex-col items-center gap-3 text-ink-700">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink-300 border-t-alain-blue" aria-hidden />
            <p className="text-sm font-medium">Assembling notebook…</p>
          </div>
        </div>
      );
    }

    if (workspace.status === "error") {
      return renderErrorState(workspace.message);
    }

    return renderBlankState();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-ink-100 bg-white/90 p-5 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
              {tutorialId && <span className="rounded-full border border-ink-100 px-2 py-0.5">Manual #{String(tutorialId)}</span>}
              {repaired && <span className="rounded-full border border-alain-yellow/50 bg-alain-yellow/20 px-2 py-0.5 text-alain-blue">Auto-repaired</span>}
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">{preview?.title || 'Generated manual'}</h2>
            {preview?.description && <p className="text-sm leading-relaxed text-ink-700">{preview.description}</p>}
            {learningList && (
              <ul className="list-disc pl-5 text-sm text-ink-700">
                {learningList.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm text-ink-600">
            {preview?.model_maker?.name && (
              <div>
                <div className="text-xs uppercase tracking-wide text-ink-500">Model maker</div>
                <div className="font-medium text-ink-800">{preview.model_maker.name}</div>
                <div className="text-xs text-ink-500">{preview.model_maker.org_type}</div>
              </div>
            )}
            {preview?.model_maker?.license && <div className="text-xs">License: {preview.model_maker.license}</div>}
            {preview?.model_maker?.homepage && (
              <a href={preview.model_maker.homepage} target="_blank" className="text-xs text-alain-blue underline">Homepage</a>
            )}
          </div>
        </div>
        {progressActive && progressLabel && (
          <div className="mt-4 flex items-center gap-2 rounded-card border border-ink-100 bg-paper-50 px-3 py-2 text-xs text-ink-700">
            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-alain-blue" aria-hidden />
            <span>{progressLabel}</span>
          </div>
        )}
      </div>

      <div className="flex-1">
        {renderNotebook()}
      </div>

      <div className="space-y-3 rounded-2xl border border-ink-100 bg-white/90 p-5 shadow-card">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onOpenManual} disabled={!tutorialId}>
            Open Manual
          </Button>
          <Button
            variant="secondary"
            onClick={() => onExport(suggestedFilename)}
            disabled={exportState.status === "loading"}
          >
            {exportState.status === "loading" ? "Exporting…" : "Export Notebook"}
          </Button>
          <Button variant="secondary" onClick={onDownloadJson}>
            Download JSON
          </Button>
          <Button variant="secondary" onClick={onRemix}>
            Remix
          </Button>
        </div>
        <div className="text-xs text-ink-500">
          TODO: inline editing for markdown/code cells will land here in a future update.
        </div>
        {exportState.status === "loading" && (
          <div className="rounded-card border border-alain-blue/30 bg-alain-blue/5 p-3 text-sm text-ink-800">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-alain-blue" aria-hidden />
              <span>Preparing notebook export…</span>
            </div>
          </div>
        )}

        {exportState.status === "success" && (
          <div className="rounded-card border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <div className="font-semibold">Export ready</div>
            <div className="mt-1 text-xs text-green-700">Saved as <span className="font-semibold">{exportState.filename}</span>.</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onCopyExportLink}>
                {copyStatus === "success" ? "Link copied" : "Copy download link"}
              </Button>
              <Button variant="secondary" onClick={onDismissExportState}>
                Dismiss
              </Button>
            </div>
            {copyStatus === "error" && <div className="mt-2 text-xs text-red-700">Copy failed. Right-click the link below to copy manually.</div>}
            <a className="mt-2 block break-all text-xs text-green-700 underline" href={exportState.url} target="_blank" rel="noreferrer">
              {exportState.url}
            </a>
          </div>
        )}
        {exportState.status === "error" && (
          <div className="rounded-card border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <div className="font-semibold">Export failed</div>
            <p className="text-xs">{exportState.message}</p>
            <Button variant="secondary" className="mt-2" onClick={onDismissExportState}>Dismiss</Button>
          </div>
        )}
      </div>
    </div>
  );
}
