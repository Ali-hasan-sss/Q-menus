"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import { useLanguage } from "@/store/hooks/useLanguage";
import {
  formatCurrencyWithLanguage,
  getLocalizedName,
} from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  GripVertical,
  Percent,
  Plus,
} from "lucide-react";
import type { Category, MenuItem } from "@/store/slices/menuSlice";

interface MenuAccordionViewProps {
  categories: Category[];
  items: MenuItem[];
  loadingItems: boolean;
  restaurantCurrency: string;
  expandedCategoryId: string | null;
  onCategoryExpand: (category: Category) => void;
  onCategoryCollapse: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onToggleCategoryStatus: (categoryId: string) => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemStatus: (itemId: string) => void;
  onCreateCategory: () => void;
  onCreateItem: (categoryId: string) => void;
  onReorderCategories: () => void;
  onReorderItems: (categoryId: string) => void;
  onApplyDiscountToAll?: () => void;
  onApplyDiscountToCategory?: (categoryId: string) => void;
  onResetAll?: () => void;
}

export function MenuAccordionView({
  categories,
  items,
  loadingItems,
  restaurantCurrency,
  expandedCategoryId,
  onCategoryExpand,
  onCategoryCollapse,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
  onEditItem,
  onDeleteItem,
  onToggleItemStatus,
  onCreateCategory,
  onCreateItem,
  onReorderCategories,
  onReorderItems,
  onApplyDiscountToAll,
  onApplyDiscountToCategory,
  onResetAll,
}: MenuAccordionViewProps) {
  const { t, isRTL, language } = useLanguage();
  const lang = language === "AR" ? "AR" : "EN";

  const handleCategoryClick = (category: Category) => {
    if (expandedCategoryId === category.id) {
      onCategoryCollapse();
    } else {
      onCategoryExpand(category);
    }
  };

  const getCategoryItems = (categoryId: string) =>
    items.filter((item) => item.categoryId === categoryId);

  return (
    <div>
      {/* Header actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isRTL ? "عرض الأكوارديون" : "Accordion View"}
        </h3>
        <div className="flex flex-wrap gap-2">
          {onApplyDiscountToAll && categories.length > 0 && (
            <Button
              onClick={onApplyDiscountToAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/10"
            >
              <Percent className="h-4 w-4" />
              {isRTL ? "خصم للقائمة" : "Discount All"}
            </Button>
          )}
          {onResetAll && categories.length > 0 && (
            <Button
              onClick={onResetAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              {isRTL ? "حذف الكل" : "Reset All"}
            </Button>
          )}
          <Button
            onClick={onReorderCategories}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <GripVertical className="h-4 w-4" />
            {isRTL ? "ترتيب الفئات" : "Reorder Categories"}
          </Button>
          <Button onClick={onCreateCategory} size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            {isRTL ? "إضافة فئة" : "Add Category"}
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {isRTL ? "لا توجد فئات" : "No categories"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isRTL ? "ابدأ بإنشاء فئتك الأولى." : "Get started by creating your first category."}
          </p>
          <Button onClick={onCreateCategory} className="mt-4">
            {isRTL ? "إضافة فئة" : "Add Category"}
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => {
            const isExpanded = expandedCategoryId === category.id;
            const categoryItems = getCategoryItems(category.id);

            return (
              <Card
                key={category.id}
                className="overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Category header - responsive: more room for name on mobile, compact controls */}
                <div
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                    isExpanded ? "bg-gray-50 dark:bg-gray-800/50" : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  {category.image && (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 break-words">
                      {getLocalizedName(category.name, category.nameAr, lang)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {category._count?.items || categoryItems.length}{" "}
                      {isRTL ? "عنصر" : "items"}
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={category.isActive}
                      onChange={() => onToggleCategoryStatus(category.id)}
                      size="sm"
                      isRTL={isRTL}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditCategory(category)}
                      className="p-2 min-h-10 min-w-10 sm:p-2 touch-manipulation"
                    >
                      <Edit className="h-4 w-4 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteCategory(category.id)}
                      className="p-2 min-h-10 min-w-10 sm:p-2 text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded content - items list */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-gray-50 dark:bg-gray-800/30 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {isRTL ? "العناصر" : "Items"}
                      </span>
                      <div
                        className={`flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        {onApplyDiscountToCategory && categoryItems.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApplyDiscountToCategory(category.id)}
                            className="text-green-600 hover:text-green-700 text-xs min-h-9 px-2.5 sm:min-h-0 touch-manipulation"
                          >
                            <Percent className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                            {isRTL ? "خصم" : "Discount"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReorderItems(category.id)}
                          className="text-xs min-h-9 px-2.5 sm:min-h-0 touch-manipulation"
                        >
                          <GripVertical className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                          {isRTL ? "ترتيب" : "Reorder"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onCreateItem(category.id)}
                          className="text-xs min-h-9 px-2.5 sm:min-h-0 touch-manipulation"
                        >
                          <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3 mr-1 shrink-0" />
                          {t("item.add")}
                        </Button>
                      </div>
                    </div>

                    {loadingItems && expandedCategoryId === category.id ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                      </div>
                    ) : categoryItems.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        <p>{isRTL ? "لا توجد عناصر في هذه الفئة" : "No items in this category"}</p>
                        <Button
                          size="sm"
                          onClick={() => onCreateItem(category.id)}
                          className="mt-2"
                        >
                          {t("item.add")}
                        </Button>
                      </div>
                    ) : (
                      <ul
                        className={`divide-y divide-gray-200 dark:divide-gray-700 ${
                          isRTL ? "text-right" : ""
                        }`}
                      >
                        {categoryItems.map((item) => (
                          <li
                            key={item.id}
                            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 ${
                              isRTL ? "flex-row-reverse" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate block">
                                {getLocalizedName(item.name, item.nameAr, lang)}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-sm font-semibold text-primary-600">
                                  {formatCurrencyWithLanguage(
                                    item.price,
                                    restaurantCurrency,
                                    language
                                  )}
                                </span>
                                {item.description && (
                                  <span className="text-xs text-gray-500 truncate max-w-[180px] sm:max-w-[200px] block sm:inline">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className={`flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${
                                isRTL ? "flex-row-reverse" : ""
                              }`}
                            >
                              <Switch
                                checked={item.isAvailable}
                                onChange={() => onToggleItemStatus(item.id)}
                                size="sm"
                                isRTL={isRTL}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEditItem(item)}
                                className="p-2 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:p-1.5 sm:h-8 sm:w-8 flex items-center justify-center touch-manipulation"
                              >
                                <Edit className="h-5 w-5 sm:h-4 sm:w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDeleteItem(item.id)}
                                className="p-2 min-h-11 min-w-11 sm:min-h-0 sm:min-w-0 sm:p-1.5 sm:h-8 sm:w-8 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                              >
                                <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
