"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useLanguage } from "@/store/hooks/useLanguage";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    items: number;
  };
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, "id">) => Promise<void>;
  category?: Category | null;
  title: string;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
}: CategoryFormModalProps) {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    image: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        nameAr: category.nameAr || "",
        description: category.description || "",
        descriptionAr: category.descriptionAr || "",
        image: category.image || "",
      });
    } else {
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        image: "",
      });
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = category
    ? isRTL
      ? `تحديث الفئة - ${category.name}`
      : `Update Category - ${category.name}`
    : isRTL
      ? "إضافة فئة جديدة"
      : "Add New Category";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <div className="max-h-[70vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* اسم الفئة */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? "اسم الفئة (العربية)" : "Category Name (Arabic)"} *
              </label>
              <Input
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                placeholder={isRTL ? "أدخل اسم الفئة" : "Enter category name"}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? "اسم الفئة (الإنجليزية)" : "Category Name (English)"} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={isRTL ? "أدخل اسم الفئة" : "Enter category name"}
                required
              />
            </div>
          </div>

          {/* الوصف */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? "الوصف (العربية)" : "Description (Arabic)"}{" "}
                <span className="text-gray-400 text-sm">
                  ({isRTL ? "اختياري" : "Optional"})
                </span>
              </label>
              <Input
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
                placeholder={isRTL ? "أدخل الوصف" : "Enter description"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isRTL ? "الوصف (الإنجليزية)" : "Description (English)"}{" "}
                <span className="text-gray-400 text-sm">
                  ({isRTL ? "اختياري" : "Optional"})
                </span>
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={isRTL ? "أدخل الوصف" : "Enter description"}
              />
            </div>
          </div>

          {/* صورة الفئة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRTL ? "صورة الفئة" : "Category Image"}{" "}
              <span className="text-gray-400 text-sm">
                ({isRTL ? "اختياري" : "Optional"})
              </span>
            </label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url || "" })}
              placeholder={
                isRTL
                  ? "رفع صورة الفئة (اختياري)"
                  : "Upload category image (optional)"
              }
            />
          </div>

          <div
            className={`flex pt-4 ${isRTL ? "justify-start space-x-reverse space-x-3" : "justify-end space-x-3"}`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isRTL
                  ? "جاري الحفظ..."
                  : "Saving..."
                : category
                  ? isRTL
                    ? "تحديث"
                    : "Update"
                  : isRTL
                    ? "إنشاء"
                    : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
