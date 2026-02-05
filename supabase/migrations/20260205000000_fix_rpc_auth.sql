-- Fix SECURITY DEFINER RPC functions to verify auth.uid() matches p_user_id
-- This prevents users from querying other users' data by passing arbitrary user_id

-- Get due cards count for a user
CREATE OR REPLACE FUNCTION get_due_cards_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Verify the caller is the requested user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot query other users data';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.cards
    WHERE user_id = p_user_id
      AND NOT is_suspended
      AND due <= NOW()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get today's review count for a user
CREATE OR REPLACE FUNCTION get_today_review_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Verify the caller is the requested user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot query other users data';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.reviews
    WHERE user_id = p_user_id
      AND reviewed_at >= CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get user's current streak
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_has_reviews BOOLEAN;
BEGIN
  -- Verify the caller is the requested user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot query other users data';
  END IF;

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
