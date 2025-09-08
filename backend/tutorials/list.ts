import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface Tutorial {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

interface ListTutorialsResponse {
  tutorials: Tutorial[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    difficulties: string[];
    providers: string[];
    tags: string[];
  };
}

interface ListQuery {
  page?: number;
  pageSize?: number;
  tags?: string[];
  difficulty?: string;
  provider?: string;
  search?: string;
}

// Retrieves tutorials with filtering, pagination, and metadata
export const list = api<ListQuery, ListTutorialsResponse>(
  { expose: true, method: "GET", path: "/tutorials" },
  async (q) => {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const whereParts: string[] = [];
    const params: any[] = [];

    // Build WHERE clause for filters
    if (q.difficulty) {
      whereParts.push(`difficulty = $${params.push(q.difficulty)}`);
    }
    if (q.provider) {
      whereParts.push(`provider = $${params.push(q.provider)}`);
    }
    if (q.tags && q.tags.length) {
      whereParts.push(`tags && $${params.push(q.tags)}::text[]`);
    }
    if (q.search) {
      const like1 = `%${q.search}%`;
      const like2 = `%${q.search}%`;
      const like3 = `%${q.search}%`;
      whereParts.push(`(title ILIKE $${params.push(like1)} OR description ILIKE $${params.push(like2)} OR model ILIKE $${params.push(like3)})`);
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    // Get total count for pagination
    const totalResult = await tutorialsDB.queryRow<{ count: number }>([
      `SELECT COUNT(*)::int as count FROM tutorials ${whereSql}`,
      ...params.slice(0, -2) // Remove search params for count query
    ] as any);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Get tutorials with pagination
    const tutorials: Tutorial[] = [];
    const tutorialRows = tutorialsDB.query<Tutorial>([
      `SELECT id, title, description, model, provider, difficulty, tags, created_at, updated_at
       FROM tutorials ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.push(pageSize)} OFFSET $${params.push(offset)}`,
      ...params,
    ] as any);

    for await (const row of tutorialRows) {
      tutorials.push(row);
    }

    // Get filter options
    const [difficulties, providers, tags] = await Promise.all([
      tutorialsDB.query<{ difficulty: string }>`SELECT DISTINCT difficulty FROM tutorials ORDER BY difficulty`,
      tutorialsDB.query<{ provider: string }>`SELECT DISTINCT provider FROM tutorials ORDER BY provider`,
      tutorialsDB.query<{ tag: string }>`SELECT DISTINCT unnest(tags) as tag FROM tutorials ORDER BY tag`
    ]);

    const filterDifficulties = difficulties.map(d => d.difficulty);
    const filterProviders = providers.map(p => p.provider);
    const filterTags = [...new Set(tags.map(t => t.tag))];

    return {
      tutorials,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        difficulties: filterDifficulties,
        providers: filterProviders,
        tags: filterTags
      }
    };
  }
);
