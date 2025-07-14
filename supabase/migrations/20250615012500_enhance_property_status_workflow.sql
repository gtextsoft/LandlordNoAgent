-- Enhance property status workflow

-- First, drop existing status check constraint
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

-- Add new status check constraint with proper workflow states
ALTER TABLE properties 
ADD CONSTRAINT properties_status_check 
CHECK (status IN ('pending', 'active', 'rented', 'inactive', 'maintenance', 'archived'));

-- Create property_status_history table to track status changes
CREATE TABLE IF NOT EXISTS property_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_status_history_property_id ON property_status_history(property_id);
CREATE INDEX IF NOT EXISTS idx_property_status_history_created_at ON property_status_history(created_at);

-- Create function to validate status transitions
CREATE OR REPLACE FUNCTION validate_property_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- Define valid status transitions
    IF (OLD.status = 'pending' AND NEW.status NOT IN ('active', 'inactive')) OR
       (OLD.status = 'active' AND NEW.status NOT IN ('rented', 'inactive', 'maintenance', 'archived')) OR
       (OLD.status = 'rented' AND NEW.status NOT IN ('active', 'maintenance', 'archived')) OR
       (OLD.status = 'inactive' AND NEW.status NOT IN ('active', 'archived')) OR
       (OLD.status = 'maintenance' AND NEW.status NOT IN ('active', 'inactive', 'archived')) OR
       (OLD.status = 'archived' AND NEW.status NOT IN ('active'))
    THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
    
    -- Insert into status history
    INSERT INTO property_status_history (
        property_id,
        old_status,
        new_status,
        changed_by,
        reason
    ) VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        auth.uid(),
        CASE
            WHEN NEW.status = 'active' THEN 'Property activated'
            WHEN NEW.status = 'rented' THEN 'Property rented out'
            WHEN NEW.status = 'inactive' THEN 'Property deactivated'
            WHEN NEW.status = 'maintenance' THEN 'Property under maintenance'
            WHEN NEW.status = 'archived' THEN 'Property archived'
            ELSE 'Status updated'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status transitions
DROP TRIGGER IF EXISTS trigger_property_status_transition ON properties;
CREATE TRIGGER trigger_property_status_transition
    BEFORE UPDATE OF status ON properties
    FOR EACH ROW
    EXECUTE FUNCTION validate_property_status_transition();

-- Add helpful comments
COMMENT ON TABLE property_status_history IS 'Tracks the history of property status changes';
COMMENT ON COLUMN property_status_history.old_status IS 'Previous status before the change';
COMMENT ON COLUMN property_status_history.new_status IS 'New status after the change';
COMMENT ON COLUMN property_status_history.reason IS 'Reason for the status change';

-- Update existing properties to ensure they have valid statuses
UPDATE properties
SET status = 'inactive'
WHERE status NOT IN ('pending', 'active', 'rented', 'inactive', 'maintenance', 'archived'); 

-- Add average_rating column to properties table
ALTER TABLE properties
ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.00;

-- Create function to update average_rating
CREATE OR REPLACE FUNCTION update_property_average_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET average_rating = (
    SELECT COALESCE(AVG(verification_score), 0.00)
    FROM property_reviews
    WHERE property_id = NEW.property_id
    AND verification_score IS NOT NULL
  )
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update average_rating when a review is added/updated
CREATE TRIGGER update_property_rating
AFTER INSERT OR UPDATE OF verification_score
ON property_reviews
FOR EACH ROW
EXECUTE FUNCTION update_property_average_rating(); 

-- Create function to handle rental application status changes
CREATE OR REPLACE FUNCTION handle_rental_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  landlord_name text;
BEGIN
  -- Get property title and landlord name
  SELECT p.title, pr.full_name
  INTO property_title, landlord_name
  FROM properties p
  JOIN profiles pr ON p.landlord_id = pr.id
  WHERE p.id = NEW.property_id;

  -- Create notification for the renter
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
      WHEN NEW.status = 'approved' THEN 'property_approved'::notification_type
      WHEN NEW.status = 'rejected' THEN 'property_rejected'::notification_type
      ELSE 'system_update'::notification_type
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Application Approved!'
      WHEN NEW.status = 'rejected' THEN 'Application Status Update'
      ELSE 'Application Updated'
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN 'Your application for ' || property_title || ' has been approved! Please proceed with the payment.'
      WHEN NEW.status = 'rejected' THEN 'Your application for ' || property_title || ' was not approved.' || COALESCE(' Reason: ' || NEW.rejection_reason, '')
      ELSE 'Your application status for ' || property_title || ' has been updated to ' || NEW.status
    END,
    CASE 
      WHEN NEW.status = 'approved' THEN '/applications/' || NEW.id || '/payment'
      ELSE '/applications'
    END,
    jsonb_build_object(
      'property_id', NEW.property_id,
      'property_title', property_title,
      'landlord_name', landlord_name,
      'status', NEW.status,
      'rejection_reason', NEW.rejection_reason
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rental application notifications
CREATE TRIGGER create_rental_application_notification_trigger
  AFTER UPDATE OF status ON rental_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_rental_application_status_change(); 