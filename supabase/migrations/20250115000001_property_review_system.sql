-- Add property review system enhancements

-- First, ensure we have the proper status values for properties
-- Update the properties table to ensure status field has proper constraints
ALTER TABLE properties 
DROP CONSTRAINT IF EXISTS properties_status_check;

ALTER TABLE properties 
ADD CONSTRAINT properties_status_check 
CHECK (status IN ('pending', 'under_review', 'active', 'inactive', 'rejected', 'flagged', 'suspended'));

-- Set default status to 'pending' for new properties
ALTER TABLE properties 
ALTER COLUMN status SET DEFAULT 'pending';

-- Create property_reviews table to track admin review actions
CREATE TABLE IF NOT EXISTS property_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'flagged', 'requested_changes')),
    admin_notes TEXT,
    rejection_reason TEXT,
    flagged_concerns TEXT[], -- Array of concern strings
    verification_score INTEGER DEFAULT 0 CHECK (verification_score >= 0 AND verification_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_admin_id ON property_reviews(admin_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_action ON property_reviews(action);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created_at ON property_reviews(created_at);

-- Add index on properties status for faster filtering
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Add updated_at trigger for property_reviews
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_reviews_updated_at 
    BEFORE UPDATE ON property_reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for property_reviews table
ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage all reviews
CREATE POLICY "Admins can view all property reviews" 
    ON property_reviews FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Admins can insert property reviews" 
    ON property_reviews FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Admins can update property reviews" 
    ON property_reviews FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    ));

-- Allow landlords to view reviews of their own properties
CREATE POLICY "Landlords can view reviews of their properties" 
    ON property_reviews FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = property_reviews.property_id 
        AND properties.landlord_id = auth.uid()
    ));

-- Create a function to automatically update property status when reviewed
CREATE OR REPLACE FUNCTION handle_property_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the property status based on the review action
    UPDATE properties 
    SET 
        status = CASE 
            WHEN NEW.action = 'approved' THEN 'active'
            WHEN NEW.action = 'rejected' THEN 'rejected'
            WHEN NEW.action = 'flagged' THEN 'flagged'
            WHEN NEW.action = 'requested_changes' THEN 'under_review'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = NEW.property_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update property status
CREATE TRIGGER trigger_property_review_status_update
    AFTER INSERT ON property_reviews
    FOR EACH ROW
    EXECUTE FUNCTION handle_property_review();

-- Add some helpful comments
COMMENT ON TABLE property_reviews IS 'Tracks admin review actions and decisions for properties';
COMMENT ON COLUMN property_reviews.verification_score IS 'Automated score based on property completeness and quality (0-100)';
COMMENT ON COLUMN property_reviews.flagged_concerns IS 'Array of specific concerns flagged during review';
COMMENT ON COLUMN property_reviews.rejection_reason IS 'Detailed reason for rejection (required when action is rejected)'; 