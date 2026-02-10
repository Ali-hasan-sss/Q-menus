"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "./Button";
import { GalleryPicker } from "./GalleryPicker";
import { useLanguage } from "@/store/hooks/useLanguage";
import { getImageUrl } from "@/lib/api";

// Only still images: JPEG, PNG, WebP. No GIF, no video.
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showGalleryOption?: boolean; // Option to show gallery picker
}

export function ImageUpload({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
  showGalleryOption = true,
}: ImageUploadProps) {
  const { isRTL } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<{
    original: { bytes: number; formatted: string };
    compressed: { bytes: number; formatted: string };
    uploaded: { bytes: number; formatted: string };
    compressionSuccess: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
      setError(
        isRTL
          ? "يُسمح فقط بصور JPEG أو PNG أو WebP (بدون GIF أو فيديو)"
          : "Only JPEG, PNG or WebP images are allowed (no GIF or video)"
      );
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const originalSize = file.size;

      // Compress before upload — keep quality high, limit dimensions and size
      const compressionOptions = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        initialQuality: 0.92,
      };

      const compressedFile = await imageCompression(file, compressionOptions);
      const compressedSize = compressedFile.size;

      setSizeInfo({
        original: { bytes: originalSize, formatted: formatBytes(originalSize) },
        compressed: { bytes: compressedSize, formatted: formatBytes(compressedSize) },
        uploaded: { bytes: compressedSize, formatted: formatBytes(compressedSize) },
        compressionSuccess: true,
      });

      const formData = new FormData();
      formData.append("image", compressedFile);

      const uploadUrl =
        process.env.NEXT_PUBLIC_PROXY_API === "true"
          ? "/api/upload"
          : process.env.NEXT_PUBLIC_API_URL
            ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")}/api/upload`
            : "http://localhost:5000/api/upload";

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        const pathToStore = result.data.path ?? result.data.url;
        onChange(pathToStore || null);
      } else {
        setError(result.message || (isRTL ? "فشل في رفع الصورة" : "Failed to upload image"));
        setSizeInfo(null);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        isRTL
          ? "حدث خطأ أثناء رفع الصورة"
          : "An error occurred while uploading the image"
      );
      setSizeInfo(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;
    // All images are server-stored (relative path). No backend delete; clear from UI/DB only.
    onChange(null);
    setSizeInfo(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />

      {/* Upload button or image preview */}
      {!value ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex gap-2 justify-center mb-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleButtonClick}
                  disabled={disabled || uploading}
                >
                  {uploading
                    ? isRTL
                      ? "جاري الرفع..."
                      : "Uploading..."
                    : isRTL
                      ? "رفع صورة"
                      : "Upload Image"}
                </Button>
                {showGalleryOption && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGallery(true)}
                    disabled={disabled || uploading}
                    className="flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {isRTL ? "اختيار صورة جاهزة " : "Select image"}
                  </Button>
                )}
              </div>
              <p className="text-xs">
                {placeholder ||
                  (isRTL
                    ? "JPEG, PNG, WebP فقط — سيتم ضغط الصورة قبل الرفع"
                    : "JPEG, PNG, WebP only — image will be compressed before upload")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={getImageUrl(value)}
              alt="Uploaded image"
              className="w-full h-48 object-cover"
            />
          </div>

          {/* Size information */}
          {sizeInfo && (
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg space-y-1">
              <div className="font-medium mb-2">
                {isRTL ? "معلومات حجم الصورة:" : "Image Size Information:"}
              </div>
              <div className="grid grid-cols-1 gap-1">
                <div className="flex justify-between">
                  <span>{isRTL ? "الحجم الأصلي:" : "Original Size:"}</span>
                  <span className="font-medium">{sizeInfo.original.formatted}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    {isRTL ? "الحجم بعد الضغط:" : "Size After Compression:"}
                  </span>
                  <span className="font-medium">
                    {sizeInfo.compressed.formatted}
                    {!sizeInfo.compressionSuccess && (
                      <span className="text-orange-600 dark:text-orange-400 ml-1">
                        ({isRTL ? "استخدم الأصل" : "used original"})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isRTL ? "الحجم بعد الرفع:" : "Size After Upload:"}</span>
                  <span className="font-medium">{sizeInfo.uploaded.formatted}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons - always visible */}
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleButtonClick}
              disabled={disabled || uploading}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {isRTL ? "تغيير الصورة" : "Change Image"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDelete}
              disabled={disabled || uploading}
              className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700 border-red-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isRTL ? "حذف الصورة" : "Delete Image"}
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{isRTL ? "جاري رفع الصورة..." : "Uploading image..."}</span>
        </div>
      )}

      {/* Gallery Picker Modal */}
      {showGallery && (
        <GalleryPicker
          onSelect={(url) => {
            onChange(url);
            setShowGallery(false);
            // Clear size info when selecting from gallery (no size info available)
            setSizeInfo(null);
          }}
          onClose={() => setShowGallery(false)}
          currentImage={value ? getImageUrl(value) : value}
        />
      )}
    </div>
  );
}
