import { useState, useRef, useEffect } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';

export interface QRScanResult {
  text: string;
  timestamp: number;
}

export function useQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<QRScanResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const scanningRef = useRef<boolean>(false);

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
      });
      
      setHasPermission(true);
      setError(null);
      
      // Stop the test stream immediately
      stream.getTracks().forEach((track) => track.stop());
      
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please enable camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotSupportedError') {
          setError('Camera is not supported in this browser.');
        } else {
          setError('Failed to access camera. Please try again.');
        }
      } else {
        setError('Failed to access camera. Please try again.');
      }
      
      return false;
    }
  };

  const startScanning = async (onResult: (result: QRScanResult) => void) => {
    if (scanningRef.current) {
      return; // Already scanning
    }

    if (hasPermission !== true) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        return;
      }
    }

    try {
      setIsScanning(true);
      setError(null);
      scanningRef.current = true;

      if (!readerRef.current) {
        readerRef.current = new BrowserQRCodeReader();
      }

      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Start continuous scanning
      await readerRef.current.decodeFromVideoDevice(
        null, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result && scanningRef.current) {
            const scanResult: QRScanResult = {
              text: result.getText(),
              timestamp: Date.now(),
            };
            
            setLastResult(scanResult);
            onResult(scanResult);
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            // NotFoundException is expected when no QR code is visible
            console.warn('QR scanning error:', error);
          }
        }
      );

    } catch (err) {
      console.error('QR scanning start error:', err);
      setError('Failed to start QR scanner. Please try again.');
      scanningRef.current = false;
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);
    
    if (readerRef.current) {
      readerRef.current.reset();
    }
    
    // Stop any active video streams
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return {
    videoRef,
    isScanning,
    hasPermission,
    error,
    lastResult,
    requestPermission,
    startScanning,
    stopScanning,
  };
}