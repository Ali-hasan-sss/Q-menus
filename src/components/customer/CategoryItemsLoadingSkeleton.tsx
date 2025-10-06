"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface CategoryItemsLoadingSkeletonProps {
  menuTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  } | null;
  categoryName?: string;
}

// Custom Skeleton component
function Skeleton({
  height,
  width,
  circle = false,
  className = "",
}: {
  height: number;
  width: number;
  circle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${circle ? "rounded-full" : "rounded"} ${className}`}
      style={{
        height: `${height}px`,
        width: `${width}px`,
      }}
    />
  );
}

export function CategoryItemsLoadingSkeleton({
  menuTheme,
  categoryName,
}: CategoryItemsLoadingSkeletonProps) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen relative">
      {/* Header Skeleton */}
      <header
        style={{
          background: menuTheme?.backgroundColor || "#ffffff",
          zIndex: 1000,
        }}
        className="shadow-sm backdrop-blur-xl fixed w-full top-0 right-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Back Button Skeleton */}
              <Skeleton height={32} width={32} circle />
              <div>
                <Skeleton height={20} width={160} className="mb-1" />
                <Skeleton height={14} width={120} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton circle height={32} width={32} />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl pt-[100px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {/* Category Title Skeleton */}
        <div className="text-center mb-5">
          <Skeleton height={32} width={256} className="mx-auto mb-4" />
        </div>

        {/* Items Grid Skeleton - 8 items in 2 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="shadow-sm border cursor-pointer hover:shadow-md transition-shadow rounded-lg p-4"
              style={{
                backgroundColor: menuTheme?.backgroundColor || "#ffffff",
                borderColor: menuTheme?.secondaryColor || "#e5e7eb",
              }}
            >
              {/* Item Image Skeleton */}
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
                <Skeleton circle height={80} width={80} />
              </div>

              {/* Item Details Skeleton */}
              <div className="text-center">
                <Skeleton height={16} width={96} className="mx-auto mb-2" />
                <Skeleton height={12} width={64} className="mx-auto mb-3" />

                {/* Price Skeleton */}
                <div className="flex items-center justify-center mb-3">
                  <Skeleton height={18} width={60} />
                </div>

                {/* Button Skeleton */}
                <Skeleton height={32} width={80} className="mx-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Loading Message */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div
            className="px-4 py-2 rounded-full shadow-lg"
            style={{
              backgroundColor: menuTheme?.primaryColor || "#f97316",
              color: menuTheme?.textColor || "#ffffff",
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span className="text-sm font-medium">
                {isRTL
                  ? `جاري تحميل عناصر ${categoryName || "الفئة"}...`
                  : `Loading ${categoryName || "category"} items...`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
