"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useLanguage } from "@/store/hooks/useLanguage";
import { publicApi } from "@/lib/api";

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
  const jsQRRef = useRef<any>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [currentCamera, setCurrentCamera] = useState<"back" | "front">("back");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  // Load jsQR dynamically to avoid SSR issues
  useEffect(() => {
    if (typeof window !== "undefined" && !jsQRRef.current) {
      import("jsqr").then((module) => {
        jsQRRef.current = module.default;
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  // Start QR detection when video is ready (only once)
  useEffect(() => {
    if (isScanning && videoRef.current && streamRef.current && !intervalRef.current) {
      const video = videoRef.current;
      
      // Wait for video to be ready before starting detection
      const handleCanPlay = () => {
        console.log("Video can play, starting QR detection");
        if (!intervalRef.current) {
          startQRDetection();
        }
      };
      
      if (video.readyState >= 2) {
        // Video is already ready
        startQRDetection();
      } else {
        // Wait for video to be ready
        video.addEventListener("canplay", handleCanPlay, { once: true });
        
        // Fallback timeout
        const timeout = setTimeout(() => {
          if (!intervalRef.current && video.readyState >= 2) {
            console.log("Starting QR detection (fallback timeout)");
            startQRDetection();
          }
        }, 1000);
        
        return () => {
          video.removeEventListener("canplay", handleCanPlay);
          clearTimeout(timeout);
        };
      }
    }
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError(null);
      console.log("Starting camera...");

      // Request camera permission - explicitly use back camera (environment)
      // This ensures we use the rear camera on mobile devices for QR scanning
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentCamera === "back" ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Try to get devices list to ensure we're using the correct camera
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        
        // Store available cameras for switching
        setAvailableCameras(videoDevices);
        
        if (currentCamera === "back") {
          // Find back camera
          const backCamera = videoDevices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
          );

          if (backCamera && backCamera.deviceId) {
            constraints.video = {
              ...(constraints.video as MediaTrackConstraints),
              deviceId: { exact: backCamera.deviceId },
            };
            console.log("Using back camera:", backCamera.label);
          } else if (videoDevices.length > 1) {
            constraints.video = {
              ...(constraints.video as MediaTrackConstraints),
              deviceId: { exact: videoDevices[1].deviceId },
            };
            console.log("Using second camera device (likely back camera)");
          }
        } else {
          // Find front camera
          const frontCamera = videoDevices.find(
            (device) =>
              device.label.toLowerCase().includes("front") ||
              device.label.toLowerCase().includes("user") ||
              device.label.toLowerCase().includes("facing")
          );

          if (frontCamera && frontCamera.deviceId) {
            constraints.video = {
              ...(constraints.video as MediaTrackConstraints),
              deviceId: { exact: frontCamera.deviceId },
            };
            console.log("Using front camera:", frontCamera.label);
          } else if (videoDevices.length > 0) {
            constraints.video = {
              ...(constraints.video as MediaTrackConstraints),
              deviceId: { exact: videoDevices[0].deviceId },
            };
            console.log("Using first camera device (likely front camera)");
          }
        }
      } catch (deviceError) {
        console.warn("Could not enumerate devices, using facingMode:", deviceError);
        // Fall back to facingMode if device enumeration fails
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera stream obtained:", stream);

      // Store stream in ref
      streamRef.current = stream;

      // Set scanning state to render video element
      setIsScanning(true);
      setHasPermission(true);

      // Wait for React to render video element
      await new Promise(resolve => setTimeout(resolve, 50));

      // Bind stream directly to video element (CRITICAL: do this after setIsScanning)
      if (videoRef.current) {
        console.log("Binding stream to video element directly");
        videoRef.current.srcObject = stream;
        
        // Play video immediately
        try {
          await videoRef.current.play();
          console.log("Video playing successfully");
        } catch (playError) {
          console.error("Error playing video:", playError);
        }
      } else {
        console.error("Video ref is null after render");
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

  const switchCamera = async () => {
    if (!isScanning || !streamRef.current) {
      console.warn("Cannot switch camera: not scanning or no stream");
      return;
    }

    // If we don't have cameras list yet, try to get it
    let camerasToUse = availableCameras;
    if (camerasToUse.length < 2) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        if (videoDevices.length >= 2) {
          setAvailableCameras(videoDevices);
          camerasToUse = videoDevices;
        } else {
          console.warn("Less than 2 cameras available, cannot switch");
          return;
        }
      } catch (err) {
        console.error("Error enumerating devices for switch:", err);
        return;
      }
    }

    try {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Toggle camera
      const newCamera = currentCamera === "back" ? "front" : "back";
      setCurrentCamera(newCamera);

      // Get constraints for new camera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: newCamera === "back" ? "environment" : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Try to use specific device ID
      const targetCamera = newCamera === "back"
        ? camerasToUse.find(
            (device: MediaDeviceInfo) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
          ) || (camerasToUse.length > 1 ? camerasToUse[1] : camerasToUse[0])
        : camerasToUse.find(
            (device: MediaDeviceInfo) =>
              device.label.toLowerCase().includes("front") ||
              device.label.toLowerCase().includes("user") ||
              device.label.toLowerCase().includes("facing")
          ) || camerasToUse[0];

      if (targetCamera && targetCamera.deviceId) {
        constraints.video = {
          ...(constraints.video as MediaTrackConstraints),
          deviceId: { exact: targetCamera.deviceId },
        };
        console.log(`Switching to ${newCamera} camera:`, targetCamera.label);
      }

      // Get new stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Update video element directly
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log("Video playing after camera switch");
        } catch (err) {
          console.error("Error playing video after switch:", err);
        }
      }
    } catch (err: any) {
      console.error("Error switching camera:", err);
      setError(
        isRTL
          ? "فشل في التبديل بين الكاميرات"
          : "Failed to switch camera"
      );
    }
  };

  const startQRDetection = () => {
    intervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

          // Use jsQR library to detect QR code
          if (jsQRRef.current) {
            const code = jsQRRef.current(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: "dontInvert",
              }
            );

            if (code && code.data) {
              console.log("QR code detected:", code.data);
              handleQRCodeDetected(code.data);
            }
          }
        }
      }
    }, 250); // Check every 250ms for better responsiveness
  };

  const handleQRCodeDetected = async (qrData: string) => {
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
          // Check for incomplete order before allowing QR scan
          // Only check for dine-in orders (not DELIVERY)
          if (tableNumber !== "DELIVERY") {
            try {
              const response = await publicApi.get(
                `/order/incomplete/${restaurantId}?tableNumber=${tableNumber}`
              );
              if (
                response.data.success &&
                response.data.data.order &&
                response.data.data.order.status !== "COMPLETED" &&
                response.data.data.order.status !== "CANCELLED"
              ) {
                // Incomplete order found - redirect to order page instead
                stopScanning();
                const orderId = response.data.data.order.id;
                console.log(
                  "🚫 Incomplete order found, redirecting to order page:",
                  orderId
                );
                router.push(`/order/${orderId}`);
                return;
              }
            } catch (error) {
              // No incomplete order found, continue with normal flow
              console.log("No incomplete order found, proceeding with QR scan");
            }
          }

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

  console.log("Rendering video scanner, isScanning:", isScanning, "stream:", !!streamRef.current, "video:", !!videoRef.current);
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black" style={{ width: "100vw", height: "100vh" }}>
      {/* Video element - must be below overlay with proper z-index */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ 
          width: "100%", 
          height: "100%", 
          objectFit: "cover",
          zIndex: 0,
          backgroundColor: "#000"
        }}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay with scanning frame - must be above video */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="w-64 h-64 border-4 border-white border-dashed rounded-lg relative">
          <div className="absolute top-2 left-2 right-2 h-1 bg-white animate-pulse"></div>
          <div className="absolute bottom-2 left-2 right-2 h-1 bg-white animate-pulse"></div>
          <div className="absolute left-2 top-2 bottom-2 w-1 bg-white animate-pulse"></div>
          <div className="absolute right-2 top-2 bottom-2 w-1 bg-white animate-pulse"></div>
        </div>
      </div>

      {/* Instructions and Controls - must be above overlay */}
      <div className="absolute bottom-8 left-4 right-4 text-center z-20 pointer-events-auto">
        <p
          className="text-white text-lg font-medium mb-3"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {isRTL ? "وجه الكاميرا نحو رمز QR" : "Point camera at QR code"}
        </p>
        <div className="flex gap-3 justify-center items-center">
          {/* Show switch button if we have multiple cameras OR if we're scanning (camera is active) */}
          {(availableCameras.length > 1 || (isScanning && streamRef.current)) && (
            <Button
              onClick={switchCamera}
              variant="outline"
              className="bg-white/90 text-black hover:bg-white flex items-center gap-2"
              title={isRTL 
                ? `التبديل إلى الكاميرا ${currentCamera === "back" ? "الأمامية" : "الخلفية"}`
                : `Switch to ${currentCamera === "back" ? "front" : "back"} camera`
              }
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">
                {isRTL 
                  ? (currentCamera === "back" ? "أمامية" : "خلفية")
                  : (currentCamera === "back" ? "Front" : "Back")
                }
              </span>
            </Button>
          )}
          <Button
            onClick={stopScanning}
            variant="outline"
            className="bg-white text-black hover:bg-gray-100"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
        </div>
      </div>
    </div>
  );
}
