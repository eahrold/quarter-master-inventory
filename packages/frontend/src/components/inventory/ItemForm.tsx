import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import type { Item, CreateItemData, UpdateItemData } from '../../lib/api'

interface ItemFormProps {
  item?: Item
  onSubmit: (data: CreateItemData | UpdateItemData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ItemForm({ item, onSubmit, onCancel, loading = false }: ItemFormProps) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || 'permanent' as const,
    locationSide: item?.locationSide || 'left' as const,
    locationLevel: item?.locationLevel || 'low' as const,
    status: item?.status || 'available' as const,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (item) {
        // Update existing item
        const updateData: UpdateItemData = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          locationSide: formData.locationSide,
          locationLevel: formData.locationLevel,
          status: formData.status,
        }
        await onSubmit(updateData)
      } else {
        // Create new item
        const createData: CreateItemData = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          locationSide: formData.locationSide,
          locationLevel: formData.locationLevel,
        }
        await onSubmit(createData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter item name"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Enter item description (optional)"
                className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.description ? 'border-red-500' : ''
                }`}
                disabled={loading}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-600">{errors.description}</p>
                ) : (
                  <div />
                )}
                <p className="text-xs text-gray-500">
                  {formData.description.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <Label>Category *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="permanent"
                  checked={formData.category === 'permanent'}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={loading}
                  className="text-quartermaster-orange-600 focus:ring-quartermaster-orange-500"
                />
                <span className="text-sm">Permanent Items</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value="staples"
                  checked={formData.category === 'staples'}
                  onChange={(e) => handleChange('category', e.target.value)}
                  disabled={loading}
                  className="text-quartermaster-orange-600 focus:ring-quartermaster-orange-500"
                />
                <span className="text-sm">Staples</span>
              </label>
            </div>
          </div>

          {/* Location Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="locationSide">Trailer Side *</Label>
              <select
                id="locationSide"
                value={formData.locationSide}
                onChange={(e) => handleChange('locationSide', e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div>
              <Label htmlFor="locationLevel">Shelf Level *</Label>
              <select
                id="locationLevel"
                value={formData.locationLevel}
                onChange={(e) => handleChange('locationLevel', e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="middle">Middle</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Status Selection (only for editing) */}
          {item && (
            <div>
              <Label>Status</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="available"
                    checked={formData.status === 'available'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={loading}
                    className="text-quartermaster-orange-600 focus:ring-quartermaster-orange-500"
                  />
                  <span className="text-sm">Available</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="checked_out"
                    checked={formData.status === 'checked_out'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={loading}
                    className="text-quartermaster-orange-600 focus:ring-quartermaster-orange-500"
                  />
                  <span className="text-sm">Checked Out</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="needs_repair"
                    checked={formData.status === 'needs_repair'}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={loading}
                    className="text-quartermaster-orange-600 focus:ring-quartermaster-orange-500"
                  />
                  <span className="text-sm">Needs Repair</span>
                </label>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="border-t pt-4">
            <Label>Preview</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{formData.name || 'Item Name'}</h4>
                  <p className="text-sm text-gray-600">
                    {formData.locationSide.charAt(0).toUpperCase() + formData.locationSide.slice(1)}-
                    {formData.locationLevel.charAt(0).toUpperCase() + formData.locationLevel.slice(1)}
                  </p>
                  {formData.description && (
                    <p className="text-sm text-gray-500 mt-1">{formData.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                  </Badge>
                  {item && (
                    <div>
                      <Badge 
                        variant={formData.status === 'available' ? 'default' : 'secondary'}
                        className={
                          formData.status === 'available' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : formData.status === 'checked_out'
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {formData.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Create Item')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
    </form>
  )
}