"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/store/hooks/useLanguage";
import { getLocalizedName } from "@/lib/utils";

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

interface CategoryListProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToggleCategoryStatus: (categoryId: string) => void;
  onCreateCategory: () => void;
  onReorderCategories: () => void;
  onResetAll?: () => void;
  onApplyDiscountToAll?: () => void;
}

export function CategoryList({
  categories,
  onCategoryClick,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
  onCreateCategory,
  onReorderCategories,
  onResetAll,
  onApplyDiscountToAll,
}: CategoryListProps) {
  const { t, isRTL, language } = useLanguage();
  const lang = language === "AR" ? "AR" : "EN";

  return (
    <div>
      <div className="flex flex-col md:flex-row  justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isRTL ? "الفئات" : "Categories"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {onApplyDiscountToAll && categories.length > 0 && (
            <Button
              onClick={onApplyDiscountToAll}
              variant="outline"
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/10 dark:text-green-400 dark:hover:text-green-300"
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {isRTL ? "خصم للقائمة" : "Discount All"}
            </Button>
          )}
          {onResetAll && categories.length > 0 && (
            <Button
              onClick={onResetAll}
              variant="outline"
              className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
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
              {isRTL ? "حذف الكل" : "Reset All"}
            </Button>
          )}
          <Button
            onClick={onReorderCategories}
            variant="outline"
            className="flex items-center gap-1 text-xs"
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
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
            {isRTL ? "ترتيب الفئات" : "Reorder Categories"}
          </Button>
          <Button
            onClick={onCreateCategory}
            className="flex text-xs items-center gap-1"
          >
            <svg
              className="w-4 h-4 mr-2"
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
            {isRTL ? "إضافة فئة" : "Add Category"}
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {isRTL ? "لا توجد فئات" : "No categories"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isRTL
              ? "ابدأ بإنشاء فئتك الأولى."
              : "Get started by creating your first category."}
          </p>
          <div className="mt-6">
            <Button onClick={onCreateCategory} className="flex items-center">
              <svg
                className="w-4 h-4 mr-2"
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
              {isRTL ? "إضافة فئة" : "Add Category"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onCategoryClick(category)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getLocalizedName(category.name, category.nameAr, lang)}
                  </h4>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {category.isActive
                    ? isRTL
                      ? "نشط"
                      : "Active"
                    : isRTL
                      ? "غير نشط"
                      : "Inactive"}
                </span>
              </div>

              {category.image && (
                <div className="mb-3">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                <p>
                  {isRTL ? "العناصر" : "Items"}: {category._count?.items || 0}
                </p>
                <p>
                  {isRTL ? "الترتيب" : "Sort Order"}: {category.sortOrder}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {isRTL
                  ? "انقر على الفئة لعرض الاصناف"
                  : "Click on the category to view the items"}
              </p>
              <div
                className="flex space-x-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Toggle Switch */}
                <div className="flex items-center">
                  <label
                    className={`flex items-center cursor-pointer ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <input
                      type="checkbox"
                      checked={category.isActive}
                      onChange={async () => {
                        try {
                          await onToggleCategoryStatus(category.id);
                        } catch (error) {
                          console.error(
                            "Error toggling category status:",
                            error,
                          );
                        }
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 mx-2 focus:ring-offset-2 ${
                        category.isActive
                          ? "bg-green-500 focus:ring-green-500"
                          : "bg-gray-300 focus:ring-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
                          category.isActive
                            ? isRTL
                              ? "-translate-x-4"
                              : "translate-x-4"
                            : isRTL
                              ? "-translate-x-0.5"
                              : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </label>
                </div>
                <Button
                  size="sm"
                  onClick={() => onEditCategory(category)}
                  className="flex items-center px-2"
                >
                  <svg
                    className="w-3 h-3"
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
                  <span className="ml-1 text-xs">
                    {isRTL ? "تعديل" : "Edit"}
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-700 flex items-center px-2"
                >
                  <svg
                    className="w-3 h-3"
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
                  <span className="ml-1 text-xs">
                    {isRTL ? "حذف" : "Delete"}
                  </span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
