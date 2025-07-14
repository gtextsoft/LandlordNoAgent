-- Fix user roles and add get_current_user_roles function

-- Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Create or replace the get_current_user_roles function
CREATE OR REPLACE FUNCTION get_current_user_roles()
RETURNS TABLE (role app_role)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- First try to get roles from user_roles table
    RETURN QUERY
    SELECT ur.role
    FROM user_roles ur
    WHERE ur.user_id = auth.uid();

    -- If no roles found, fall back to profile role
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT p.role::app_role
        FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IS NOT NULL;

        -- If role found in profile but not in user_roles, sync it
        INSERT INTO user_roles (user_id, role)
        SELECT auth.uid(), p.role
        FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role = p.role
        );
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_roles() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_current_user_roles IS 'Returns the roles for the current user, syncing from profile if necessary';
COMMENT ON TABLE user_roles IS 'Stores user roles for the application';

-- Sync existing profiles to user_roles if not already there
INSERT INTO user_roles (user_id, role)
SELECT p.id, p.role
FROM profiles p
WHERE p.role IS NOT NULL
AND NOT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = p.id 
    AND ur.role = p.role
); 