import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@quartermaster/shared'
import { api, ApiError } from '../lib/api'

interface Troop {
  id: string
  name: string
  slug: string
}

interface AuthState {
  user: User | null
  token: string | null
  troop: Troop | null
  isLoading: boolean
  error: string | null
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, troopSlug: string) => Promise<void>
  logout: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      troop: null,
      isLoading: false,
      error: null,

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const { token } = get()
        if (!token) return

        try {
          set({ isLoading: true, error: null })
          
          // Set the token for API requests
          api.setAuthToken(token)
          
          // Verify token and get user info
          const { user, troop } = await api.auth.me()
          set({ user, troop })
        } catch (error) {
          console.error('Auth check failed:', error)
          // Token is invalid, clear auth state
          get().logout()
        } finally {
          set({ isLoading: false })
        }
      },

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const { user, token, troop } = await api.auth.login({ email, password })
          
          set({ user, token, troop, isLoading: false })
          
          console.log('Login successful:', { user: user.username, troop: troop.name })
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : 'Login failed. Please try again.'
          
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      register: async (username: string, email: string, password: string, troopSlug: string) => {
        try {
          set({ isLoading: true, error: null })
          
          const { user, token, troop } = await api.auth.register({ 
            username, 
            email, 
            password, 
            troopSlug 
          })
          
          set({ user, token, troop, isLoading: false })
          
          console.log('Registration successful:', { user: user.username, troop: troop.name })
        } catch (error) {
          const errorMessage = error instanceof ApiError 
            ? error.message 
            : 'Registration failed. Please try again.'
          
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint if we have a token
          const { token } = get()
          if (token) {
            await api.auth.logout()
          }
        } catch (error) {
          // Even if logout fails, clear local state
          console.error('Logout API call failed:', error)
        } finally {
          // Clear local state and API token
          set({ user: null, token: null, troop: null, isLoading: false, error: null })
          api.setAuthToken(null)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        troop: state.troop,
      }),
    }
  )
)