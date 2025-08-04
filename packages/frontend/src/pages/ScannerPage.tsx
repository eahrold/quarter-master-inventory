import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { QRScanner } from '@/components/scanner/QRScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Package, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ScannedItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  status: string;
  qrCode: string;
}

export function ScannerPage() {
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const navigate = useNavigate();

  const scanMutation = useMutation({
    mutationFn: (qrData: string) => api.qr.scan(qrData),
    onSuccess: (data) => {
      setScannedItem(data.item);
      setScanError(null);
    },
    onError: (error: any) => {
      console.error('QR scan error:', error);
      setScanError(error.message || 'Failed to scan QR code');
      setScannedItem(null);
    },
  });

  const handleScan = (qrData: string) => {
    setScanError(null);
    scanMutation.mutate(qrData);
  };

  const handleViewItem = () => {
    if (scannedItem) {
      navigate(`/inventory/${scannedItem.id}`);
    }
  };

  const handleScanAgain = () => {
    setScannedItem(null);
    setScanError(null);
    scanMutation.reset();
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600">Scan QR codes to quickly access item information</p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        {/* Scanner Component */}
        {!scannedItem && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-quartermaster-orange-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-quartermaster-orange-600" />
                </div>
              </div>
              <CardTitle>QR Code Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <QRScanner onScan={handleScan} />
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {scanMutation.isPending && (
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-quartermaster-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Processing QR code...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {scanError && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Scan Failed</h3>
                <p className="text-sm text-gray-600 mb-4">{scanError}</p>
                <Button onClick={handleScanAgain} variant="outline" className="w-full">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scanned Item Result */}
        {scannedItem && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-green-800">QR Code Scanned Successfully!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Item Information */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{scannedItem.name}</h3>
                    {scannedItem.description && (
                      <p className="text-sm text-gray-600">{scannedItem.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Location: <span className="font-medium">{scannedItem.location}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={getStatusColor(scannedItem.status)}>
                    {scannedItem.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium">
                    {scannedItem.category.charAt(0).toUpperCase() + scannedItem.category.slice(1)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button onClick={handleViewItem} variant="qm" className="w-full">
                  View Item Details
                </Button>
                <Button onClick={handleScanAgain} variant="outline" className="w-full">
                  Scan Another QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}