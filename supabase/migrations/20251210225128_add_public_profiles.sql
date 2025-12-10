-- Migration: Add public profiles feature
-- Add username, is_public, bio, social_links to profiles
-- Add is_public, view_count to stacks

-- Modify profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add constraint for URL-safe usernames
ALTER TABLE public.profiles
  ADD CONSTRAINT username_format CHECK (
    username IS NULL OR username ~ '^[a-z0-9_-]{3,50}$'
  );

-- Modify stacks table
ALTER TABLE public.stacks
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Index for public profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_public ON public.profiles(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_stacks_public ON public.stacks(is_public) WHERE is_public = TRUE;

-- RLS: Allow public profile reads (use CREATE OR REPLACE pattern via DO block)
DO $$
BEGIN
  -- Drop and recreate profile policy
  DROP POLICY IF EXISTS "Anyone can view public profiles" ON public.profiles;
  CREATE POLICY "Anyone can view public profiles"
    ON public.profiles FOR SELECT
    USING (is_public = TRUE OR auth.uid() = id);

  -- Drop and recreate stack policy
  DROP POLICY IF EXISTS "Anyone can view public stacks" ON public.stacks;
  CREATE POLICY "Anyone can view public stacks"
    ON public.stacks FOR SELECT
    USING (is_public = TRUE OR auth.uid() = user_id);
END $$;

-- Function to increment view count (p_ prefix to avoid parameter shadowing)
CREATE OR REPLACE FUNCTION increment_view_count(p_stack_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stacks
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_stack_id AND is_public = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
