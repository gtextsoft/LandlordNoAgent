
import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Database } from '@/integrations/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type UserRoleType = Database['public']['Enums']['app_role'];

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  userRoles: string[]
  hasRole: (role: string) => boolean
  primaryRole: UserRoleType
  signUp: (email: string, password: string, role: UserRoleType, fullName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  const fetchUserRoles = async (userId: string): Promise<string[]> => {
    try {
      // Use the new security definer function
      const { data, error } = await supabase.rpc('get_current_user_roles')
      
      if (error) {
        console.error('Error fetching user roles:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('Error fetching user roles:', error)
      return []
    }
  }

  const createProfile = async (userId: string, email: string, role: UserRoleType, fullName: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          role,
          full_name: fullName
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return null
      }

      // Also create the role in user_roles table
      await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role
        })

      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  const hasRole = (role: string): boolean => {
    // Fallback to profile.role if userRoles is empty
    if (userRoles.length === 0 && profile?.role) {
      return profile.role === role;
    }
    return userRoles.includes(role);
  }

  const getPrimaryRole = (): UserRoleType => {
    if (userRoles.includes('admin')) return 'admin'
    if (userRoles.includes('landlord')) return 'landlord'
    return 'renter'
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (!mounted) return

        console.log('Initial session:', session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const [profileData, rolesData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchUserRoles(session.user.id)
          ])
          
          if (mounted) {
            setProfile(profileData)
            setUserRoles(rolesData)
          }
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.id)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          setTimeout(async () => {
            if (!mounted) return
            
            let profileData = await fetchProfile(session.user.id)
            const rolesData = await fetchUserRoles(session.user.id)
            
            if (!profileData && session.user.user_metadata) {
              const { role, full_name } = session.user.user_metadata
              if (role && full_name) {
                profileData = await createProfile(
                  session.user.id,
                  session.user.email!,
                  role,
                  full_name
                )
              }
            }
            
            if (mounted) {
              setProfile(profileData)
              setUserRoles(rolesData)
            }
          }, 0)
        } else {
          setProfile(null)
          setUserRoles([])
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null)
          setUserRoles([])
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, role: UserRoleType, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName
          }
        }
      })

      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      userRoles,
      hasRole,
      primaryRole: getPrimaryRole(),
      signUp, 
      signIn, 
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
