-- Marginalia Initial Schema
-- Creates all tables, indexes, RLS policies, and triggers

-- =============================================================================
-- PROFILES (extends auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  daily_review_goal INTEGER DEFAULT 20,
  preferred_question_types TEXT[] DEFAULT ARRAY['cloze', 'definition'],
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with app-specific settings';

-- =============================================================================
-- API KEYS (encrypted at rest via Supabase Vault in production)
-- =============================================================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic')),
  encrypted_key TEXT NOT NULL,
  model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

COMMENT ON TABLE public.api_keys IS 'User API keys for AI providers (encrypted)';

-- =============================================================================
-- COLLECTIONS (books, articles, etc.)
-- =============================================================================
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  title TEXT NOT NULL,
  author TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('web_article', 'manual', 'kindle', 'epub', 'pdf')),
  source_url TEXT,
  cover_image_url TEXT,

  -- Stats (denormalized for performance)
  highlight_count INTEGER DEFAULT 0,
  card_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.collections IS 'Collections of highlights from books, articles, etc.';

-- =============================================================================
-- HIGHLIGHTS
-- =============================================================================
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Content
  text TEXT NOT NULL,
  note TEXT,  -- User's annotation

  -- Location context
  chapter TEXT,
  page_number INTEGER,
  location_percent DECIMAL(5,2),  -- 0-100% through document

  -- Surrounding context (for AI generation)
  context_before TEXT,  -- ~100 chars before
  context_after TEXT,   -- ~100 chars after

  -- Status
  has_cards BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.highlights IS 'Text highlights from collections';

-- =============================================================================
-- TAGS
-- =============================================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,  -- Hex color

  UNIQUE(user_id, name)
);

COMMENT ON TABLE public.tags IS 'User-defined tags for organizing highlights';

-- =============================================================================
-- HIGHLIGHT_TAGS (junction table)
-- =============================================================================
CREATE TABLE public.highlight_tags (
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,

  PRIMARY KEY (highlight_id, tag_id)
);

COMMENT ON TABLE public.highlight_tags IS 'Many-to-many relationship between highlights and tags';

-- =============================================================================
-- CARDS (flashcards)
-- =============================================================================
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Question content
  question_type TEXT NOT NULL CHECK (question_type IN ('cloze', 'definition', 'conceptual')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,

  -- For cloze: store the full text with {{c1::deletion}} markers
  cloze_text TEXT,

  -- Generation metadata
  is_ai_generated BOOLEAN DEFAULT true,
  ai_confidence DECIMAL(3,2),  -- 0-1 score

  -- FSRS fields
  stability DECIMAL(10,4) DEFAULT 0,
  difficulty DECIMAL(10,4) DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  last_review TIMESTAMPTZ,
  due TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_suspended BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.cards IS 'Flashcards generated from highlights with FSRS scheduling';

-- =============================================================================
-- REVIEWS (individual review events)
-- =============================================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),

  -- Snapshot of FSRS state before this review
  stability_before DECIMAL(10,4),
  difficulty_before DECIMAL(10,4),
  state_before TEXT,

  -- Time spent (milliseconds)
  duration_ms INTEGER,

  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.reviews IS 'Individual card review events for tracking progress';

-- =============================================================================
-- PENDING QUESTIONS (awaiting user approval)
-- =============================================================================
CREATE TABLE public.pending_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  question_type TEXT NOT NULL CHECK (question_type IN ('cloze', 'definition', 'conceptual')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  cloze_text TEXT,
  ai_confidence DECIMAL(3,2),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'edited')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pending_questions IS 'AI-generated questions awaiting user review';

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_collections_user ON public.collections(user_id);
CREATE INDEX idx_collections_updated ON public.collections(updated_at DESC);

CREATE INDEX idx_highlights_collection ON public.highlights(collection_id);
CREATE INDEX idx_highlights_user ON public.highlights(user_id);
CREATE INDEX idx_highlights_created ON public.highlights(created_at DESC);

CREATE INDEX idx_cards_user_due ON public.cards(user_id, due) WHERE NOT is_suspended;
CREATE INDEX idx_cards_highlight ON public.cards(highlight_id);
CREATE INDEX idx_cards_state ON public.cards(user_id, state) WHERE NOT is_suspended;

CREATE INDEX idx_reviews_card ON public.reviews(card_id);
CREATE INDEX idx_reviews_user_date ON public.reviews(user_id, reviewed_at DESC);

CREATE INDEX idx_pending_questions_highlight ON public.pending_questions(highlight_id);
CREATE INDEX idx_pending_questions_user_status ON public.pending_questions(user_id, status);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_questions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- API Keys: users can only access their own
CREATE POLICY "Users can access own api_keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id);

-- Collections: users can only access their own
CREATE POLICY "Users can access own collections"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id);

-- Highlights: users can only access their own
CREATE POLICY "Users can access own highlights"
  ON public.highlights FOR ALL
  USING (auth.uid() = user_id);

-- Tags: users can only access their own
CREATE POLICY "Users can access own tags"
  ON public.tags FOR ALL
  USING (auth.uid() = user_id);

-- Highlight_tags: users can access tags for their highlights
CREATE POLICY "Users can access own highlight_tags"
  ON public.highlight_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.highlights h
      WHERE h.id = highlight_tags.highlight_id
      AND h.user_id = auth.uid()
    )
  );

-- Cards: users can only access their own
CREATE POLICY "Users can access own cards"
  ON public.cards FOR ALL
  USING (auth.uid() = user_id);

-- Reviews: users can only access their own
CREATE POLICY "Users can access own reviews"
  ON public.reviews FOR ALL
  USING (auth.uid() = user_id);

-- Pending questions: users can only access their own
CREATE POLICY "Users can access own pending_questions"
  ON public.pending_questions FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGERS & FUNCTIONS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update collection highlight count
CREATE OR REPLACE FUNCTION update_collection_highlight_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.collections
    SET highlight_count = highlight_count + 1,
        updated_at = NOW()
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.collections
    SET highlight_count = GREATEST(highlight_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_collection_highlight_count
  AFTER INSERT OR DELETE ON public.highlights
  FOR EACH ROW EXECUTE FUNCTION update_collection_highlight_count();

-- Update collection card count when cards added/removed
CREATE OR REPLACE FUNCTION update_collection_card_count()
RETURNS TRIGGER AS $$
DECLARE
  v_collection_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT collection_id INTO v_collection_id
    FROM public.highlights
    WHERE id = NEW.highlight_id;

    UPDATE public.collections
    SET card_count = card_count + 1,
        updated_at = NOW()
    WHERE id = v_collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT collection_id INTO v_collection_id
    FROM public.highlights
    WHERE id = OLD.highlight_id;

    UPDATE public.collections
    SET card_count = GREATEST(card_count - 1, 0),
        updated_at = NOW()
    WHERE id = v_collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_collection_card_count
  AFTER INSERT OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION update_collection_card_count();

-- Update highlight has_cards flag
CREATE OR REPLACE FUNCTION update_highlight_has_cards()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.highlights
    SET has_cards = true,
        updated_at = NOW()
    WHERE id = NEW.highlight_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.highlights
    SET has_cards = EXISTS (
      SELECT 1 FROM public.cards WHERE highlight_id = OLD.highlight_id
    ),
    updated_at = NOW()
    WHERE id = OLD.highlight_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_highlight_has_cards
  AFTER INSERT OR DELETE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION update_highlight_has_cards();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get due cards count for a user
CREATE OR REPLACE FUNCTION get_due_cards_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.cards
  WHERE user_id = p_user_id
    AND NOT is_suspended
    AND due <= NOW();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get today's review count for a user
CREATE OR REPLACE FUNCTION get_today_review_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.reviews
  WHERE user_id = p_user_id
    AND reviewed_at >= CURRENT_DATE;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Get user's current streak
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_has_reviews BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE user_id = p_user_id
        AND reviewed_at::DATE = v_current_date
    ) INTO v_has_reviews;

    IF v_has_reviews THEN
      v_streak := v_streak + 1;
      v_current_date := v_current_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    -- Safety limit
    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
