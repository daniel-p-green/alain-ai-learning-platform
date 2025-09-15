-- Catalog performance indexes
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

