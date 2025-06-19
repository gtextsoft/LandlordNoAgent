/*
  # Create messages table

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `chat_room_id` (uuid, foreign key to chat_rooms)
      - `sender_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for chat participants to access messages
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Chat participants can access messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = messages.chat_room_id
      AND (chat_rooms.renter_id = auth.uid() OR chat_rooms.landlord_id = auth.uid())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);