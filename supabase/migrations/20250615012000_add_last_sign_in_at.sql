-- Add last_sign_in_at column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz DEFAULT now();

-- Update existing profiles to have a default last_sign_in_at value
UPDATE profiles SET last_sign_in_at = created_at WHERE last_sign_in_at IS NULL; 