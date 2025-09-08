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
}

interface ListQuery {
  page?: number;
  pageSize?: number;
  tags?: string[];
  difficulty?: string;
}

// Retrieves all tutorials ordered by creation date.
export const list = api<ListQuery, ListTutorialsResponse>(
  { expose: true, method: "GET", path: "/tutorials" },
  async (q) => {
    const page = Math.max(1, q.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, q.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const whereParts: string[] = [];
    const params: any[] = [];
    if (q.difficulty) {
      whereParts.push(`difficulty = ${params.push(q.difficulty) && `$${params.length}`}`);
    }
    if (q.tags && q.tags.length) {
      whereParts.push(`tags && ${params.push(q.tags) && `$${params.length}`}::text[]`);
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    const tutorials: Tutorial[] = [];
    const rows = tutorialsDB.query<Tutorial>([
      `SELECT id, title, description, model, provider, difficulty, tags, created_at, updated_at\n` +
        `FROM tutorials ${whereSql}\n` +
        `ORDER BY created_at DESC\n` +
        `LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    ] as any);

    for await (const row of rows) {
      tutorials.push(row);
    }

    return { tutorials };
  }
);
