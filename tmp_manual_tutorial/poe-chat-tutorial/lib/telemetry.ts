export type ChatTelemetry = {
  id: string;
  model: string;
  startedAt: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  status: "success" | "error";
  errorMessage?: string;
};

export function createTelemetryId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
