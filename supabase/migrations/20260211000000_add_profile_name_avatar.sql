-- Add profile name, avatar, and onboarding fields
ALTER TABLE public.profiles
  ADD COLUMN first_name text,
  ADD COLUMN last_name text,
  ADD COLUMN avatar_url text,
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
