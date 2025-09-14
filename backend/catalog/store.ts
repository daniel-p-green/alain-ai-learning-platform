import { tutorialsDB } from "../tutorials/db";

export type Visibility = 'private' | 'public' | 'unlisted';

export interface NotebookIndexRecord {
  file_path: string;
  model: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_by?: string | null;
  visibility?: Visibility;
  tags?: string[];
  size_bytes?: number;
  checksum?: string;
}

export async function indexGeneratedNotebook(r: NotebookIndexRecord) {
  const vis = r.visibility || 'private';
  const tags = r.tags || [];
  await tutorialsDB.exec`
    INSERT INTO generated_notebooks (file_path, model, provider, difficulty, created_by, visibility, tags, size_bytes, checksum)
    VALUES (${r.file_path}, ${r.model}, ${r.provider}, ${r.difficulty}, ${r.created_by || null}, ${vis}, ${tags}, ${r.size_bytes || null}, ${r.checksum || null})
    ON CONFLICT (file_path) DO UPDATE SET
      model = EXCLUDED.model,
      provider = EXCLUDED.provider,
      difficulty = EXCLUDED.difficulty,
      created_by = COALESCE(generated_notebooks.created_by, EXCLUDED.created_by),
      visibility = EXCLUDED.visibility,
      tags = EXCLUDED.tags,
      size_bytes = EXCLUDED.size_bytes,
      checksum = EXCLUDED.checksum
  `;
}

export async function publishNotebook(filePath: string, visibility: Visibility): Promise<{ share_slug?: string | null }>
{
  // Generate slug for unlisted if missing
  let shareSlug: string | null = null;
  if (visibility === 'unlisted') {
    shareSlug = Math.random().toString(36).slice(2, 10);
  }
  const row = await tutorialsDB.queryRow<{ share_slug: string | null }>`
    UPDATE generated_notebooks
      SET visibility = ${visibility},
          share_slug = COALESCE(share_slug, ${shareSlug})
      WHERE file_path = ${filePath}
      RETURNING share_slug
  `;
  return { share_slug: row?.share_slug || shareSlug };
}

export interface ResearchIndexRecord {
  model: string;
  provider: string;
  research_dir: string;
  collected_at?: string;
  stats?: any;
}

export async function upsertResearchIndex(r: ResearchIndexRecord) {
  await tutorialsDB.exec`
    INSERT INTO research_index (model, provider, research_dir, collected_at, stats)
    VALUES (${r.model}, ${r.provider}, ${r.research_dir}, ${r.collected_at || new Date().toISOString()}, ${r.stats || null})
    ON CONFLICT (model, provider) DO UPDATE SET
      research_dir = EXCLUDED.research_dir,
      collected_at = EXCLUDED.collected_at,
      stats = EXCLUDED.stats
  `;
}

// Lessons indexing
export interface LessonIndexRecord {
  file_path: string;
  model: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  created_by?: string | null;
  visibility?: Visibility;
  tags?: string[];
  size_bytes?: number;
  checksum?: string;
}

export async function indexGeneratedLesson(r: LessonIndexRecord) {
  const vis = r.visibility || 'private';
  const tags = r.tags || [];
  await tutorialsDB.exec`
    INSERT INTO generated_lessons (file_path, model, provider, difficulty, created_by, visibility, tags, size_bytes, checksum)
    VALUES (${r.file_path}, ${r.model}, ${r.provider}, ${r.difficulty}, ${r.created_by || null}, ${vis}, ${tags}, ${r.size_bytes || null}, ${r.checksum || null})
    ON CONFLICT (file_path) DO UPDATE SET
      model = EXCLUDED.model,
      provider = EXCLUDED.provider,
      difficulty = EXCLUDED.difficulty,
      created_by = COALESCE(generated_lessons.created_by, EXCLUDED.created_by),
      visibility = EXCLUDED.visibility,
      tags = EXCLUDED.tags,
      size_bytes = EXCLUDED.size_bytes,
      checksum = EXCLUDED.checksum
  `;
}

export async function publishLesson(filePath: string, visibility: Visibility): Promise<{ share_slug?: string | null }>
{
  let shareSlug: string | null = null;
  if (visibility === 'unlisted') shareSlug = Math.random().toString(36).slice(2, 10);
  const row = await tutorialsDB.queryRow<{ share_slug: string | null }>`
    UPDATE generated_lessons
      SET visibility = ${visibility},
          share_slug = COALESCE(share_slug, ${shareSlug})
      WHERE file_path = ${filePath}
      RETURNING share_slug
  `;
  return { share_slug: row?.share_slug || shareSlug };
}
