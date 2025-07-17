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
      } else if (primaryRole === 'renter') {
        return <Navigate to="/renter" replace />
      } else {
        // No valid role, show error or redirect
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-700 mb-4">Your account does not have a valid role assigned. Please contact support.</p>
              <p className="text-sm text-gray-500">Required roles: {allowedRoles.join(', ')}</p>
              <p className="text-sm text-gray-500">Your current role: {primaryRole || 'None'}</p>
            </div>
          </div>
        );
      }
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
