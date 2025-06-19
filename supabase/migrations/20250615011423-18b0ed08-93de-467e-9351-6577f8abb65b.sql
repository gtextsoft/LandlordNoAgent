
-- Create saved_properties table to store user's saved/favorite properties
CREATE TABLE public.saved_properties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_properties
CREATE POLICY "Users can view their own saved properties"
  ON public.saved_properties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save properties"
  ON public.saved_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved properties"
  ON public.saved_properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_saved_properties_user_id ON public.saved_properties(user_id);
CREATE INDEX idx_saved_properties_property_id ON public.saved_properties(property_id);
