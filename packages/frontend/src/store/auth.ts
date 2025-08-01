import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@quartermaster/shared'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      checkAuth: async () => {
        // DEVELOPMENT BYPASS: Auto-login for localhost
        if (import.meta.env.DEV) {
          const mockUser: User = {
            id: "dev-user-id",
            troopId: "dev-troop-id", 
            username: "admin",
            email: "admin@localhost.dev",
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          console.log('🔓 Development mode: Auto-login with mock admin user')
          set({ user: mockUser, token: "dev-token" })
          return
        }

        const { token } = get()
        if (!token) return

        try {
          set({ isLoading: true })
          // TODO: Implement API call to verify token
          // const user = await api.auth.me()
          // set({ user })
        } catch (error) {
          // Token is invalid, clear auth state
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      login: async (email: string, password: string) => {
        // DEVELOPMENT BYPASS: Auto-login for localhost
        if (import.meta.env.DEV) {
          const mockUser: User = {
            id: "dev-user-id",
            troopId: "dev-troop-id",
            username: "admin", 
            email: "admin@localhost.dev",
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          
          console.log('🔓 Development mode: Mock login successful')
          set({ user: mockUser, token: "dev-token", isLoading: false })
          return
        }

        try {
          set({ isLoading: true })
          // TODO: Implement API call
          // const { user, token } = await api.auth.login({ email, password })
          // set({ user, token })
          
          // Temporary mock implementation
          console.log('Login attempted with:', { email, password })
          throw new Error('Authentication not yet implemented')
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false })
        // TODO: Clear API token
        // api.setAuthToken(null)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)