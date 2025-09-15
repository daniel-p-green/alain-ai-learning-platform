import { api } from "encore.dev/api";
import { metrics, systemMetrics } from "../utils/observability";

interface MetricsResponse {
  timestamp: string;
  system: ReturnType<typeof systemMetrics>;
  metrics: ReturnType<typeof metrics.snapshot>;
}

export const getMetrics = api<{}, MetricsResponse>(
  { expose: true, method: "GET", path: "/metrics" },
  async () => {
    return {
      timestamp: new Date().toISOString(),
      system: systemMetrics(),
      metrics: metrics.snapshot(),
    };
  }
);

