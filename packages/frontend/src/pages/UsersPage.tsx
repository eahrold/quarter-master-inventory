import { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Plus, User, Edit, Trash2, Shield, UserCheck, UserX } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { useAuthStore } from '../store/auth'
import { AdminRoute } from '../components/auth/ProtectedRoute'
import type { User as UserType } from '../lib/api'

interface UserManagementState {
  users: UserType[]
  isLoading: boolean
  error: string | null
}

export function UsersPage() {
  const { user: currentUser } = useAuthStore()
  const [state, setState] = useState<UserManagementState>({
    users: [],
    isLoading: true,
    error: null,
  })

  const loadUsers = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      const { users } = await api.users.list()
      setState(prev => ({ ...prev, users, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load users'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.users.delete(userId)
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user.id !== userId)
      }))
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to delete user'
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'leader': return 'bg-blue-100 text-blue-800'
      case 'scout': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'leader': return <UserCheck className="h-4 w-4" />
      case 'scout': return <User className="h-4 w-4" />
      case 'viewer': return <UserX className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  return (
    <AdminRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage troop members and their permissions</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {state.error}
            <Button 
              onClick={loadUsers} 
              variant="outline" 
              size="sm" 
              className="ml-3"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading state */}
        {state.isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Users list */}
        {!state.isLoading && (
          <div className="grid gap-4">
            {state.users.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Get started by adding your first user.</p>
                </CardContent>
              </Card>
            ) : (
              state.users.map((user) => (
                <Card key={user.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.username}
                            {user.id === currentUser?.id && (
                              <span className="ml-2 text-sm text-gray-500">(You)</span>
                            )}
                          </h3>
                          <p className="text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AdminRoute>
  )
}