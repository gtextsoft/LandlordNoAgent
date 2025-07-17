import { supabase } from '@/lib/supabase'
import { validateUserRole, assignUserRole, getUsersByRole } from './roleManagement'

/**
 * Test utility to verify role assignment functionality
 */
export const testRoleAssignment = async () => {
  console.log('🧪 Testing role assignment functionality...')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ User not authenticated')
      return false
    }

    console.log('✅ User authenticated:', user.email)

    // Test 1: Check current user roles
    const { data: currentRoles, error: rolesError } = await supabase.rpc('get_user_roles_safe', { 
      _user_id: user.id 
    })
    
    if (rolesError) {
      console.error('❌ Error fetching current roles:', rolesError)
      return false
    }

    console.log('✅ Current user roles:', currentRoles)

    // Test 2: Validate role assignment for different roles
    const testRoles: Array<'admin' | 'landlord' | 'renter'> = ['renter', 'landlord', 'admin']
    
    for (const role of testRoles) {
      console.log(`\n🔍 Testing role validation for: ${role}`)
      
      const validation = await validateUserRole(user.id, role)
      console.log(`   Has ${role} role:`, validation.isValid)
      
      if (!validation.isValid) {
        console.log(`   Error:`, validation.error)
      }
    }

    // Test 3: Get users by role
    console.log('\n📊 Testing get users by role...')
    for (const role of testRoles) {
      const { data: users, error } = await getUsersByRole(role)
      if (error) {
        console.error(`❌ Error getting ${role} users:`, error)
      } else {
        console.log(`✅ Found ${users.length} users with ${role} role`)
      }
    }

    // Test 4: Check profile vs user_roles consistency
    console.log('\n🔍 Checking profile vs user_roles consistency...')
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    console.log('   Profile role:', profile?.role)
    console.log('   User roles:', userRoles?.map(ur => ur.role))

    if (profile?.role && userRoles?.length === 0) {
      console.warn('⚠️  Profile has role but user_roles table is empty - this should be synced')
    } else if (profile?.role && userRoles?.some(ur => ur.role === profile.role)) {
      console.log('✅ Profile and user_roles are consistent')
    }

    console.log('\n✅ Role assignment tests completed')
    return true

  } catch (error) {
    console.error('❌ Error during role testing:', error)
    return false
  }
}

/**
 * Test utility to verify admin role assignment
 */
export const testAdminRoleAssignment = async () => {
  console.log('👑 Testing admin role assignment...')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ User not authenticated')
      return false
    }

    // Check if user is admin
    const adminValidation = await validateUserRole(user.id, 'admin')
    
    if (adminValidation.isValid) {
      console.log('✅ User has admin privileges')
      
      // Test admin functions
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, role, full_name')
        .limit(5)

      if (usersError) {
        console.error('❌ Error fetching users:', usersError)
        return false
      }

      console.log('✅ Admin can fetch users:', allUsers?.length || 0)
      return true
    } else {
      console.log('❌ User does not have admin privileges')
      console.log('   Current roles:', adminValidation.currentRoles)
      return false
    }

  } catch (error) {
    console.error('❌ Error during admin testing:', error)
    return false
  }
}

/**
 * Utility to fix role inconsistencies
 */
export const fixRoleInconsistencies = async () => {
  console.log('🔧 Fixing role inconsistencies...')
  
  try {
    // Get all profiles with roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role')
      .not('role', 'is', null)

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return false
    }

    console.log(`📋 Found ${profiles.length} profiles with roles`)

    // Check each profile for user_roles consistency
    for (const profile of profiles || []) {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)

      const hasRoleInUserRoles = userRoles?.some(ur => ur.role === profile.role)

      if (!hasRoleInUserRoles) {
        console.log(`🔧 Syncing role for user ${profile.id}: ${profile.role}`)
        
        const { error: syncError } = await supabase
          .from('user_roles')
          .insert({
            user_id: profile.id,
            role: profile.role
          })

        if (syncError) {
          console.error(`❌ Error syncing role for ${profile.id}:`, syncError)
        } else {
          console.log(`✅ Synced role for user ${profile.id}`)
        }
      }
    }

    console.log('✅ Role inconsistency fix completed')
    return true

  } catch (error) {
    console.error('❌ Error fixing role inconsistencies:', error)
    return false
  }
} 