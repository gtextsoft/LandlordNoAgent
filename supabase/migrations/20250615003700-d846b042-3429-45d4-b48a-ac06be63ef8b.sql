
-- Apply Row Level Security to the profiles table to protect user data.

-- First, enable RLS on the profiles table.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create policies for the 'profiles' table.

-- Allow any authenticated user to view any profile.
-- This is useful for renters to see landlord details and vice-versa.
CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Allow users to create their own profile entry.
-- The check ensures that a user can only create a profile for their own user ID.
CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile.
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow users to delete their own profile.
CREATE POLICY "Users can delete their own profile."
ON public.profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Allow admin users to perform any action on any profile.
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.current_user_has_role('admin'));
