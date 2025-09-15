import { api } from "encore.dev/api";
import { metrics, systemMetrics } from "../utils/observability";
import type { SystemMetrics, MetricsSnapshot } from "../utils/observability";

interface MetricsResponse {
  timestamp: string;
  system: SystemMetrics;
  metrics: MetricsSnapshot;
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
