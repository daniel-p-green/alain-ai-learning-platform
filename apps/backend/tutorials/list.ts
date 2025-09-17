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
  model_maker_name?: string | null;
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
    modelMakers?: string[];
  };
}

interface ListQuery {
  page?: number;
  pageSize?: number;
  tags?: string[];
  difficulty?: string;
  provider?: string;
  search?: string;
  modelMaker?: string;
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
    if (q.modelMaker) {
      whereParts.push(`EXISTS (SELECT 1 FROM model_makers mm WHERE mm.id = tutorials.model_maker_id AND mm.name = $${params.push(q.modelMaker)})`);
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
      ...params,
    ] as any);
    const total = totalResult?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Get tutorials with pagination
    const tutorials: Tutorial[] = [];
    const paramCount = params.length;
    const dataSql = `SELECT t.id, t.title, t.description, t.model, t.provider, t.difficulty, t.tags, t.created_at, t.updated_at,
              mm.name as model_maker_name
       FROM tutorials t
       LEFT JOIN model_makers mm ON mm.id = t.model_maker_id
       ${whereSql}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    const dataParams = [...params, pageSize, offset];
    const tutorialRows = tutorialsDB.query<Tutorial>([
      dataSql,
      ...dataParams,
    ] as any);

    for await (const row of tutorialRows) {
      tutorials.push(row);
    }

    // Get filter options
    const [difficulties, providers, tags, makers] = await Promise.all([
      tutorialsDB.query<{ difficulty: string }>`SELECT DISTINCT difficulty FROM tutorials ORDER BY difficulty`,
      tutorialsDB.query<{ provider: string }>`SELECT DISTINCT provider FROM tutorials ORDER BY provider`,
      tutorialsDB.query<{ tag: string }>`SELECT DISTINCT unnest(tags) as tag FROM tutorials ORDER BY tag`,
      tutorialsDB.query<{ name: string }>`SELECT DISTINCT name FROM model_makers ORDER BY name`
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
        tags: filterTags,
        modelMakers: makers.map(m => m.name),
      }
    };
  }
);
