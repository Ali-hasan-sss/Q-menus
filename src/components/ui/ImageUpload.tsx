"use client";

import { useState, useRef } from "react";
import { Button } from "./Button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = "",
}: ImageUploadProps) {
  const { isRTL } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(isRTL ? "يجب أن يكون الملف صورة" : "File must be an image");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(
        isRTL
          ? "حجم الملف يجب أن يكون أقل من 5 ميجابايت"
          : "File size must be less than 5MB"
      );
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onChange(result.data.url);
      } else {
        setError(isRTL ? "فشل في رفع الصورة" : "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        isRTL
          ? "حدث خطأ أثناء رفع الصورة"
          : "An error occurred while uploading the image"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    // Extract public ID from Cloudinary URL
    const urlParts = value.split("/");
    const publicId = urlParts
      .slice(urlParts.findIndex((part) => part === "upload") + 1)
      .join("/")
      .split(".")[0];

    try {
      const response = await fetch("/api/upload", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });

      const result = await response.json();

      if (result.success) {
        onChange(null);
      } else {
        console.error("Delete error:", result.message);
        // Even if delete fails on server, remove from UI
        onChange(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      // Even if delete fails, remove from UI
      onChange(null);
    }
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
        accept="image/*"
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
              <Button
                type="button"
                variant="outline"
                onClick={handleButtonClick}
                disabled={disabled || uploading}
                className="mb-2"
              >
                {uploading
                  ? isRTL
                    ? "جاري الرفع..."
                    : "Uploading..."
                  : isRTL
                    ? "اختر صورة"
                    : "Choose Image"}
              </Button>
              <p className="text-xs">
                {placeholder ||
                  (isRTL
                    ? "PNG, JPG, GIF حتى 5 ميجابايت"
                    : "PNG, JPG, GIF up to 5MB")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={value}
              alt="Uploaded image"
              className="w-full h-48 object-cover"
            />
          </div>

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
    </div>
  );
}
