import { supabase } from '@/lib/supabase'
import { UserRoleType } from '@/lib/supabase'

/**
 * Role management utilities
 */

export interface RoleValidationResult {
  isValid: boolean
  error?: string
  currentRoles: string[]
}

/**
 * Validates if a user has the required role
 */
export const validateUserRole = async (userId: string, requiredRole: UserRoleType): Promise<RoleValidationResult> => {
  try {
    const { data: userRoles, error } = await supabase.rpc('get_user_roles_safe', { _user_id: userId })
    
    if (error) {
      return {
        isValid: false,
        error: `Error fetching user roles: ${error.message}`,
        currentRoles: []
      }
    }

    const hasRole = userRoles?.includes(requiredRole) || false
    
    return {
      isValid: hasRole,
      currentRoles: userRoles || [],
      error: hasRole ? undefined : `User does not have required role: ${requiredRole}`
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Unexpected error: ${error}`,
      currentRoles: []
    }
  }
}

/**
 * Assigns a role to a user
 */
export const assignUserRole = async (userId: string, role: UserRoleType): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, remove all existing roles for this user
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      return { success: false, error: `Error removing existing roles: ${deleteError.message}` }
    }

    // Update profile role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (profileError) {
      return { success: false, error: `Error updating profile: ${profileError.message}` }
    }

    // Insert new role in user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role
      })

    if (roleError) {
      return { success: false, error: `Error creating user role: ${roleError.message}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: `Unexpected error: ${error}` }
  }
}

/**
 * Gets all users with a specific role
 */
export const getUsersByRole = async (role: UserRoleType): Promise<{ data: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        profiles!inner(
          id,
          email,
          full_name,
          created_at
        )
      `)
      .eq('role', role)

    if (error) {
      return { data: [], error: error.message }
    }

    return { data: data || [] }
  } catch (error) {
    return { data: [], error: `Unexpected error: ${error}` }
  }
}

/**
 * Checks if a user has any valid role
 */
export const hasAnyRole = (userRoles: string[]): boolean => {
  const validRoles = ['admin', 'landlord', 'renter']
  return userRoles.some(role => validRoles.includes(role))
}

/**
 * Gets the primary role for a user (admin > landlord > renter)
 */
export const getPrimaryRole = (userRoles: string[]): UserRoleType | null => {
  if (userRoles.includes('admin')) return 'admin'
  if (userRoles.includes('landlord')) return 'landlord'
  if (userRoles.includes('renter')) return 'renter'
  return null
}

/**
 * Validates if a role transition is allowed
 */
export const validateRoleTransition = (currentRole: UserRoleType, newRole: UserRoleType): boolean => {
  // Admin can assign any role
  // Landlord can only be assigned by admin
  // Renter is the default role
  const allowedTransitions: Record<UserRoleType, UserRoleType[]> = {
    admin: ['admin', 'landlord', 'renter'],
    landlord: ['landlord', 'renter'],
    renter: ['renter']
  }

  return allowedTransitions[currentRole]?.includes(newRole) || false
} 