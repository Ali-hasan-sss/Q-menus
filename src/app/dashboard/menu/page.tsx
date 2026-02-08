"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useMenu } from "@/store/hooks/useMenu";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import { useToast } from "@/store/hooks/useToast";
import { MenuTabs } from "@/components/dashboard/MenuTabs";
import { CategoryList } from "@/components/dashboard/CategoryList";
import { ItemList } from "@/components/dashboard/ItemList";
import { MenuAccordionView } from "@/components/dashboard/MenuAccordionView";
import { CategoryFormModal } from "@/components/dashboard/CategoryFormModal";
import { CategoryReorderModal } from "@/components/dashboard/CategoryReorderModal";
import { ItemReorderModal } from "@/components/dashboard/ItemReorderModal";
import { ItemFormModal } from "@/components/dashboard/ItemFormModal";
import { DiscountModal } from "@/components/dashboard/DiscountModal";
import { ThemeEditor } from "@/components/dashboard/ThemeEditor";
import { ExcelImportButton } from "@/components/dashboard/ExcelImportButton";
import { api } from "@/lib/api";

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
  const router = useRouter();
  const pathname = usePathname();
  const {
    menu,
    categories,
    items,
    restaurantCurrency,
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
    applyDiscountToAll,
    applyDiscountToCategory,
  } = useMenu();
  const { showConfirm } = useConfirmDialog();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"categories" | "theme">(
    "categories",
  );
  const [viewMode, setViewMode] = useState<"grid" | "accordion">("grid");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [expandedAccordionCategoryId, setExpandedAccordionCategoryId] =
    useState<string | null>(null);

  // Handle tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "theme") {
      setActiveTab("theme");
    } else {
      setActiveTab("categories");
    }
  }, [searchParams]);

  // Sync selectedCategory from URL (for browser back + direct links)
  useEffect(() => {
    const categoryId = searchParams.get("category");
    if (viewMode !== "grid") return;
    if (!categoryId) {
      setSelectedCategory(null);
      return;
    }
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      const categoryItems = items.filter((item) => item.categoryId === categoryId);
      if (categoryItems.length === 0) {
        fetchCategoryItems(categoryId);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [searchParams, categories, viewMode, fetchCategoryItems, items]);

  // Update URL when selectedCategory changes (grid view only)
  const updateUrlForCategory = (categoryId: string | null, push = false) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    (push ? router.push : router.replace)(href, { scroll: false });
  };

  // Ensure data is loaded when component mounts - only run once
  useEffect(() => {
    if (categories.length === 0 && user && !loading) {
      fetchCategories();
    }
  }, []); // Empty dependency array to run only once

  // Handle category click (grid view)
  const handleCategoryClick = async (category: Category) => {
    updateUrlForCategory(category.id, true); // push for browser back support
    setSelectedCategory(category);

    // Load items for this category if not already loaded
    const categoryItems = items.filter(
      (item) => item.categoryId === category.id,
    );
    if (categoryItems.length === 0) {
      await fetchCategoryItems(category.id);
    }
  };

  // Handle accordion category expand
  const handleAccordionCategoryExpand = async (category: Category) => {
    setExpandedAccordionCategoryId(category.id);
    const categoryItems = items.filter(
      (item) => item.categoryId === category.id,
    );
    if (categoryItems.length === 0) {
      await fetchCategoryItems(category.id);
    }
  };

  // Handle back to categories (browser back returns to categories list)
  const handleBackToCategories = () => {
    router.back();
  };

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoryReorderModal, setShowCategoryReorderModal] =
    useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showItemReorderModal, setShowItemReorderModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountMode, setDiscountMode] = useState<"all" | "category">("all");
  const [discountTargetCategory, setDiscountTargetCategory] =
    useState<Category | null>(null);
  const [reorderItemsTargetCategory, setReorderItemsTargetCategory] =
    useState<Category | null>(null);
  const [itemFormCategoryId, setItemFormCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory(data);
      showToast(
        isRTL ? "تم إضافة الفئة بنجاح" : "Category added successfully",
        "success",
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
          limit || "N/A",
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
          "success",
        );
      } catch (error: any) {
        showToast(
          error.response?.data?.message ||
            (isRTL ? "حدث خطأ أثناء تحديث الفئة" : "Error updating category"),
          "error",
        );
      }
    }
  };

  const handleCreateItem = async (data: any) => {
    try {
      await createItem(data);
      showToast(
        isRTL ? "تم إضافة العنصر بنجاح" : "Item added successfully",
        "success",
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
          limit || "N/A",
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
          "success",
        );
      } catch (error: any) {
        showToast(
          error.response?.data?.message ||
            (isRTL ? "حدث خطأ أثناء تحديث العنصر" : "Error updating item"),
          "error",
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
            "success",
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف الفئة" : "Error deleting category"),
            "error",
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
            "success",
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف العنصر" : "Error deleting item"),
            "error",
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
    setShowDiscountModal(false);
    setEditingCategory(null);
    setEditingItem(null);
    setDiscountTargetCategory(null);
    setReorderItemsTargetCategory(null);
    setItemFormCategoryId(null);
  };

  const handleApplyDiscountToAll = () => {
    setDiscountMode("all");
    setShowDiscountModal(true);
  };

  const handleApplyDiscountToCategory = (category?: Category) => {
    setDiscountMode("category");
    setDiscountTargetCategory(category || selectedCategory || null);
    setShowDiscountModal(true);
  };

  const handleDiscountSubmit = async (discount: number) => {
    if (discountMode === "all") {
      await applyDiscountToAll(discount);
      showToast(
        isRTL
          ? `تم تطبيق خصم ${discount}% على كامل القائمة`
          : `Discount of ${discount}% applied to all menu items`,
        "success",
      );
      fetchCategories();
      if (selectedCategory) {
        fetchCategoryItems(selectedCategory.id);
      }
    } else if (discountMode === "category" && discountTargetCategory) {
      await applyDiscountToCategory(discountTargetCategory.id, discount);
      showToast(
        isRTL
          ? `تم تطبيق خصم ${discount}% على أصناف الفئة`
          : `Discount of ${discount}% applied to category items`,
        "success",
      );
      fetchCategoryItems(discountTargetCategory.id);
    }
  };

  const handleReorderCategories = () => {
    setShowCategoryReorderModal(true);
  };

  const handleReorderItems = (category?: Category) => {
    setReorderItemsTargetCategory(category || selectedCategory || null);
    setShowItemReorderModal(true);
  };

  const handleCategoriesReordered = () => {
    // The API call is handled inside the modal
    // We just need to refresh the categories list
    fetchCategories();
  };

  const handleItemsReordered = () => {
    const targetCat = reorderItemsTargetCategory || selectedCategory;
    if (targetCat) {
      fetchCategoryItems(targetCat.id);
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
            "success",
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء إعادة التعيين" : "Error resetting menu"),
            "error",
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
              setExpandedAccordionCategoryId(null);
              if (tab === "theme") updateUrlForCategory(null);
            }}
            categoriesCount={categories.length}
          />

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div>
              {/* View mode toggle - only when categories exist */}
              {categories.length > 0 && (
                <div
                  className={`flex items-center gap-2 mb-4 ${isRTL ? "flex-row-reverse justify-end" : ""}`}
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "طريقة العرض:" : "View:"}
                  </span>
                  <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <button
                      onClick={() => {
                        setViewMode("grid");
                        setExpandedAccordionCategoryId(null);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "grid"
                          ? "bg-primary-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={isRTL ? "شبكة" : "Grid"}
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("accordion");
                        setSelectedCategory(null);
                        updateUrlForCategory(null);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "accordion"
                          ? "bg-primary-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={isRTL ? "أكوارديون" : "Accordion"}
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
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {viewMode === "grid" && !selectedCategory ? (
                <CategoryList
                  categories={categories}
                  onCategoryClick={handleCategoryClick}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onToggleCategoryStatus={toggleCategoryStatus}
                  onCreateCategory={() => setShowCategoryModal(true)}
                  onReorderCategories={handleReorderCategories}
                  onResetAll={handleResetAll}
                  onApplyDiscountToAll={handleApplyDiscountToAll}
                />
              ) : viewMode === "grid" && selectedCategory ? (
                <ItemList
                  items={getCategoryItems()}
                  selectedCategory={getSelectedCategory()}
                  loadingItems={loadingItems}
                  restaurantCurrency={restaurantCurrency}
                  onBackToCategories={handleBackToCategories}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onToggleItemStatus={toggleItemStatus}
                  onCreateItem={() => {
                    setItemFormCategoryId(selectedCategory?.id || null);
                    setShowItemModal(true);
                  }}
                  onReorderItems={handleReorderItems}
                  onApplyDiscountToCategory={handleApplyDiscountToCategory}
                />
              ) : (
                <MenuAccordionView
                  categories={categories}
                  items={items}
                  loadingItems={loadingItems}
                  restaurantCurrency={restaurantCurrency}
                  expandedCategoryId={expandedAccordionCategoryId}
                  onCategoryExpand={handleAccordionCategoryExpand}
                  onCategoryCollapse={() =>
                    setExpandedAccordionCategoryId(null)
                  }
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onToggleCategoryStatus={toggleCategoryStatus}
                  onEditItem={handleEditItem}
                  onDeleteItem={handleDeleteItem}
                  onToggleItemStatus={toggleItemStatus}
                  onCreateCategory={() => setShowCategoryModal(true)}
                  onCreateItem={(categoryId) => {
                    setItemFormCategoryId(categoryId);
                    setShowItemModal(true);
                  }}
                  onReorderItems={(categoryId) => {
                    const cat = categories.find((c) => c.id === categoryId);
                    if (cat) handleReorderItems(cat);
                  }}
                  onReorderCategories={handleReorderCategories}
                  onApplyDiscountToAll={handleApplyDiscountToAll}
                  onApplyDiscountToCategory={(categoryId) => {
                    const cat = categories.find((c) => c.id === categoryId);
                    if (cat) handleApplyDiscountToCategory(cat);
                  }}
                  onResetAll={handleResetAll}
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
        categoryId={itemFormCategoryId || selectedCategory?.id}
        restaurantCurrency={restaurantCurrency}
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
        items={
          (reorderItemsTargetCategory || selectedCategory)
            ? items.filter(
                (i) =>
                  i.categoryId ===
                  (reorderItemsTargetCategory || selectedCategory)?.id
              )
            : []
        }
        onReorder={handleItemsReordered}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={closeModals}
        onSubmit={handleDiscountSubmit}
        title={
          discountMode === "all"
            ? isRTL
              ? "خصم لكامل القائمة"
              : "Discount for All Menu Items"
            : isRTL
              ? `خصم لأصناف ${discountTargetCategory?.name || ""}`
              : `Discount for ${discountTargetCategory?.name || ""} Items`
        }
        description={
          discountMode === "all"
            ? isRTL
              ? "أدخل نسبة الخصم لتطبيقها على جميع أصناف القائمة (0 لإزالة الخصم)"
              : "Enter discount percentage to apply to all menu items (0 to remove discount)"
            : isRTL
              ? `أدخل نسبة الخصم لتطبيقها على أصناف ${discountTargetCategory?.name || "هذه الفئة"} (0 لإزالة الخصم)`
              : `Enter discount percentage to apply to ${discountTargetCategory?.name || "this category"}'s items (0 to remove discount)`
        }
      />
    </div>
  );
}
