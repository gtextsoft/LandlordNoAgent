import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { UserRoleType } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRoleType[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, profile, loading, hasRole, primaryRole } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles) {
    const hasRequiredRole = allowedRoles.some(role => hasRole(role))
    
    if (!hasRequiredRole) {
      // Redirect based on primary role
      if (primaryRole === 'admin') {
        return <Navigate to="/admin" replace />
      } else if (primaryRole === 'landlord') {
        return <Navigate to="/landlord" replace />
      } else {
        return <Navigate to="/" replace />
      }
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
