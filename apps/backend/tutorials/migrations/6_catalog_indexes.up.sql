-- Re-create catalog tables defensively (some deployments may have missed earlier migrations).
CREATE TABLE IF NOT EXISTS generated_notebooks (
  id BIGSERIAL PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  title TEXT,
  overview TEXT,
  maker JSONB,
  quality_score INTEGER,
  colab_compatible BOOLEAN,
  section_count INTEGER,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_generated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility TEXT NOT NULL CHECK (visibility IN ('private','public','unlisted')) DEFAULT 'private',
  share_slug TEXT UNIQUE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  size_bytes INTEGER,
  checksum TEXT
);

CREATE TABLE IF NOT EXISTS generated_lessons (
  id BIGSERIAL PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  title TEXT,
  overview TEXT,
  maker JSONB,
  quality_score INTEGER,
  section_count INTEGER,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_generated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visibility TEXT NOT NULL CHECK (visibility IN ('private','public','unlisted')) DEFAULT 'private',
  share_slug TEXT UNIQUE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  size_bytes INTEGER,
  checksum TEXT
);

-- Generated notebooks
CREATE INDEX IF NOT EXISTS idx_generated_notebooks_visibility_created_at
  ON generated_notebooks (visibility, created_at);

CREATE INDEX IF NOT EXISTS idx_generated_notebooks_model_provider_difficulty
  ON generated_notebooks (model, provider, difficulty);

-- Tags assumed to be an array column
CREATE INDEX IF NOT EXISTS idx_generated_notebooks_tags
  ON generated_notebooks USING GIN (tags);

-- Generated lessons
CREATE INDEX IF NOT EXISTS idx_generated_lessons_visibility_created_at
  ON generated_lessons (visibility, created_at);

CREATE INDEX IF NOT EXISTS idx_generated_lessons_model_provider_difficulty
  ON generated_lessons (model, provider, difficulty);

CREATE INDEX IF NOT EXISTS idx_generated_lessons_tags
  ON generated_lessons USING GIN (tags);
