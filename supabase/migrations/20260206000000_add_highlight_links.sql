-- Highlight Links: connections between highlights (manual or AI-suggested)
CREATE TABLE public.highlight_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  target_highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Link metadata
  link_type TEXT NOT NULL DEFAULT 'manual' CHECK (link_type IN ('manual', 'ai_suggested')),
  description TEXT,
  ai_confidence DECIMAL(3,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'pending')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate and self links
  CONSTRAINT highlight_links_no_self_link CHECK (source_highlight_id != target_highlight_id),
  UNIQUE(source_highlight_id, target_highlight_id, user_id)
);

COMMENT ON TABLE public.highlight_links IS 'Connections between highlights, created manually or suggested by AI';

-- Indexes
CREATE INDEX idx_highlight_links_user ON public.highlight_links(user_id);
CREATE INDEX idx_highlight_links_source ON public.highlight_links(source_highlight_id);
CREATE INDEX idx_highlight_links_target ON public.highlight_links(target_highlight_id);
CREATE INDEX idx_highlight_links_status ON public.highlight_links(user_id, status);

-- RLS
ALTER TABLE public.highlight_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own highlight_links"
  ON public.highlight_links FOR ALL
  USING (auth.uid() = user_id);

-- RPC: aggregate cross-collection link counts for the mindmap overview
CREATE OR REPLACE FUNCTION get_collection_link_counts(p_user_id UUID)
RETURNS TABLE (
  source_collection_id UUID,
  target_collection_id UUID,
  link_count BIGINT
) AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    sh.collection_id AS source_collection_id,
    th.collection_id AS target_collection_id,
    COUNT(*) AS link_count
  FROM public.highlight_links hl
  JOIN public.highlights sh ON sh.id = hl.source_highlight_id
  JOIN public.highlights th ON th.id = hl.target_highlight_id
  WHERE hl.user_id = p_user_id
    AND hl.status = 'active'
    AND sh.collection_id != th.collection_id
  GROUP BY sh.collection_id, th.collection_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
