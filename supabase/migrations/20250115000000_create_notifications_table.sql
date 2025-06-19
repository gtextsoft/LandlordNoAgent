/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification content)
      - `read` (boolean, read status)
      - `action_url` (text, optional URL for action)
      - `metadata` (jsonb, additional data)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for users to access their own notifications
*/

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'message',
  'property_inquiry',
  'property_approved',
  'property_rejected',
  'booking_request',
  'booking_confirmed',
  'booking_cancelled',
  'payment_received',
  'maintenance_request',
  'system_update'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create function to automatically create notifications for new messages
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  property_title text;
  sender_name text;
BEGIN
  -- Get the recipient (the other person in the chat room)
  SELECT 
    CASE 
      WHEN NEW.sender_id = cr.renter_id THEN cr.landlord_id
      ELSE cr.renter_id
    END,
    p.title
  INTO recipient_id, property_title
  FROM chat_rooms cr
  JOIN properties p ON cr.property_id = p.id
  WHERE cr.id = NEW.chat_room_id;

  -- Get sender name
  SELECT full_name INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Create notification for the recipient
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    recipient_id,
    'message',
    'New Message',
    sender_name || ' sent you a message about ' || property_title,
    '/messages/' || NEW.chat_room_id,
    jsonb_build_object(
      'chat_room_id', NEW.chat_room_id,
      'sender_id', NEW.sender_id,
      'property_title', property_title
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Create function to create property inquiry notifications
CREATE OR REPLACE FUNCTION create_property_inquiry_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  renter_name text;
BEGIN
  -- Get property title and renter name
  SELECT p.title, pr.full_name
  INTO property_title, renter_name
  FROM properties p, profiles pr
  WHERE p.id = NEW.property_id AND pr.id = NEW.renter_id;

  -- Create notification for the landlord
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    NEW.landlord_id,
    'property_inquiry',
    'New Property Inquiry',
    renter_name || ' is interested in your property: ' || property_title,
    '/messages/' || NEW.id,
    jsonb_build_object(
      'chat_room_id', NEW.id,
      'property_id', NEW.property_id,
      'renter_id', NEW.renter_id,
      'property_title', property_title
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property inquiry notifications
CREATE TRIGGER create_property_inquiry_notification_trigger
  AFTER INSERT ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION create_property_inquiry_notification(); 