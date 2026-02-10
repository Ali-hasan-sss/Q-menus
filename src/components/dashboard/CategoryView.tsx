"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMenu } from "@/store/hooks/useMenu";
import { useLanguage } from "@/store/hooks/useLanguage";
import { getLocalizedName } from "@/lib/utils";
import { getImageUrl } from "@/lib/api";

interface CategoryViewProps {
  categoryId: string;
  onEditCategory: (categoryId: string) => void;
  onEditItem: (itemId: string) => void;
}

export function CategoryView({
  categoryId,
  onEditCategory,
  onEditItem,
}: CategoryViewProps) {
  const { categories, items } = useMenu();
  const { language } = useLanguage();
  const lang = language === "AR" ? "AR" : "EN";
  const [isExpanded, setIsExpanded] = useState(true);

  const category = categories.find((cat) => cat.id === categoryId);
  const categoryItems = items.filter((item) => item.categoryId === categoryId);

  if (!category) return null;

  return (
    <Card className="p-6 mb-6">
      {/* Category Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            {category.image && (
              <img
                src={getImageUrl(category.image)}
                alt={category.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {getLocalizedName(category.name, category.nameAr, lang)}
              </h3>
              <div className="flex items-center gap-4 mt-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {category.isActive ? "Active" : "Inactive"}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {categoryItems.length} items
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Collapse" : "Expand"}
          </Button>
          <Button size="sm" onClick={() => onEditCategory(category.id)}>
            Edit Category
          </Button>
        </div>
      </div>

      {/* Category Description */}
      {category.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {category.description}
        </p>
      )}

      {/* Items List */}
      {isExpanded && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Items in this category
            </h4>
            <Button size="sm">Add Item to Category</Button>
          </div>

          {categoryItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No items in this category yet.</p>
              <Button size="sm" className="mt-2">
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-white">
                        {getLocalizedName(item.name, item.nameAr, lang)}
                      </h5>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        item.isAvailable
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  {item.image && (
                    <div className="mb-3">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.price} {item.currency}
                      </p>
                      {item.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditItem(item.id)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
