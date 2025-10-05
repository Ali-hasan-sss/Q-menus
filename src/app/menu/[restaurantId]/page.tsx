"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { publicApi, endpoints } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";

import { MenuItem } from "@/components/customer/MenuItem";
import { RestaurantHeader } from "@/components/customer/RestaurantHeader";

import { FloatingOrderSummary } from "@/components/customer/FloatingOrderSummary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { MenuLoadingSkeleton } from "@/components/customer/MenuLoadingSkeleton";
import { CategoryItemsLoadingSkeleton } from "@/components/customer/CategoryItemsLoadingSkeleton";
import QRScanner from "@/components/customer/QRScanner";
import toast from "react-hot-toast";
import { hexToRgba } from "@/lib/helper";

interface MenuItem {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  currency: string;
  image?: string;
  isAvailable: boolean;
  extras?: any;
  discount?: number;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  items?: MenuItem[]; // Made optional since we'll load items separately
  _count?: {
    items: number;
  };
}

interface Menu {
  id: string;
  name: string;
  nameAr?: string;
  categories: Category[];
}

interface Restaurant {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  logo?: string;
  theme?: any;
}

interface MenuTheme {
  id: string;
  layoutType: string;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Color Opacity Settings
  primaryColorOpacity?: number;
  secondaryColorOpacity?: number;
  backgroundColorOpacity?: number;
  textColorOpacity?: number;
  accentColorOpacity?: number;

  fontFamily: string;
  headingSize: string;
  bodySize: string;
  priceSize: string;
  cardPadding: string;
  cardMargin: string;
  borderRadius: string;
  categoryStyle: string;
  showCategoryImages: boolean;
  itemLayout: string;
  imageAspect: string;
  backgroundImage?: string;
  backgroundOverlay?: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundRepeat: string;

  // Background Overlay Opacity
  backgroundOverlayOpacity?: number;

  customCSS?: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  nameAr?: string;
  price: string;
  currency: string;
  quantity: number;
  notes?: string;
  extras?: any;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restaurantId } = params as { restaurantId: string };
  const tableNumber = searchParams.get("tableNumber");
  const addToOrderParam = searchParams.get("addToOrder");

  // Check if access is authorized (must have tableNumber or be adding to existing order)
  // For security: ALL orders (dine-in and delivery) must come through QR scan
  const isValidTableNumber =
    tableNumber && (tableNumber === "DELIVERY" || /^\d+$/.test(tableNumber));
  const isValidAddToOrder =
    addToOrderParam && /^[a-zA-Z0-9]{24,}$/.test(addToOrderParam);
  const isAuthorizedAccess = isValidTableNumber || isValidAddToOrder;

  const { language, t, isRTL } = useLanguage();
  const { joinRestaurant, joinTable, emitCreateOrder } = useCustomerSocket();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuTheme, setMenuTheme] = useState<MenuTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [incompleteOrder, setIncompleteOrder] = useState<any>(null);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(
    addToOrderParam
  );

  // LocalStorage key for this restaurant's order
  const orderStorageKey = `order_${restaurantId}_${tableNumber || "delivery"}`;

  // Color opacity states (load from theme or default to 1)
  const [colorOpacity, setColorOpacity] = useState({
    primary: 1, // 100% opacity
    secondary: 1, // 100% opacity
    background: 1, // 100% opacity
    text: 1, // 100% opacity
    accent: 1, // 100% opacity
  });

  // Background overlay opacity state (load from theme or default to 0.5)
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0.5);

  // Default theme for all restaurants
  const defaultTheme = {
    primaryColor: "#f58114",
    secondaryColor: "#2797dd",
    backgroundColor: "#ffe59e",
    textColor: "#000000",
    accentColor: "#e2ee44",
    primaryColorOpacity: 0.5,
    secondaryColorOpacity: 1,
    backgroundColorOpacity: 0.7,
    textColorOpacity: 1,
    accentColorOpacity: 1,
    backgroundOverlayOpacity: 0.1,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundImage:
      "https://res.cloudinary.com/dnojeu5cs/image/upload/v1759501200/mymenus-images/uvimvqchjpshc45ighmx.jpg",
    customBackgroundImage:
      "https://res.cloudinary.com/dnojeu5cs/image/upload/v1759501200/mymenus-images/uvimvqchjpshc45ighmx.jpg",
  };

  // Function to update CSS custom properties with restaurant theme
  const updateThemeVariables = (theme: MenuTheme | null) => {
    const root = document.documentElement;
    const activeTheme = theme || defaultTheme;

    // Update CSS custom properties
    root.style.setProperty("--theme-primary", activeTheme.primaryColor);
    root.style.setProperty("--theme-secondary", activeTheme.secondaryColor);
    root.style.setProperty("--theme-background", activeTheme.backgroundColor);
    root.style.setProperty("--theme-text", activeTheme.textColor);
    root.style.setProperty("--theme-accent", activeTheme.accentColor);
  };

  // Save order to localStorage
  const saveOrderToStorage = (orderData: {
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    orderNotes: string;
  }) => {
    try {
      localStorage.setItem(orderStorageKey, JSON.stringify(orderData));
      console.log("Order saved to localStorage:", orderData);
    } catch (error) {
      console.error("Failed to save order to localStorage:", error);
    }
  };

  // Load order from localStorage
  const loadOrderFromStorage = () => {
    try {
      const savedOrder = localStorage.getItem(orderStorageKey);
      if (savedOrder) {
        const orderData = JSON.parse(savedOrder);
        setOrderItems(orderData.items || []);
        setCustomerName(orderData.customerName || "");
        setCustomerPhone(orderData.customerPhone || "");
        setCustomerAddress(orderData.customerAddress || "");
        setOrderNotes(orderData.orderNotes || "");

        // Show order summary if there are items
        if (orderData.items && orderData.items.length > 0) {
          setShowOrderSummary(true);
        }

        console.log("Order loaded from localStorage:", orderData);
      }
    } catch (error) {
      console.error("Failed to load order from localStorage:", error);
    }
  };

  // Clear order from localStorage
  const clearOrderFromStorage = () => {
    try {
      localStorage.removeItem(orderStorageKey);
      console.log("Order cleared from localStorage");
    } catch (error) {
      console.error("Failed to clear order from localStorage:", error);
    }
  };

  useEffect(() => {
    loadMenuData();
    checkIncompleteOrder();
    loadOrderFromStorage(); // Load saved order from localStorage

    // Clear browser history to prevent back button manipulation
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.href);
    }
  }, [restaurantId, tableNumber]);

  // Debug effect to log color opacity and theme changes
  useEffect(() => {
    console.log("Color opacity changed:", colorOpacity);
  }, [colorOpacity]);

  useEffect(() => {
    console.log("Menu theme changed:", menuTheme);
  }, [menuTheme]);

  // Save customer data to localStorage when it changes
  useEffect(() => {
    if (
      orderItems.length > 0 ||
      customerName ||
      customerPhone ||
      customerAddress ||
      orderNotes
    ) {
      saveOrderToStorage({
        items: orderItems,
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
      });
    }
  }, [customerName, customerPhone, customerAddress, orderNotes]);

  // Load items when selectedCategory changes
  useEffect(() => {
    if (
      selectedCategory &&
      !loadedCategories.has(selectedCategory.id) &&
      (!selectedCategory.items || selectedCategory.items.length === 0)
    ) {
      // Set loading state
      setLoadingCategory(selectedCategory.id);

      loadCategoryItems(selectedCategory.id).finally(() => {
        setLoadingCategory(null);
        // Mark this category as loaded to prevent infinite loop
        setLoadedCategories(
          (prev) => new Set(Array.from(prev).concat(selectedCategory.id))
        );
      });
    }
  }, [selectedCategory, loadedCategories]);

  const checkIncompleteOrder = async () => {
    try {
      // Check if there's an incomplete order for this table/customer
      const response = await publicApi.get(
        `/order/incomplete/${restaurantId}?tableNumber=${tableNumber || ""}`
      );
      if (response.data.success && response.data.data.order) {
        setIncompleteOrder(response.data.data.order);
      }
    } catch (error) {
      // No incomplete order found, which is fine
      console.log("No incomplete order found");
    }
  };

  useEffect(() => {
    // Join restaurant room for order updates
    if (restaurantId) {
      joinRestaurant(restaurantId);
    }
  }, [restaurantId, joinRestaurant]);

  // Handle browser back/forward navigation - Force QR scan for security
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default browser back behavior
      event.preventDefault();

      // Force user to scan QR again for security
      const confirmExit = window.confirm(
        isRTL
          ? "للأمان، يجب مسح رمز QR مرة أخرى للوصول إلى القائمة"
          : "For security, you must scan the QR code again to access the menu"
      );

      if (confirmExit) {
        // Redirect to QR scanner (remove tableNumber to force scan)
        router.push(`/menu/${restaurantId}`);
      } else {
        // Push current state back to history to prevent back button from working
        window.history.pushState(null, "", window.location.href);
      }
    };

    // Push initial state to prevent back button
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [menus, isRTL, router, restaurantId]);

  useEffect(() => {
    // Listen for order status updates
    const handleOrderStatusUpdate = (event: CustomEvent) => {
      const { order } = event.detail;
      console.log("Order status update received:", order);
      if (order.id === orderId) {
        console.log("Updating order status to:", order.status);
        setOrderStatus(order.status);

        // If order is cancelled, clear the incomplete order
        if (order.status === "CANCELLED") {
          setIncompleteOrder(null);
        }
      }
    };

    // Listen for order creation confirmation
    const handleOrderCreated = (event: CustomEvent) => {
      const { order } = event.detail;
      console.log("Order created successfully:", order);

      // Only process if this is our pending order
      if (pendingOrder && order.id) {
        setOrderId(order.id);
        setOrderStatus(order.status);
        setPendingOrder(null);
        setIsOrdering(false);

        const successMessage =
          tableNumber === "DELIVERY"
            ? t("menu.orderSuccess.delivery")
            : t("menu.orderSuccess.dineIn");
        toast.success(successMessage);
      }
    };

    window.addEventListener(
      "orderStatusUpdate",
      handleOrderStatusUpdate as EventListener
    );
    window.addEventListener(
      "orderCreated",
      handleOrderCreated as EventListener
    );

    return () => {
      window.removeEventListener(
        "orderStatusUpdate",
        handleOrderStatusUpdate as EventListener
      );
      window.removeEventListener(
        "orderCreated",
        handleOrderCreated as EventListener
      );
    };
  }, [orderId, pendingOrder, tableNumber]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load only categories first for better performance
      const response = await publicApi.get(
        endpoints.public.menuCategories(restaurantId)
      );
      const { restaurant, categories, menuTheme } = response.data.data;

      setRestaurant(restaurant);
      setMenuTheme(menuTheme);

      // Use default theme if no custom theme exists
      const activeTheme = menuTheme || defaultTheme;

      // Load color opacity from theme (use default values if not provided)
      setColorOpacity({
        primary: activeTheme.primaryColorOpacity || 0.6,
        secondary: activeTheme.secondaryColorOpacity || 1,
        background: activeTheme.backgroundColorOpacity || 1,
        text: activeTheme.textColorOpacity || 1,
        accent: activeTheme.accentColorOpacity || 1,
      });

      // Load background overlay opacity from theme
      setBackgroundOverlayOpacity(activeTheme.backgroundOverlayOpacity || 0.5);

      // Update CSS custom properties with restaurant theme (or default)
      updateThemeVariables(menuTheme);

      // Convert categories to menus format for compatibility (without items)
      setMenus([
        {
          id: "main-menu",
          name: "Main Menu",
          nameAr: "القائمة الرئيسية",
          categories: categories.map((cat: any) => ({
            ...cat,
            items: [], // No items loaded initially
          })),
        },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to load menu";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (categoryId: string) => {
    try {
      setLoadingItems(true);

      const response = await publicApi.get(
        endpoints.public.categoryItems(restaurantId, categoryId)
      );
      const { category, items } = response.data.data;

      // Update the specific category with its items
      setMenus((prevMenus) =>
        prevMenus.map((menu) => ({
          ...menu,
          categories: menu.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, items: items } : cat
          ),
        }))
      );

      // Also update selectedCategory if it's the current one
      setSelectedCategory((prevCategory) => {
        if (prevCategory && prevCategory.id === categoryId) {
          console.log("🔄 Updating selectedCategory with items:", items);
          return { ...prevCategory, items: items };
        }
        return prevCategory;
      });
    } catch (error: any) {
      console.error("Failed to load category items:", error);
      // Don't set global error, just log it
    } finally {
      setLoadingItems(false);
    }
  };

  const addItemToOrder = (
    menuItem: MenuItem,
    quantity: number = 1,
    notes?: string,
    extras?: any
  ) => {
    setOrderItems((prev) => {
      const existingItem = prev.find((item) => item.menuItemId === menuItem.id);

      // Calculate final price with discount
      let finalPrice =
        typeof menuItem.price === "string"
          ? parseFloat(menuItem.price)
          : menuItem.price;
      if (menuItem.discount && menuItem.discount > 0) {
        finalPrice = finalPrice * (1 - menuItem.discount / 100);
      }

      // Calculate extras price
      let extrasPrice = 0;
      if (extras && Object.keys(extras).length > 0) {
        Object.values(extras).forEach((extraGroup: any) => {
          if (Array.isArray(extraGroup)) {
            extraGroup.forEach((extraId: string) => {
              // Find the extra option in menuItem.extras
              if (menuItem.extras) {
                Object.values(menuItem.extras).forEach((group: any) => {
                  if (group.options) {
                    const option = group.options.find(
                      (opt: any) => opt.id === extraId
                    );
                    if (option && option.price) {
                      extrasPrice += option.price;
                    }
                  }
                });
              }
            });
          }
        });
      }

      // Total price including extras
      const totalPrice = finalPrice + extrasPrice;

      let newItems;
      if (existingItem) {
        // For existing items, we need to handle extras properly
        // If the extras are different, treat as a new item
        const existingExtras = JSON.stringify(existingItem.extras || {});
        const newExtras = JSON.stringify(extras || {});

        if (existingExtras === newExtras) {
          // Same extras, just increase quantity
          newItems = prev.map((item) =>
            item.menuItemId === menuItem.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  notes: notes || item.notes,
                }
              : item
          );
        } else {
          // Different extras, add as new item
          newItems = [
            ...prev,
            {
              menuItemId: menuItem.id,
              name: menuItem.name,
              nameAr: menuItem.nameAr,
              price: totalPrice.toString(),
              currency: menuItem.currency,
              quantity,
              notes,
              extras,
            },
          ];
        }
      } else {
        newItems = [
          ...prev,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            nameAr: menuItem.nameAr,
            price: totalPrice.toString(),
            currency: menuItem.currency,
            quantity,
            notes,
            extras,
          },
        ];
      }

      // Save to localStorage
      saveOrderToStorage({
        items: newItems,
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
      });

      return newItems;
    });

    // Show order summary when items are added
    setShowOrderSummary(true);
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => {
      const newItems = prev.filter((item) => item.menuItemId !== menuItemId);

      // Save to localStorage
      saveOrderToStorage({
        items: newItems,
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
      });

      // Hide order summary if no items left
      if (newItems.length === 0) {
        setShowOrderSummary(false);
      }
      return newItems;
    });
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(menuItemId);
      return;
    }

    setOrderItems((prev) => {
      const newItems = prev.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      );

      // Save to localStorage
      saveOrderToStorage({
        items: newItems,
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
      });

      return newItems;
    });
  };

  const handleCategoryClick = (category: Category) => {
    // Set selected category immediately
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

  // Function to handle item click
  const handleItemClick = (item: MenuItem) => {
    // This function is now handled by MenuItem component directly
    // No URL changes needed
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      // Use the price already stored in orderItems (which includes discount)
      const itemPrice = parseFloat(item.price);
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const findMenuItemById = (id: string): MenuItem | null => {
    // Check selected category first
    if (selectedCategory && selectedCategory.items) {
      const item = selectedCategory.items.find((item) => item.id === id);
      if (item) return item;
    }

    // Check all menus
    for (const menu of menus) {
      for (const category of menu.categories) {
        if (category.items) {
          const item = category.items.find((item) => item.id === id);
          if (item) return item;
        }
      }
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("Please add items to your order");
      return;
    }

    // If adding to existing order, use different logic
    if (existingOrderId) {
      try {
        setIsOrdering(true);

        const response = await publicApi.put(
          `/order/${existingOrderId}/add-items`,
          {
            items: orderItems,
          }
        );

        if (response.data.success) {
          toast.success(t("menu.orderSuccess.itemsAdded"));
          setOrderItems([]);
          setShowOrderSummary(false);
          clearOrderFromStorage(); // Clear from localStorage

          // Redirect back to order status page
          router.push(`/order/${existingOrderId}`);
        }
      } catch (error: any) {
        const message =
          error.response?.data?.message || t("menu.orderError.addItemsFailed");
        toast.error(message);
      } finally {
        setIsOrdering(false);
      }
      return;
    }

    // For security: ALL orders must come through QR scan (tableNumber required)
    if (!tableNumber) {
      toast.error(t("menu.orderError.qrRequired"));
      return;
    }

    // Check if this is a delivery order (special tableNumber)
    if (tableNumber === "DELIVERY") {
      // For delivery orders, customer details are required
      if (!customerName.trim()) {
        toast.error(t("menu.orderError.customerNameRequired"));
        return;
      }
      if (customerName.trim().length < 3) {
        toast.error(t("menu.orderError.customerNameMinLength"));
        return;
      }
      if (!customerPhone.trim()) {
        toast.error(t("menu.orderError.customerPhoneRequired"));
        return;
      }
      // Validate phone number: 10 digits starting with 09
      const phoneRegex = /^09\d{8}$/;
      if (!phoneRegex.test(customerPhone.trim())) {
        toast.error(t("menu.orderError.customerPhoneInvalid"));
        return;
      }
      if (!customerAddress.trim()) {
        toast.error(t("menu.orderError.customerAddressRequired"));
        return;
      }
    }

    try {
      setIsOrdering(true);

      const orderData = {
        restaurantId,
        orderType: (tableNumber === "DELIVERY" ? "DELIVERY" : "DINE_IN") as
          | "DINE_IN"
          | "DELIVERY",
        tableNumber: tableNumber === "DELIVERY" ? undefined : tableNumber, // No tableNumber for delivery
        items: orderItems,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
        notes: orderNotes || undefined,
      };

      // Store pending order data
      setPendingOrder(orderData);

      // Emit order via socket only
      emitCreateOrder(orderData);

      // Clear form immediately
      setOrderItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setOrderNotes("");
      setShowOrderSummary(false);
      clearOrderFromStorage(); // Clear from localStorage
    } catch (error: any) {
      const message =
        error.response?.data?.message || t("menu.orderError.failed");
      toast.error(message);
      setIsOrdering(false);
      setPendingOrder(null);
    }
  };

  // Show QR Scanner if not authorized access
  if (!isAuthorizedAccess) {
    return <QRScanner restaurantId={restaurantId} />;
  }

  if (loading) {
    return <MenuLoadingSkeleton menuTheme={menuTheme} />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadMenuData} />;
  }

  if (orderId && orderStatus) {
    // Redirect to dedicated order page
    router.push(`/order/${orderId}`);
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* Custom CSS for smooth transitions */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .transition-smooth {
          transition: all 0.3s ease-in-out;
        }
      `}</style>

      <div
        className="min-h-screen relative"
        style={{
          backgroundColor: hexToRgba(
            menuTheme?.backgroundColor || defaultTheme.backgroundColor,
            colorOpacity.background
          ),
          backgroundImage: menuTheme?.backgroundImage
            ? `url(${menuTheme.backgroundImage})`
            : undefined,
          backgroundPosition:
            menuTheme?.backgroundPosition || defaultTheme.backgroundPosition,
          backgroundSize:
            menuTheme?.backgroundSize || defaultTheme.backgroundSize,
          backgroundRepeat:
            menuTheme?.backgroundRepeat || defaultTheme.backgroundRepeat,
          color: hexToRgba(
            menuTheme?.textColor || defaultTheme.textColor,
            colorOpacity.text
          ),
          fontFamily: menuTheme?.fontFamily || "Inter, sans-serif",
        }}
        onLoad={() => {
          console.log("Main page div loaded with colorOpacity:", colorOpacity);
          console.log("MenuTheme:", menuTheme);
        }}
      >
        {/* Background Overlay */}
        {menuTheme?.backgroundImage && (
          <div
            className="fixed inset-0 pointer-events-none will-change-auto"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${backgroundOverlayOpacity})`,
              transform: "translateZ(0)", // Force hardware acceleration
              backfaceVisibility: "hidden",
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <RestaurantHeader
            restaurant={restaurant}
            menuTheme={menuTheme}
            tableNumber={tableNumber || undefined}
            colorOpacity={colorOpacity}
          />

          <div className="max-w-7xl pt-[100px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
            {incompleteOrder && incompleteOrder.status !== "CANCELLED" && (
              <div className="">
                <button
                  style={{ zIndex: 1000 }}
                  onClick={() => router.push(`/order/${incompleteOrder.id}`)}
                  className="inline-flex  top-14 left-2 fixed bg-opacity-90 items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                  {isRTL
                    ? "طلب غير مكتمل - اضغط للمتابعة"
                    : "Incomplete Order - Click to Continue"}
                </button>
              </div>
            )}
            {/* Categories View */}
            {!selectedCategory && (
              <div className="animate-fadeIn">
                <h2
                  className="text-2xl  font-bold mb-6 text-center"
                  style={{
                    color: hexToRgba(
                      menuTheme?.textColor || "#1f2937",
                      colorOpacity.text
                    ),
                  }}
                >
                  {isRTL ? "اختر وجبتك اللذيذة" : "Choose your delicious Meal"}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {menus.map((menu) =>
                    menu.categories.map((category) => (
                      <div
                        key={category.id}
                        className={`shadow-sm border cursor-pointer hover:shadow-md transition-shadow relative ${menuTheme?.borderRadius || "rounded-lg"} ${menuTheme?.cardPadding || "p-4"} ${loadingCategory === category.id ? "opacity-75" : ""}`}
                        style={{
                          backgroundColor: hexToRgba(
                            menuTheme?.primaryColor || "#ffffff",
                            colorOpacity.primary
                          ),
                          borderColor: hexToRgba(
                            menuTheme?.secondaryColor || "#e5e7eb",
                            colorOpacity.secondary
                          ),
                        }}
                        onClick={() => handleCategoryClick(category)}
                      >
                        {/* Loading indicator */}
                        {loadingCategory === category.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        )}

                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={
                                  isRTL
                                    ? category.nameAr || category.name
                                    : category.name
                                }
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg
                                  className="w-8 h-8"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <h3
                            className="text-sm font-medium"
                            style={{
                              color: hexToRgba(
                                menuTheme?.textColor || "#1f2937",
                                colorOpacity.text
                              ),
                            }}
                          >
                            {isRTL
                              ? category.nameAr || category.name
                              : category.name}
                          </h3>
                          <p
                            className="text-xs mt-1"
                            style={{
                              color: menuTheme?.secondaryColor || "#6b7280",
                            }}
                          >
                            {category._count?.items || 0}{" "}
                            {isRTL ? "عنصر" : "items"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Items View */}
            {selectedCategory && (
              <div className="animate-fadeIn">
                {/* Category Header with Back Button */}
                <div className="mb-8">
                  {/* Category Title */}
                  <div className="text-center">
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{
                        color: hexToRgba(
                          menuTheme?.textColor || "#1f2937",
                          colorOpacity.text
                        ),
                      }}
                    >
                      {isRTL
                        ? selectedCategory.nameAr || selectedCategory.name
                        : selectedCategory.name}
                    </h2>
                    {selectedCategory.description && (
                      <p
                        style={{
                          color: hexToRgba(
                            menuTheme?.secondaryColor || "#6b7280",
                            colorOpacity.secondary
                          ),
                        }}
                      >
                        {isRTL
                          ? selectedCategory.descriptionAr ||
                            selectedCategory.description
                          : selectedCategory.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items Grid */}
                {(() => {
                  console.log("🎯 Items Grid Debug:", {
                    loadingItems,
                    selectedCategoryItems: selectedCategory.items,
                    itemsLength: selectedCategory.items?.length || 0,
                  });
                  return null;
                })()}
                {loadingItems ? (
                  <CategoryItemsLoadingSkeleton
                    menuTheme={menuTheme}
                    categoryName={
                      selectedCategory?.name || selectedCategory?.nameAr
                    }
                  />
                ) : selectedCategory.items &&
                  selectedCategory.items.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {selectedCategory.items.map((item) => (
                      <MenuItem
                        key={item.id}
                        item={item}
                        onAddToOrder={addItemToOrder}
                        onItemClick={handleItemClick}
                        isRTL={isRTL}
                        theme={menuTheme || undefined}
                        colorOpacity={colorOpacity}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "لا توجد عناصر في هذه الفئة"
                        : "No items available in this category"}
                    </p>
                  </div>
                )}
                {/* Floating Back Button - Bottom */}
                <div
                  className={`fixed z-40 ${
                    orderItems.length > 0
                      ? isRTL
                        ? "bottom-20 right-6"
                        : "bottom-20 left-6"
                      : isRTL
                        ? "bottom-6 right-6"
                        : "bottom-6 left-6"
                  }`}
                >
                  <button
                    onClick={handleBackToCategories}
                    className="shadow-lg hover:shadow-xl rounded-full w-14 h-14 flex items-center justify-center transition-all duration-200"
                    style={{
                      backgroundColor:
                        menuTheme?.primaryColor || "var(--theme-primary)",
                      color: menuTheme?.textColor || "#ffffff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        menuTheme?.secondaryColor || "var(--theme-secondary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        menuTheme?.primaryColor || "var(--theme-primary)";
                    }}
                  >
                    {isRTL ? (
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    ) : (
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
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Floating Order Summary */}
          {showOrderSummary && orderItems.length > 0 && (
            <FloatingOrderSummary
              orderItems={orderItems}
              total={calculateTotal()}
              currency={orderItems[0].currency}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromOrder}
              onPlaceOrder={handlePlaceOrder}
              isOrdering={isOrdering}
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerAddress={customerAddress}
              setCustomerAddress={setCustomerAddress}
              orderNotes={orderNotes}
              setOrderNotes={setOrderNotes}
              isDelivery={tableNumber === "DELIVERY"}
              onHide={() => setShowOrderSummary(false)}
              isAddingToExisting={!!existingOrderId}
              menuTheme={menuTheme}
              findMenuItemById={findMenuItemById}
            />
          )}
        </div>
      </div>
    </>
  );
}
