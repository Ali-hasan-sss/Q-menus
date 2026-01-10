"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, endpoints } from "@/lib/api";

interface KitchenSection {
  id: string;
  name: string;
  nameAr?: string;
  sortOrder: number;
  isActive: boolean;
}

export function KitchenSectionsManager() {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();

  const [sections, setSections] = useState<KitchenSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({
    name: "",
    nameAr: "",
    sortOrder: 0,
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await api.get(endpoints.kitchen.sections.list);
      if (response.data.success) {
        setSections(response.data.data.sections || []);
      }
    } catch (error: any) {
      console.error("Error fetching kitchen sections:", error);
      if (error.response?.status !== 403) {
        showToast(
          error.response?.data?.message ||
            (isRTL ? "حدث خطأ في جلب الأقسام" : "Error fetching sections"),
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSection.name.trim()) {
      showToast(
        isRTL ? "يرجى إدخال اسم القسم" : "Please enter section name",
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(endpoints.kitchen.sections.create, {
        name: newSection.name,
        nameAr: newSection.nameAr || null,
        sortOrder: newSection.sortOrder || 0,
      });

      if (response.data.success) {
        showToast(
          isRTL ? "تم إنشاء القسم بنجاح" : "Section created successfully",
          "success"
        );
        setNewSection({ name: "", nameAr: "", sortOrder: 0 });
        await fetchSections();
      }
    } catch (error: any) {
      console.error("Error creating section:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ في إنشاء القسم" : "Error creating section"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<KitchenSection>) => {
    try {
      setSaving(true);
      const response = await api.put(
        endpoints.kitchen.sections.update(id),
        data
      );

      if (response.data.success) {
        showToast(
          isRTL ? "تم تحديث القسم بنجاح" : "Section updated successfully",
          "success"
        );
        setEditingId(null);
        await fetchSections();
      }
    } catch (error: any) {
      console.error("Error updating section:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ في تحديث القسم" : "Error updating section"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        isRTL
          ? "هل أنت متأكد من حذف هذا القسم؟"
          : "Are you sure you want to delete this section?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const response = await api.delete(endpoints.kitchen.sections.delete(id));

      if (response.data.success) {
        showToast(
          isRTL ? "تم حذف القسم بنجاح" : "Section deleted successfully",
          "success"
        );
        await fetchSections();
      }
    } catch (error: any) {
      console.error("Error deleting section:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ في حذف القسم" : "Error deleting section"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await handleUpdate(id, { isActive: !isActive });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          {isRTL ? "جاري التحميل..." : "Loading..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Section */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isRTL ? "إضافة قسم جديد" : "Add New Section"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isRTL ? "اسم القسم (عربي)" : "Section Name (Arabic)"}
            </label>
            <Input
              value={newSection.nameAr}
              onChange={(e) =>
                setNewSection({ ...newSection, nameAr: e.target.value })
              }
              placeholder={isRTL ? "مثال: المطبخ الساخن" : "e.g., Hot Kitchen"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isRTL ? "اسم القسم (إنجليزي)" : "Section Name (English)"} *
            </label>
            <Input
              value={newSection.name}
              onChange={(e) =>
                setNewSection({ ...newSection, name: e.target.value })
              }
              placeholder={isRTL ? "مثال: Hot Kitchen" : "e.g., Hot Kitchen"}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isRTL ? "ترتيب العرض" : "Display Order"}
            </label>
            <Input
              type="number"
              min="0"
              value={newSection.sortOrder}
              onChange={(e) =>
                setNewSection({
                  ...newSection,
                  sortOrder: parseInt(e.target.value) || 0,
                })
              }
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            onClick={handleCreate}
            disabled={saving || !newSection.name.trim()}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "إضافة القسم"
                : "Add Section"}
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isRTL ? "الأقسام الحالية" : "Current Sections"}
        </h3>
        {sections.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            {isRTL
              ? "لا توجد أقسام مضافة. سيتم عرض جميع العناصر في القسم العام."
              : "No sections added. All items will be shown in the General section."}
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-between"
              >
                {editingId === section.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      value={section.nameAr || ""}
                      onChange={(e) =>
                        setSections(
                          sections.map((s) =>
                            s.id === section.id
                              ? { ...s, nameAr: e.target.value }
                              : s
                          )
                        )
                      }
                      placeholder={
                        isRTL ? "اسم القسم (عربي)" : "Section Name (Arabic)"
                      }
                    />
                    <Input
                      value={section.name}
                      onChange={(e) =>
                        setSections(
                          sections.map((s) =>
                            s.id === section.id
                              ? { ...s, name: e.target.value }
                              : s
                          )
                        )
                      }
                      placeholder={
                        isRTL ? "اسم القسم (إنجليزي)" : "Section Name (English)"
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      value={section.sortOrder}
                      onChange={(e) =>
                        setSections(
                          sections.map((s) =>
                            s.id === section.id
                              ? {
                                  ...s,
                                  sortOrder: parseInt(e.target.value) || 0,
                                }
                              : s
                          )
                        )
                      }
                      placeholder={isRTL ? "ترتيب" : "Order"}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdate(section.id, {
                            name: section.name,
                            nameAr: section.nameAr || undefined,
                            sortOrder: section.sortOrder,
                          })
                        }
                        disabled={saving}
                      >
                        {isRTL ? "حفظ" : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          fetchSections();
                        }}
                      >
                        {isRTL ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL && section.nameAr
                            ? section.nameAr
                            : section.name}
                        </h4>
                        {section.nameAr && !isRTL && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({section.nameAr})
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {isRTL ? "ترتيب:" : "Order:"} {section.sortOrder}
                        </span>
                        {section.isActive ? (
                          <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            {isRTL ? "نشط" : "Active"}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {isRTL ? "غير نشط" : "Inactive"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleActive(section.id, section.isActive)
                        }
                        disabled={saving}
                      >
                        {section.isActive
                          ? isRTL
                            ? "تعطيل"
                            : "Deactivate"
                          : isRTL
                            ? "تفعيل"
                            : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(section.id)}
                        disabled={saving}
                      >
                        {isRTL ? "تعديل" : "Edit"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(section.id)}
                        disabled={saving}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        {isRTL ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
