"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    items: number;
  };
}

interface CategoryReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onReorder: () => void;
}

interface SortableCategoryItemProps {
  category: Category;
  index: number;
  isRTL: boolean;
}

function SortableCategoryItem({
  category,
  index,
  isRTL,
}: SortableCategoryItemProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all touch-manipulation ${
        isDragging
          ? "shadow-lg scale-105 border-blue-400"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md"
      }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing p-2 dnd-drag-handle"
      >
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" />
        </svg>
      </div>

      {/* Category image */}
      {category.image && (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Category info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {isRTL && category.nameAr ? category.nameAr : category.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              category.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                category.isActive ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {category.isActive ? t("category.active") : t("category.inactive")}
          </span>
        </div>
      </div>

      {/* Order number */}
      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-bold">
        {index + 1}
      </div>
    </div>
  );
}

export function CategoryReorderModal({
  isOpen,
  onClose,
  categories,
  onReorder,
}: CategoryReorderModalProps) {
  const { isRTL } = useLanguage();
  const [reorderedCategories, setReorderedCategories] =
    useState<Category[]>(categories);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for better touch sensitivity
        delay: 50, // Reduced delay for faster response
        tolerance: 3, // Reduced tolerance for more precise touch
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update reorderedCategories when categories prop changes
  useEffect(() => {
    setReorderedCategories(categories);
  }, [categories]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setReorderedCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const updateData = reorderedCategories.map((category, index) => ({
        id: category.id,
        sortOrder: index + 1,
      }));

      await api.put("/menu/categories/reorder", { categories: updateData });
      onReorder();
      onClose();
    } catch (error) {
      console.error("Error saving category order:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setReorderedCategories(categories);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={isRTL ? "ترتيب الفئات" : "Reorder Categories"}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isRTL
            ? "اسحب وأفلت الفئات لترتيبها كما تشاء، ثم اضغط حفظ الترتيب"
            : "Drag and drop categories to reorder them, then click save order"}
        </p>

        <div className="dnd-touch-improvements">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => {
              // Prevent body scroll during drag
              document.body.style.overflow = "hidden";
            }}
            onDragEnd={(event) => {
              // Handle drag end logic
              handleDragEnd(event);
              // Restore body scroll after drag
              document.body.style.overflow = "";
            }}
          >
            <SortableContext
              items={reorderedCategories.map((cat) => cat.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 transition-colors touch-manipulation">
                {reorderedCategories.map((category, index) => (
                  <SortableCategoryItem
                    key={category.id}
                    category={category}
                    index={index}
                    isRTL={isRTL}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Action buttons */}
        <div
          className={`flex pt-4 ${
            isRTL
              ? "justify-start space-x-reverse space-x-3"
              : "justify-end space-x-3"
          }`}
        >
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSaveOrder} disabled={saving}>
            {saving
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "حفظ الترتيب"
                : "Save Order"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
