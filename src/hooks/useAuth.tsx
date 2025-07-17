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

  const createProfile = async (userId: string, email: string, role: UserRoleType, fullName: string): Promise<Profile | null> => {
    try {
      console.log('Creating profile for user:', userId, 'with role:', role);
      
      // Create profile first
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
        // If profile already exists, try to fetch it
        if (error.code === '23505') { // Unique constraint violation
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          if (fetchError) {
            console.error('Error fetching existing profile:', fetchError)
            return null
          }
          
          return existingProfile
        }
        return null
      }

      // Also create the role in user_roles table for consistency
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role
        })

      if (roleError) {
        console.error('Error creating user role:', roleError)
        // Don't fail the entire operation if role creation fails
        // The get_current_user_roles function will handle this
      }

      console.log('Successfully created profile and user role for user:', userId)
      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  const fetchUserRoles = async (userId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_roles');
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }
      
      return data ? data.map((row: any) => row.role) : [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }

  const hasRole = (role: string): boolean => {
    // If we're still loading, don't deny access yet
    if (loading) {
      return false;
    }

    // Only rely on userRoles from the user_roles table for security
    if (!userRoles || userRoles.length === 0) {
      console.warn('User roles not loaded or empty. Access denied.');
      return false;
    }
    return userRoles.includes(role);
  }

  const getPrimaryRole = (): UserRoleType | null => {
    if (!userRoles || userRoles.length === 0) {
      return null;
    }
    
    // Priority: admin > landlord > renter
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('landlord')) return 'landlord';
    if (userRoles.includes('renter')) return 'renter';
    return null; // No valid role found
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }
        if (!mounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Always ensure user_roles is up to date for all roles
          const [profileData, rolesData] = await Promise.all([
            fetchProfile(session.user.id),
            fetchUserRoles(session.user.id)
          ]);
          
          // If user has a profile but not in user_roles, upsert
          if (profileData && (!rolesData || rolesData.length === 0)) {
            await supabase.from('user_roles').upsert({
              user_id: session.user.id,
              role: profileData.role
            }, { onConflict: 'user_id,role' });
            
            // Refetch roles after upsert
            const updatedRoles = await fetchUserRoles(session.user.id);
            if (mounted) {
              setProfile(profileData);
              setUserRoles(updatedRoles.length > 0 ? updatedRoles : [profileData.role]);
            }
          } else {
            if (mounted) {
              setProfile(profileData);
              setUserRoles(rolesData && rolesData.length > 0 ? rolesData : [profileData?.role].filter(Boolean));
            }
          }
        }
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Give the database trigger time to create the profile
          setTimeout(async () => {
            if (!mounted) return;
            
            let profileData = await fetchProfile(session.user.id);
            let rolesData = await fetchUserRoles(session.user.id);
            
            // If profile doesn't exist and we have user metadata, create it
            if (!profileData && session.user.user_metadata) {
              const { role, full_name } = session.user.user_metadata;
              if (role && full_name) {
                console.log('Creating profile from user metadata:', { role, full_name });
                profileData = await createProfile(
                  session.user.id,
                  session.user.email!,
                  role,
                  full_name
                );
                
                // Create user_roles entry
                await supabase.from('user_roles').upsert({
                  user_id: session.user.id,
                  role
                }, { onConflict: 'user_id,role' });
                
                rolesData = [role];
              }
            }
            
            // Always upsert user_roles for consistency
            if (profileData && (!rolesData || rolesData.length === 0)) {
              await supabase.from('user_roles').upsert({
                user_id: session.user.id,
                role: profileData.role
              }, { onConflict: 'user_id,role' });
              rolesData = [profileData.role];
            }
            
            if (mounted) {
              setProfile(profileData);
              setUserRoles(rolesData && rolesData.length > 0 ? rolesData : [profileData?.role].filter(Boolean));
            }
          }, 500); // Wait 500ms for database trigger to complete
        } else {
          setProfile(null);
          setUserRoles([]);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUserRoles([]);
        }
        
        if (mounted) setLoading(false);
      }
    );
    
    initializeAuth();
    
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, role: UserRoleType, fullName: string) => {
    try {
      console.log('🚀 Starting signup process with selected role:', { email, role, fullName });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName
          }
        }
      })

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error }
      }

      console.log('✅ Sign up successful:', data);
      console.log('👤 User metadata stored:', data.user?.user_metadata);
      
      // If user was created but not confirmed, try to create profile manually as fallback
      if (data.user && !data.user.email_confirmed_at) {
        console.log('📝 User created but not confirmed, ensuring profile exists with SELECTED role:', role);
        
        // Use the manual profile creation function as fallback with the SELECTED role
        try {
          const { data: profileResult, error: profileError } = await supabase.rpc('create_profile_for_user', {
            user_id: data.user.id,
            user_email: email,
            user_role: role, // Make sure we pass the SELECTED role
            user_full_name: fullName
          });
          
          if (profileError) {
            console.warn('⚠️ Manual profile creation failed:', profileError);
            console.log('🔄 Attempting to create profile with direct database call...');
            
            // Try direct database insertion as final fallback
            const { data: directProfile, error: directError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: email,
                role: role, // Use the SELECTED role
                full_name: fullName
              })
              .select()
              .single();
              
            if (directError) {
              console.error('❌ Direct profile creation also failed:', directError);
            } else {
              console.log('✅ Direct profile creation successful with role:', role);
              
              // Also create user_roles entry
              await supabase.from('user_roles').insert({
                user_id: data.user.id,
                role: role // Use the SELECTED role
              });
            }
          } else {
            console.log('✅ Manual profile creation successful with role:', role, 'Result:', profileResult);
          }
        } catch (profileError) {
          console.warn('⚠️ Exception during manual profile creation:', profileError);
        }
      }
      
      // Also try to create profile immediately for confirmed users
      if (data.user && data.user.email_confirmed_at) {
        console.log('📝 User confirmed, ensuring profile exists with SELECTED role:', role);
        
        // Give a small delay for trigger to complete, then check/create profile
        setTimeout(async () => {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user!.id)
            .single();
            
          if (!existingProfile) {
            console.log('🔄 No profile found, creating with SELECTED role:', role);
            await supabase.rpc('create_profile_for_user', {
              user_id: data.user!.id,
              user_email: email,
              user_role: role, // SELECTED role
              user_full_name: fullName
            });
          } else {
            console.log('✅ Profile exists with role:', existingProfile.role);
            if (existingProfile.role !== role) {
              console.warn('⚠️ Profile role mismatch! Expected:', role, 'Got:', existingProfile.role);
            }
          }
        }, 100);
      }
      
      return { error: null }
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return { error: authError }
      }

      // Update last_sign_in_at in profiles table
      if (authData.user) {
        await supabase
          .from('profiles')
          .update({ last_sign_in_at: new Date().toISOString() })
          .eq('id', authData.user.id)
      }

      return { error: null }
    } catch (error) {
      console.error('Error signing in:', error)
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
