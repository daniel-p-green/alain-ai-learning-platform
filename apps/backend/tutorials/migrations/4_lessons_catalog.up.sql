-- Catalog index for generated lessons
CREATE TABLE IF NOT EXISTS generated_lessons (
  id BIGSERIAL PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility TEXT NOT NULL CHECK (visibility IN ('private','public','unlisted')) DEFAULT 'private',
  share_slug TEXT UNIQUE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  size_bytes INTEGER,
  checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_generated_lessons_public
  ON generated_lessons(visibility) WHERE visibility IN ('public','unlisted');
CREATE INDEX IF NOT EXISTS idx_generated_lessons_model ON generated_lessons(model);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_provider ON generated_lessons(provider);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_difficulty ON generated_lessons(difficulty);

