-- Collection summaries (one per collection, latest wins)
CREATE TABLE collection_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary text NOT NULL,
  themes text[] NOT NULL DEFAULT '{}',
  highlight_count integer NOT NULL,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(collection_id, user_id)
);

ALTER TABLE collection_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own summaries" ON collection_summaries
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER update_summary_updated_at
  BEFORE UPDATE ON collection_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Quiz sessions (multiple per collection, history)
CREATE TABLE quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questions jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]',
  total_questions integer NOT NULL,
  correct_count integer NOT NULL DEFAULT 0,
  score_percent integer NOT NULL DEFAULT 0,
  duration_ms integer NOT NULL DEFAULT 0,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own quiz sessions" ON quiz_sessions
  FOR ALL USING (user_id = auth.uid());
