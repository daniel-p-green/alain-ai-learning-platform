import { api } from "encore.dev/api";
import { progressDB } from "./db";

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
  responseTime?: number;
}

// Health check for progress service
export const health = api<{}, ServiceHealth>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const startTime = Date.now();

    try {
      // Test basic database connectivity
      const result = await progressDB.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM user_progress`;

      // Test progress tracking functionality
      const recentProgress = await progressDB.queryRow<{ count: number }>`
        SELECT COUNT(*)::int as count
        FROM user_progress
        WHERE last_accessed > NOW() - INTERVAL '1 hour'
      `;

      return {
        status: 'healthy',
        message: `${result?.count || 0} progress records, ${recentProgress?.count || 0} active in last hour`,
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
