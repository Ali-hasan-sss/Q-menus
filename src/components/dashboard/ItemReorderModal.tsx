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
import { useLanguage } from "@/store/hooks/useLanguage";
import { getLocalizedName } from "@/lib/utils";
import { api } from "@/lib/api";
import type { MenuItem } from "@/store/slices/menuSlice";

interface ItemReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onReorder: () => void;
}

function SortableItem({ item }: { item: MenuItem }) {
  const { t, isRTL, language } = useLanguage();
  const lang = language === "AR" ? "AR" : "EN";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-2 ${
        isDragging ? "shadow-lg" : "hover:shadow-md"
      } transition-shadow touch-manipulation`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 dnd-drag-handle"
      >
        <svg
          className="h-5 w-5 sm:h-6 sm:w-6"
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
      </div>

      {/* Item Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {getLocalizedName(item.name, item.nameAr, lang)}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {item.price} {item.currency}
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                item.isAvailable
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {item.isAvailable ? t("item.available") : t("item.unavailable")}
            </span>
          </div>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function ItemReorderModal({
  isOpen,
  onClose,
  items,
  onReorder,
}: ItemReorderModalProps) {
  const { t } = useLanguage();
  const [reorderedItems, setReorderedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      // Sort items by sortOrder
      const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
      setReorderedItems(sortedItems);
    }
  }, [items, isOpen]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setReorderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      const itemsWithNewOrder = reorderedItems.map((item, index) => ({
        id: item.id,
        sortOrder: index + 1,
      }));

      await api.put("/menu/items/reorder", {
        items: itemsWithNewOrder,
      });

      onReorder();
      onClose();
    } catch (error) {
      console.error("Error saving item order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("item.reorder")}
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("item.reorderDescription") ||
            "Drag and drop items to reorder them"}
        </p>

        {reorderedItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {t("item.noItemsToReorder") || "No items to reorder"}
            </p>
          </div>
        ) : (
          <div
            className="max-h-96 overflow-y-auto dnd-touch-improvements"
            style={{
              overscrollBehavior: "contain",
            }}
          >
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
                items={reorderedItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {reorderedItems.map((item) => (
                  <SortableItem key={item.id} item={item} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSaveOrder} disabled={loading}>
            {loading ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
