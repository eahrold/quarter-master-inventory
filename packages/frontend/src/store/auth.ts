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
          
          // Set troop slug for subsequent requests
          if (troop) {
            api.setTroopSlug(troop.slug)
          }
          
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
          
          // Set auth tokens for future requests
          api.setAuthToken(token)
          api.setTroopSlug(troop.slug)
          
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
          
          // Set auth tokens for future requests
          api.setAuthToken(token)
          api.setTroopSlug(troop.slug)
          
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
          // Clear API tokens
          api.setAuthToken(null)
          api.setTroopSlug(null)
          
          // Clear local state
          set({ user: null, token: null, troop: null, isLoading: false, error: null })
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
      onRehydrateStorage: () => (state) => {
        // Restore API client tokens when store is rehydrated from localStorage
        if (state?.token) {
          api.setAuthToken(state.token)
        }
        if (state?.troop?.slug) {
          api.setTroopSlug(state.troop.slug)
        }
      },
    }
  )
)