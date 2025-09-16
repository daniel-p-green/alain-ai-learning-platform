"use client";

/**
 * StreamingOutput
 * - Displays streamed output with optional error banner and simple metrics
 * - Accepts preformatted `output` string; no internal formatting is applied
 */

type Props = {
  output: string;
  isStreaming?: boolean;
  error?: { code: string; message: string } | null;
  elapsedSeconds?: number;
  tokenCount?: number;
  status?: 'error' | 'success' | 'info' | 'idle';
};

export function StreamingOutput({ output, isStreaming, error, elapsedSeconds, tokenCount, status = 'idle' }: Props) {
  return (
    <div className="space-y-2" role="region" aria-live="polite">
      {error && (
        <div className="bg-white border border-red-300 rounded-card p-3">
          <div className="font-semibold text-red-700">{error.code}</div>
          <div className="text-sm text-red-600">{error.message}</div>
        </div>
      )}

      {isStreaming && !error && (
        <div className="bg-alain-card rounded-card p-3 text-sm space-y-2 border border-alain-stroke/15">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-700">Elapsed:</span>
            <span className="text-alain-blue font-mono">{Math.max(0, elapsedSeconds || 0)}s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-700">Tokens:</span>
            <span className="text-alain-blue font-mono">~{tokenCount || 0}</span>
          </div>
          <div className="w-full bg-ink-100 rounded-full h-2">
            <div className="bg-alain-blue h-2 rounded-full animate-pulse w-3/5" />
          </div>
        </div>
      )}

      <pre
        className={`whitespace-pre-wrap bg-paper-0 border rounded-card p-3 text-ink-900 text-sm min-h-24 ${
          status === 'error'
            ? 'border-red-600'
            : status === 'success'
            ? 'border-green-600'
            : status === 'info'
            ? 'border-alain-blue'
            : 'border-ink-100'
        }`}
        aria-live="polite"
      >
        {output || (isStreaming ? "Streaming…" : "")}
      </pre>
    </div>
  );
}
