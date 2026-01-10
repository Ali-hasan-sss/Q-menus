"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";
import { useMenu } from "@/contexts/MenuContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Navbar from "@/components/dashboard/Navbar";
import { api, publicApi, endpoints } from "@/lib/api";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { MenuItem } from "@/components/customer/MenuItem";

interface Order {
  id: string;
  orderType: string;
  tableNumber: string;
  subtotal?: number | string;
  taxes?: Array<{
    name: string;
    nameAr?: string;
    percentage: number;
    amount: number;
  }>;
  totalPrice: number | string;
  currency: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    notes?: string;
    extras?: any;
    isNew?: boolean;
    isModified?: boolean;
    isCustomItem?: boolean;
    customItemName?: string;
    customItemNameAr?: string;
    menuItem?: {
      name: string;
      nameAr?: string;
      currency?: string;
      category?: {
        id: string;
        name: string;
        nameAr?: string;
      };
    };
  }[];
}

const statusColors = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  PREPARING:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  READY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  DELIVERED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const {
    socket,
    isConnected,
    clearNewOrdersCount,
    clearUpdatedOrdersCount,
    isSoundMuted,
    toggleSound,
  } = useSocket();
  const { toggleTableOccupied } = useMenu();
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "table" | "tables">(
    "tables"
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [modifiedOrderIds, setModifiedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [modifiedItemIds, setModifiedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [qrCodes, setQrCodes] = useState<
    Record<string, { id: string; isOccupied: boolean }>
  >({});
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemTab, setAddItemTab] = useState<"menu" | "custom">("custom");
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [restaurantNameAr, setRestaurantNameAr] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<string>("");
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [quickOrderItems, setQuickOrderItems] = useState<
    Array<{
      menuItemId: string;
      quantity: number;
      price: number;
      notes?: string;
      extras?: any;
      name?: string;
      nameAr?: string;
    }>
  >([]);
  const [quickOrderCategories, setQuickOrderCategories] = useState<any[]>([]);
  const [quickOrderSelectedCategory, setQuickOrderSelectedCategory] = useState<
    any | null
  >(null);
  const [quickOrderLoadingCategories, setQuickOrderLoadingCategories] =
    useState(false);
  const [quickOrderLoadingItems, setQuickOrderLoadingItems] = useState(false);
  const [isCreatingQuickOrder, setIsCreatingQuickOrder] = useState(false);
  const [selectedDeliveryOrderIndex, setSelectedDeliveryOrderIndex] =
    useState(0);
  const [quickOrders, setQuickOrders] = useState<Order[]>([]);
  const [selectedQuickOrderIndex, setSelectedQuickOrderIndex] = useState(0);
  const menuItemsFetchedRef = useRef(false);
  const [statistics, setStatistics] = useState<{
    revenue: number;
    totalOrders: number;
    averageOrderValue: number;
    orderStats: Record<string, number>;
    loading: boolean;
  }>({
    revenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    orderStats: {},
    loading: true,
  });
  const [statisticsPeriod, setStatisticsPeriod] = useState<string>("30");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalActiveOrders, setTotalActiveOrders] = useState(0);
  const ordersPerPage = 100; // حد أقصى 100 طلب
  const observerTarget = useRef<HTMLDivElement>(null);

  // تصفية الطلبات النشطة فقط (غير المكتملة والملغاة)
  const activeOrders = useMemo(() => {
    return orders.filter(
      (order) => order.status !== "COMPLETED" && order.status !== "CANCELLED"
    );
  }, [orders]);

  // تحديد الطلبات المعروضة (حد أقصى 100)
  const displayedOrders = useMemo(() => {
    return activeOrders.slice(0, ordersPerPage);
  }, [activeOrders]);

  // دالة جلب المزيد من الطلبات
  const loadMoreOrders = useCallback(() => {
    if (!isLoadingMore && hasMoreOrders) {
      fetchOrders(currentPage + 1, true);
    }
  }, [currentPage, hasMoreOrders, isLoadingMore]);

  // useEffect للـ Intersection Observer (Infinite Scroll)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreOrders && !isLoadingMore) {
          loadMoreOrders();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreOrders, isLoadingMore, loadMoreOrders]);

  useEffect(() => {
    const loadData = async () => {
      // First fetch currency to ensure it's available
      await fetchRestaurantCurrency();
      // Then fetch orders and other data
      await fetchOrders(1, false); // جلب الصفحة الأولى
      await fetchAvailableTables();
      await fetchStatistics();
    };
    loadData();
  }, [statisticsPeriod]);

  // Load menu categories when quick order modal opens
  useEffect(() => {
    if (showQuickOrderModal && user?.restaurant?.id) {
      const loadQuickOrderMenu = async () => {
        try {
          setQuickOrderLoadingCategories(true);
          const response = await publicApi.get(
            endpoints.public.menuCategories(user.restaurant!.id)
          );
          if (response.data.success) {
            const categories = response.data.data.categories.map(
              (cat: any) => ({
                ...cat,
                items: [], // Items will be loaded when category is selected
              })
            );
            setQuickOrderCategories(categories);
          }
        } catch (error) {
          console.error("Error loading menu categories:", error);
          showToast(
            isRTL ? "فشل في تحميل القائمة" : "Failed to load menu",
            "error"
          );
        } finally {
          setQuickOrderLoadingCategories(false);
        }
      };
      loadQuickOrderMenu();
    }
  }, [showQuickOrderModal, user?.restaurant?.id, isRTL]);

  // Load category items when category is selected
  useEffect(() => {
    if (
      quickOrderSelectedCategory &&
      user?.restaurant?.id &&
      (!quickOrderSelectedCategory.items ||
        quickOrderSelectedCategory.items.length === 0)
    ) {
      const loadCategoryItems = async () => {
        try {
          setQuickOrderLoadingItems(true);
          const response = await publicApi.get(
            endpoints.public.categoryItems(
              user.restaurant!.id,
              quickOrderSelectedCategory.id
            )
          );
          if (response.data.success) {
            const { items } = response.data.data;
            setQuickOrderSelectedCategory((prev: any) => ({
              ...prev,
              items: items,
            }));
            // Update categories list
            setQuickOrderCategories((prev) =>
              prev.map((cat) =>
                cat.id === quickOrderSelectedCategory.id
                  ? { ...cat, items: items }
                  : cat
              )
            );
          }
        } catch (error) {
          console.error("Error loading category items:", error);
        } finally {
          setQuickOrderLoadingItems(false);
        }
      };
      loadCategoryItems();
    }
  }, [quickOrderSelectedCategory, user?.restaurant?.id]);

  // Listen for QR codes updates from MenuContext
  useEffect(() => {
    const handleQRCodesUpdate = () => {
      fetchAvailableTables();
    };

    // Listen for custom event when QR codes are updated
    window.addEventListener("qrCodesUpdated", handleQRCodesUpdate);

    return () => {
      window.removeEventListener("qrCodesUpdated", handleQRCodesUpdate);
    };
  }, []);

  // Fetch restaurant currency and name
  const fetchRestaurantCurrency = async () => {
    try {
      const response = await api.get("/restaurant/profile");
      if (response.data.success) {
        const data = response.data.data;
        if (data.currency) {
          setRestaurantCurrency(data.currency);
        }
        if (data.name) {
          setRestaurantName(data.name);
        }
        if (data.nameAr) {
          setRestaurantNameAr(data.nameAr);
        }
        return data.currency || null;
      }
    } catch (error) {
      console.error("Error fetching restaurant currency:", error);
      // Fallback: try to get from menu endpoint
      try {
        const menuResponse = await api.get("/menu");
        if (menuResponse.data.success) {
          const data = menuResponse.data.data;
          if (data.currency) {
            setRestaurantCurrency(data.currency);
          }
          if (data.restaurant?.name) {
            setRestaurantName(data.restaurant.name);
          }
          if (data.restaurant?.nameAr) {
            setRestaurantNameAr(data.restaurant.nameAr);
          }
          return data.currency || null;
        }
      } catch (menuError) {
        console.error("Error fetching currency from menu:", menuError);
      }
    }
    return null;
  };

  // Helper function to get the correct currency for display
  const getDisplayCurrency = (orderCurrency?: string): string => {
    // Always prefer restaurant currency if available (even if USD)
    if (restaurantCurrency) {
      return restaurantCurrency;
    }
    // Fallback to order currency
    if (orderCurrency) {
      return orderCurrency;
    }
    // Final fallback to USD
    return "USD";
  };

  // Helper function to get display table number (translate QUICK to localized text)
  const getDisplayTableNumber = (tableNumber?: string | null): string => {
    if (!tableNumber) return "";
    if (tableNumber === "QUICK") {
      return isRTL ? "طلب سريع" : "Quick Order";
    }
    return tableNumber;
  };

  // Fetch order statistics
  const fetchStatistics = async () => {
    try {
      setStatistics((prev) => ({ ...prev, loading: true }));
      const response = await api.get(
        `/order/stats/overview?period=${statisticsPeriod}`
      );
      if (response.data.success) {
        setStatistics({
          revenue: Number(response.data.data.revenue) || 0,
          totalOrders: response.data.data.totalOrders || 0,
          averageOrderValue: Number(response.data.data.averageOrderValue) || 0,
          orderStats: response.data.data.orderStats || {},
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setStatistics((prev) => ({ ...prev, loading: false }));
    }
  };

  // Fetch menu items when modal is opened and tab is set to menu
  useEffect(() => {
    if (
      showAddItemModal &&
      addItemTab === "menu" &&
      !menuItemsFetchedRef.current
    ) {
      fetchMenuItems();
      menuItemsFetchedRef.current = true;
    }
  }, [showAddItemModal, addItemTab]);

  // Apply visual effects to recent orders every time orders are loaded
  useEffect(() => {
    if (orders.length > 0) {
      console.log("🎯 Applying visual effects to recent orders...");
      const now = new Date();
      const recentOrders: string[] = [];
      const recentItemIds: string[] = [];
      const recentModifiedOrders: string[] = [];

      orders.forEach((order) => {
        const orderTime = new Date(order.createdAt);
        const timeDiff = now.getTime() - orderTime.getTime();
        const isRecentOrder = timeDiff < 30000; // 30 seconds

        if (isRecentOrder) {
          recentOrders.push(order.id);

          // Add item IDs for visual effect
          order.items.forEach((item: any) => {
            recentItemIds.push(item.id);
          });
        }

        // Check for recently updated orders (if updatedAt exists)
        if (order.updatedAt) {
          const updatedTime = new Date(order.updatedAt);
          const updateTimeDiff = now.getTime() - updatedTime.getTime();
          const isRecentlyUpdated =
            updateTimeDiff < 30000 && updateTimeDiff > 5000; // 30 seconds but not just created

          if (isRecentlyUpdated) {
            recentModifiedOrders.push(order.id);
          }
        }
      });

      // Apply visual effects to recent orders
      if (recentOrders.length > 0) {
        console.log(
          "🎯 Applying visual effects to recent orders:",
          recentOrders
        );
        setNewOrderIds(
          (prev) => new Set([...Array.from(prev), ...recentOrders])
        );
        setNewItemIds(
          (prev) => new Set([...Array.from(prev), ...recentItemIds])
        );
      }

      // Apply visual effects to recently modified orders
      if (recentModifiedOrders.length > 0) {
        console.log(
          "🎯 Applying visual effects to modified orders:",
          recentModifiedOrders
        );
        setModifiedOrderIds(
          (prev) => new Set([...Array.from(prev), ...recentModifiedOrders])
        );
      }
    }
  }, [orders]);

  // Clear notifications count when entering orders page
  useEffect(() => {
    clearNewOrdersCount();
    clearUpdatedOrdersCount();
  }, [clearNewOrdersCount, clearUpdatedOrdersCount]);

  // Auto-clear visual effects after 30 seconds (disabled to prevent automatic clearing)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setNewOrderIds(new Set());
  //     setModifiedOrderIds(new Set());
  //     setNewItemIds(new Set());
  //     setModifiedItemIds(new Set());
  //   }, 30000); // 30 seconds

  //   return () => clearTimeout(timer);
  // }, []);

  // Listen for real-time order updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data: any) => {
      console.log("New order received:", data);
      const newOrder = data.order;

      // Mark all items in the new order as new
      const newItemIds = newOrder.items.map((item: any) => item.id);
      console.log("🎯 Adding new order items to tracking:", newItemIds);
      setNewItemIds((prev) => new Set([...Array.from(prev), ...newItemIds]));

      // Add to orders list, avoiding duplicates
      setOrders((prevOrders) => {
        // Check if order already exists to avoid duplicates
        const existingOrder = prevOrders.find(
          (order) => order.id === newOrder.id
        );
        if (existingOrder) {
          return prevOrders;
        }
        // إضافة في البداية إذا كان نشطاً (غير مكتمل وغير ملغي)
        if (
          newOrder.status !== "COMPLETED" &&
          newOrder.status !== "CANCELLED"
        ) {
          return [newOrder, ...prevOrders];
        }
        return prevOrders;
      });

      // Mark as new order for highlighting
      setNewOrderIds((prev) => new Set(Array.from(prev).concat(newOrder.id)));
      console.log("🎯 Added new order to visual effects:", newOrder.id);
    };

    const handleOrderUpdate = (data: any) => {
      console.log("🎯 Order update received:", data);
      const updatedOrder = data.order;
      const updatedBy = data.updatedBy;
      console.log("🎯 Updated order details:", {
        id: updatedOrder.id,
        itemsCount: updatedOrder.items?.length,
        items: updatedOrder.items?.map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        updatedBy: updatedBy,
      });

      // If order is cancelled, remove it from the list
      if (updatedOrder.status === "CANCELLED") {
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order.id !== updatedOrder.id)
        );
        return;
      }

      // Don't apply visual effects if updated by restaurant or kitchen (status changes)
      // Only show visual effects for customer updates (new order or adding items)
      // Also don't show effects if order status is READY (completed by kitchen)
      if (updatedBy !== "customer" || updatedOrder.status === "READY") {
        console.log(
          "🎯 Order updated by",
          updatedBy,
          "with status",
          updatedOrder.status,
          "- no visual effects (status change only)"
        );
        // Still update the order data but without visual effects
        setOrders((prevOrders) => {
          const updatedOrders = prevOrders.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          );

          // Update selectedOrder if it's the same order being updated
          setSelectedOrder((currentSelected) => {
            if (currentSelected && currentSelected.id === updatedOrder.id) {
              return updatedOrder;
            }
            return currentSelected;
          });

          return updatedOrders;
        });
        return;
      }

      // Find the previous order to compare items
      setOrders((prevOrders) => {
        const prevOrder = prevOrders.find(
          (order) => order.id === updatedOrder.id
        );

        if (prevOrder) {
          console.log("🎯 Comparing orders:", {
            prevOrderItems: prevOrder.items.map((item) => ({
              id: item.id,
              quantity: item.quantity,
            })),
            updatedOrderItems: updatedOrder.items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
            })),
          });

          // Check for new items (items that weren't in the previous order)
          const prevItemIds = new Set(prevOrder.items.map((item) => item.id));

          const newItems = updatedOrder.items.filter(
            (item: any) => !prevItemIds.has(item.id)
          );
          const newItemIds = newItems.map((item: any) => item.id);

          // Check for modified items (items with different quantity or price)
          const modifiedItems = updatedOrder.items.filter((newItem: any) => {
            const oldItem = prevOrder.items.find(
              (item) => item.id === newItem.id
            );
            return (
              oldItem &&
              (oldItem.quantity !== newItem.quantity ||
                oldItem.price !== newItem.price ||
                oldItem.notes !== newItem.notes)
            );
          });
          const modifiedItemIds = modifiedItems.map((item: any) => item.id);

          // Update item tracking immediately (only if updated by customer)
          // Don't track items for restaurant/kitchen status changes
          if (updatedBy === "customer") {
            if (newItemIds.length > 0) {
              console.log("🎯 Adding new items to tracking:", newItemIds);
              setNewItemIds(
                (prev) => new Set([...Array.from(prev), ...newItemIds])
              );
            }
            if (modifiedItemIds.length > 0) {
              console.log(
                "🎯 Adding modified items to tracking:",
                modifiedItemIds
              );
              setModifiedItemIds(
                (prev) => new Set([...Array.from(prev), ...modifiedItemIds])
              );
            }
          }
        }

        const updatedOrders = prevOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        );

        // Update selectedOrder if it's the same order being updated
        setSelectedOrder((currentSelected) => {
          if (currentSelected && currentSelected.id === updatedOrder.id) {
            return updatedOrder;
          }
          return currentSelected;
        });

        return updatedOrders;
      });

      // Mark as modified order for highlighting (only if updated by customer)
      // Don't highlight orders when status is changed by restaurant/kitchen
      if (updatedBy === "customer") {
        setTimeout(() => {
          setModifiedOrderIds(
            (prev) => new Set(Array.from(prev).concat(updatedOrder.id))
          );
        }, 100); // Small delay to ensure state updates are processed
      }
    };

    // Listen for socket events
    socket.on("new_order", handleNewOrder);
    socket.on("order_updated", handleOrderUpdate);
    socket.on("order_status_update", handleOrderUpdate);

    return () => {
      socket.off("new_order", handleNewOrder);
      socket.off("order_updated", handleOrderUpdate);
      socket.off("order_status_update", handleOrderUpdate);
    };
  }, [socket]);

  const fetchOrders = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await api.get(`/order`, {
        params: {
          page,
          limit: ordersPerPage,
        },
      });

      if (response.data.success) {
        const fetchedOrders = response.data.data.orders.filter(
          (order: Order) => order.status !== "CANCELLED"
        );

        if (append) {
          // إضافة الطلبات الجديدة للقائمة الموجودة
          setOrders((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((o) => o.id));
            const newOrders = fetchedOrders.filter(
              (o: Order) => !existingIds.has(o.id)
            );
            return [...prev, ...newOrders];
          });
        } else {
          setOrders(fetchedOrders);
        }

        // تحديث pagination info
        if (response.data.data.pagination) {
          const {
            total,
            pages,
            page: currentPageNum,
          } = response.data.data.pagination;
          setTotalActiveOrders(total);
          setHasMoreOrders(currentPageNum < pages);
          setCurrentPage(currentPageNum);
        } else {
          // إذا لم يكن هناك pagination، تحقق من عدد الطلبات
          setHasMoreOrders(fetchedOrders.length === ordersPerPage);
        }

        // Try to get currency from response if available
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        } else if (fetchedOrders.length > 0) {
          // Try to find a non-USD currency from orders
          const orderWithCurrency = fetchedOrders.find(
            (order: Order) => order.currency && order.currency !== "USD"
          );
          if (orderWithCurrency && orderWithCurrency.currency) {
            setRestaurantCurrency(orderWithCurrency.currency);
          } else if (fetchedOrders[0].currency) {
            // Use currency from first order even if USD
            setRestaurantCurrency(fetchedOrders[0].currency);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchAvailableTables = async () => {
    try {
      const response = await api.get("/qr");
      if (response.data.success) {
        const qrCodesData = response.data.data.qrCodes.filter(
          (qr: any) => qr.tableNumber && qr.tableNumber !== "ROOT"
        );
        
        const tableNumbers = qrCodesData
          .map((qr: any) => qr.tableNumber)
          .sort((a: string, b: string) => parseInt(a) - parseInt(b));
        setAvailableTables(tableNumbers);
        
        // Store QR codes with their IDs and occupied status
        const qrCodesMap: Record<string, { id: string; isOccupied: boolean }> =
          {};
        qrCodesData.forEach((qr: any) => {
          qrCodesMap[qr.tableNumber] = {
            id: qr.id,
            isOccupied: (qr as any).isOccupied || false,
          };
        });
        setQrCodes(qrCodesMap);
      }
    } catch (error) {
      console.error("Error fetching available tables:", error);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await api.get("/menu");
      if (response.data.success && response.data.data.menu) {
        setMenuCategories(response.data.data.menu.categories || []);
        // Extract currency from response
        if (response.data.data.currency) {
          setRestaurantCurrency(response.data.data.currency);
        }
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleOrderClick = (
    order: Order,
    isDeliveryCard: boolean = false,
    isQuickOrderCard: boolean = false
  ) => {
    // Only open modal for table view, not list view
    if (viewMode === "table" || viewMode === "tables") {
      // If this is a delivery card click, get all active delivery orders
      if (isDeliveryCard) {
        const activeDeliveryOrders = orders.filter(
          (o) =>
            o.orderType === "DELIVERY" &&
            o.status !== "COMPLETED" &&
            o.status !== "CANCELLED"
        );

        if (activeDeliveryOrders.length > 0) {
          setDeliveryOrders(activeDeliveryOrders);
          setSelectedDeliveryOrderIndex(0);
          setQuickOrders([]); // Clear quick orders
          setSelectedQuickOrderIndex(0);
          setSelectedOrder(activeDeliveryOrders[0]);
          setShowOrderModal(true);
        }
      } else if (isQuickOrderCard) {
        // If this is a quick order card click, get all active quick orders
        const activeQuickOrders = orders.filter(
          (o) =>
            o.orderType === "DINE_IN" &&
            o.tableNumber === "QUICK" &&
            o.status !== "COMPLETED" &&
            o.status !== "CANCELLED"
        );

        if (activeQuickOrders.length > 0) {
          setQuickOrders(activeQuickOrders);
          setSelectedQuickOrderIndex(0);
          setDeliveryOrders([]); // Clear delivery orders
          setSelectedDeliveryOrderIndex(0);
          setSelectedOrder(activeQuickOrders[0]);
          setShowOrderModal(true);
        }
      } else {
        // Regular order click
        const currentOrder = orders.find((o) => o.id === order.id) || order;
        setDeliveryOrders([]); // Clear delivery orders for non-delivery orders
        setSelectedDeliveryOrderIndex(0);
        setQuickOrders([]); // Clear quick orders
        setSelectedQuickOrderIndex(0);
        setSelectedOrder(currentOrder);
        setShowOrderModal(true);
      }
    }

    // Remove order-level highlights when order is clicked (but keep item-level highlights)
    setNewOrderIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(order.id);
      return newSet;
    });

    setModifiedOrderIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(order.id);
      return newSet;
    });

    // Don't remove item highlights here - they will be removed when modal is closed
  };

  const closeOrderModal = () => {
    // Remove item highlights when modal is closed
    if (selectedOrder) {
      const orderItemIds = selectedOrder.items.map((item) => item.id);
      setNewItemIds((prev) => {
        const newSet = new Set(prev);
        orderItemIds.forEach((id) => newSet.delete(id));
        return newSet;
      });

      setModifiedItemIds((prev) => {
        const newSet = new Set(prev);
        orderItemIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }

    setShowOrderModal(false);
    setSelectedOrder(null);
    setDeliveryOrders([]);
    setSelectedDeliveryOrderIndex(0);
    setQuickOrders([]);
    setSelectedQuickOrderIndex(0);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/order/${orderId}/status`, { status: newStatus });

      // Update orders without adding to modifiedOrderIds (restaurant self-update)
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Update deliveryOrders if applicable
      if (deliveryOrders.length > 0) {
        setDeliveryOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }

      // Update quickOrders if applicable
      if (quickOrders.length > 0) {
        setQuickOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }

      // Update selectedOrder if it's the same order
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }

      // Don't add to modifiedOrderIds since this is a restaurant self-update
      console.log("🎯 Order status updated by restaurant - no visual effects");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Function to get item name (custom or from menu)
  const getItemName = (item: any): string => {
    if (item.isCustomItem) {
      return isRTL && item.customItemNameAr
        ? item.customItemNameAr
        : item.customItemName || "Custom Item";
    }
    return isRTL && item.menuItem?.nameAr
      ? item.menuItem.nameAr
      : item.menuItem?.name || "Item";
  };

  // Function to get item category name
  const getItemCategory = (item: any): string | null => {
    if (item.isCustomItem) {
      return isRTL ? "خدمة إضافية" : "Additional Service";
    }
    if (item.menuItem?.category) {
      return isRTL && item.menuItem.category.nameAr
        ? item.menuItem.category.nameAr
        : item.menuItem.category.name;
    }
    return null;
  };

  // Function to get extras names
  const getExtrasNames = (extras: any, originalMenuItem?: any): string[] => {
    if (!extras || typeof extras !== "object") return [];

    const extrasNames: string[] = [];
    Object.values(extras).forEach((extraGroup: any) => {
      if (Array.isArray(extraGroup)) {
        // This is an array of selected extra IDs
        extraGroup.forEach((extraId: string) => {
          // Find the extra name from the original menu item data
          if (originalMenuItem?.extras) {
            Object.values(originalMenuItem.extras).forEach(
              (originalExtraGroup: any) => {
                if (originalExtraGroup.options) {
                  const option = originalExtraGroup.options.find(
                    (opt: any) => opt.id === extraId
                  );
                  if (option) {
                    const extraName = isRTL
                      ? option.nameAr || option.name
                      : option.name;
                    extrasNames.push(extraName);
                  }
                }
              }
            );
          } else {
            // Fallback to showing ID if no original data
            extrasNames.push(`Extra: ${extraId}`);
          }
        });
      }
    });
    return extrasNames;
  };

  // Function to translate order status
  const getStatusLabel = (status: string): string => {
    const statusTranslations: Record<string, { en: string; ar: string }> = {
      PENDING: { en: "Pending", ar: "قيد الانتظار" },
      PREPARING: { en: "Preparing", ar: "قيد التحضير" },
      READY: { en: "Ready", ar: "جاهز" },
      DELIVERED: { en: "On the way", ar: "في الطريق" },
      COMPLETED: { en: "Completed", ar: "مكتمل" },
      CANCELLED: { en: "Cancelled", ar: "ملغي" },
    };
    return isRTL
      ? statusTranslations[status]?.ar || status
      : statusTranslations[status]?.en || status;
  };

  const handleSendToKitchen = async (orderId: string) => {
    try {
      const lang = isRTL ? "ar" : "en";
      const response = await api.get(
        `/order/${orderId}/whatsapp-url?lang=${lang}`
      );

      if (response.data.success) {
        const { whatsappURL, warning, usingFallback } = response.data.data;

        // Show warning if using group link fallback
        if (warning) {
          showToast(warning, "info");
        }

        // Open WhatsApp in new window
        window.open(whatsappURL, "_blank");

        const successMessage = usingFallback
          ? isRTL
            ? "جاري فتح واتساب مع رقم الهاتف..."
            : "Opening WhatsApp with phone number..."
          : isRTL
            ? "جاري فتح واتساب..."
            : "Opening WhatsApp...";

        showToast(successMessage, "success");
      }
    } catch (error: any) {
      console.error("Send to kitchen error:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "خطأ في إرسال الطلب إلى المطبخ"
            : "Error sending order to kitchen"),
        "error"
      );
    }
  };

  const handleAddItemToOrder = async () => {
    if (!selectedOrder) {
      showToast(
        isRTL ? "الرجاء اختيار طلب" : "Please select an order",
        "error"
      );
      return;
    }

    try {
      let response;

      if (addItemTab === "menu") {
        // Add item from menu
        if (!selectedMenuItem) {
          showToast(
            isRTL ? "الرجاء اختيار منتج" : "Please select a menu item",
            "error"
          );
          return;
        }

        response = await api.put(`/order/${selectedOrder.id}/add-items`, {
          items: [
            {
              menuItemId: selectedMenuItem,
              quantity: newItemQuantity,
              notes: newItemNotes || undefined,
            },
          ],
        });
      } else {
        // Add custom service/item
        if (!newItemName || !newItemPrice) {
          showToast(
            isRTL
              ? "الرجاء ملء جميع الحقول المطلوبة"
              : "Please fill all required fields",
            "error"
          );
          return;
        }

        response = await api.post(`/order/${selectedOrder.id}/add-item`, {
          name: newItemName,
          quantity: newItemQuantity,
          price: parseFloat(newItemPrice),
          notes: newItemNotes || undefined,
        });
      }

      if (response.data.success) {
        // Update the order in state
        const updatedOrder = response.data.data.order;
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === selectedOrder.id ? updatedOrder : order
          )
        );
        setSelectedOrder(updatedOrder);

        // Update deliveryOrders if applicable
        if (deliveryOrders.length > 0) {
          setDeliveryOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === selectedOrder.id ? updatedOrder : order
            )
          );
        }

        // Update quickOrders if applicable
        if (quickOrders.length > 0) {
          setQuickOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === selectedOrder.id ? updatedOrder : order
            )
          );
        }

        // Reset form
        setAddItemTab("custom");
        setNewItemName("");
        setNewItemQuantity(1);
        setNewItemPrice("");
        setNewItemNotes("");
        setSelectedCategory("");
        setSelectedMenuItem("");
        setShowAddItemModal(false);

        showToast(
          isRTL ? "تمت الإضافة بنجاح" : "Item added successfully",
          "success"
        );
      }
    } catch (error: any) {
      console.error("Error adding item to order:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء الإضافة" : "Error adding item"),
        "error"
      );
    }
  };

  // Function to print invoice directly (thermal printer compatible)
  const handlePrintInvoice = (order: Order) => {
    // Use restaurant currency or fallback to order currency
    const currency = restaurantCurrency || order.currency || "USD";

    // Remove any existing print container
    const existingContainer = document.getElementById(
      "print-invoice-container"
    );
    if (existingContainer) {
      existingContainer.remove();
    }
    const existingStyles = document.getElementById("print-invoice-styles");
    if (existingStyles) {
      existingStyles.remove();
            }

    // Create print container
    const printContainer = document.createElement("div");
    printContainer.id = "print-invoice-container";
    const displayRestaurantName =
      isRTL && restaurantNameAr ? restaurantNameAr : restaurantName || "";
    printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
        ${displayRestaurantName ? `<div style="font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #000;">${displayRestaurantName}</div>` : ""}
        <h1 style="font-size: 18px; margin: 0; font-weight: bold; color: #000;">${isRTL ? "فاتورة" : "INVOICE"}</h1>
        <p style="font-size: 11px; margin: 4px 0 0 0; color: #000;">#${order.id.slice(-8)}</p>
          </div>
          
      <div style="margin-bottom: 8px; font-size: 10px; color: #000;">
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "رقم الطلب:" : "Order:"}</strong> #${order.id.slice(-8)}</div>
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "النوع:" : "Type:"}</strong> ${
                order.orderType === "DINE_IN"
                  ? isRTL
                    ? "داخل المطعم"
                    : "Dine-in"
                  : isRTL
                    ? "توصيل"
                    : "Delivery"
        }</div>
        ${order.tableNumber ? `<div style="margin-bottom: 4px;"><strong>${isRTL ? "طاولة:" : "Table:"}</strong> ${getDisplayTableNumber(order.tableNumber)}</div>` : ""}
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "التاريخ:" : "Date:"}</strong> ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
            
            ${
              order.customerName || order.customerPhone || order.customerAddress
          ? `<div style="margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #000;">
        ${order.customerName ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "الاسم:" : "Name:"}</strong> ${order.customerName}</div>` : ""}
        ${order.customerPhone ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "الهاتف:" : "Phone:"}</strong> ${order.customerPhone}</div>` : ""}
        ${order.customerAddress ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "العنوان:" : "Address:"}</strong> ${order.customerAddress}</div>` : ""}
            </div>`
                : ""
            }
      
      <div style="margin: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
              ${order.items
                .map(
                  (item) => `
          <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #ccc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-weight: bold; flex: 1; color: #000;">${getItemName(item)}</span>
              <span style="white-space: nowrap; margin-left: 4px; color: #000;">${item.quantity}x</span>
            </div>
            ${item.notes ? `<div style="font-size: 9px; color: #000; margin-top: 2px;">${isRTL ? "ملاحظات:" : "Note:"} ${item.notes}</div>` : ""}
                    ${
                      item.extras &&
                      getExtrasNames(item.extras, item.menuItem).length > 0
                ? `<div style="font-size: 9px; color: #000; margin-top: 2px;">${getExtrasNames(item.extras, item.menuItem).join(", ")}</div>`
                        : ""
                    }
            <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 10px; color: #000;">
              <span>${formatCurrencyWithLanguage(Number(item.price), currency, language)}</span>
              <span style="font-weight: bold;">${formatCurrencyWithLanguage(Number(item.price) * item.quantity, currency, language)}</span>
            </div>
          </div>
              `
                )
                .join("")}
      </div>
      
      <div style="margin-top: 8px; font-size: 11px; color: #000;">
              ${
                order.subtotal !== undefined
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>${isRTL ? "المجموع الفرعي:" : "Subtotal:"}</span>
          <span>${formatCurrencyWithLanguage(Number(order.subtotal), currency, language)}</span>
        </div>`
                  : ""
              }
              ${
                order.taxes && order.taxes.length > 0
            ? order.taxes
                    .map(
                      (tax: any) => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;">
                      <span>${isRTL ? tax.nameAr || tax.name : tax.name} (${tax.percentage}%)</span>
                      <span>${formatCurrencyWithLanguage(tax.amount, currency, language)}</span>
                    </div>
                  `
                    )
                .join("")
                  : ""
              }
        <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 2px solid #000; font-size: 14px; font-weight: bold;">
          <span>${isRTL ? "المجموع الكلي:" : "TOTAL:"}</span>
          <span>${formatCurrencyWithLanguage(Number(order.totalPrice), currency, language)}</span>
        </div>
      </div>
          
          ${
            order.notes
          ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #000;">
        <div style="font-weight: bold; margin-bottom: 4px;">${isRTL ? "ملاحظات:" : "Notes:"}</div>
        <div>${order.notes}</div>
            </div>`
              : ""
          }
          
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; text-align: center; font-size: 10px; color: #000;">
        <div style="margin-bottom: 4px;">${isRTL ? "شكراً لزيارتك!" : "Thank you!"}</div>
        <div style="font-size: 9px; color: #000;">${new Date().toLocaleString()}</div>
          </div>
    `;

    // Add styles for print container (thermal printer: 80mm width)
    printContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      background: white;
      color: black;
      font-family: 'Courier New', 'Courier', monospace;
      padding: 5mm;
      font-size: 12px;
      line-height: 1.4;
      direction: ${isRTL ? "rtl" : "ltr"};
      box-sizing: border-box;
      overflow: hidden;
    `;

    document.body.appendChild(printContainer);

    // Add print styles for thermal printer (80mm width)
    const printStyles = document.createElement("style");
    printStyles.id = "print-invoice-styles";
    printStyles.textContent = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
          padding: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          width: 80mm;
          margin: 0;
          padding: 0;
        }
        body * {
          visibility: hidden !important;
        }
        #print-invoice-container,
        #print-invoice-container * {
          visibility: visible !important;
          color: #000 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-invoice-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          max-width: 80mm !important;
          min-width: 80mm !important;
          margin: 0 !important;
          padding: 5mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          page-break-after: auto !important;
          page-break-inside: avoid !important;
        }
        #print-invoice-container * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        /* Hide all other elements */
        body > *:not(#print-invoice-container) {
          display: none !important;
        }
      }
      /* Screen styles - keep hidden */
      #print-invoice-container {
        position: absolute;
        left: -9999px;
        top: 0;
      }
    `;
    document.head.appendChild(printStyles);

    // Trigger print after a short delay
    setTimeout(() => {
      window.print();
      // Clean up after printing
      setTimeout(() => {
        if (document.getElementById("print-invoice-container")) {
          document.body.removeChild(printContainer);
        }
        if (document.getElementById("print-invoice-styles")) {
          document.head.removeChild(printStyles);
        }
      }, 500);
    }, 200);
  };

  const getStatusOptions = (
    currentStatus: string,
    orderType: string,
    showAll: boolean = false
  ) => {
    if (showAll) {
      // For modal, show all statuses including current one, but exclude CANCELLED
      // CANCELLED will be handled by a separate cancel button
      const allStatuses =
        orderType === "DELIVERY"
          ? ["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"]
          : ["PENDING", "PREPARING", "READY", "COMPLETED"];

      return allStatuses.map((status) => ({
        value: status,
        label:
          status === currentStatus
            ? `${getStatusLabel(status)} ${isRTL ? "(الحالية)" : "(Current)"}`
            : getStatusLabel(status),
      }));
    }

    const dineInFlow = {
      PENDING: ["PREPARING"],
      PREPARING: ["READY"],
      READY: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const deliveryFlow = {
      PENDING: ["PREPARING"],
      PREPARING: ["READY"],
      READY: ["DELIVERED"],
      DELIVERED: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    const nextStatuses =
      orderType === "DELIVERY"
        ? deliveryFlow[currentStatus as keyof typeof deliveryFlow] || []
        : dineInFlow[currentStatus as keyof typeof dineInFlow] || [];

    return nextStatuses.map((status) => ({
      value: status,
      label: getStatusLabel(status),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-5">
      <div className="max-w-7xl md:py-10 mx-auto py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {isRTL ? "إدارة الطلبات" : "Order Management"}
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "عرض وإدارة طلبات العملاء"
                  : "View and manage customer orders"}
              </p>
              {/* Socket Connection Status */}
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isConnected
                      ? isRTL
                        ? "التحديثات المباشرة مفعلة"
                        : "Live updates enabled"
                      : isRTL
                        ? "جاري الاتصال..."
                        : "Connecting..."}
                  </span>
                </div>

                {/* Sound Toggle Button */}
                <button
                  onClick={toggleSound}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                    isSoundMuted
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                  }`}
                  title={
                    isSoundMuted
                      ? isRTL
                        ? "تفعيل الصوت"
                        : "Unmute notifications"
                      : isRTL
                        ? "كتم الصوت"
                        : "Mute notifications"
                  }
                >
                  {isSoundMuted ? (
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
                        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                      />
                    </svg>
                  ) : (
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
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                  )}
                  <span className="text-xs font-medium">
                    {isSoundMuted
                      ? isRTL
                        ? "صامت"
                        : "Muted"
                      : isRTL
                        ? "مفعل"
                        : "Active"}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "list"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isRTL ? "قائمة" : "List"}
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "table"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isRTL ? "جدول" : "Table"}
                </button>
                <button
                  onClick={() => setViewMode("tables")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "tables"
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {isRTL ? "طاولات" : "Tables"}
                </button>
              </div>
            </div>
          </div>

          {/* Orders Display */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {displayedOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`p-4 transition-all duration-500 cursor-pointer hover:shadow-md ${
                    newOrderIds.has(order.id)
                      ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg animate-pulse"
                      : modifiedOrderIds.has(order.id)
                        ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg animate-pulse"
                        : ""
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {isRTL ? "طلب #" : "Order #"}
                            {order.id.slice(-8)}
                          </h3>
                          {newOrderIds.has(order.id) && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                              {isRTL ? "جديد" : "NEW"}
                            </span>
                          )}
                          {modifiedOrderIds.has(order.id) &&
                            !newOrderIds.has(order.id) && (
                              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                                {isRTL ? "معدل" : "MODIFIED"}
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.customerName && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {isRTL ? "العميل: " : "Customer: "}
                            {order.customerName}
                          </p>
                        )}
                        {order.customerPhone && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {isRTL ? "الهاتف: " : "Phone: "}
                            {order.customerPhone}
                          </p>
                        )}
                        {order.customerAddress && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {isRTL ? "العنوان: " : "Address: "}
                            {order.customerAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          statusColors[
                            order.status as keyof typeof statusColors
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {formatCurrencyWithLanguage(
                          Number(order.totalPrice),
                          restaurantCurrency || order.currency || "USD",
                          language
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Table Number Badge */}
                  {order.tableNumber && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <svg
                          className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {getDisplayTableNumber(order.tableNumber)}
                      </span>
                    </div>
                  )}

                  {/* Order Items Table */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL ? "العناصر (" : "Items ("}
                      {order.items.length}
                      {isRTL ? ")" : ")"}:
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-1 px-1 font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "العنصر" : "Item"}
                            </th>
                            <th className="text-center py-1 px-1 font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "الكمية" : "Qty"}
                            </th>
                            <th className="text-left py-1 px-1 font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "ملاحظات" : "Notes"}
                            </th>
                            <th className="text-right py-1 px-1 font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "السعر" : "Price"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => {
                            const isNewItem = newItemIds.has(item.id);
                            const isModifiedItem = modifiedItemIds.has(item.id);
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${
                                  isNewItem
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                                    : isModifiedItem
                                      ? "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500"
                                      : ""
                                }`}
                              >
                                <td className="py-1 px-1 text-gray-900 dark:text-white">
                                  <div className="flex items-center space-x-2">
                                    <div>
                                      {getItemCategory(item) && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                          {getItemCategory(item)}
                                        </p>
                                      )}
                                      <p>{getItemName(item)}</p>
                                    </div>
                                    {isNewItem && (
                                      <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full font-medium animate-pulse">
                                        {isRTL ? "جديد" : "NEW"}
                                      </span>
                                    )}
                                    {isModifiedItem && !isNewItem && (
                                      <span className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-medium animate-pulse">
                                        {isRTL ? "معدل" : "MODIFIED"}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-center text-gray-600 dark:text-gray-400">
                                  {item.quantity}
                                  {isRTL ? "×" : "x"}
                                </td>
                                <td className="py-1 px-1 text-gray-600 dark:text-gray-400">
                                  <div>
                                    {item.notes && <div>{item.notes}</div>}
                                    {item.extras &&
                                      getExtrasNames(item.extras, item.menuItem)
                                        .length > 0 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          {getExtrasNames(
                                            item.extras,
                                            item.menuItem
                                          ).join(", ")}
                                        </div>
                                      )}
                                    {!item.notes &&
                                      (!item.extras ||
                                        getExtrasNames(
                                          item.extras,
                                          item.menuItem
                                        ).length === 0) &&
                                      "-"}
                                  </div>
                                </td>
                                <td className="py-1 px-1 text-right font-medium text-gray-900 dark:text-white">
                                  {formatCurrencyWithLanguage(
                                    Number(item.price) * item.quantity,
                                    restaurantCurrency ||
                                      order.currency ||
                                      "USD",
                                    language
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* General Order Notes */}
                  {order.notes && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? "ملاحظات عامة:" : "General Notes:"}
                      </h4>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                        <p className="text-xs text-gray-800 dark:text-gray-200">
                          {order.notes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? "المجموع: " : "Total: "}
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        {isRTL ? "عنصر" : "items"}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrencyWithLanguage(
                          Number(order.totalPrice),
                          restaurantCurrency || order.currency || "USD",
                          language
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-wrap gap-2">
                    {order.status !== "COMPLETED" &&
                      order.status !== "CANCELLED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowAddItemModal(true);
                          }}
                          className="text-xs px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center gap-1"
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
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          {isRTL ? "إضافة" : "Add Item"}
                        </button>
                      )}
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={
                        order.status === "CANCELLED" ||
                        order.status === "COMPLETED"
                      }
                    >
                      {getStatusOptions(
                        order.status,
                        order.orderType,
                        true
                      ).map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {order.status !== "CANCELLED" &&
                      order.status !== "COMPLETED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                isRTL
                                  ? "هل أنت متأكد من إلغاء هذا الطلب؟"
                                  : "Are you sure you want to cancel this order?"
                              )
                            ) {
                              updateOrderStatus(order.id, "CANCELLED");
                            }
                          }}
                          className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-1"
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
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          {isRTL ? "إلغاء" : "Cancel"}
                        </button>
                      )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintInvoice(order);
                      }}
                      className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1"
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
                          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                        />
                      </svg>
                      {isRTL ? "طباعة" : "Print"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToKitchen(order.id);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      {isRTL ? "إرسال إلى المطبخ" : "Send to Kitchen"}
                    </button>
                  </div>
                </Card>
              ))}

              {/* Infinite Scroll Trigger */}
              {hasMoreOrders && (
                <div ref={observerTarget} className="py-4 text-center">
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {isRTL ? "جاري تحميل المزيد..." : "Loading more..."}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={loadMoreOrders}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      {isRTL ? "تحميل المزيد" : "Load More"}
                    </button>
                  )}
                </div>
              )}

              {displayedOrders.length === 0 && !loading && (
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
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {isRTL ? "لا توجد طلبات نشطة" : "No active orders"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "الطلبات النشطة ستظهر هنا"
                      : "Active orders will appear here"}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "الطلب" : "Order"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "النوع" : "Type"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "الحالة" : "Status"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "العناصر" : "Items"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "المجموع" : "Total"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "الوقت" : "Time"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {isRTL ? "الإجراءات" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          newOrderIds.has(order.id)
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : modifiedOrderIds.has(order.id)
                              ? "bg-orange-50 dark:bg-orange-900/20"
                              : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                #{order.id.slice(-8)}
                              </div>
                              {order.tableNumber && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {getDisplayTableNumber(order.tableNumber)}
                                </div>
                              )}
                              {order.customerName && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {isRTL ? "العميل:" : "Customer:"}{" "}
                                  {order.customerName}
                                </div>
                              )}
                              {order.customerPhone && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {isRTL ? "هاتف:" : "Phone:"}{" "}
                                  {order.customerPhone}
                                </div>
                              )}
                              {order.customerAddress && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {isRTL ? "عنوان:" : "Address:"}{" "}
                                  {order.customerAddress}
                                </div>
                              )}
                            </div>
                            {newOrderIds.has(order.id) && (
                              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                                {isRTL ? "جديد" : "NEW"}
                              </span>
                            )}
                            {modifiedOrderIds.has(order.id) &&
                              !newOrderIds.has(order.id) && (
                                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                                  {isRTL ? "معدل" : "MODIFIED"}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {order.orderType === "DINE_IN"
                            ? isRTL
                              ? "داخل المطعم"
                              : "Dine-in"
                            : isRTL
                              ? "توصيل"
                              : "Delivery"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              statusColors[
                                order.status as keyof typeof statusColors
                              ] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}{" "}
                          {isRTL ? "عنصر" : "items"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrencyWithLanguage(
                            Number(order.totalPrice),
                            getDisplayCurrency(order.currency),
                            language
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleOrderClick(order)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {isRTL ? "عرض التفاصيل" : "View Details"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Infinite Scroll Trigger */}
              {hasMoreOrders && (
                <div
                  ref={observerTarget}
                  className="py-4 text-center border-t border-gray-200 dark:border-gray-700"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {isRTL ? "جاري تحميل المزيد..." : "Loading more..."}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {displayedOrders.length === 0 && !loading && (
                <div className="text-center py-12">
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
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {isRTL ? "لا توجد طلبات نشطة" : "No active orders"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "الطلبات النشطة ستظهر هنا"
                      : "Active orders will appear here"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tables Layout View */}
          {viewMode === "tables" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Delivery Orders Table */}
              <div
                className={`relative p-4 border-2 rounded-lg transition-all duration-300 ${(() => {
                  const deliveryOrder = orders.find(
                    (order) =>
                      order.orderType === "DELIVERY" &&
                      order.status !== "COMPLETED" &&
                      order.status !== "CANCELLED"
                  );
                  const isNew =
                    deliveryOrder && newOrderIds.has(deliveryOrder.id);
                  const isModified =
                    deliveryOrder && modifiedOrderIds.has(deliveryOrder.id);

                  if (isNew) {
                    return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg";
                  } else if (isModified) {
                    return "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg";
                  } else if (deliveryOrder) {
                    return "border-red-500 bg-red-50 dark:bg-red-900/20 cursor-pointer hover:shadow-lg";
                  } else {
                    return "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:shadow-lg";
                  }
                })()}`}
                onClick={() => {
                  const deliveryOrder = orders.find(
                    (order) =>
                      order.orderType === "DELIVERY" &&
                      order.status !== "COMPLETED" &&
                      order.status !== "CANCELLED"
                  );
                  if (deliveryOrder) {
                    handleOrderClick(deliveryOrder, true); // true = isDeliveryCard
                  }
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    🚚 {isRTL ? "طلب خارجي" : "Delivery"}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full mx-auto ${(() => {
                      const deliveryOrder = orders.find(
                        (order) =>
                          order.orderType === "DELIVERY" &&
                          order.status !== "COMPLETED" &&
                          order.status !== "CANCELLED"
                      );
                      return deliveryOrder ? "bg-red-500" : "bg-green-500";
                    })()}`}
                  />
                  {(() => {
                    const deliveryOrder = orders.find(
                      (order) =>
                        order.orderType === "DELIVERY" &&
                        order.status !== "COMPLETED" &&
                        order.status !== "CANCELLED"
                    );
                    const isNew =
                      deliveryOrder && newOrderIds.has(deliveryOrder.id);
                    const isModified =
                      deliveryOrder && modifiedOrderIds.has(deliveryOrder.id);

                    if (isNew) {
                      return (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "جديد" : "NEW"}
                        </span>
                      );
                    } else if (isModified) {
                      return (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "معدل" : "MODIFIED"}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Quick Orders Card */}
              <div
                className={`relative p-4 border-2 rounded-lg transition-all duration-300 ${(() => {
                  const quickOrder = orders.find(
                    (order) =>
                      order.orderType === "DINE_IN" &&
                      order.tableNumber === "QUICK" &&
                      order.status !== "COMPLETED" &&
                      order.status !== "CANCELLED"
                  );
                  const isNew = quickOrder && newOrderIds.has(quickOrder.id);
                  const isModified =
                    quickOrder && modifiedOrderIds.has(quickOrder.id);

                  if (isNew) {
                    return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg";
                  } else if (isModified) {
                    return "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg";
                  } else if (quickOrder) {
                    return "border-purple-500 bg-purple-50 dark:bg-purple-900/20 cursor-pointer hover:shadow-lg";
                  } else {
                    return "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:shadow-lg";
                  }
                })()}`}
                onClick={() => {
                  handleOrderClick({} as Order, false, true); // isQuickOrderCard = true
                }}
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    ⚡ {isRTL ? "طلب سريع" : "Quick Order"}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full mx-auto ${(() => {
                      const quickOrder = orders.find(
                        (order) =>
                          order.orderType === "DINE_IN" &&
                          order.tableNumber === "QUICK" &&
                          order.status !== "COMPLETED" &&
                          order.status !== "CANCELLED"
                      );
                      return quickOrder ? "bg-purple-500" : "bg-green-500";
                    })()}`}
                  />
                  {(() => {
                    const quickOrder = orders.find(
                      (order) =>
                        order.orderType === "DINE_IN" &&
                        order.tableNumber === "QUICK" &&
                        order.status !== "COMPLETED" &&
                        order.status !== "CANCELLED"
                    );
                    const isNew = quickOrder && newOrderIds.has(quickOrder.id);
                    const isModified =
                      quickOrder && modifiedOrderIds.has(quickOrder.id);

                    if (isNew) {
                      return (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "جديد" : "NEW"}
                        </span>
                      );
                    } else if (isModified) {
                      return (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "معدل" : "MODIFIED"}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {availableTables.map((tableNumber) => {
                const hasQRCode = true; // All tables in availableTables have QR codes
                const tableOrder = orders.find(
                  (order) =>
                    order.orderType === "DINE_IN" &&
                    order.tableNumber === tableNumber &&
                    order.tableNumber !== "QUICK" && // Exclude quick orders from tables view
                    order.status !== "COMPLETED" &&
                    order.status !== "CANCELLED"
                );
                const qrCode = qrCodes[tableNumber];
                const hasActiveSession = qrCode?.isOccupied || false;
                const isOccupied = !!tableOrder;
                const isNew = tableOrder && newOrderIds.has(tableOrder.id);
                const isModified =
                  tableOrder && modifiedOrderIds.has(tableOrder.id);

                const handleToggleSession = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (qrCode) {
                    try {
                      await toggleTableOccupied(qrCode.id);
                      // Update local state
                      setQrCodes((prev) => ({
                        ...prev,
                        [tableNumber]: {
                          ...prev[tableNumber],
                          isOccupied: !prev[tableNumber]?.isOccupied,
                        },
                      }));
                    } catch (error) {
                      console.error("Error toggling table session:", error);
                    }
                  }
                };

                return (
                  <div
                    key={tableNumber}
                    className={`relative p-4 border-2 rounded-lg transition-all duration-300 ${
                      isNew
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg"
                        : isModified
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg animate-pulse cursor-pointer hover:shadow-lg"
                          : isOccupied
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 cursor-pointer hover:shadow-lg"
                            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:shadow-lg"
                    }`}
                    onClick={() => tableOrder && handleOrderClick(tableOrder)}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {isRTL ? "طاولة " : "Table "}
                        {tableNumber}
                      </div>
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <div
                          className={`w-4 h-4 rounded-full ${
                            isOccupied ? "bg-red-500" : "bg-green-500"
                          }`}
                        />
                        {/* Session Toggle Switch */}
                        <div
                          className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                          onClick={handleToggleSession}
                        >
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {isRTL ? "جلسة نشطة" : "Active Session"}
                          </span>
                          <button
                            onClick={handleToggleSession}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                              hasActiveSession
                                ? "bg-green-600"
                                : "bg-gray-200 dark:bg-gray-700"
                            }`}
                            dir="ltr"
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                hasActiveSession
                                  ? "translate-x-5"
                                  : "translate-x-1"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      {isNew && (
                        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "جديد" : "NEW"}
                        </span>
                      )}
                      {isModified && !isNew && (
                        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-bounce">
                          {isRTL ? "معدل" : "MODIFIED"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {orders.length === 0 && (
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                {t("orders.noOrders") || "No orders"}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("orders.noOrdersDesc") ||
                  "Orders will appear here when customers place them."}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? "تفاصيل الطلب" : "Order Details"}
                </h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Delivery Orders Tabs - Only show for multiple delivery orders */}
              {deliveryOrders.length > 1 && (
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {deliveryOrders.map((order, index) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedDeliveryOrderIndex(index);
                          setSelectedOrder(order);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                          selectedDeliveryOrderIndex === index
                            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-b-2 border-primary-600"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {order.customerName ||
                              (isRTL ? "عميل" : "Customer")}{" "}
                            #{order.id.slice(-4)}
                          </span>
                          {newOrderIds.has(order.id) && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {isRTL ? "جديد" : "NEW"}
                            </span>
                          )}
                          {modifiedOrderIds.has(order.id) &&
                            !newOrderIds.has(order.id) && (
                              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {isRTL ? "معدل" : "MOD"}
                              </span>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Orders Tabs - Only show for multiple quick orders */}
              {quickOrders.length > 1 && (
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {quickOrders.map((order, index) => (
                      <button
                        key={order.id}
                        onClick={() => {
                          setSelectedQuickOrderIndex(index);
                          setSelectedOrder(order);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                          selectedQuickOrderIndex === index
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-b-2 border-purple-600"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {isRTL ? "طلب سريع" : "Quick Order"} #
                            {order.id.slice(-4)}
                          </span>
                          {newOrderIds.has(order.id) && (
                            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                              {isRTL ? "جديد" : "NEW"}
                            </span>
                          )}
                          {modifiedOrderIds.has(order.id) &&
                            !newOrderIds.has(order.id) && (
                              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                {isRTL ? "معدل" : "MOD"}
                              </span>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {isRTL ? "معلومات الطلب" : "Order Information"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "رقم الطلب:" : "Order ID:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{selectedOrder.id.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "النوع:" : "Type:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.orderType === "DINE_IN"
                          ? isRTL
                            ? "داخل المطعم"
                            : "Dine-in"
                          : isRTL
                            ? "توصيل"
                            : "Delivery"}
                      </span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "طاولة:" : "Table:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getDisplayTableNumber(selectedOrder.tableNumber)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "الحالة:" : "Status:"}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusColors[
                            selectedOrder.status as keyof typeof statusColors
                          ] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    {selectedOrder.subtotal !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrencyWithLanguage(
                            Number(selectedOrder.subtotal),
                            restaurantCurrency ||
                              selectedOrder.currency ||
                              "USD",
                            language
                          )}
                        </span>
                      </div>
                    )}
                    {selectedOrder.taxes && selectedOrder.taxes.length > 0 && (
                      <>
                        {selectedOrder.taxes.map((tax, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              {isRTL ? tax.nameAr || tax.name : tax.name} (
                              {tax.percentage}%):
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatCurrencyWithLanguage(
                                tax.amount,
                                restaurantCurrency ||
                                  selectedOrder.currency ||
                                  "USD",
                                language
                              )}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "المجموع:" : "Total:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrencyWithLanguage(
                          Number(selectedOrder.totalPrice),
                          restaurantCurrency || selectedOrder.currency || "USD",
                          language
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "الوقت:" : "Time:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {isRTL ? "معلومات العميل" : "Customer Information"}
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.customerName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "الاسم:" : "Name:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "الهاتف:" : "Phone:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerPhone}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "العنوان:" : "Address:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerAddress}
                        </span>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "ملاحظات:" : "Notes:"}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isRTL ? "عناصر الطلب" : "Order Items"}
                  </h3>
                  {selectedOrder.status !== "COMPLETED" &&
                    selectedOrder.status !== "CANCELLED" && (
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-md flex items-center gap-2"
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
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        {isRTL ? "إضافة عنصر" : "Add Item"}
                      </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "العنصر" : "Item"}
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الكمية" : "Qty"}
                        </th>

                        <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "ملاحظات" : "Notes"}
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "السعر" : "Price"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => {
                        const isNewItem = newItemIds.has(item.id);
                        const isModifiedItem = modifiedItemIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${
                              isNewItem
                                ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                                : isModifiedItem
                                  ? "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500"
                                  : ""
                            }`}
                          >
                            <td className="py-3 text-center px-3">
                              <div className="flex items-center space-x-2">
                                <div>
                                  {getItemCategory(item) && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                      {getItemCategory(item)}
                                    </p>
                                  )}
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {getItemName(item)}
                                  </p>
                                </div>
                                {isNewItem && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                    {isRTL ? "جديد" : "NEW"}
                                  </span>
                                )}
                                {isModifiedItem && !isNewItem && (
                                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                    {isRTL ? "معدل" : "MODIFIED"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {item.quantity}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-600 dark:text-gray-400">
                              <div>
                                {item.notes && <div>{item.notes}</div>}
                                {item.extras &&
                                  getExtrasNames(item.extras, item.menuItem)
                                    .length > 0 && (
                                    <div className="text-xs text-blue-600 mt-1">
                                      {getExtrasNames(
                                        item.extras,
                                        item.menuItem
                                      ).join(", ")}
                                    </div>
                                  )}
                                {!item.notes &&
                                  (!item.extras ||
                                    getExtrasNames(item.extras, item.menuItem)
                                      .length === 0) &&
                                  "-"}
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {formatCurrencyWithLanguage(
                                Number(item.price) * item.quantity,
                                restaurantCurrency ||
                                  selectedOrder.currency ||
                                  "USD",
                                language
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {selectedOrder.subtotal !== undefined && (
                        <tr className="border-t border-gray-200 dark:border-gray-700">
                          <td
                            colSpan={3}
                            className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300"
                          >
                            {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                          </td>
                          <td className="text-right py-2 px-3 text-sm text-gray-700 dark:text-gray-300">
                            {formatCurrencyWithLanguage(
                              Number(selectedOrder.subtotal),
                              restaurantCurrency ||
                                selectedOrder.currency ||
                                "USD",
                              language
                            )}
                          </td>
                        </tr>
                      )}
                      {selectedOrder.taxes &&
                        selectedOrder.taxes.length > 0 && (
                          <>
                            {selectedOrder.taxes.map((tax, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-200 dark:border-gray-700"
                              >
                                <td
                                  colSpan={3}
                                  className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400"
                                >
                                  {isRTL ? tax.nameAr || tax.name : tax.name} (
                                  {tax.percentage}%):
                                </td>
                                <td className="text-right py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                                  {formatCurrencyWithLanguage(
                                    tax.amount,
                                    restaurantCurrency ||
                                      selectedOrder.currency ||
                                      "USD",
                                    language
                                  )}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                        <td
                          colSpan={3}
                          className="py-3 px-3 font-semibold text-gray-900 dark:text-white"
                        >
                          {isRTL ? "المجموع:" : "Total:"}
                        </td>
                        <td className="text-right py-3 px-3 font-bold text-lg text-gray-900 dark:text-white">
                          {formatCurrencyWithLanguage(
                            Number(selectedOrder.totalPrice),
                            restaurantCurrency ||
                              selectedOrder.currency ||
                              "USD",
                            language
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update */}
              <div
                className={` w-full flex flex-col md:flex-row ${isRTL ? "flex-row-reverse" : "flex-row"} justify-between gap-3`}
              >
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSendToKitchen(selectedOrder.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    {isRTL ? "إرسال إلى المطبخ" : "Send to Kitchen"}
                  </button>
                  <button
                    onClick={() => handlePrintInvoice(selectedOrder)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    {isRTL ? "طباعة الفاتورة" : "Print Invoice"}
                  </button>
                </div>
                <div className="flex justify-between md:justify-start gap-3 flex-wrap">
                  <select
                    value={selectedOrder.status}
                    onChange={(e) => {
                      updateOrderStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({
                        ...selectedOrder,
                        status: e.target.value,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={
                      selectedOrder.status === "CANCELLED" ||
                      selectedOrder.status === "COMPLETED"
                    }
                  >
                    {getStatusOptions(
                      selectedOrder.status,
                      selectedOrder.orderType,
                      true
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedOrder.status !== "CANCELLED" &&
                    selectedOrder.status !== "COMPLETED" && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              isRTL
                                ? "هل أنت متأكد من إلغاء هذا الطلب؟"
                                : "Are you sure you want to cancel this order?"
                            )
                          ) {
                            updateOrderStatus(selectedOrder.id, "CANCELLED");
                            setSelectedOrder({
                              ...selectedOrder,
                              status: "CANCELLED",
                            });
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        {isRTL ? "إلغاء الطلب" : "Cancel Order"}
                      </button>
                    )}
                  <button
                    onClick={closeOrderModal}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    {isRTL ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={() => {
            setShowAddItemModal(false);
            setAddItemTab("custom");
            setNewItemName("");
            setNewItemQuantity(1);
            setNewItemPrice("");
            setNewItemNotes("");
            setSelectedCategory("");
            setSelectedMenuItem("");
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? "إضافة عنصر إلى الطلب" : "Add Item to Order"}
            </h3>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
              <button
                onClick={() => {
                  setAddItemTab("custom");
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  addItemTab === "custom"
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {isRTL ? "خدمة مخصصة" : "Custom Service"}
              </button>
              <button
                onClick={() => {
                  setAddItemTab("menu");
                }}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  addItemTab === "menu"
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {isRTL ? "من القائمة" : "From Menu"}
              </button>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {addItemTab === "custom" ? (
                // Custom Service Tab
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? "اسم الخدمة *" : "Service Name *"}
                    </label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={
                        isRTL
                          ? "مثال: رسوم خدمة، رسوم توصيل..."
                          : "e.g., Service fee, Delivery fee..."
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? "الكمية *" : "Quantity *"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQuantity}
                        onChange={(e) =>
                          setNewItemQuantity(parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? "السعر *" : "Price *"} (
                        {selectedOrder.currency || restaurantCurrency || "USD"})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 pr-24 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {newItemPrice && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
                            {formatCurrencyWithLanguage(
                              parseFloat(newItemPrice) || 0,
                              selectedOrder.currency ||
                                restaurantCurrency ||
                                "USD",
                              language
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Menu Items Tab
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? "اختر الفئة *" : "Select Category *"}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedMenuItem("");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">
                        {isRTL ? "-- اختر فئة --" : "-- Select Category --"}
                      </option>
                      {menuCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {isRTL && category.nameAr
                            ? category.nameAr
                            : category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCategory && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? "اختر المنتج *" : "Select Product *"}
                      </label>
                      <select
                        value={selectedMenuItem}
                        onChange={(e) => setSelectedMenuItem(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">
                          {isRTL ? "-- اختر منتج --" : "-- Select Product --"}
                        </option>
                        {menuCategories
                          .find((cat) => cat.id === selectedCategory)
                          ?.items?.filter((item: any) => item.isAvailable)
                          .map((item: any) => (
                            <option key={item.id} value={item.id}>
                              {isRTL && item.nameAr ? item.nameAr : item.name} -
                              {formatCurrencyWithLanguage(
                                Number(item.price),
                                restaurantCurrency ||
                                  selectedOrder.currency ||
                                  "USD",
                                language
                              )}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {isRTL ? "الكمية *" : "Quantity *"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItemQuantity}
                      onChange={(e) =>
                        setNewItemQuantity(parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              {/* Common Notes Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "ملاحظات" : "Notes"}
                </label>
                <textarea
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder={
                    isRTL ? "ملاحظات إضافية..." : "Additional notes..."
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Total Price Display */}
            {(addItemTab === "menu" && selectedMenuItem) ||
            (addItemTab === "custom" && newItemPrice && newItemName) ? (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isRTL ? "المجموع:" : "Total:"}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {addItemTab === "menu" && selectedMenuItem
                      ? (() => {
                          const selectedItem = menuCategories
                            .find((cat) => cat.id === selectedCategory)
                            ?.items?.find(
                              (item: any) => item.id === selectedMenuItem
                            );
                          return selectedItem
                            ? formatCurrencyWithLanguage(
                                Number(selectedItem.price) * newItemQuantity,
                                restaurantCurrency ||
                                  selectedOrder.currency ||
                                  "USD",
                                language
                              )
                            : "";
                        })()
                      : formatCurrencyWithLanguage(
                          (parseFloat(newItemPrice) || 0) * newItemQuantity,
                          restaurantCurrency || selectedOrder.currency || "USD",
                          language
                        )}
                  </span>
                </div>
              </div>
            ) : null}

            <div
              className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} justify-end gap-3 mt-6`}
            >
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setAddItemTab("custom");
                  setNewItemName("");
                  setNewItemQuantity(1);
                  setNewItemPrice("");
                  setNewItemNotes("");
                  setSelectedCategory("");
                  setSelectedMenuItem("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleAddItemToOrder}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
              >
                {isRTL ? "إضافة" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Order Modal */}
      {showQuickOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? "إنشاء طلب سريع" : "Create Quick Order"}
                </h2>
                <button
                  onClick={() => {
                    setShowQuickOrderModal(false);
                    setQuickOrderItems([]);
                    setQuickOrderSelectedCategory(null);
                    setQuickOrderCategories([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
    </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Menu Display - Categories and Items */}
              {quickOrderLoadingCategories ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {isRTL ? "جاري تحميل القائمة..." : "Loading menu..."}
                  </p>
                </div>
              ) : quickOrderCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    {isRTL
                      ? "لا توجد فئات في القائمة"
                      : "No categories in menu"}
                  </p>
                </div>
              ) : !quickOrderSelectedCategory ? (
                /* Categories List */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {quickOrderCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setQuickOrderSelectedCategory(category)}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {isRTL
                          ? category.nameAr || category.name
                          : category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {isRTL
                            ? category.descriptionAr || category.description
                            : category.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Items in Selected Category */
                <div className="mb-4">
                  {/* Sticky Back Button and Category Name */}
                  <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-2 mb-4 -mx-6 px-6 pt-2 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuickOrderSelectedCategory(null)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {isRTL
                            ? quickOrderSelectedCategory.nameAr ||
                              quickOrderSelectedCategory.name
                            : quickOrderSelectedCategory.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                  {quickOrderLoadingItems ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {isRTL ? "جاري تحميل العناصر..." : "Loading items..."}
                      </p>
                    </div>
                  ) : quickOrderSelectedCategory.items &&
                    quickOrderSelectedCategory.items.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {quickOrderSelectedCategory.items.map((item: any) => (
                        <MenuItem
                          key={item.id}
                          item={item}
                          currency={restaurantCurrency || "USD"}
                          onAddToOrder={(item, quantity, notes, extras) => {
                            setQuickOrderItems([
                              ...quickOrderItems,
                              {
                                menuItemId: item.id,
                                quantity: quantity,
                                price: parseFloat(item.price),
                                notes: notes,
                                extras: extras,
                                name: isRTL
                                  ? item.nameAr || item.name
                                  : item.name,
                              },
                            ]);
                          }}
                          isRTL={isRTL}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        {isRTL
                          ? "لا توجد عناصر في هذه الفئة"
                          : "No items in this category"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items Summary */}
              {quickOrderItems.length > 0 && (
                <div className="mb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {isRTL ? "عناصر الطلب" : "Order Items"} (
                    {quickOrderItems.length})
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {quickOrderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.name} x {item.quantity}
                          </p>
                          {item.extras &&
                            Object.keys(item.extras).length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isRTL ? "إضافات" : "Extras"}
                              </p>
                            )}
                          {item.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrencyWithLanguage(
                              item.price * item.quantity,
                              restaurantCurrency || "USD",
                              language
                            )}
                          </span>
                          <button
                            onClick={() => {
                              setQuickOrderItems(
                                quickOrderItems.filter((_, i) => i !== index)
                              );
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isRTL ? "المجموع:" : "Total:"}
                      </span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrencyWithLanguage(
                          quickOrderItems.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          ),
                          restaurantCurrency || "USD",
                          language
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowQuickOrderModal(false);
                    setQuickOrderItems([]);
                    setQuickOrderSelectedCategory(null);
                    setQuickOrderCategories([]);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={async () => {
                    if (quickOrderItems.length === 0) {
                      showToast(
                        isRTL
                          ? "الرجاء إضافة عنصر واحد على الأقل"
                          : "Please add at least one item",
                        "error"
                      );
                      return;
                    }

                    if (!user?.restaurant?.id) {
                      showToast(
                        isRTL
                          ? "لم يتم العثور على معرف المطعم"
                          : "Restaurant ID not found",
                        "error"
                      );
                      return;
                    }

                    try {
                      setIsCreatingQuickOrder(true);

                      // Create order with menu items
                      // Use "QUICK" as special table number for quick orders
                      const response = await api.post("/order/create", {
                        restaurantId: user.restaurant.id,
                        orderType: "DINE_IN",
                        tableNumber: "QUICK", // Special table number for quick orders
                        items: quickOrderItems.map((item) => ({
                          menuItemId: item.menuItemId,
                          quantity: item.quantity,
                          notes: item.notes,
                          extras: item.extras,
                        })),
                      });

                      if (response.data.success) {
                        showToast(
                          isRTL
                            ? "تم إنشاء الطلب السريع بنجاح"
                            : "Quick order created successfully",
                          "success"
                        );
                        setShowQuickOrderModal(false);
                        setQuickOrderItems([]);
                        setQuickOrderSelectedCategory(null);
                        setQuickOrderCategories([]);
                        // Refresh orders
                        await fetchOrders(1, false);
                      }
                    } catch (error: any) {
                      console.error("Error creating quick order:", error);
                      showToast(
                        error.response?.data?.message ||
                          (isRTL
                            ? "فشل في إنشاء الطلب السريع"
                            : "Failed to create quick order"),
                        "error"
                      );
                    } finally {
                      setIsCreatingQuickOrder(false);
                    }
                  }}
                  disabled={
                    isCreatingQuickOrder || quickOrderItems.length === 0
                  }
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingQuickOrder
                    ? isRTL
                      ? "جاري الإنشاء..."
                      : "Creating..."
                    : isRTL
                      ? "إنشاء الطلب"
                      : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Order Button */}
      <button
        onClick={() => setShowQuickOrderModal(true)}
        className="fixed bottom-20 md:bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg z-40 transition-all duration-200 hover:scale-110"
        title={isRTL ? "إنشاء طلب سريع" : "Create Quick Order"}
      >
        <svg
          className="w-6 h-6"
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
      </button>
    </div>
  );
}
