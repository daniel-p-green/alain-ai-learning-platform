CREATE TABLE IF NOT EXISTS model_makers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  org_type TEXT NOT NULL,
  homepage TEXT,
  license TEXT,
  repo TEXT
);

ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS model_maker_id BIGINT REFERENCES model_makers(id);

CREATE INDEX IF NOT EXISTS idx_tutorials_maker_id ON tutorials(model_maker_id);

