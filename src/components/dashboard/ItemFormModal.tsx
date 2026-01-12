"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { api, endpoints } from "@/lib/api";

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  image?: string;
  sortOrder: number;
  categoryId: string;
  isAvailable?: boolean;
  discount?: number;
  extras?: any;
  kitchenSectionId?: string | null;
  category?: {
    name: string;
    nameAr?: string;
  };
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
}

interface KitchenSection {
  id: string;
  name: string;
  nameAr?: string;
  sortOrder: number;
  isActive: boolean;
}

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MenuItem, "id">) => Promise<void>;
  item?: MenuItem | null;
  categories: Category[];
  title: string;
  categoryId?: string; // معرف الفئة المحددة
  restaurantCurrency?: string; // عملة المطعم
}

export function ItemFormModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  categories,
  title,
  categoryId,
  restaurantCurrency = "USD",
}: ItemFormModalProps) {
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    price: 0,
    image: "",
    categoryId: "",
    discount: 0,
    extras: {},
    kitchenSectionId: "" as string | "",
  });
  const [loading, setLoading] = useState(false);
  const [extrasList, setExtrasList] = useState<
    Array<{ name: string; price: number }>
  >([]);
  const [newExtra, setNewExtra] = useState({ name: "", price: 0 });
  const [kitchenSections, setKitchenSections] = useState<KitchenSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Fetch kitchen sections
  useEffect(() => {
    const fetchKitchenSections = async () => {
      try {
        setLoadingSections(true);
        const response = await api.get(endpoints.kitchen.sections.list);
        if (response.data.success) {
          setKitchenSections(
            (response.data.data.sections || []).filter(
              (s: KitchenSection) => s.isActive
            )
          );
        }
      } catch (error: any) {
        // Ignore 403 errors (plan doesn't support KDS)
        if (error.response?.status !== 403) {
          console.error("Error fetching kitchen sections:", error);
        }
      } finally {
        setLoadingSections(false);
      }
    };

    if (isOpen) {
      fetchKitchenSections();
    }
  }, [isOpen]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        nameAr: item.nameAr || "",
        description: item.description || "",
        descriptionAr: item.descriptionAr || "",
        price: item.price,
        image: item.image || "",
        categoryId: item.categoryId,
        discount: item.discount || 0,
        extras: item.extras || {},
        kitchenSectionId: item.kitchenSectionId || "",
      });

      // Parse existing extras
      if (item.extras && typeof item.extras === "object") {
        const parsedExtras = Object.values(item.extras as any).flatMap(
          (extra: any) =>
            extra.options
              ? extra.options.map((option: any) => ({
                  name: option.name,
                  price: option.price || 0,
                }))
              : []
        );
        setExtrasList(parsedExtras);
      }
    } else {
      setFormData({
        name: "",
        nameAr: "",
        description: "",
        descriptionAr: "",
        price: 0,
        image: "",
        discount: 0,
        extras: {},
        categoryId: categoryId || categories[0]?.id || "",
        kitchenSectionId: "",
      });
      setExtrasList([]);
    }
  }, [item, categories, isOpen, categoryId]);

  // Ensure categoryId is always set from props when adding new item
  useEffect(() => {
    if (!item && categoryId) {
      setFormData((prev) => ({
        ...prev,
        categoryId: categoryId,
      }));
    }
  }, [categoryId, item]);

  // Add extra function
  const addExtra = () => {
    if (newExtra.name.trim()) {
      setExtrasList([...extrasList, { ...newExtra }]);
      setNewExtra({ name: "", price: 0 });
    }
  };

  // Remove extra function
  const removeExtra = (index: number) => {
    setExtrasList(extrasList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert extras list to JSON format
      const extrasJson =
        extrasList.length > 0
          ? {
              extras: {
                name: isRTL ? "الإضافات" : "Extras",
                nameAr: "الإضافات",
                options: extrasList.map((extra, index) => ({
                  id: `extra_${index}`,
                  name: extra.name,
                  nameAr: extra.name,
                  price: extra.price,
                })),
              },
            }
          : {};

      const submitData = {
        ...formData,
        categoryId: categoryId || formData.categoryId, // Use categoryId from props if available
        sortOrder: item?.sortOrder || 0,
        extras: JSON.stringify(extrasJson),
        kitchenSectionId: formData.kitchenSectionId || null,
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="max-h-[70vh] overflow-y-auto ">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("item.nameAr")} *
              </label>
              <Input
                value={formData.nameAr}
                onChange={(e) =>
                  setFormData({ ...formData, nameAr: e.target.value })
                }
                placeholder={t("item.nameAr")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("item.name")} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("item.name")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("item.descriptionAr")}{" "}
                <span className="text-gray-400 text-sm">
                  ({t("common.optional") || "Optional"})
                </span>
              </label>
              <Input
                value={formData.descriptionAr}
                onChange={(e) =>
                  setFormData({ ...formData, descriptionAr: e.target.value })
                }
                placeholder={t("item.descriptionAr")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("item.description")}{" "}
                <span className="text-gray-400 text-sm">
                  ({t("common.optional") || "Optional"})
                </span>
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("item.description")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("item.price")}
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? "الخصم (%)" : "Discount (%)"}{" "}
                <span className="text-gray-400 text-sm">
                  ({t("common.optional") || "Optional"})
                </span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.discount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discount: parseInt(e.target.value) || 0,
                  })
                }
                onFocus={(e) => e.target.select()}
                placeholder="0"
              />
            </div>
          </div>

          {/* Kitchen Section Selection */}
          {kitchenSections.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isRTL ? "قسم المطبخ" : "Kitchen Section"}{" "}
                <span className="text-gray-400 text-sm">
                  ({t("common.optional") || "Optional"})
                </span>
              </label>
              <select
                value={formData.kitchenSectionId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kitchenSectionId: e.target.value,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">
                  {isRTL ? "قسم عام (افتراضي)" : "General Section (Default)"}
                </option>
                {kitchenSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {isRTL && section.nameAr ? section.nameAr : section.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isRTL
                  ? "اختر قسم المطبخ الذي سيتم إرسال هذا العنصر إليه. إذا لم تختر قسماً، سيظهر في القسم العام."
                  : "Select the kitchen section where this item will be sent. If no section is selected, it will appear in the General section."}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("item.image") || "Item Image"}{" "}
              <span className="text-gray-400 text-sm">
                ({t("common.optional") || "Optional"})
              </span>
            </label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url || "" })}
              placeholder={t("item.image")}
            />
          </div>

          {/* Extras Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isRTL ? "الإضافات" : "Extras"}{" "}
              <span className="text-gray-400 text-sm">
                ({t("common.optional") || "Optional"})
              </span>
            </label>

            {/* Add Extra Form */}
            <div className="mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  placeholder={
                    isRTL ? " مثلا اكسترا جبن ، اكسترا لحم" : "Extra name"
                  }
                  value={newExtra.name}
                  onChange={(e) =>
                    setNewExtra({ ...newExtra, name: e.target.value })
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder={isRTL ? "السعر" : "Price"}
                  value={newExtra.price}
                  onChange={(e) =>
                    setNewExtra({
                      ...newExtra,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExtra}
                disabled={!newExtra.name.trim()}
                className="w-full"
              >
                {isRTL ? "إضافة" : "Add Extra"}
              </Button>
            </div>

            {/* Extras List */}
            {extrasList.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isRTL ? "الإضافات المضافة:" : "Added Extras:"}
                </p>
                <div className="space-y-1">
                  {extrasList.map((extra, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md"
                    >
                      <span className="text-sm">
                        {extra.name} -{" "}
                        {formatCurrencyWithLanguage(
                          extra.price,
                          restaurantCurrency,
                          isRTL ? "AR" : "EN"
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExtra(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        {isRTL ? "حذف" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`flex justify-end pt-4 ${isRTL ? "space-x-reverse space-x-3" : "space-x-3"}`}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? t("common.loading")
                : item
                  ? t("common.save")
                  : t("common.add")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
