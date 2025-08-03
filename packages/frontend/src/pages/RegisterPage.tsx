import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { RegisterForm } from '../components/auth/RegisterForm'

export function RegisterPage() {
  const { user } = useAuthStore()

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">QM</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Quarter Master</h1>
          <p className="text-gray-600 mt-2">Scout Troop Inventory Management</p>
        </div>
        
        {/* Register form */}
        <RegisterForm />
      </div>
    </div>
  )
}