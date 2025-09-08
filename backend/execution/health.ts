import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    poe: ServiceHealth;
    openai: ServiceHealth;
    database: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked: string;
  responseTime?: number;
}

// Health check for execution service
export const health = api<{}, HealthStatus>(
  { expose: true, method: "GET", path: "/health" },
  async () => {
    const startTime = Date.now();
    const services: HealthStatus['services'] = {
      poe: await checkPoeHealth(),
      openai: await checkOpenAIHealth(),
      database: await checkDatabaseHealth()
    };

    const overallStatus = determineOverallStatus(services);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services
    };
  }
);

// Check Poe API health
async function checkPoeHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.POE_API_KEY;
    if (!apiKey) {
      return {
        status: 'unhealthy',
        message: 'POE_API_KEY not configured',
        lastChecked: new Date().toISOString()
      };
    }

    // Quick health check with a minimal request
    const response = await fetch("https://api.poe.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "GPT-OSS-20B",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1,
        stream: false
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime
      };
    } else if (response.status === 429) {
      return {
        status: 'degraded',
        message: 'Rate limited',
        lastChecked: new Date().toISOString(),
        responseTime
      };
    } else {
      return {
        status: 'unhealthy',
        message: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

// Check OpenAI API health
async function checkOpenAIHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;

    if (!apiKey || !baseUrl) {
      return {
        status: 'unhealthy',
        message: 'OPENAI_API_KEY or OPENAI_BASE_URL not configured',
        lastChecked: new Date().toISOString()
      };
    }

    // Quick health check
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        responseTime
      };
    } else {
      return {
        status: 'unhealthy',
        message: `HTTP ${response.status}`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - startTime
    };
  }
}

// Check database health
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Import the database here to avoid circular dependencies
    const { tutorialsDB } = await import("../tutorials/db");

    // Simple query to test database connectivity
    await tutorialsDB.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM tutorials`;

    return {
      status: 'healthy',
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

// Determine overall system health
function determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(s => s.status);

  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.includes('degraded')) {
    return 'degraded';
  }

  return 'healthy';
}
