-- Add catalog metadata columns for notebooks and lessons
ALTER TABLE generated_notebooks
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS overview TEXT,
  ADD COLUMN IF NOT EXISTS maker JSONB,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS colab_compatible BOOLEAN,
  ADD COLUMN IF NOT EXISTS section_count INTEGER,
  ADD COLUMN IF NOT EXISTS last_generated TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE generated_lessons
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS overview TEXT,
  ADD COLUMN IF NOT EXISTS maker JSONB,
  ADD COLUMN IF NOT EXISTS quality_score INTEGER,
  ADD COLUMN IF NOT EXISTS section_count INTEGER,
  ADD COLUMN IF NOT EXISTS last_generated TIMESTAMPTZ DEFAULT NOW();

-- Seed last_generated for existing rows so ordering remains consistent
UPDATE generated_notebooks
  SET last_generated = COALESCE(last_generated, created_at);

UPDATE generated_lessons
  SET last_generated = COALESCE(last_generated, created_at);
