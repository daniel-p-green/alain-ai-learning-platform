-- Catalog and publication support

-- Generated notebooks index for discovery/sharing
CREATE TABLE IF NOT EXISTS generated_notebooks (
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

CREATE INDEX IF NOT EXISTS idx_generated_notebooks_public
  ON generated_notebooks(visibility) WHERE visibility IN ('public','unlisted');
CREATE INDEX IF NOT EXISTS idx_generated_notebooks_model ON generated_notebooks(model);
CREATE INDEX IF NOT EXISTS idx_generated_notebooks_provider ON generated_notebooks(provider);
CREATE INDEX IF NOT EXISTS idx_generated_notebooks_difficulty ON generated_notebooks(difficulty);

-- Research index for quick lookup of research sets
CREATE TABLE IF NOT EXISTS research_index (
  id BIGSERIAL PRIMARY KEY,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  research_dir TEXT NOT NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stats JSONB,
  UNIQUE(model, provider)
);

-- Publication metadata on tutorials (optional)
ALTER TABLE tutorials
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public','unlisted')),
  ADD COLUMN IF NOT EXISTS share_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS author_id TEXT;

