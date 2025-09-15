CREATE TABLE IF NOT EXISTS tutorial_versions (
  id BIGSERIAL PRIMARY KEY,
  tutorial_id BIGINT NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  author_id TEXT,
  snapshot JSONB NOT NULL,
  UNIQUE(tutorial_id, version)
);

CREATE INDEX IF NOT EXISTS idx_tutorial_versions_tid ON tutorial_versions(tutorial_id);

