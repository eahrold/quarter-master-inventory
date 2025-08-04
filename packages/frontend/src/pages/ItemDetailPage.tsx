import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QRDisplay } from '@/components/scanner/QRDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => api.items.get(id!),
    enabled: !!id,
  });

  const item = data?.item;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-yellow-100 text-yellow-800';
      case 'needs_repair':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-quartermaster-orange-500 mx-auto mb-2" />
          <p className="text-gray-600">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600">Failed to load item details</p>
        </div>
      </div>
    );
  }

  const locationDisplay = `${item.locationSide.charAt(0).toUpperCase() + item.locationSide.slice(1)}-${
    item.locationLevel.charAt(0).toUpperCase() + item.locationLevel.slice(1)
  }`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{item.name}</h1>
          <p className="text-gray-600">Item details and actions</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">Edit Item</Button>
          <Button variant="qm" disabled={item.status !== 'available'}>
            {item.status === 'available' ? 'Check Out' : 'Unavailable'}
          </Button>
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
                  <div className="mt-1">
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
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
                <p className="font-medium text-gray-900">{locationDisplay}</p>
                <p className="text-sm text-gray-500">Trailer Location</p>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <QRDisplay itemId={item.id} itemName={item.name} showPrintButton={true} />

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
                <p className="text-sm text-gray-600">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Last Updated</label>
                <p className="text-sm text-gray-600">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">QR Code ID</label>
                <p className="text-sm font-mono text-gray-600">{item.qrCode}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}