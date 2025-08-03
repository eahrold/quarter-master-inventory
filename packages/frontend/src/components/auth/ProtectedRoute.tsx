import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'

type UserRole = 'admin' | 'leader' | 'scout' | 'viewer'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  redirectPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectPath = '/login' 
}: ProtectedRouteProps) {
  const { user, token, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  // Check authentication on mount and when token changes
  React.useEffect(() => {
    if (token && !user) {
      checkAuth()
    }
  }, [token, user, checkAuth])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user || !token) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role as UserRole)
    
    if (!hasRequiredRole) {
      // Redirect to dashboard or show unauthorized page
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

// Helper components for common role combinations
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function LeaderRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'leader']}>
      {children}
    </ProtectedRoute>
  )
}

export function ScoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'leader', 'scout']}>
      {children}
    </ProtectedRoute>
  )
}