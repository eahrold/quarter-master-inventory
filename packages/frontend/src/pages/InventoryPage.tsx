import { useState, useEffect } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '../components/ui/modal'
import { ItemList } from '../components/inventory/ItemList'
import { ItemForm } from '../components/inventory/ItemForm'
import { ItemSearch } from '../components/inventory/ItemSearch'
import { useInventoryStore } from '../store/inventory'
import { useAuthStore } from '../store/auth'
import type { Item, CreateItemData, UpdateItemData, CheckoutData, CheckinData } from '../lib/api'

export function InventoryPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [actionItem, setActionItem] = useState<Item | null>(null)

  const {
    items,
    loading,
    error,
    filters,
    loadItems,
    searchItems,
    createItem,
    updateItem,
    deleteItem,
    checkoutItem,
    checkinItem,
    clearError,
  } = useInventoryStore()

  const { user } = useAuthStore()

  // Load items on mount
  useEffect(() => {
    loadItems()
  }, [loadItems])

  // Handle item creation
  const handleCreateItem = async (data: CreateItemData | UpdateItemData) => {
    try {
      await createItem(data as CreateItemData)
      setShowAddModal(false)
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle item update
  const handleUpdateItem = async (data: CreateItemData | UpdateItemData) => {
    if (!editingItem) return
    
    try {
      await updateItem(editingItem.id, data as UpdateItemData)
      setShowEditModal(false)
      setEditingItem(null)
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle item deletion
  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteItem(item.id)
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle checkout
  const handleCheckout = async (item: Item) => {
    setActionItem(item)
    setShowCheckoutModal(true)
  }

  const handleCheckoutSubmit = async (data: CheckoutData) => {
    if (!actionItem) return
    
    try {
      await checkoutItem(actionItem.id, data)
      setShowCheckoutModal(false)
      setActionItem(null)
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle checkin
  const handleCheckin = async (item: Item) => {
    setActionItem(item)
    setShowCheckinModal(true)
  }

  const handleCheckinSubmit = async (data: CheckinData) => {
    if (!actionItem) return
    
    try {
      await checkinItem(actionItem.id, data)
      setShowCheckinModal(false)
      setActionItem(null)
    } catch (error) {
      // Error is handled by the store
    }
  }

  // Handle edit
  const handleEditItem = (item: Item) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  // Check if user can create items
  const canCreateItems = user?.role === 'admin' || user?.role === 'leader'

  // Check if user can edit/delete items
  const canEditItems = user?.role === 'admin' || user?.role === 'leader'

  // Check if user can delete items
  const canDeleteItems = user?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600">Manage your troop's equipment and supplies</p>
        </div>
        {canCreateItems && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <ItemSearch
        filters={filters}
        onFiltersChange={(newFilters) => searchItems(newFilters)}
        onSearch={() => searchItems(filters)}
        loading={loading}
      />

      {/* Items List */}
      <ItemList
        items={items}
        loading={loading}
        onItemClick={(item) => {
          // Could navigate to item detail page
          console.log('View item:', item)
        }}
        onEditItem={canEditItems ? handleEditItem : undefined}
        onDeleteItem={canDeleteItems ? handleDeleteItem : undefined}
        onCheckoutItem={handleCheckout}
        onCheckinItem={handleCheckin}
      />

      {/* Add Item Modal */}
      <Modal open={showAddModal} onOpenChange={setShowAddModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Add New Item</ModalTitle>
          </ModalHeader>
          <ItemForm
            onSubmit={handleCreateItem}
            onCancel={() => setShowAddModal(false)}
            loading={loading}
          />
        </ModalContent>
      </Modal>

      {/* Edit Item Modal */}
      <Modal open={showEditModal} onOpenChange={setShowEditModal}>
        <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ModalHeader>
            <ModalTitle>Edit Item</ModalTitle>
          </ModalHeader>
          <ItemForm
            item={editingItem || undefined}
            onSubmit={handleUpdateItem}
            onCancel={() => {
              setShowEditModal(false)
              setEditingItem(null)
            }}
            loading={loading}
          />
        </ModalContent>
      </Modal>

      {/* Checkout Modal */}
      <Modal open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Check Out Item</ModalTitle>
          </ModalHeader>
          <CheckoutForm
            item={actionItem}
            onSubmit={handleCheckoutSubmit}
            onCancel={() => {
              setShowCheckoutModal(false)
              setActionItem(null)
            }}
            loading={loading}
          />
        </ModalContent>
      </Modal>

      {/* Checkin Modal */}
      <Modal open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Check In Item</ModalTitle>
          </ModalHeader>
          <CheckinForm
            item={actionItem}
            onSubmit={handleCheckinSubmit}
            onCancel={() => {
              setShowCheckinModal(false)
              setActionItem(null)
            }}
            loading={loading}
          />
        </ModalContent>
      </Modal>
    </div>
  )
}

// Simple Checkout Form Component
function CheckoutForm({ 
  item, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  item: Item | null
  onSubmit: (data: CheckoutData) => void
  onCancel: () => void
  loading: boolean
}) {
  const [checkedOutBy, setCheckedOutBy] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!checkedOutBy.trim()) return

    onSubmit({
      checkedOutBy: checkedOutBy.trim(),
      notes: notes.trim() || undefined,
    })
  }

  if (!item) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Checking out: <strong>{item.name}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Person checking out *
        </label>
        <input
          type="text"
          value={checkedOutBy}
          onChange={(e) => setCheckedOutBy(e.target.value)}
          placeholder="Enter name"
          className="w-full p-2 border border-gray-300 rounded-md"
          required
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes..."
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading || !checkedOutBy.trim()}>
          {loading ? 'Checking Out...' : 'Check Out'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Simple Checkin Form Component
function CheckinForm({ 
  item, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  item: Item | null
  onSubmit: (data: CheckinData) => void
  onCancel: () => void
  loading: boolean
}) {
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      notes: notes.trim() || undefined,
    })
  }

  if (!item) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Checking in: <strong>{item.name}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Condition notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Item condition, any issues, etc..."
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Checking In...' : 'Check In'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  )
}