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
    <div className="space-y-2">
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <div className="font-semibold text-red-400">{error.code}</div>
          <div className="text-sm text-red-300">{error.message}</div>
        </div>
      )}

      {isStreaming && !error && (
        <div className="bg-gray-900 rounded p-3 text-sm space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Elapsed:</span>
            <span className="text-brand-blue font-mono">{Math.max(0, elapsedSeconds || 0)}s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">Tokens:</span>
            <span className="text-brand-blue font-mono">~{tokenCount || 0}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-brand-blue h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      <pre
        className={`whitespace-pre-wrap bg-gray-900 border rounded p-3 text-gray-100 text-sm min-h-24 ${
          status === 'error'
            ? 'border-red-600'
            : status === 'success'
            ? 'border-green-600'
            : status === 'info'
            ? 'border-brand-blue'
            : 'border-gray-800'
        }`}
      >
        {output || (isStreaming ? "Streaming…" : "")}
      </pre>
    </div>
  );
}
