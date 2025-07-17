-- Improve role synchronization and add better error handling

-- Create a function to sync user roles from profiles to user_roles table
CREATE OR REPLACE FUNCTION sync_user_roles_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If profile role is updated, sync to user_roles table
    IF TG_OP = 'UPDATE' OR TG_OP = 'INSERT' THEN
        -- Remove existing roles for this user
        DELETE FROM user_roles WHERE user_id = NEW.id;
        
        -- Insert the new role
        IF NEW.role IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role) VALUES (NEW.id, NEW.role);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically sync roles
DROP TRIGGER IF EXISTS sync_roles_trigger ON profiles;
CREATE TRIGGER sync_roles_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_roles_from_profile();

-- Create a function to validate role assignments
CREATE OR REPLACE FUNCTION validate_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure only valid roles can be assigned
    IF NEW.role NOT IN ('admin', 'landlord', 'renter') THEN
        RAISE EXCEPTION 'Invalid role: %', NEW.role;
    END IF;
    
    -- Ensure admin role is only assigned to verified users
    IF NEW.role = 'admin' THEN
        -- Add additional validation for admin role if needed
        -- For now, just log the admin assignment
        RAISE LOG 'Admin role assigned to user: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to validate role assignments
DROP TRIGGER IF EXISTS validate_role_trigger ON profiles;
CREATE TRIGGER validate_role_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_role_assignment();

-- Create a function to get user roles with better error handling
CREATE OR REPLACE FUNCTION get_user_roles_safe(_user_id UUID)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_roles app_role[];
BEGIN
    -- Try to get roles from user_roles table first
    SELECT ARRAY_AGG(role) INTO user_roles
    FROM user_roles 
    WHERE user_id = _user_id;
    
    -- If no roles found, try to get from profile
    IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
        SELECT ARRAY[role::app_role] INTO user_roles
        FROM profiles 
        WHERE id = _user_id AND role IS NOT NULL;
        
        -- If role found in profile, sync to user_roles
        IF user_roles IS NOT NULL AND array_length(user_roles, 1) IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role)
            SELECT _user_id, unnest(user_roles)
            ON CONFLICT (user_id, role) DO NOTHING;
        END IF;
    END IF;
    
    RETURN COALESCE(user_roles, ARRAY[]::app_role[]);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_user_roles_from_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION validate_role_assignment() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles_safe(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION sync_user_roles_from_profile IS 'Automatically syncs profile roles to user_roles table';
COMMENT ON FUNCTION validate_role_assignment IS 'Validates role assignments before they are saved';
COMMENT ON FUNCTION get_user_roles_safe IS 'Safely gets user roles with fallback to profile and auto-sync';

-- Sync any existing profiles that don't have corresponding user_roles entries
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