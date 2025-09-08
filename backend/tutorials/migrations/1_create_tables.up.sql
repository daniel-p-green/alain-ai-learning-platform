CREATE TABLE tutorials (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE tutorial_steps (
  id BIGSERIAL PRIMARY KEY,
  tutorial_id BIGINT NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  code_template TEXT,
  expected_output TEXT,
  model_params JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(tutorial_id, step_order)
);

CREATE TABLE user_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  tutorial_id BIGINT NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 1,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

CREATE INDEX idx_tutorials_difficulty ON tutorials(difficulty);
CREATE INDEX idx_tutorials_tags ON tutorials USING GIN(tags);
CREATE INDEX idx_tutorial_steps_tutorial_id ON tutorial_steps(tutorial_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
