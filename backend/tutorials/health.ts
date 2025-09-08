import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
  responseTime?: number;
}

// Health check for tutorials service
export const health = api<{}, ServiceHealth>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const startTime = Date.now();

    try {
      // Test basic database connectivity
      const result = await tutorialsDB.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM tutorials`;

      // Test more complex query
      const tutorials = await tutorialsDB.queryRow<{ id: number; title: string }>`
        SELECT id, title FROM tutorials LIMIT 1
      `;

      return {
        status: 'healthy',
        message: `Found ${result?.count || 0} tutorials`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }
);
