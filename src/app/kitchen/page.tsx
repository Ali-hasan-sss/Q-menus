"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";
import { api, endpoints } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface KitchenSection {
  id: string;
  name: string;
  nameAr?: string;
  sortOrder: number;
  isActive: boolean;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  notes?: string;
  customItemName?: string;
  customItemNameAr?: string;
  isCustomItem: boolean;
  kitchenItemStatus: "PENDING" | "PREPARING" | "COMPLETED";
  menuItem?: {
    id: string;
    name: string;
    nameAr?: string;
    kitchenSection?: KitchenSection;
  };
}

interface Order {
  id: string;
  tableNumber?: string;
  orderType: "DINE_IN" | "DELIVERY";
  createdAt: string;
}

interface SectionData {
  section: KitchenSection;
  items: Array<{
    orderItem: OrderItem;
    order: Order;
  }>;
}

type StatusColumn = "PENDING" | "PREPARING" | "COMPLETED";

interface StatusColumnData {
  id: StatusColumn;
  title: string;
  titleAr: string;
  items: Array<{
    orderItem: OrderItem;
    order: Order;
  }>;
}

// Draggable Item Component
function DraggableItem({
  item,
  order,
  isRTL,
}: {
  item: OrderItem;
  order: Order;
  isRTL: boolean;
}) {
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

  const getItemName = (item: OrderItem) => {
    if (item.isCustomItem) {
      return isRTL && item.customItemNameAr
        ? item.customItemNameAr
        : item.customItemName || "Custom Item";
    }
    return isRTL && item.menuItem?.nameAr
      ? item.menuItem.nameAr
      : item.menuItem?.name || "Unknown Item";
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: false,
        locale: isRTL ? ar : enUS,
      });
    } catch (e) {
      return "";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: "none", // Prevent default touch behaviors for better drag
      }}
      {...attributes}
      {...listeners}
      className={`p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl mb-3 cursor-grab active:cursor-grabbing shadow-md hover:shadow-xl transition-all duration-200 hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-600 touch-manipulation ${
        isDragging ? "ring-4 ring-primary-400 shadow-2xl scale-105" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <svg
                className="w-4 h-4 text-primary-600 dark:text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              {getItemName(item)}{" "}
              <span className="text-primary-600 dark:text-primary-400">
                × {item.quantity}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-800 dark:text-primary-200 font-semibold border border-primary-300 dark:border-primary-600">
              {order.tableNumber
                ? `${isRTL ? "طاولة" : "Table"} ${order.tableNumber}`
                : order.orderType === "DELIVERY"
                  ? isRTL
                    ? "توصيل"
                    : "Delivery"
                  : "-"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
              ⏱ {formatTimeAgo(order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {item.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 italic flex items-start gap-2">
            <span className="text-primary-500 dark:text-primary-400 font-semibold">
              {isRTL ? "ملاحظات:" : "Notes:"}
            </span>
            <span>{item.notes}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// Status Column Component
function StatusColumn({
  column,
  isRTL,
}: {
  column: StatusColumnData;
  isRTL: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const bgColor =
    column.id === "PENDING"
      ? "bg-gradient-to-b from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-900/20"
      : column.id === "PREPARING"
        ? "bg-gradient-to-b from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/20"
        : "bg-gradient-to-b from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/20";

  const borderColor =
    column.id === "PENDING"
      ? "border-yellow-400 dark:border-yellow-600"
      : column.id === "PREPARING"
        ? "border-primary-400 dark:border-primary-600"
        : "border-green-400 dark:border-green-600";

  const headerBgColor =
    column.id === "PENDING"
      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700"
      : column.id === "PREPARING"
        ? "bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700"
        : "bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700";

  return (
    <div
      ref={setNodeRef}
      id={column.id}
      className={`flex-1 min-w-0 h-full ${bgColor} border-2 ${borderColor} rounded-xl overflow-hidden flex flex-col shadow-lg backdrop-blur-sm`}
    >
      {/* Column Header */}
      <div className={`${headerBgColor} px-4 py-4 text-white shadow-md`}>
        <h2 className="text-xl font-bold text-center drop-shadow-md">
          {isRTL ? column.titleAr : column.title}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="px-3 py-1 bg-white/20 dark:bg-white/10 rounded-full backdrop-blur-sm">
            <p className="text-sm font-semibold text-center">
              {column.items.length} {isRTL ? "عنصر" : "item(s)"}
            </p>
          </div>
        </div>
      </div>

      {/* Column Items */}
      <div
        className="flex-1 overflow-y-auto p-4 thin-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(156, 163, 175, 0.5) transparent",
        }}
      >
        <SortableContext
          items={column.items.map((item) => item.orderItem.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isRTL ? "لا توجد عناصر" : "No items"}
            </div>
          ) : (
            column.items.map(({ orderItem, order }) => (
              <DraggableItem
                key={orderItem.id}
                item={orderItem}
                order={order}
                isRTL={isRTL}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KitchenDisplayPage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { socket, isConnected, joinRestaurant } = useSocket();
  const router = useRouter();

  const [sections, setSections] = useState<SectionData[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const previousItemIdsRef = useRef<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    // Load sound preference from localStorage, default to true
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kitchen_sound_enabled");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for better touch sensitivity
        delay: 50, // Small delay for touch devices
        tolerance: 3, // More precise touch detection
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user?.restaurant)) {
      router.push("/kitchen/login");
    }
  }, [isAuthenticated, user, authLoading, router]);

  // Join restaurant room for real-time updates
  useEffect(() => {
    if (isConnected && socket && user?.restaurant?.id) {
      joinRestaurant(user.restaurant.id);
      console.log("🍳 Joined restaurant room for kitchen display");
    }
  }, [isConnected, socket, user?.restaurant?.id, joinRestaurant]);

  // Fetch KDS items
  const fetchKDSItems = useCallback(
    async (checkForNewItems = false) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(endpoints.kitchen.kds.items);
        if (response.data.success) {
          const fetchedSections = response.data.data.sections || [];

          // Check for new items in the selected section
          if (checkForNewItems && selectedSectionId) {
            const selectedSection = fetchedSections.find(
              (s: SectionData) => s.section.id === selectedSectionId
            );

            if (selectedSection) {
              const currentItemIds = new Set<string>(
                selectedSection.items.map(
                  (item: { orderItem: OrderItem; order: Order }) =>
                    item.orderItem.id
                )
              );

              // Find new items (items that weren't in previous list)
              const newItemIds = Array.from(currentItemIds).filter(
                (id: string) => !previousItemIdsRef.current.has(id)
              );

              // If there are new items in the selected section, play sound
              if (newItemIds.length > 0) {
                console.log(
                  "🔔 New items detected in selected section:",
                  selectedSectionId,
                  newItemIds
                );

                // Play notification sound only for the selected section (if sound is enabled)
                if (soundEnabled) {
                  try {
                    const audio = new Audio("/notification.mp3");
                    audio.volume = 0.5;
                    audio.play().catch((e) => {
                      console.log("Could not play notification sound:", e);
                    });
                  } catch (e) {
                    console.log("Audio not available:", e);
                  }
                } else {
                  console.log(
                    "🔇 Sound is disabled, skipping audio notification"
                  );
                }

                // Show visual notification
                toast.success(
                  isRTL
                    ? `تم إضافة ${newItemIds.length} عنصر جديد`
                    : `${newItemIds.length} new item(s) added`,
                  {
                    duration: 3000,
                    icon: "🍳",
                  }
                );

                // Flash effect on the page
                document.body.style.transition = "background-color 0.3s";
                document.body.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                setTimeout(() => {
                  document.body.style.backgroundColor = "";
                }, 300);
              }

              // Update previous item IDs
              previousItemIdsRef.current = currentItemIds;
            }
          } else {
            // First load or section changed - update previous item IDs
            if (selectedSectionId) {
              const selectedSection = fetchedSections.find(
                (s: SectionData) => s.section.id === selectedSectionId
              );
              if (selectedSection) {
                const currentItemIds = new Set<string>(
                  selectedSection.items.map(
                    (item: { orderItem: OrderItem; order: Order }) =>
                      item.orderItem.id
                  )
                );
                previousItemIdsRef.current = currentItemIds;
              }
            }
          }

          setSections(fetchedSections);

          // Auto-select first section if none selected
          if (!selectedSectionId && fetchedSections.length > 0) {
            setSelectedSectionId(fetchedSections[0].section.id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching KDS items:", err);
        setError(
          err.response?.data?.message ||
            (isRTL ? "حدث خطأ في جلب الطلبات" : "Error fetching orders")
        );
      } finally {
        setLoading(false);
      }
    },
    [isRTL, selectedSectionId, soundEnabled]
  );

  // Listen for KDS updates
  useEffect(() => {
    if (!socket) return;

    const handleKDSUpdate = (data: any) => {
      console.log("🍳 KDS update received:", data);
      const source = data.source || "kitchen";
      console.log("📊 KDS update source:", source);

      // Only check for new items if source is customer (new items added)
      // The fetchKDSItems will check for new items in the selected section
      const shouldCheckForNewItems = source === "customer";

      // Always refresh items regardless of source
      // If source is customer, check for new items in selected section
      fetchKDSItems(shouldCheckForNewItems);
    };

    const handleOrderCreated = (data: any) => {
      console.log("🍳 Order created:", data);
      // Check for new items in selected section when new order is created
      fetchKDSItems(true);
    };

    socket.on("kds_update", handleKDSUpdate);
    socket.on("order_created", handleOrderCreated);
    socket.on("order_status_update", () => {
      // Silent update for status changes (no visual/audio effects)
      fetchKDSItems();
    });

    return () => {
      socket.off("kds_update", handleKDSUpdate);
      socket.off("order_created", handleOrderCreated);
      socket.off("order_status_update");
    };
  }, [socket, fetchKDSItems, isRTL]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated && user?.restaurant) {
      fetchKDSItems();

      // Auto-refresh every 30 seconds as fallback
      const interval = setInterval(fetchKDSItems, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.restaurant, fetchKDSItems]);

  // Update item status with optimistic update
  const updateItemStatus = async (
    itemId: string,
    status: "PENDING" | "PREPARING" | "COMPLETED"
  ) => {
    if (updatingItems.has(itemId)) return;

    // Find the item in current section
    const itemToUpdate = currentSection?.items.find(
      (item) => item.orderItem.id === itemId
    );

    if (!itemToUpdate) return;

    const oldStatus = itemToUpdate.orderItem.kitchenItemStatus;

    // Optimistic update: Update UI immediately
    setSections((prevSections) => {
      return prevSections.map((section) => {
        if (section.section.id !== selectedSectionId) return section;

        return {
          ...section,
          items: section.items.map((item) => {
            if (item.orderItem.id === itemId) {
              return {
                ...item,
                orderItem: {
                  ...item.orderItem,
                  kitchenItemStatus: status,
                },
              };
            }
            return item;
          }),
        };
      });
    });

    try {
      setUpdatingItems((prev) => new Set(prev).add(itemId));
      const response = await api.put(
        endpoints.kitchen.kds.updateItemStatus(itemId),
        { status }
      );

      if (!response.data.success) {
        // Revert on error
        setSections((prevSections) => {
          return prevSections.map((section) => {
            if (section.section.id !== selectedSectionId) return section;

            return {
              ...section,
              items: section.items.map((item) => {
                if (item.orderItem.id === itemId) {
                  return {
                    ...item,
                    orderItem: {
                      ...item.orderItem,
                      kitchenItemStatus: oldStatus,
                    },
                  };
                }
                return item;
              }),
            };
          });
        });
        throw new Error(response.data.message || "Update failed");
      }

      // Success - UI already updated optimistically
      // Optionally sync with server data if needed (but don't cause flicker)
      // We'll let socket updates handle any server-side changes
    } catch (err: any) {
      console.error("Error updating item status:", err);
      toast.error(
        err.response?.data?.message ||
          (isRTL
            ? "حدث خطأ في تحديث حالة العنصر"
            : "Error updating item status")
      );
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Get section display name
  const getSectionName = (section: KitchenSection) => {
    return isRTL && section.nameAr ? section.nameAr : section.name;
  };

  // Get current section data
  const currentSection = sections.find(
    (s) => s.section.id === selectedSectionId
  );

  // Group items by status
  const getStatusColumns = (): StatusColumnData[] => {
    if (!currentSection) {
      return [
        {
          id: "PENDING",
          title: "Pending",
          titleAr: "قيد الانتظار",
          items: [],
        },
        {
          id: "PREPARING",
          title: "Preparing",
          titleAr: "قيد التحضير",
          items: [],
        },
        {
          id: "COMPLETED",
          title: "Completed",
          titleAr: "تم التحضير",
          items: [],
        },
      ];
    }

    // Debug: Log item statuses
    console.log(
      "🔍 Current section items statuses:",
      currentSection.items.map((item) => ({
        id: item.orderItem.id,
        status: item.orderItem.kitchenItemStatus,
        name: item.orderItem.menuItem?.name || item.orderItem.customItemName,
      }))
    );

    const pending: StatusColumnData = {
      id: "PENDING",
      title: "Pending",
      titleAr: "قيد الانتظار",
      items: currentSection.items.filter((item) => {
        const isPending = item.orderItem.kitchenItemStatus === "PENDING";
        if (!isPending && item.orderItem.kitchenItemStatus) {
          console.log(
            `⚠️ Item ${item.orderItem.id} has status: ${item.orderItem.kitchenItemStatus}, expected PENDING`
          );
        }
        return isPending;
      }),
    };

    const preparing: StatusColumnData = {
      id: "PREPARING",
      title: "Preparing",
      titleAr: "قيد التحضير",
      items: currentSection.items.filter(
        (item) => item.orderItem.kitchenItemStatus === "PREPARING"
      ),
    };

    const completed: StatusColumnData = {
      id: "COMPLETED",
      title: "Completed",
      titleAr: "تم التحضير",
      items: currentSection.items.filter(
        (item) => item.orderItem.kitchenItemStatus === "COMPLETED"
      ),
    };

    return [pending, preparing, completed];
  };

  const statusColumns = getStatusColumns();

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;

    // Find the item's current status
    const currentItem = currentSection?.items.find(
      (item) => item.orderItem.id === itemId
    );

    if (!currentItem) return;

    const currentStatus = currentItem.orderItem.kitchenItemStatus;

    // Determine target column ID
    // over.id could be the column ID (when dropping on empty area) or an item ID (when dropping on another item)
    let targetColumnId: StatusColumn | null = null;

    // Check if over.id is a valid column ID
    const validColumnIds: StatusColumn[] = [
      "PENDING",
      "PREPARING",
      "COMPLETED",
    ];
    if (validColumnIds.includes(over.id as StatusColumn)) {
      targetColumnId = over.id as StatusColumn;
    } else {
      // If over.id is an item ID, find which column contains it
      for (const column of statusColumns) {
        const itemInColumn = column.items.find(
          (item) => item.orderItem.id === over.id
        );
        if (itemInColumn) {
          targetColumnId = column.id;
          break;
        }
      }

      // If still not found, it might be a different element - skip update
      if (!targetColumnId) {
        console.warn("Could not determine target column for:", over.id);
        return;
      }
    }

    // Only update if status changed
    if (currentStatus !== targetColumnId) {
      await updateItemStatus(itemId, targetColumnId);
    }
  };

  // Get active item for drag overlay
  const getActiveItem = () => {
    if (!activeId || !currentSection) return null;
    return currentSection.items.find((item) => item.orderItem.id === activeId);
  };

  const activeItem = getActiveItem();

  // Handle logout
  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear httpOnly cookie
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    }

    // Clear any stale localStorage tokens
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    // Call logout from AuthContext to clear user state
    logout();

    // Redirect to kitchen login page (override the default redirect in logout)
    setTimeout(() => {
      router.push("/kitchen/login");
    }, 100);
  };

  // Toggle sound on/off
  const toggleSound = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("kitchen_sound_enabled", String(newSoundState));
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !user?.restaurant) {
    return null; // Will redirect
  }

  return (
    <div
      className="bg-gradient-to-br from-gray-50 via-orange-50/30 to-yellow-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 dark:from-primary-600 dark:via-primary-700 dark:to-primary-600 shadow-lg flex-shrink-0 z-50 border-b-4 border-primary-400 dark:border-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg backdrop-blur-sm">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                  {isRTL ? "لوحة المطبخ" : "Kitchen Display"}
                </h1>
                <p className="text-sm text-white/90 mt-1 font-medium">
                  {user.restaurant.nameAr || user.restaurant.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Section Selector */}
              <div className="flex items-center gap-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <label className="text-sm font-semibold text-white">
                  {isRTL ? "القسم:" : "Section:"}
                </label>
                <select
                  value={selectedSectionId || ""}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-3 py-1.5 border-0 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-white/50 focus:outline-none font-medium shadow-sm"
                >
                  {sections.map((section) => (
                    <option key={section.section.id} value={section.section.id}>
                      {getSectionName(section.section)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected
                      ? "bg-green-300 animate-pulse shadow-lg shadow-green-300/50"
                      : "bg-red-300"
                  }`}
                />
                <span className="text-sm text-white font-medium">
                  {isConnected
                    ? isRTL
                      ? "متصل"
                      : "Connected"
                    : isRTL
                      ? "غير متصل"
                      : "Disconnected"}
                </span>
              </div>
              {/* Sound Toggle Button */}
              <button
                onClick={toggleSound}
                className={`p-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                  soundEnabled
                    ? "bg-white/30 dark:bg-white/20 text-white hover:bg-white/40 shadow-lg shadow-white/20"
                    : "bg-white/20 dark:bg-white/10 text-white/70 hover:bg-white/30"
                }`}
                title={
                  soundEnabled
                    ? isRTL
                      ? "كتم الصوت"
                      : "Mute Sound"
                    : isRTL
                      ? "تفعيل الصوت"
                      : "Unmute Sound"
                }
              >
                {soundEnabled ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22z" />
                  </svg>
                )}
              </button>
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg">
                <LanguageToggle />
              </div>
              <div className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-lg">
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm bg-white/20 dark:bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 font-medium"
              >
                {isRTL ? "تسجيل الخروج" : "Logout"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : sections.length === 0 ? (
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? "لا توجد أقسام" : "No Sections"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL
                ? "يرجى إضافة أقسام المطبخ من الإعدادات"
                : "Please add kitchen sections from settings"}
            </p>
          </Card>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(event) => {
                handleDragStart(event);
                // Prevent body scroll during drag on touch devices
                if (
                  typeof window !== "undefined" &&
                  window.matchMedia("(pointer: coarse)").matches
                ) {
                  document.body.style.overflow = "hidden";
                  document.body.style.touchAction = "none";
                }
              }}
              onDragEnd={async (event) => {
                await handleDragEnd(event);
                // Restore body scroll after drag
                if (typeof window !== "undefined") {
                  document.body.style.overflow = "";
                  document.body.style.touchAction = "";
                }
              }}
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 min-h-0 h-full">
                {statusColumns.map((column) => (
                  <StatusColumn key={column.id} column={column} isRTL={isRTL} />
                ))}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <div className="p-4 bg-gradient-to-br from-white to-primary-50 dark:from-gray-800 dark:to-primary-900/30 border-2 border-primary-500 rounded-xl shadow-2xl opacity-95 backdrop-blur-sm">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {isRTL && activeItem.orderItem.menuItem?.nameAr
                        ? activeItem.orderItem.menuItem.nameAr
                        : activeItem.orderItem.menuItem?.name ||
                          activeItem.orderItem.customItemName ||
                          "Item"}{" "}
                      <span className="text-primary-600 dark:text-primary-400">
                        × {activeItem.orderItem.quantity}
                      </span>
                    </h3>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            {/* Refresh Button */}
            {!loading && (
              <div className="mt-6 text-center flex-shrink-0">
                <Button
                  onClick={() => fetchKDSItems(false)}
                  variant="outline"
                  disabled={loading}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 inline-block mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {isRTL ? "تحديث" : "Refresh"}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
