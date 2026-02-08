"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { api } from "@/lib/api";

interface GalleryImage {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  imageUrl: string;
  category: string;
  tags?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "All Categories", labelAr: "جميع الفئات" },
  { value: "food", label: "Food", labelAr: "طعام" },
  { value: "drink", label: "Drinks", labelAr: "مشروبات" },
  { value: "dessert", label: "Desserts", labelAr: "حلويات" },
  { value: "appetizer", label: "Appetizers", labelAr: "مقبلات" },
  { value: "main", label: "Main Course", labelAr: "أطباق رئيسية" },
  { value: "general", label: "General", labelAr: "عام" },
];

export default function AdminGalleryPage() {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    imageUrl: "",
    category: "general",
    tags: "",
  });

  useEffect(() => {
    fetchImages();
    fetchStats();
  }, [searchTerm, selectedCategory]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);

      const response = await api.get(`/gallery/admin?${params.toString()}`);
      if (response.data.success) {
        setImages(response.data.data.images);
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      showToast(isRTL ? "خطأ في جلب الصور" : "Error fetching images", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/gallery/admin/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.imageUrl) {
      showToast(isRTL ? "الرجاء رفع صورة" : "Please upload an image", "error");
      return;
    }

    if (!formData.name.trim()) {
      showToast(
        isRTL
          ? "الرجاء إدخال اسم الصورة بالإنجليزي"
          : "Please enter image name in English",
        "error"
      );
      return;
    }

    if (!formData.nameAr.trim()) {
      showToast(
        isRTL
          ? "الرجاء إدخال اسم الصورة بالعربي"
          : "Please enter image name in Arabic",
        "error"
      );
      return;
    }

    try {
      if (editingImage) {
        // Update
        const response = await api.put(
          `/gallery/admin/${editingImage.id}`,
          formData
        );
        if (response.data.success) {
          showToast(
            isRTL ? "تم تحديث الصورة بنجاح" : "Image updated successfully",
            "success"
          );
          fetchImages();
          fetchStats();
          closeModal();
        }
      } else {
        // Create
        const response = await api.post("/gallery/admin", formData);
        if (response.data.success) {
          showToast(
            isRTL ? "تم إضافة الصورة بنجاح" : "Image added successfully",
            "success"
          );
          fetchImages();
          fetchStats();
          closeModal();
        }
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ" : "An error occurred"),
        "error"
      );
    }
  };

  const handleDelete = (image: GalleryImage) => {
    showConfirm({
      title: isRTL ? "حذف الصورة" : "Delete Image",
      message: isRTL
        ? `هل أنت متأكد من حذف "${image.nameAr || image.name}"؟`
        : `Are you sure you want to delete "${image.name}"?`,
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/gallery/admin/${image.id}`);
          showToast(
            isRTL ? "تم حذف الصورة بنجاح" : "Image deleted successfully",
            "success"
          );
          fetchImages();
          fetchStats();
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "خطأ في حذف الصورة" : "Error deleting image"),
            "error"
          );
        }
      },
    });
  };

  const handleToggleStatus = async (image: GalleryImage) => {
    try {
      await api.put(`/gallery/admin/${image.id}/toggle`);
      showToast(
        isRTL
          ? `تم ${image.isActive ? "إلغاء تفعيل" : "تفعيل"} الصورة`
          : `Image ${image.isActive ? "deactivated" : "activated"}`,
        "success"
      );
      fetchImages();
      fetchStats();
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "خطأ في تحديث الحالة" : "Error updating status"),
        "error"
      );
    }
  };

  const openModal = (image?: GalleryImage) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        name: image.name,
        nameAr: image.nameAr,
        description: image.description || "",
        imageUrl: image.imageUrl,
        category: image.category,
        tags: image.tags || "",
      });
    } else {
      setEditingImage(null);
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        imageUrl: "",
        category: "general",
        tags: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingImage(null);
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      imageUrl: "",
      category: "general",
      tags: "",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isRTL ? "إدارة معرض الصور" : "Gallery Management"}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "إدارة الصور المشتركة للمستخدمين"
                  : "Manage shared images for users"}
              </p>
            </div>
            <Button onClick={() => openModal()} className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              {isRTL ? "إضافة صورة" : "Add Image"}
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL ? "إجمالي الصور" : "Total Images"}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL ? "نشطة" : "Active"}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL ? "غير نشطة" : "Inactive"}
                </div>
                <div className="text-2xl font-bold text-gray-600">
                  {stats.inactive}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isRTL ? "الفئات" : "Categories"}
                </div>
                <div className="text-2xl font-bold text-primary-600">
                  {stats.byCategory?.length || 0}
                </div>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
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
          </Card>

          {/* Images Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : images.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? "لا توجد صور" : "No images found"}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <Card
                  key={image.id}
                  className={`overflow-hidden ${!image.isActive ? "opacity-50" : ""}`}
                >
                  <div className="relative aspect-square">
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {!image.isActive && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                        {isRTL ? "غير نشط" : "Inactive"}
                      </div>
                    )}
                    {image.usageCount > 0 && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {image.usageCount}× {isRTL ? "مستخدمة" : "used"}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {isRTL ? image.nameAr : image.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isRTL
                        ? CATEGORIES.find((c) => c.value === image.category)
                            ?.labelAr
                        : CATEGORIES.find((c) => c.value === image.category)
                            ?.label}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openModal(image)}
                        className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        {isRTL ? "تعديل" : "Edit"}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(image)}
                        className={`flex-1 px-2 py-1 text-xs rounded ${
                          image.isActive
                            ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {image.isActive
                          ? isRTL
                            ? "إلغاء"
                            : "Deactivate"
                          : isRTL
                            ? "تفعيل"
                            : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(image)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        {isRTL ? "حذف" : "Delete"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingImage
                    ? isRTL
                      ? "تعديل الصورة"
                      : "Edit Image"
                    : isRTL
                      ? "إضافة صورة جديدة"
                      : "Add New Image"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
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

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "الصورة" : "Image"}
                  </label>
                  <ImageUpload
                    value={formData.imageUrl}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, imageUrl: url || "" }))
                    }
                    showGalleryOption={false}
                  />
                </div>

                {/* Name (English) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الاسم (إنجليزي)" : "Name (English)"} *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Hummus, Shawarma, etc."
                  />
                </div>

                {/* Name (Arabic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الاسم (عربي)" : "Name (Arabic)"} *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.nameAr}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        nameAr: e.target.value,
                      }))
                    }
                    placeholder="حمص، شاورما، إلخ"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الفئة" : "Category"}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {isRTL ? cat.labelAr : cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الوصف" : "Description"}{" "}
                    <span className="text-gray-400">
                      ({isRTL ? "اختياري" : "optional"})
                    </span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder={
                      isRTL
                        ? "وصف قصير للصورة..."
                        : "Short description of the image..."
                    }
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الوسوم" : "Tags"}{" "}
                    <span className="text-gray-400">
                      ({isRTL ? "اختياري" : "optional"})
                    </span>
                  </label>
                  <Input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tags: e.target.value }))
                    }
                    placeholder={
                      isRTL ? "مقبلات, صحي, نباتي" : "appetizer, healthy, vegan"
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isRTL ? "افصل الوسوم بفاصلة" : "Separate tags with commas"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeModal}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="submit">
                    {editingImage
                      ? isRTL
                        ? "تحديث"
                        : "Update"
                      : isRTL
                        ? "إضافة"
                        : "Add"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
