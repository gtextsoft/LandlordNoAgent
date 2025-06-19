/*
  # Create chat rooms table

  1. New Tables
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `renter_id` (uuid, foreign key to profiles)
      - `landlord_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `chat_rooms` table
    - Add policies for participants to access their chat rooms
*/

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, renter_id)
);

-- Enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can access their rooms"
  ON chat_rooms
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = renter_id OR 
    auth.uid() = landlord_id
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_property_renter ON chat_rooms(property_id, renter_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_landlord ON chat_rooms(landlord_id);