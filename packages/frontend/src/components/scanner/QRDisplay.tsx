import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Printer, QrCode, Loader2 } from 'lucide-react';

interface QRDisplayProps {
  itemId: string;
  itemName: string;
  showPrintButton?: boolean;
}

export function QRDisplay({ itemId, itemName, showPrintButton = false }: QRDisplayProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch QR code for the item
  const { data: qrData, isLoading, error } = useQuery({
    queryKey: ['qr-code', itemId],
    queryFn: () => api.qr.generate(itemId),
    staleTime: 5 * 60 * 1000, // QR codes don't change often, cache for 5 minutes
  });

  const handleDownload = () => {
    if (!qrData?.qrCode) return;

    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = qrData.qrCode;
    link.download = `qr-code-${itemName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      
      // Get printable HTML
      const printableHTML = await api.qr.getPrintable(itemId);
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printableHTML);
        printWindow.document.close();
        
        // Trigger print dialog
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }
    } catch (error) {
      console.error('Error generating printable QR code:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-quartermaster-orange-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Generating QR code...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !qrData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Failed to generate QR code</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">QR Code</CardTitle>
        <p className="text-sm text-gray-600">{itemName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Image */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={qrData.qrCode}
              alt={`QR code for ${itemName}`}
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* QR Code Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Scan this code to quickly access item information</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          
          {showPrintButton && (
            <Button
              onClick={handlePrint}
              variant="qm"
              className="flex-1"
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 mr-2" />
              )}
              Print Label
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}