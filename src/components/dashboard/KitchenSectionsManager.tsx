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
      const errorMessage = error.response?.data?.message || "";

      // Translate specific error message
      let translatedMessage = errorMessage;
      if (
        errorMessage.includes(
          "Cannot delete kitchen section with associated menu items"
        ) ||
        errorMessage.includes("associated menu items")
      ) {
        translatedMessage = isRTL
          ? "لا يمكن حذف قسم المطبخ المرتبط بعناصر قائمة. يرجى إعادة تعيين العناصر أولاً."
          : "Cannot delete kitchen section with associated menu items. Please reassign items first.";
      } else if (errorMessage) {
        translatedMessage = errorMessage;
      } else {
        translatedMessage = isRTL
          ? "حدث خطأ في حذف القسم"
          : "Error deleting section";
      }

      showToast(translatedMessage, "error");
    } finally {
      setSaving(false);
    }
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
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setEditingId(section.id)}
                        disabled={saving}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isRTL ? "تعديل" : "Edit"}
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        disabled={saving}
                        className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isRTL ? "حذف" : "Delete"}
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
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
