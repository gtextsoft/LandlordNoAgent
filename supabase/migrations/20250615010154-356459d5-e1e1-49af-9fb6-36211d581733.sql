
-- This migration enhances Row-Level Security for the 'profiles' table,
-- replacing overly permissive rules with granular access controls.

-- Step 1: Drop all old or potentially conflicting policies to ensure a clean slate.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Chat participants can view each other's profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view landlord profiles for active properties" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- The following policies might have been created with a trailing period, so we drop them as well.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;


-- Step 2: Create the new, more secure set of SELECT policies for the 'profiles' table.

-- Policy 2.1: Users can view their own profile.
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2.2: Allow users to see the profiles of people they are in a chat with.
CREATE POLICY "Chat participants can view each other's profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE (chat_rooms.landlord_id = auth.uid() AND chat_rooms.renter_id = profiles.id)
         OR (chat_rooms.renter_id = auth.uid() AND chat_rooms.landlord_id = profiles.id)
    )
  );

-- Policy 2.3: Allow anyone to view landlord profiles for active properties.
CREATE POLICY "Public can view landlord profiles for active properties"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.landlord_id = profiles.id
      AND properties.status = 'active'
    )
  );

-- Step 3: Create policies for Admin management of profiles.

-- Policy 3.1: Admins can view all profiles.
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.current_user_has_role('admin'));

-- Policy 3.2: Admins can manage all profiles.
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('admin'));
