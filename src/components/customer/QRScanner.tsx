"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/contexts/LanguageContext";

interface QRScannerProps {
  restaurantId: string;
}

export default function QRScanner({ restaurantId }: QRScannerProps) {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setHasPermission(true);

        // Start QR code detection
        startQRDetection();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      if (err.name === "NotAllowedError") {
        setError(
          isRTL
            ? "تم رفض إذن الكاميرا. يرجى السماح بالوصول للكاميرا."
            : "Camera permission denied. Please allow camera access."
        );
      } else if (err.name === "NotFoundError") {
        setError(isRTL ? "لم يتم العثور على كاميرا." : "No camera found.");
      } else {
        setError(isRTL ? "خطأ في الوصول للكاميرا." : "Camera access error.");
      }
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRDetection = () => {
    intervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Simple QR code detection (you might want to use a library like jsQR)
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          // For now, we'll use a simple approach - in production, use jsQR library
          detectQRCode(imageData);
        }
      }
    }, 1000); // Check every second
  };

  const detectQRCode = (imageData: ImageData) => {
    // This is a simplified version. In production, use jsQR library:
    // import jsQR from 'jsqr';
    // const code = jsQR(imageData.data, imageData.width, imageData.height);

    // For demo purposes, we'll simulate QR detection
    // In real implementation, parse the QR code and extract tableNumber
    console.log("QR detection running...");
  };

  const handleQRCodeDetected = (qrData: string) => {
    try {
      // Parse QR code data to extract table number
      const url = new URL(qrData);
      const pathParts = url.pathname.split("/");
      const tableNumber = url.searchParams.get("tableNumber");

      // Validate that QR code is for this restaurant
      if (pathParts[1] === "menu" && pathParts[2] === restaurantId) {
        if (
          tableNumber &&
          (tableNumber === "DELIVERY" || /^\d+$/.test(tableNumber))
        ) {
          stopScanning();
          
          // Clear browser history to prevent back button manipulation
          window.history.replaceState(null, "", window.location.href);
          
          router.push(`/menu/${restaurantId}?tableNumber=${tableNumber}`);
        } else {
          setError(
            isRTL
              ? "رمز QR غير صحيح - رقم الطاولة غير صالح"
              : "Invalid QR code - invalid table number"
          );
        }
      } else {
        setError(
          isRTL
            ? "رمز QR غير صحيح - لا ينتمي لهذا المطعم"
            : "Invalid QR code - not for this restaurant"
        );
      }
    } catch (err) {
      setError(isRTL ? "رمز QR غير صحيح" : "Invalid QR code");
    }
  };

  // Manual entry removed for security reasons - QR scan only

  if (hasPermission === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {isRTL ? "مطلوب إذن الكاميرا" : "Camera Permission Required"}
          </h2>
          <p
            className="text-gray-600 dark:text-gray-400 mb-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {isRTL
              ? "يجب السماح بالوصول للكاميرا لمسح رمز QR الخاص بالطاولة. الإدخال اليدوي غير متاح لأغراض الأمان."
              : "Camera access is required to scan the table's QR code. Manual entry is disabled for security reasons."}
          </p>
          <div className="space-y-3">
            <Button onClick={startScanning} className="w-full">
              {isRTL ? "إعادة المحاولة" : "Try Again"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {isRTL ? "خطأ في المسح" : "Scanning Error"}
          </h2>
          <p
            className="text-gray-600 dark:text-gray-400 mb-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {error}
            <br />
            {isRTL
              ? "يرجى السماح بالوصول للكاميرا للمتابعة. الإدخال اليدوي غير متاح لأغراض الأمان."
              : "Please allow camera access to continue. Manual entry is disabled for security reasons."}
          </p>
          <div className="space-y-3">
            <Button onClick={startScanning} className="w-full">
              {isRTL ? "إعادة المحاولة" : "Try Again"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isScanning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-blue-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-4" dir={isRTL ? "rtl" : "ltr"}>
            {isRTL ? "مسح رمز QR للطاولة" : "Scan Table QR Code"}
          </h2>
          <p
            className="text-gray-600 dark:text-gray-400 mb-6"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {isRTL
              ? "امسح رمز QR الموجود على الطاولة للوصول إلى قائمة الطعام. الإدخال اليدوي غير متاح لأغراض الأمان."
              : "Scan the QR code on your table to access the menu. Manual entry is disabled for security reasons."}
          </p>
          <div className="space-y-3">
            <Button onClick={startScanning} className="w-full">
              {isRTL ? "بدء المسح" : "Start Scanning"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay with scanning frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-4 border-white border-dashed rounded-lg relative">
          <div className="absolute top-2 left-2 right-2 h-1 bg-white animate-pulse"></div>
          <div className="absolute bottom-2 left-2 right-2 h-1 bg-white animate-pulse"></div>
          <div className="absolute left-2 top-2 bottom-2 w-1 bg-white animate-pulse"></div>
          <div className="absolute right-2 top-2 bottom-2 w-1 bg-white animate-pulse"></div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-8 left-4 right-4 text-center">
        <p
          className="text-white text-lg font-medium mb-2"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {isRTL ? "وجه الكاميرا نحو رمز QR" : "Point camera at QR code"}
        </p>
        <Button
          onClick={stopScanning}
          variant="outline"
          className="bg-white text-black hover:bg-gray-100"
        >
          {isRTL ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}
