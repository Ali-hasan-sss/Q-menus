"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { Button } from "./Button";
import { Input } from "./Input";

interface GalleryImage {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string;
  usageCount: number;
}

interface GalleryPickerProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  currentImage?: string;
}

const CATEGORIES = [
  { value: "all", label: "All", labelAr: "الكل" },
  { value: "food", label: "Food", labelAr: "طعام" },
  { value: "drink", label: "Drinks", labelAr: "مشروبات" },
  { value: "dessert", label: "Desserts", labelAr: "حلويات" },
  { value: "appetizer", label: "Appetizers", labelAr: "مقبلات" },
  { value: "main", label: "Main Course", labelAr: "أطباق رئيسية" },
  { value: "general", label: "General", labelAr: "عام" },
];

export function GalleryPicker({
  onSelect,
  onClose,
  currentImage,
}: GalleryPickerProps) {
  const { isRTL } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(
    currentImage || null
  );

  useEffect(() => {
    fetchImages();
  }, [searchTerm, selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);

      const response = await api.get(`/gallery?${params.toString()}`);
      if (response.data.success) {
        setImages(response.data.data.images);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (selectedImage) {
      // Increment usage count
      const imageId = images.find((img) => img.imageUrl === selectedImage)?.id;
      if (imageId) {
        try {
          await api.post(`/gallery/${imageId}/use`);
        } catch (error) {
          console.error("Error incrementing usage count:", error);
        }
      }
      onSelect(selectedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isRTL ? "معرض Qmenus" : "Qmenus Gallery"}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isRTL
                  ? "اختر صورة من المعرض المشترك أو ارفع صورة خاصة بك"
                  : "Select an image from our shared gallery or upload your own"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={isRTL ? "بحث..." : "Search..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {isRTL ? cat.labelAr : cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? "لا توجد صور" : "No images found"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => setSelectedImage(image.imageUrl)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === image.imageUrl
                      ? "border-primary-600 shadow-lg scale-105"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === image.imageUrl && (
                      <div className="absolute inset-0 bg-primary-600 bg-opacity-20 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-white dark:bg-gray-700">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {isRTL ? image.nameAr : image.name}
                    </p>
                    {image.usageCount > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {image.usageCount}× {isRTL ? "مستخدمة" : "used"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleSelect}
            disabled={!selectedImage}
          >
            {isRTL ? "اختيار" : "Select"}
          </Button>
        </div>
      </div>
    </div>
  );
}
