-- Add favorite_protocol_ids column to profiles table
-- Security: Protected by existing RLS policy "Users can update own profile" (auth.uid() = id)
-- See supabase/schema.sql lines 90-92 for policy definition
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_protocol_ids UUID[] DEFAULT '{}';

-- Comment for documentation
COMMENT ON COLUMN profiles.favorite_protocol_ids IS 'Array of protocol UUIDs that user has favorited';
