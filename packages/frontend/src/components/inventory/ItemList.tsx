import { Package, MapPin, Clock, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { Item } from '../../lib/api'

interface ItemListProps {
  items: Item[]
  loading?: boolean
  onItemClick?: (item: Item) => void
  onEditItem?: (item: Item) => void
  onDeleteItem?: (item: Item) => void
  onCheckoutItem?: (item: Item) => void
  onCheckinItem?: (item: Item) => void
}

export function ItemList({
  items,
  loading = false,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onCheckoutItem,
  onCheckinItem,
}: ItemListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Available</Badge>
      case 'checked_out':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Checked Out</Badge>
      case 'needs_repair':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Needs Repair</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'permanent':
        return <Package className="h-5 w-5" />
      case 'staples':
        return <Package className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const formatLocation = (locationSide: string, locationLevel: string) => {
    const side = locationSide.charAt(0).toUpperCase() + locationSide.slice(1)
    const level = locationLevel.charAt(0).toUpperCase() + locationLevel.slice(1)
    return `${side}-${level}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No items found</h3>
        <p className="mt-2 text-gray-500">
          Get started by adding your first inventory item.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-quartermaster-yellow-100 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(item.category)}
                </div>
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {formatLocation(item.locationSide, item.locationLevel)}
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onItemClick?.(item)
                  }}>
                    View Details
                  </DropdownMenuItem>
                  {item.status === 'available' && onCheckoutItem && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onCheckoutItem(item)
                    }}>
                      Check Out
                    </DropdownMenuItem>
                  )}
                  {item.status === 'checked_out' && onCheckinItem && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onCheckinItem(item)
                    }}>
                      Check In
                    </DropdownMenuItem>
                  )}
                  {onEditItem && (
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onEditItem(item)
                    }}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDeleteItem && (
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600" 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteItem(item)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              {getStatusBadge(item.status)}
              
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(item.updatedAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              <span className="capitalize">{item.category}</span>
              {item.qrCode && (
                <span className="ml-2 font-mono">QR: {item.qrCode.slice(-6)}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}