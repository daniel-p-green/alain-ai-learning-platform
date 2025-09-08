import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface CreateTutorialRequest {
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

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

// Creates a new tutorial.
export const create = api<CreateTutorialRequest, Tutorial>(
  { expose: true, method: "POST", path: "/tutorials" },
  async (req) => {
    const tutorial = await tutorialsDB.queryRow<Tutorial>`
      INSERT INTO tutorials (title, description, model, provider, difficulty, tags)
      VALUES (${req.title}, ${req.description}, ${req.model}, ${req.provider}, ${req.difficulty}, ${req.tags})
      RETURNING id, title, description, model, provider, difficulty, tags, created_at, updated_at
    `;

    return tutorial!;
  }
);
