
-- Create an enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'landlord', 'renter');

-- Create a user_roles table to support multiple roles per user
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
    ON public.user_roles 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all roles" 
    ON public.user_roles 
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create a function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create a function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS app_role[]
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT ARRAY_AGG(role) 
    FROM public.user_roles 
    WHERE user_id = _user_id
$$;

-- Insert Stephen Akintayo's roles (replace with his actual user ID)
-- First, let's find Stephen's user ID from the profiles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM public.profiles 
WHERE email = 'products@stephenakintayo.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'landlord'::app_role
FROM public.profiles 
WHERE email = 'products@stephenakintayo.com'
ON CONFLICT (user_id, role) DO NOTHING;
