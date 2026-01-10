"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Edit, Trash2 } from "lucide-react";

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

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  image?: string;
}

interface ItemListProps {
  items: MenuItem[];
  selectedCategory: Category | null;
  loadingItems?: boolean;
  restaurantCurrency?: string;
  onBackToCategories: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemStatus: (itemId: string) => void;
  onCreateItem: () => void;
  onReorderItems: () => void;
}

export function ItemList({
  items,
  selectedCategory,
  loadingItems = false,
  restaurantCurrency = "USD",
  onBackToCategories,
  onEditItem,
  onDeleteItem,
  onToggleItemStatus,
  onCreateItem,
  onReorderItems,
}: ItemListProps) {
  const { t, isRTL, language } = useLanguage();
  const [showStickyBackButton, setShowStickyBackButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowStickyBackButton(scrollTop > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          onClick={onBackToCategories}
          className={`transition-all duration-300 ${
            showStickyBackButton
              ? `fixed z-50 shadow-lg hover:shadow-xl ${
                  isRTL ? "right-4 md:right-4" : "left-4 md:left-4"
                } bottom-20 md:bottom-auto top-auto md:top-4`
              : "relative"
          }`}
        >
          <BackIcon className="h-4 w-4 mr-2" />
          {showStickyBackButton
            ? t("menu.backToCategoriesShort")
            : t("menu.backToCategories")}
        </Button>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {selectedCategory?.name} {t("menu.items") || "Items"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} {t("menu.itemsInCategory")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {selectedCategory?.image && (
            <img
              src={selectedCategory.image}
              alt={selectedCategory.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {selectedCategory?.name}
            </h4>
            {selectedCategory?.nameAr && (
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                {selectedCategory.nameAr}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={onReorderItems}
            variant="outline"
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
          >
            <svg
              className="h-3 w-3 sm:h-4 sm:w-4"
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
            <span className="hidden xs:inline">
              {t("item.reorder") || "Reorder Items"}
            </span>
            <span className="xs:hidden">
              {t("item.reorder")?.split(" ")[0] || "Reorder"}
            </span>
          </Button>
          <Button
            onClick={onCreateItem}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
          >
            {t("item.add")}
          </Button>
        </div>
      </div>

      {loadingItems ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {t("common.loading") || "Loading items..."}
          </span>
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center mb-6">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t("item.noItemsInCategory")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("item.addFirstItem")}
          </p>
          <div className="mt-6">
            <Button onClick={onCreateItem}>{t("item.add")}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-6 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  {item.nameAr && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {item.nameAr}
                    </p>
                  )}
                </div>
                <Switch
                  checked={item.isAvailable}
                  onChange={() => onToggleItemStatus(item.id)}
                  size="sm"
                  isRTL={isRTL}
                  className="ml-2 flex-shrink-0"
                />
              </div>

              {item.image && (
                <div className="mb-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {formatCurrencyWithLanguage(
                    item.price,
                    restaurantCurrency,
                    language
                  )}
                </p>
                <div className="h-8 overflow-hidden">
                  {item.description ? (
                    <p className="line-clamp-2 text-xs">{item.description}</p>
                  ) : (
                    <p className="text-gray-400 italic text-xs">
                      {t("item.noDescription")}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex mt-auto ${isRTL ? "space-x-reverse space-x-1" : "space-x-1"}`}
              >
                <Button
                  size="sm"
                  onClick={() => onEditItem(item)}
                  className="flex-1 text-xs py-1 flex items-center justify-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  {t("common.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700 flex-1 text-xs py-1 flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
