import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, QrCode, MapPin, Calendar } from 'lucide-react'

export function ItemDetailPage() {
  // Mock item data
  const item = {
    id: '1',
    name: '4-Person Tent',
    description: 'Coleman 4-person camping tent with rainfly',
    category: 'permanent',
    location: 'Left-High',
    status: 'available',
    qrCode: 'QM-1234567890',
    createdAt: '2024-01-15',
    lastUpdated: '2024-01-20',
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'checked_out':
        return 'bg-quartermaster-orange-100 text-quartermaster-orange-800'
      case 'needs_repair':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-gray-600">Item details and actions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Edit Item</Button>
          <Button variant="qm">Check Out</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Item Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-900">{item.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-gray-900 capitalize">{item.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">No transaction history available</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-16 h-16 bg-quartermaster-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-8 w-8 text-quartermaster-orange-600" />
                </div>
                <p className="font-medium text-gray-900">{item.location}</p>
                <p className="text-sm text-gray-500">Trailer Location</p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="h-4 w-4" />
                <span>QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <QrCode className="h-16 w-16 text-gray-400" />
                </div>
                <p className="text-sm font-mono text-gray-600">{item.qrCode}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Print QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="text-sm text-gray-600">{item.createdAt}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-600">{item.lastUpdated}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}