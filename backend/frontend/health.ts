import { api } from "encore.dev/api";

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
  responseTime?: number;
}

// Health check for frontend service
export const health = api<{}, ServiceHealth>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const startTime = Date.now();

    try {
      // Check if we can access the frontend assets
      // This is a simple health check for the frontend service
      const fs = await import('fs');
      const path = await import('path');

      const distPath = path.join(process.cwd(), 'dist');
      const indexPath = path.join(distPath, 'index.html');

      if (fs.existsSync(indexPath)) {
        return {
          status: 'healthy',
          message: 'Frontend assets available',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      } else {
        return {
          status: 'degraded',
          message: 'Frontend assets not built',
          lastChecked: new Date().toISOString(),
          responseTime: Date.now() - startTime
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Frontend service error',
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  }
);
