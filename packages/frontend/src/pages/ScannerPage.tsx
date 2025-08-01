import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Camera } from 'lucide-react'

export function ScannerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600">Scan QR codes to quickly access item information</p>
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-quartermaster-orange-100 rounded-lg flex items-center justify-center">
                <QrCode className="h-8 w-8 text-quartermaster-orange-600" />
              </div>
            </div>
            <CardTitle>QR Code Scanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Camera preview will appear here</p>
              </div>
            </div>
            <Button variant="qm" className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Point your camera at a QR code to scan it
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}