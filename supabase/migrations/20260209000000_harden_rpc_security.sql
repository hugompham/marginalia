-- Harden SECURITY DEFINER functions: set search_path + restrict execution grants

-- Fix get_collection_link_counts
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

REVOKE EXECUTE ON FUNCTION get_collection_link_counts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_collection_link_counts(UUID) TO authenticated;

-- Also harden existing SECURITY DEFINER functions from prior migrations
CREATE OR REPLACE FUNCTION get_due_cards_count(p_user_id UUID) RETURNS INTEGER AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER FROM public.cards
    WHERE user_id = p_user_id AND due <= NOW() AND NOT is_suspended
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

REVOKE EXECUTE ON FUNCTION get_due_cards_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_due_cards_count(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_today_review_count(p_user_id UUID) RETURNS INTEGER AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER FROM public.reviews
    WHERE user_id = p_user_id AND reviewed_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

REVOKE EXECUTE ON FUNCTION get_today_review_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_today_review_count(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_review BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.reviews
      WHERE user_id = p_user_id AND DATE(reviewed_at) = check_date
    ) INTO has_review;

    EXIT WHEN NOT has_review;
    streak := streak + 1;
    check_date := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public;

REVOKE EXECUTE ON FUNCTION get_user_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_streak(UUID) TO authenticated;
