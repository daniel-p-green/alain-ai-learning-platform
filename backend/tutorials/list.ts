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

// Retrieves all tutorials ordered by creation date.
export const list = api<void, ListTutorialsResponse>(
  { expose: true, method: "GET", path: "/tutorials" },
  async () => {
    const tutorials: Tutorial[] = [];
    const rows = tutorialsDB.query<Tutorial>`
      SELECT id, title, description, model, provider, difficulty, tags, created_at, updated_at
      FROM tutorials
      ORDER BY created_at DESC
    `;

    for await (const row of rows) {
      tutorials.push(row);
    }

    return { tutorials };
  }
);
