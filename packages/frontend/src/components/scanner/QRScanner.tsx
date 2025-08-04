import { useState } from 'react';
import { useQRScanner, type QRScanResult } from '@/hooks/useQRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, AlertCircle, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function QRScanner({ onScan, onClose, isModal = false }: QRScannerProps) {
  const [hasScanned, setHasScanned] = useState(false);
  
  const {
    videoRef,
    isScanning,
    hasPermission,
    error,
    requestPermission,
    startScanning,
    stopScanning,
  } = useQRScanner();

  const handleScan = (result: QRScanResult) => {
    if (!hasScanned) {
      setHasScanned(true);
      stopScanning();
      onScan(result.text);
      
      // Reset after a delay to allow for new scans
      setTimeout(() => {
        setHasScanned(false);
      }, 2000);
    }
  };

  const handleStartScanning = () => {
    setHasScanned(false);
    startScanning(handleScan);
  };

  const handleStopScanning = () => {
    stopScanning();
    setHasScanned(false);
  };

  // Camera permission request screen
  if (hasPermission === null) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <Camera className="mx-auto h-12 w-12 text-quartermaster-orange-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-gray-600 mb-4">
            We need access to your camera to scan QR codes
          </p>
          <Button
            onClick={requestPermission}
            variant="qm"
            className="w-full"
          >
            Allow Camera Access
          </Button>
          {isModal && onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full mt-2"
            >
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Camera permission denied screen
  if (hasPermission === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-gray-600 mb-4">
            {error || 'Please enable camera permissions in your browser settings and refresh the page'}
          </p>
          <div className="space-y-2">
            <Button
              onClick={requestPermission}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
            {isModal && onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main scanner interface
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Video preview with scanning overlay */}
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-square rounded-lg bg-black"
          autoPlay
          playsInline
          muted
          style={{ objectFit: 'cover' }}
        />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 border-2 border-quartermaster-orange-400 rounded-lg pointer-events-none">
          {/* Corner markers */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-quartermaster-orange-400"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-quartermaster-orange-400"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-quartermaster-orange-400"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-quartermaster-orange-400"></div>
          
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-quartermaster-orange-400 rounded-full opacity-60"></div>
          </div>
          
          {/* Success indicator */}
          {hasScanned && (
            <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
              <div className="bg-white rounded-full p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          )}
        </div>
        
        {/* Status indicator */}
        <div className="absolute top-2 left-2 right-2">
          {isScanning && !hasScanned ? (
            <div className="bg-quartermaster-orange-500 text-white px-3 py-1 rounded-full text-sm text-center">
              🔍 Scanning for QR codes...
            </div>
          ) : hasScanned ? (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm text-center">
              ✅ QR code detected!
            </div>
          ) : (
            <div className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm text-center">
              Ready to scan
            </div>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2">
        {!isScanning ? (
          <Button
            onClick={handleStartScanning}
            variant="qm"
            className="flex-1"
            disabled={hasScanned}
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <Button
            onClick={handleStopScanning}
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
        
        {isModal && onClose && (
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Close
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Point your camera at a QR code to scan it
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}