
-- Fix RLS policy recursion by creating security definer functions and proper policies

-- First, create a security definer function to get user roles without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_roles()
RETURNS app_role[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT ARRAY_AGG(role) 
    FROM public.user_roles 
    WHERE user_id = auth.uid()
$$;

-- Create a function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid() AND role = _role
    )
$$;

-- Drop existing policies on user_roles to fix recursion
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create new non-recursive policies for user_roles
CREATE POLICY "Users can view their own roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (public.current_user_has_role('admin'));

CREATE POLICY "Admins can manage all roles" 
    ON public.user_roles 
    FOR ALL 
    USING (public.current_user_has_role('admin'));

-- Enable RLS on other tables if not already enabled
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for properties
DROP POLICY IF EXISTS "Everyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can manage their properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;

CREATE POLICY "Everyone can view active properties" 
    ON public.properties 
    FOR SELECT 
    USING (status = 'active');

CREATE POLICY "Landlords can manage their properties" 
    ON public.properties 
    FOR ALL 
    USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can manage all properties" 
    ON public.properties 
    FOR ALL 
    USING (public.current_user_has_role('admin'));

-- Create RLS policies for chat_rooms
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Admins can view all chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can view their chat rooms" 
    ON public.chat_rooms 
    FOR SELECT 
    USING (auth.uid() = renter_id OR auth.uid() = landlord_id);

CREATE POLICY "Users can create chat rooms" 
    ON public.chat_rooms 
    FOR INSERT 
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Admins can view all chat rooms" 
    ON public.chat_rooms 
    FOR ALL 
    USING (public.current_user_has_role('admin'));

-- Create RLS policies for messages
DROP POLICY IF EXISTS "Users can view messages in their chat rooms" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their chat rooms" ON public.messages;

CREATE POLICY "Users can view messages in their chat rooms" 
    ON public.messages 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_rooms 
            WHERE chat_rooms.id = messages.chat_room_id 
            AND (chat_rooms.renter_id = auth.uid() OR chat_rooms.landlord_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their chat rooms" 
    ON public.messages 
    FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_rooms 
            WHERE chat_rooms.id = messages.chat_room_id 
            AND (chat_rooms.renter_id = auth.uid() OR chat_rooms.landlord_id = auth.uid())
        )
    );

-- Create storage bucket for property photos (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-photos',
    'property-photos',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies first, then recreate them
DROP POLICY IF EXISTS "Anyone can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property photos" ON storage.objects;

-- Create storage policies for property photos
CREATE POLICY "Anyone can view property photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-photos');

CREATE POLICY "Authenticated users can upload property photos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'property-photos' AND
    auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own property photos"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'property-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property photos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'property-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
