import type { 
  LoginInput, 
  RegisterInput, 
  User, 
  Item, 
  CreateItemData, 
  UpdateItemData, 
  CheckoutData, 
  CheckinData, 
  ItemFilters 
} from '@quartermaster/shared'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class APIClient {
  private baseURL: string
  private token: string | null = null
  private troopSlug: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAuthToken(token: string | null) {
    this.token = token
  }

  setTroopSlug(troopSlug: string | null) {
    this.troopSlug = troopSlug
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...(this.troopSlug && { 'x-troop-slug': this.troopSlug }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          errorData.code
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  // Auth endpoints
  auth = {
    login: async (credentials: LoginInput): Promise<{ user: User; token: string; troop: { id: string; name: string; slug: string } }> => {
      const result = await this.request<{ user: User; token: string; troop: { id: string; name: string; slug: string } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
      
      // Set the token for future requests
      this.setAuthToken(result.token)
      
      return result
    },

    register: async (userData: RegisterInput): Promise<{ user: User; token: string; troop: { id: string; name: string; slug: string } }> => {
      const result = await this.request<{ user: User; token: string; troop: { id: string; name: string; slug: string } }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      
      // Set the token for future requests
      this.setAuthToken(result.token)
      
      return result
    },

    me: async (): Promise<{ user: User; troop: { id: string; name: string; slug: string } | null }> => {
      return await this.request<{ user: User; troop: { id: string; name: string; slug: string } | null }>('/api/auth/me')
    },

    logout: async (): Promise<{ message: string }> => {
      const result = await this.request<{ message: string }>('/api/auth/logout', {
        method: 'POST',
      })
      
      // Clear the token
      this.setAuthToken(null)
      
      return result
    },
  }

  // User management endpoints
  users = {
    list: async (): Promise<{ users: User[] }> => {
      return await this.request<{ users: User[] }>('/api/users')
    },

    get: async (id: string): Promise<{ user: User }> => {
      return await this.request<{ user: User }>(`/api/users/${id}`)
    },

    create: async (userData: { username: string; email: string; password: string; role: string }): Promise<{ user: User }> => {
      return await this.request<{ user: User }>('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    },

    update: async (id: string, userData: { username?: string; email?: string; role?: string }): Promise<{ user: User }> => {
      return await this.request<{ user: User }>(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      })
    },

    delete: async (id: string): Promise<{ message: string }> => {
      return await this.request<{ message: string }>(`/api/users/${id}`, {
        method: 'DELETE',
      })
    },

    updatePassword: async (id: string, passwordData: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
      return await this.request<{ message: string }>(`/api/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      })
    },
  }

  // Inventory management endpoints
  items = {
    list: async (filters?: ItemFilters): Promise<{ items: Item[] }> => {
      const params = new URLSearchParams()
      if (filters?.category) params.append('category', filters.category)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.location) params.append('location', filters.location)
      if (filters?.search) params.append('search', filters.search)
      
      const queryString = params.toString()
      const url = queryString ? `/api/items?${queryString}` : '/api/items'
      
      return await this.request<{ items: Item[] }>(url)
    },

    get: async (id: string): Promise<{ item: Item }> => {
      return await this.request<{ item: Item }>(`/api/items/${id}`)
    },

    create: async (itemData: CreateItemData): Promise<{ item: Item }> => {
      return await this.request<{ item: Item }>('/api/items', {
        method: 'POST',
        body: JSON.stringify(itemData),
      })
    },

    update: async (id: string, itemData: UpdateItemData): Promise<{ item: Item }> => {
      return await this.request<{ item: Item }>(`/api/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
      })
    },

    delete: async (id: string): Promise<{ message: string }> => {
      return await this.request<{ message: string }>(`/api/items/${id}`, {
        method: 'DELETE',
      })
    },

    checkout: async (id: string, checkoutData: CheckoutData): Promise<{ item: Item }> => {
      return await this.request<{ item: Item }>(`/api/items/${id}/checkout`, {
        method: 'POST',
        body: JSON.stringify(checkoutData),
      })
    },

    checkin: async (id: string, checkinData: CheckinData): Promise<{ item: Item }> => {
      return await this.request<{ item: Item }>(`/api/items/${id}/checkin`, {
        method: 'POST',
        body: JSON.stringify(checkinData),
      })
    },
  }
}

// Create and export API client instance
export const api = new APIClient(API_BASE_URL)
export { ApiError }
export type { User, Item }