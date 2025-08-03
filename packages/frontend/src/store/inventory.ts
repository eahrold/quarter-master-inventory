import { create } from 'zustand'
import { api, type Item, type CreateItemData, type UpdateItemData, type CheckoutData, type CheckinData, type ItemFilters } from '../lib/api'

interface InventoryState {
  // State
  items: Item[]
  loading: boolean
  error: string | null
  filters: ItemFilters
  selectedItem: Item | null
  
  // Actions
  loadItems: () => Promise<void>
  searchItems: (filters: ItemFilters) => Promise<void>
  clearFilters: () => void
  setSelectedItem: (item: Item | null) => void
  
  // CRUD operations
  createItem: (data: CreateItemData) => Promise<void>
  updateItem: (id: string, data: UpdateItemData) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  
  // Checkout operations
  checkoutItem: (id: string, data: CheckoutData) => Promise<void>
  checkinItem: (id: string, data: CheckinData) => Promise<void>
  
  // Utility
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // Initial state
  items: [],
  loading: false,
  error: null,
  filters: {},
  selectedItem: null,

  // Load all items
  loadItems: async () => {
    set({ loading: true, error: null })
    try {
      const response = await api.items.list(get().filters)
      set({ items: response.items, loading: false })
    } catch (error) {
      console.error('Failed to load items:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load items'
      
      // If it's an auth error, user might need to log in again
      if (errorMessage.includes('Troop identifier required') || errorMessage.includes('Authentication required')) {
        // Could trigger re-authentication here if needed
        console.warn('Authentication may be required')
      }
      
      set({ 
        error: errorMessage,
        loading: false 
      })
    }
  },

  // Search items with filters
  searchItems: async (filters: ItemFilters) => {
    set({ loading: true, error: null, filters })
    try {
      const response = await api.items.list(filters)
      set({ items: response.items, loading: false })
    } catch (error) {
      console.error('Failed to search items:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to search items'
      
      // If it's an auth error, user might need to log in again
      if (errorMessage.includes('Troop identifier required') || errorMessage.includes('Authentication required')) {
        console.warn('Authentication may be required')
      }
      
      set({ 
        error: errorMessage,
        loading: false 
      })
    }
  },

  // Clear filters and reload
  clearFilters: () => {
    set({ filters: {} })
    get().loadItems()
  },

  // Set selected item
  setSelectedItem: (item: Item | null) => {
    set({ selectedItem: item })
  },

  // Create new item
  createItem: async (data: CreateItemData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.items.create(data)
      set(state => ({ 
        items: [...state.items, response.item],
        loading: false 
      }))
    } catch (error) {
      console.error('Failed to create item:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create item',
        loading: false 
      })
      throw error // Re-throw so components can handle it
    }
  },

  // Update existing item
  updateItem: async (id: string, data: UpdateItemData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.items.update(id, data)
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? response.item : item
        ),
        selectedItem: state.selectedItem?.id === id ? response.item : state.selectedItem,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to update item:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update item',
        loading: false 
      })
      throw error
    }
  },

  // Delete item
  deleteItem: async (id: string) => {
    set({ loading: true, error: null })
    try {
      await api.items.delete(id)
      set(state => ({
        items: state.items.filter(item => item.id !== id),
        selectedItem: state.selectedItem?.id === id ? null : state.selectedItem,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to delete item:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete item',
        loading: false 
      })
      throw error
    }
  },

  // Checkout item
  checkoutItem: async (id: string, data: CheckoutData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.items.checkout(id, data)
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? response.item : item
        ),
        selectedItem: state.selectedItem?.id === id ? response.item : state.selectedItem,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to checkout item:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to checkout item',
        loading: false 
      })
      throw error
    }
  },

  // Checkin item
  checkinItem: async (id: string, data: CheckinData) => {
    set({ loading: true, error: null })
    try {
      const response = await api.items.checkin(id, data)
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? response.item : item
        ),
        selectedItem: state.selectedItem?.id === id ? response.item : state.selectedItem,
        loading: false
      }))
    } catch (error) {
      console.error('Failed to checkin item:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to checkin item',
        loading: false 
      })
      throw error
    }
  },

  // Utility functions
  clearError: () => set({ error: null }),
  
  setLoading: (loading: boolean) => set({ loading }),
}))