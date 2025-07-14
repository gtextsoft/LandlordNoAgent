-- Add rent_amount column and copy from properties table
ALTER TABLE rental_applications
ADD COLUMN rent_amount DECIMAL(10,2);

-- Update existing applications with the rent amount from properties
UPDATE rental_applications ra
SET rent_amount = p.price
FROM properties p
WHERE ra.property_id = p.id;

-- Make rent_amount required for future applications
ALTER TABLE rental_applications
ALTER COLUMN rent_amount SET NOT NULL;

-- Add unique constraint to prevent multiple applications
ALTER TABLE rental_applications
ADD CONSTRAINT unique_renter_property 
UNIQUE (renter_id, property_id);

-- Add rejection_reason column for better feedback
ALTER TABLE rental_applications
ADD COLUMN rejection_reason TEXT;

-- Update the notification trigger to include rent amount and landlord notifications
CREATE OR REPLACE FUNCTION handle_rental_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  landlord_name text;
  landlord_id uuid;
  renter_name text;
BEGIN
  -- Get property title, landlord info, and renter name
  SELECT p.title, pr.full_name, p.landlord_id, renter_pr.full_name
  INTO property_title, landlord_name, landlord_id, renter_name
  FROM properties p
  JOIN profiles pr ON p.landlord_id = pr.id
  JOIN profiles renter_pr ON NEW.renter_id = renter_pr.id
  WHERE p.id = NEW.property_id;

  -- Create notification for the renter about status change
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    NEW.renter_id,
    CASE 
      WHEN NEW.status = 'application_approved' THEN 'property_approved'::notification_type
      WHEN NEW.status = 'application_rejected' THEN 'property_rejected'::notification_type
      ELSE 'system_update'::notification_type
    END,
    CASE 
      WHEN NEW.status = 'application_approved' THEN 'Application Approved!'
      WHEN NEW.status = 'application_rejected' THEN 'Application Status Update'
      ELSE 'Application Updated'
    END,
    CASE 
      WHEN NEW.status = 'application_approved' THEN 'Your application for ' || property_title || ' has been approved! Please proceed with the payment of ₦' || NEW.rent_amount::text || '/year.'
      WHEN NEW.status = 'application_rejected' THEN 'Your application for ' || property_title || ' was not approved.' || COALESCE(' Reason: ' || NEW.rejection_reason, '')
      ELSE 'Your application status for ' || property_title || ' has been updated to ' || NEW.status
    END,
    CASE 
      WHEN NEW.status = 'application_approved' THEN '/payment/' || NEW.id
      ELSE '/my-applications'
    END,
    jsonb_build_object(
      'application_id', NEW.id,
      'property_id', NEW.property_id,
      'property_title', property_title,
      'landlord_name', landlord_name,
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason,
      'rent_amount', NEW.rent_amount
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql; 

-- Create function to handle new application notifications to landlords
CREATE OR REPLACE FUNCTION handle_new_rental_application()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  landlord_id uuid;
  renter_name text;
BEGIN
  -- Get property title, landlord info, and renter name
  SELECT p.title, p.landlord_id, pr.full_name
  INTO property_title, landlord_id, renter_name
  FROM properties p
  JOIN profiles pr ON NEW.renter_id = pr.id
  WHERE p.id = NEW.property_id;

  -- Create notification for the landlord about new application
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    metadata
  ) VALUES (
    landlord_id,
    'property_inquiry'::notification_type,
    'New Rental Application',
    renter_name || ' has submitted an application for your property: ' || property_title,
    '/applications?property=' || NEW.property_id,
    jsonb_build_object(
      'application_id', NEW.id,
      'property_id', NEW.property_id,
      'property_title', property_title,
      'renter_id', NEW.renter_id,
      'renter_name', renter_name,
      'rent_amount', NEW.rent_amount
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_rental_application_notification_trigger ON rental_applications;

-- Create trigger for rental application status change notifications
CREATE TRIGGER create_rental_application_notification_trigger
  AFTER UPDATE OF status ON rental_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_rental_application_status_change();

-- Create trigger for new application notifications to landlords
CREATE TRIGGER create_new_rental_application_notification_trigger
  AFTER INSERT ON rental_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_rental_application(); 