import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'

// Layout components
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// Page components
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ItemDetailPage } from '@/pages/ItemDetailPage'
import { ScannerPage } from '@/pages/ScannerPage'
import { UsersPage } from '@/pages/UsersPage'
import { ProfilePage } from '@/pages/ProfilePage'

function App() {
  const { checkAuth, user } = useAuthStore()

  // Check authentication status on app load
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/inventory/:id" element={<ItemDetailPage />} />
                <Route path="/scanner" element={<ScannerPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App