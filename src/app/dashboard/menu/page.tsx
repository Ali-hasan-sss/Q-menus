"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMenu } from "@/contexts/MenuContext";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { MenuTabs } from "@/components/dashboard/MenuTabs";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { ItemList } from "@/components/dashboard/ItemList";
import { CategoryFormModal } from "@/components/dashboard/CategoryFormModal";
import { CategoryReorderModal } from "@/components/dashboard/CategoryReorderModal";
import { ItemReorderModal } from "@/components/dashboard/ItemReorderModal";
import { ItemFormModal } from "@/components/dashboard/ItemFormModal";
import { ThemeEditor } from "@/components/dashboard/ThemeEditor";
import { ExcelImportButton } from "@/components/dashboard/ExcelImportButton";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count: {
    items: number;
  };
}

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  image?: string;
  isAvailable: boolean;
  sortOrder: number;
  categoryId: string;
  category: {
    name: string;
    nameAr?: string;
  };
}

export default function MenuPage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const {
    menu,
    categories,
    items,
    loading,
    loadingItems,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    toggleCategoryStatus,
    toggleItemStatus,
    fetchCategories,
    fetchCategoryItems,
    fetchItems,
    refreshData,
    resetAllCategories,
  } = useMenu();
  const { showConfirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"categories" | "theme">(
    "categories"
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  // Handle tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "theme") {
      setActiveTab("theme");
    } else {
      setActiveTab("categories");
    }
  }, [searchParams]);

  // Ensure data is loaded when component mounts - only run once
  useEffect(() => {
    console.log("📊 Menu Page - Initial load check:", {
      categoriesLength: categories.length,
      user: !!user,
      loading,
    });
    // If no categories are loaded and user is authenticated, fetch data
    if (categories.length === 0 && user && !loading) {
      console.log("🔄 No categories found, fetching data...");
      fetchCategories();
    }
  }, []); // Empty dependency array to run only once

  // Handle category click
  const handleCategoryClick = async (category: Category) => {
    setSelectedCategory(category);

    // Load items for this category if not already loaded
    const categoryItems = items.filter(
      (item) => item.categoryId === category.id
    );
    if (categoryItems.length === 0) {
      await fetchCategoryItems(category.id);
    }
  };

  // Handle back to categories
  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryReorderModal, setShowCategoryReorderModal] =
    useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemReorderModal, setShowItemReorderModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory(data);
      showToast(
        isRTL ? "تم إضافة الفئة بنجاح" : "Category added successfully",
        "success"
      );
    } catch (error: any) {
      let errorMessage =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء إضافة الفئة" : "Error adding category");

      // Check for plan limit errors and translate them
      if (errorMessage.includes("maximum number of categories")) {
        const { limit, current } = error.response?.data || {};
        errorMessage = t("dashboard.categoryLimitReached").replace(
          "{limit}",
          limit || "N/A"
        );
      } else if (errorMessage.includes("No active subscription")) {
        errorMessage = t("dashboard.noActiveSubscription");
      }

      showToast(errorMessage, "error");
    }
  };

  const handleUpdateCategory = async (data: any) => {
    if (editingCategory) {
      try {
        await updateCategory(editingCategory.id, data);
        showToast(
          isRTL ? "تم تحديث الفئة بنجاح" : "Category updated successfully",
          "success"
        );
      } catch (error: any) {
        showToast(
          error.response?.data?.message ||
            (isRTL ? "حدث خطأ أثناء تحديث الفئة" : "Error updating category"),
          "error"
        );
      }
    }
  };

  const handleCreateItem = async (data: any) => {
    try {
      await createItem(data);
      showToast(
        isRTL ? "تم إضافة العنصر بنجاح" : "Item added successfully",
        "success"
      );
    } catch (error: any) {
      let errorMessage =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء إضافة العنصر" : "Error adding item");

      // Check for plan limit errors and translate them
      if (errorMessage.includes("maximum number of items")) {
        const { limit, current } = error.response?.data || {};
        errorMessage = t("dashboard.itemLimitReached").replace(
          "{limit}",
          limit || "N/A"
        );
      } else if (errorMessage.includes("No active subscription")) {
        errorMessage = t("dashboard.noActiveSubscription");
      }

      showToast(errorMessage, "error");
    }
  };

  const handleUpdateItem = async (data: any) => {
    if (editingItem) {
      try {
        await updateItem(editingItem.id, data);
        showToast(
          isRTL ? "تم تحديث العنصر بنجاح" : "Item updated successfully",
          "success"
        );
      } catch (error: any) {
        showToast(
          error.response?.data?.message ||
            (isRTL ? "حدث خطأ أثناء تحديث العنصر" : "Error updating item"),
          "error"
        );
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    showConfirm({
      title: isRTL ? "حذف الفئة" : "Delete Category",
      message: isRTL
        ? "هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع العناصر في هذه الفئة أيضاً."
        : t("category.deleteConfirm") ||
          "Are you sure you want to delete this category? This will also delete all items in this category.",
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await deleteCategory(categoryId);
          if (selectedCategory?.id === categoryId) {
            setSelectedCategory(null);
          }
          showToast(
            isRTL ? "تم حذف الفئة بنجاح" : "Category deleted successfully",
            "success"
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف الفئة" : "Error deleting category"),
            "error"
          );
        }
      },
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    showConfirm({
      title: isRTL ? "حذف العنصر" : "Delete Item",
      message: isRTL
        ? "هل أنت متأكد من حذف هذا العنصر؟"
        : t("item.deleteConfirm") ||
          "Are you sure you want to delete this item?",
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await deleteItem(itemId);
          showToast(
            isRTL ? "تم حذف العنصر بنجاح" : "Item deleted successfully",
            "success"
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف العنصر" : "Error deleting item"),
            "error"
          );
        }
      },
    });
  };

  // This function is overridden by the async version above

  const getCategoryItems = () => {
    if (!selectedCategory) return [];
    return items.filter((item) => item.categoryId === selectedCategory.id);
  };

  const getSelectedCategory = () => {
    return selectedCategory;
  };

  const closeModals = () => {
    setShowCategoryModal(false);
    setShowCategoryReorderModal(false);
    setShowItemModal(false);
    setShowItemReorderModal(false);
    setEditingCategory(null);
    setEditingItem(null);
  };

  const handleReorderCategories = () => {
    setShowCategoryReorderModal(true);
  };

  const handleReorderItems = () => {
    setShowItemReorderModal(true);
  };

  const handleCategoriesReordered = () => {
    // The API call is handled inside the modal
    // We just need to refresh the categories list
    fetchCategories();
  };

  const handleItemsReordered = () => {
    // The API call is handled inside the modal
    // We just need to refresh the items list
    if (selectedCategory) {
      fetchItems(selectedCategory.id);
    }
  };

  const handleResetAll = async () => {
    showConfirm({
      title: isRTL ? "إعادة تعيين القائمة" : "Reset Menu",
      message: isRTL
        ? "هل أنت متأكد من حذف جميع الفئات والعناصر؟ هذا الإجراء لا يمكن التراجع عنه."
        : "Are you sure you want to delete all categories and items? This action cannot be undone.",
      confirmText: isRTL ? "حذف الكل" : "Delete All",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await resetAllCategories();
          setSelectedCategory(null);
          showToast(
            isRTL ? "تم إعادة تعيين القائمة بنجاح" : "Menu reset successfully",
            "success"
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء إعادة التعيين" : "Error resetting menu"),
            "error"
          );
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isRTL ? "جاري التحميل..." : t("common.loading") || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isRTL
                  ? "خطأ في تحميل القائمة"
                  : t("error.title") || "Error Loading Menu"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => refreshData()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isRTL ? "إعادة المحاولة" : t("common.retry") || "Retry"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl md:py-10 mx-auto py-2 sm:px-6 lg:px-8 pb-20 mb-4 sm:pb-6">
        <div className="px-4 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isRTL ? "إدارة القائمة" : t("menu.title") || "Menu Management"}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "إدارة فئات وأصناف قائمة مطعمك"
                  : t("menu.subtitle") ||
                    "Manage your restaurant menu categories and items"}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ExcelImportButton onImportSuccess={refreshData} />
            </div>
          </div>

          {/* Tabs */}
          <MenuTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setSelectedCategory(null);
            }}
            categoriesCount={categories.length}
          />

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              {!selectedCategory ? (
                <CategoryList
                  categories={categories}
                  onCategoryClick={handleCategoryClick}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onToggleCategoryStatus={toggleCategoryStatus}
                  onCreateCategory={() => setShowCategoryModal(true)}
                  onReorderCategories={handleReorderCategories}
                  onResetAll={handleResetAll}
                />
              ) : (
                <ItemList
                  items={getCategoryItems()}
                  selectedCategory={getSelectedCategory()}
                  loadingItems={loadingItems}
                  onBackToCategories={handleBackToCategories}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onToggleItemStatus={toggleItemStatus}
                  onCreateItem={() => setShowItemModal(true)}
                  onReorderItems={handleReorderItems}
                />
              )}
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === "theme" && <ThemeEditor />}
        </div>
      </div>

      {/* Modals */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={closeModals}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
        title={
          editingCategory
            ? isRTL
              ? "تعديل الفئة"
              : t("category.edit") || "Edit Category"
            : isRTL
              ? "إنشاء فئة جديدة"
              : t("category.create") || "Create Category"
        }
      />

      <ItemFormModal
        isOpen={showItemModal}
        onClose={closeModals}
        onSubmit={editingItem ? handleUpdateItem : handleCreateItem}
        item={editingItem}
        categories={categories}
        categoryId={selectedCategory?.id}
        title={
          editingItem
            ? `${t("item.edit")} - ${editingItem.name}`
            : t("item.add")
        }
      />

      <CategoryReorderModal
        isOpen={showCategoryReorderModal}
        onClose={closeModals}
        categories={categories}
        onReorder={handleCategoriesReordered}
      />

      <ItemReorderModal
        isOpen={showItemReorderModal}
        onClose={closeModals}
        items={selectedCategory ? getCategoryItems() : []}
        onReorder={handleItemsReordered}
      />
    </div>
  );
}
