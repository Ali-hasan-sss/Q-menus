"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
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
  pointerWithin,
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
      className={`p-4 bg-white/95 dark:bg-slate-800/95 border-2 border-gray-200/60 dark:border-slate-700/60 rounded-2xl mb-3 cursor-grab active:cursor-grabbing shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-[1.02] hover:border-blue-300/80 dark:hover:border-blue-600/80 touch-manipulation backdrop-blur-sm ${
        isDragging ? "ring-4 ring-blue-400/50 shadow-2xl scale-105 z-50" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
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
              <span className="text-blue-600 dark:text-blue-400">
                × {item.quantity}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-800/40 text-blue-800 dark:text-blue-200 font-semibold border border-blue-300/50 dark:border-blue-600/50">
              {order.tableNumber
                ? `${isRTL ? "طاولة" : "Table"} ${order.tableNumber}`
                : order.orderType === "DELIVERY"
                  ? isRTL
                    ? "توصيل"
                    : "Delivery"
                  : "-"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
              ⏱ {formatTimeAgo(order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {item.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-slate-700/60">
          <p className="text-sm text-gray-700 dark:text-slate-300 italic flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
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
      ? "bg-gradient-to-b from-amber-50/80 via-yellow-50/60 to-amber-50/80 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/40"
      : column.id === "PREPARING"
        ? "bg-gradient-to-b from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40"
        : "bg-gradient-to-b from-emerald-50/80 via-green-50/60 to-emerald-50/80 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-emerald-950/40";

  const borderColor =
    column.id === "PENDING"
      ? "border-amber-300/60 dark:border-amber-600/50"
      : column.id === "PREPARING"
        ? "border-blue-300/60 dark:border-blue-600/50"
        : "border-emerald-300/60 dark:border-emerald-600/50";

  const headerBgColor =
    column.id === "PENDING"
      ? "bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 dark:from-amber-600 dark:via-amber-700 dark:to-yellow-700"
      : column.id === "PREPARING"
        ? "bg-gradient-to-r from-blue-500 via-indigo-600 to-blue-600 dark:from-blue-700 dark:via-indigo-800 dark:to-blue-800"
        : "bg-gradient-to-r from-emerald-500 via-green-600 to-emerald-600 dark:from-emerald-700 dark:via-green-800 dark:to-emerald-800";

  return (
    <div
      ref={setNodeRef}
      id={column.id}
      className={`flex-1 min-w-0 h-full ${bgColor} border-2 ${borderColor} rounded-2xl overflow-hidden flex flex-col shadow-xl backdrop-blur-md`}
    >
      {/* Column Header */}
      <div className={`${headerBgColor} px-5 py-4 text-white shadow-lg`}>
        <h2 className="text-xl font-bold text-center drop-shadow-lg tracking-wide">
          {isRTL ? column.titleAr : column.title}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2.5">
          <div className="px-4 py-1.5 bg-white/25 dark:bg-white/15 rounded-full backdrop-blur-md shadow-md border border-white/20">
            <p className="text-sm font-semibold text-center">
              {column.items.length} {isRTL ? "عنصر" : "item(s)"}
            </p>
          </div>
        </div>
      </div>

      {/* Column Items - min-height ensures droppable area is always large enough */}
      <div
        className="flex-1 min-h-[200px] overflow-y-auto p-4 thin-scrollbar"
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
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 min-h-[120px] flex items-center justify-center">
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
  // Track previous item IDs for all sections (sectionId -> Set of itemIds)
  const previousItemIdsBySectionRef = useRef<Map<string, Set<string>>>(
    new Map()
  );
  const isDraggingRef = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCheckForNewItemsRef = useRef<boolean>(false);
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
        distance: 6,
        delay: 60,
        tolerance: 4,
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
    async (checkForNewItems = false, showLoading = false) => {
      // Skip fetch if currently dragging to prevent flicker
      if (isDraggingRef.current) {
        console.log("⏸️ Skipping fetch during drag operation");
        return;
      }

      // Clear any pending fetch timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      // If checkForNewItems is true, mark that we have a pending check
      // This prevents order_status_update from updating previousItemIdsBySectionRef
      if (checkForNewItems) {
        pendingCheckForNewItemsRef.current = true;
        return new Promise<void>((resolve) => {
          fetchTimeoutRef.current = setTimeout(async () => {
            await performFetch(checkForNewItems, showLoading);
            pendingCheckForNewItemsRef.current = false;
            resolve();
          }, 150); // Small delay to ensure latest data and let other updates complete
        });
      } else {
        // If there's a pending check for new items, skip updating previousItemIdsBySectionRef
        // This prevents race conditions where order_status_update updates before kds_update
        return performFetch(checkForNewItems, showLoading);
      }
    },
    [isRTL, selectedSectionId, soundEnabled]
  );

  // Actual fetch function
  const performFetch = useCallback(
    async (checkForNewItems = false, showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);
        const response = await api.get(endpoints.kitchen.kds.items);
        if (response.data.success) {
          const fetchedSections = response.data.data.sections || [];

          // Check for new items in ALL sections (not just selected)
          if (checkForNewItems) {
            let totalNewItems = 0;
            let newItemsBySection: Array<{
              sectionId: string;
              sectionName: string;
              count: number;
            }> = [];

            console.log("🔍 Checking for new items across all sections...");

            // Create a snapshot of previous items BEFORE checking
            // This prevents race conditions if multiple fetches happen simultaneously
            const previousItemsSnapshot = new Map<string, Set<string>>();
            previousItemIdsBySectionRef.current.forEach((items, sectionId) => {
              previousItemsSnapshot.set(sectionId, new Set(items));
            });

            console.log(
              "📊 Previous items by section (snapshot):",
              Array.from(previousItemsSnapshot.entries()).map(
                ([id, items]) => ({ sectionId: id, count: items.size })
              )
            );

            // Check each section for new items
            fetchedSections.forEach((section: SectionData) => {
              const sectionId = section.section.id;
              const currentItemIds = new Set<string>(
                section.items.map(
                  (item: { orderItem: OrderItem; order: Order }) =>
                    item.orderItem.id
                )
              );

              // Get previous item IDs for this section from snapshot
              const previousItemIds = previousItemsSnapshot.get(sectionId);

              // If this is the first time checking this section, skip detection
              // We don't want to play sound for initial load
              const isFirstCheck = previousItemIds === undefined;

              const previousItemIdsToCompare =
                previousItemIds || new Set<string>();

              console.log(
                `🔍 Section ${section.section.name} (${sectionId}):`,
                {
                  currentItems: Array.from(currentItemIds),
                  previousItems: Array.from(previousItemIdsToCompare),
                  currentCount: currentItemIds.size,
                  previousCount: previousItemIdsToCompare.size,
                  isFirstCheck,
                }
              );

              // Find new items (items that weren't in previous list for this section)
              // Skip detection on first check to avoid false positives
              const newItemIds = isFirstCheck
                ? [] // Don't consider items as "new" on first check
                : Array.from(currentItemIds).filter(
                    (id: string) => !previousItemIdsToCompare.has(id)
                  );

              console.log(
                `🔍 New items in section ${section.section.name}:`,
                newItemIds,
                `(isFirstCheck: ${isFirstCheck})`
              );

              if (newItemIds.length > 0) {
                totalNewItems += newItemIds.length;
                newItemsBySection.push({
                  sectionId,
                  sectionName: isRTL
                    ? section.section.nameAr || section.section.name
                    : section.section.name,
                  count: newItemIds.length,
                });
                console.log(
                  `🔔 New items detected in section ${section.section.name}:`,
                  newItemIds
                );
              }

              // Update previous item IDs for this section AFTER checking
              previousItemIdsBySectionRef.current.set(
                sectionId,
                currentItemIds
              );
            });

            console.log(
              `🔍 Total new items found: ${totalNewItems}`,
              newItemsBySection
            );

            // If there are new items in any section, play sound and show notification
            if (totalNewItems > 0) {
              console.log(
                `🔔 Total new items detected: ${totalNewItems} across ${newItemsBySection.length} section(s)`
              );
              console.log(`🔊 Sound enabled: ${soundEnabled}`);

              // Play notification sound (if sound is enabled)
              if (soundEnabled) {
                console.log("🔊 Attempting to play notification sound...");
                try {
                  const audioContext = new (window.AudioContext ||
                    (window as any).webkitAudioContext)();
                  const oscillator = audioContext.createOscillator();
                  const gainNode = audioContext.createGain();

                  oscillator.connect(gainNode);
                  gainNode.connect(audioContext.destination);

                  // Kitchen notification sound - distinct beep pattern
                  oscillator.frequency.setValueAtTime(
                    1000,
                    audioContext.currentTime
                  );
                  oscillator.frequency.setValueAtTime(
                    800,
                    audioContext.currentTime + 0.1
                  );
                  oscillator.frequency.setValueAtTime(
                    1200,
                    audioContext.currentTime + 0.2
                  );
                  oscillator.frequency.setValueAtTime(
                    1000,
                    audioContext.currentTime + 0.3
                  );

                  gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
                  gainNode.gain.exponentialRampToValueAtTime(
                    0.01,
                    audioContext.currentTime + 0.4
                  );

                  oscillator.start(audioContext.currentTime);
                  oscillator.stop(audioContext.currentTime + 0.4);

                  console.log("🔊 Playing kitchen notification sound");
                } catch (e) {
                  console.log("Could not play notification sound:", e);
                }
              } else {
                console.log(
                  "🔇 Sound is disabled, skipping audio notification"
                );
              }

              // Show visual notification with section details
              const sectionDetails = newItemsBySection
                .map((s) => `${s.sectionName}: ${s.count}`)
                .join(", ");
              toast.success(
                isRTL
                  ? `تم إضافة ${totalNewItems} عنصر جديد في ${newItemsBySection.length} قسم (${sectionDetails})`
                  : `${totalNewItems} new item(s) added in ${newItemsBySection.length} section(s) (${sectionDetails})`,
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
          } else {
            // First load or no check needed - update previous item IDs for all sections
            // BUT: Only update if there's no pending check for new items
            // This prevents race conditions where order_status_update updates before kds_update
            if (!pendingCheckForNewItemsRef.current) {
              fetchedSections.forEach((section: SectionData) => {
                const sectionId = section.section.id;
                const currentItemIds = new Set<string>(
                  section.items.map(
                    (item: { orderItem: OrderItem; order: Order }) =>
                      item.orderItem.id
                  )
                );
                previousItemIdsBySectionRef.current.set(
                  sectionId,
                  currentItemIds
                );
              });
            } else {
              console.log(
                "⏸️ Skipping previousItemIdsBySectionRef update - pending check for new items"
              );
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
        if (showLoading) {
          setLoading(false);
        }
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

      // Skip if dragging to prevent flicker
      if (isDraggingRef.current) {
        console.log("⏸️ Skipping socket update during drag");
        return;
      }

      // Check if this is a quick order (created by cashier)
      const isQuickOrder =
        data.order?.tableNumber === "QUICK" ||
        data.orderItem?.order?.tableNumber === "QUICK";

      // Check for new items if source is customer or restaurant (new items added)
      // For quick orders (source === "restaurant"), always check for new items
      // The fetchKDSItems will check for new items in the selected section
      const shouldCheckForNewItems =
        source === "customer" || source === "restaurant" || isQuickOrder;

      console.log(
        `🔄 Refreshing KDS items - checkForNewItems: ${shouldCheckForNewItems}, isQuickOrder: ${isQuickOrder}, source: ${source}`
      );

      // Refresh items without showing loading indicator (silent update)
      fetchKDSItems(shouldCheckForNewItems, false);
    };

    const handleOrderCreated = (data: any) => {
      console.log("🍳 Order created:", data);

      // Skip if dragging
      if (isDraggingRef.current) {
        console.log("⏸️ Skipping order_created update during drag");
        return;
      }
      // Check for new items in selected section when new order is created
      fetchKDSItems(true, false);
    };

    const handleNewOrder = (data: any) => {
      console.log("🍳 New order received:", data);

      // Skip if dragging
      if (isDraggingRef.current) {
        console.log("⏸️ Skipping new_order update during drag");
        return;
      }

      // Check if this is a quick order (created by cashier)
      const isQuickOrder = data.order?.tableNumber === "QUICK";

      // For quick orders, immediately refresh to show new items
      // For customer orders, kds_update will handle it
      if (isQuickOrder) {
        console.log(
          "⚡ Quick order detected - refreshing KDS items immediately"
        );
        // Check for new items in selected section when quick order is created
        fetchKDSItems(true, false);
      }
    };

    socket.on("kds_update", handleKDSUpdate);
    socket.on("order_created", handleOrderCreated);
    socket.on("new_order", handleNewOrder);
    socket.on("order_status_update", () => {
      // Skip if dragging
      if (isDraggingRef.current) {
        return;
      }
      // Silent update for status changes (no visual/audio effects, no loading)
      fetchKDSItems(false, false);
    });

    return () => {
      socket.off("kds_update", handleKDSUpdate);
      socket.off("order_created", handleOrderCreated);
      socket.off("new_order", handleNewOrder);
      socket.off("order_status_update");
    };
  }, [socket, fetchKDSItems, isRTL]);

  // Initial fetch only (no auto-refresh, Socket handles updates)
  useEffect(() => {
    if (isAuthenticated && user?.restaurant) {
      // Only show loading on initial fetch
      fetchKDSItems(false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.restaurant]);

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
    isDraggingRef.current = true; // Set flag to prevent socket updates during drag
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    // Keep dragging flag true briefly to prevent immediate socket updates
    // Will be reset after a short delay
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 300); // Small delay to allow drag animation to complete

    if (!over) {
      isDraggingRef.current = false;
      return;
    }

    const itemId = active.id as string;

    // Find the item's current status
    const currentItem = currentSection?.items.find(
      (item) => item.orderItem.id === itemId
    );

    if (!currentItem) {
      isDraggingRef.current = false;
      return;
    }

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
        isDraggingRef.current = false;
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
      className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 shadow-xl flex-shrink-0 z-50 border-b-4 border-blue-400/50 dark:border-blue-500/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/25 dark:bg-white/15 rounded-xl backdrop-blur-md shadow-lg border border-white/20">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg tracking-tight">
                  {isRTL ? "لوحة المطبخ" : "Kitchen Display"}
                </h1>
                <p className="text-sm text-blue-50 mt-1 font-medium">
                  {user.restaurant.nameAr || user.restaurant.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Section Selector */}
              <div className="flex items-center gap-2 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg border border-white/20">
                <label className="text-sm font-semibold text-white">
                  {isRTL ? "القسم:" : "Section:"}
                </label>
                <select
                  value={selectedSectionId || ""}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-3 py-1.5 border-0 rounded-lg bg-white/95 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-300 focus:outline-none font-medium shadow-md transition-all"
                >
                  {sections.map((section) => (
                    <option key={section.section.id} value={section.section.id}>
                      {getSectionName(section.section)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2.5 bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-lg border border-white/20">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? "bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/60"
                      : "bg-red-400 shadow-lg shadow-red-400/60"
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
                className={`p-2.5 rounded-xl transition-all duration-200 backdrop-blur-md shadow-lg border ${
                  soundEnabled
                    ? "bg-white/30 dark:bg-white/20 text-white hover:bg-white/40 border-white/30 shadow-white/20"
                    : "bg-white/20 dark:bg-white/10 text-white/70 hover:bg-white/30 border-white/20"
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
              <div className="bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                <LanguageToggle />
              </div>
              <div className="bg-white/25 dark:bg-white/15 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-sm bg-white/25 dark:bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/35 font-medium shadow-lg rounded-xl transition-all"
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
              collisionDetection={pointerWithin}
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
                // Restore body scroll first
                if (typeof window !== "undefined") {
                  document.body.style.overflow = "";
                  document.body.style.touchAction = "";
                }
                // Then handle drag end
                await handleDragEnd(event);
              }}
            >
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 min-h-0 h-full">
                {statusColumns.map((column) => (
                  <StatusColumn key={column.id} column={column} isRTL={isRTL} />
                ))}
              </div>

              <DragOverlay>
                {activeItem ? (
                  <div className="p-4 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-900/30 border-2 border-blue-500 rounded-2xl shadow-2xl opacity-95 backdrop-blur-md">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {isRTL && activeItem.orderItem.menuItem?.nameAr
                        ? activeItem.orderItem.menuItem.nameAr
                        : activeItem.orderItem.menuItem?.name ||
                          activeItem.orderItem.customItemName ||
                          "Item"}{" "}
                      <span className="text-blue-600 dark:text-blue-400">
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
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-2 border-blue-300/60 dark:border-blue-600/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
