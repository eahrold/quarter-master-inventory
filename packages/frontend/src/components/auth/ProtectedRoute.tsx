import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, checkAuth } = useAuthStore()

  // In development, auto-authenticate on mount
  React.useEffect(() => {
    if (import.meta.env.DEV && !user) {
      checkAuth()
    }
  }, [user, checkAuth])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quartermaster-orange-500"></div>
      </div>
    )
  }

  // In development, allow access even without user (checkAuth will handle it)
  if (!user && !import.meta.env.DEV) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}