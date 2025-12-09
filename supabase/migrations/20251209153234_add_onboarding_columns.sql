-- Add onboarding columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_profile JSONB;

-- Create index for faster onboarding status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding quiz';
COMMENT ON COLUMN profiles.onboarding_profile IS 'Stores onboarding quiz answers: {goals, experience, time_minutes, completed_at}';
