-- =============================================================================
-- Add key_hint column to api_keys table
-- Stores the last 4 characters of the original API key for display purposes
-- =============================================================================

ALTER TABLE public.api_keys ADD COLUMN key_hint TEXT;

COMMENT ON COLUMN public.api_keys.key_hint IS 'Last 4 characters of the original API key for display purposes';
