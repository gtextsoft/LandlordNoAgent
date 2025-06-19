/*
  # Create properties table

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `landlord_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `price` (numeric)
      - `location` (text)
      - `photo_url` (text)
      - `status` (text, check constraint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `properties` table
    - Add policies for landlords to manage their properties
    - Add policy for public read access to active properties
*/

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  location text,
  photo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Landlords can manage their properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (landlord_id = auth.uid());

CREATE POLICY "Active properties are viewable by everyone"
  ON properties
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "All properties viewable by admins"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();