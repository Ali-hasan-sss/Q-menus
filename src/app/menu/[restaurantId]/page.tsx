"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { publicApi, endpoints } from "@/lib/api";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";

import { MenuItem } from "@/components/customer/MenuItem";
import { RestaurantHeader } from "@/components/customer/RestaurantHeader";
import dynamic from "next/dynamic";

import { FloatingOrderSummary } from "@/components/customer/FloatingOrderSummary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { MenuLoadingSkeleton } from "@/components/customer/MenuLoadingSkeleton";
import WaiterRequestButton from "@/components/customer/WaiterRequestButton";

// Dynamically import QRScanner to avoid SSR issues with jsqr
const QRScanner = dynamic(() => import("@/components/customer/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { hexToRgba } from "@/lib/helper";
import { DEFAULT_THEME, mergeWithDefaultTheme } from "@/lib/defaultTheme";

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
  currency?: string;
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
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");
  const [currencyExchanges, setCurrencyExchanges] = useState<any[]>([]);
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(
    new Set(),
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
    null,
  );
  const selectedCategoryRef = useRef<Category | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [incompleteOrder, setIncompleteOrder] = useState<any>(null);
  const [existingOrderId, setExistingOrderId] = useState<string | null>(
    addToOrderParam,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // LocalStorage key for this restaurant's order
  const orderStorageKey = `order_${restaurantId}_${tableNumber || "delivery"}`;
  // LocalStorage key for selected currency
  const currencyStorageKey = `selectedCurrency_${restaurantId}`;

  // Color opacity states (load from theme or default to 1)
  const [colorOpacity, setColorOpacity] = useState({
    primary: 1, // 100% opacity
    secondary: 1, // 100% opacity
    background: 1, // 100% opacity
    text: 1, // 100% opacity
    accent: 1, // 100% opacity
  });

  // Background overlay opacity state (load from theme or default)
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(
    DEFAULT_THEME.backgroundOverlayOpacity,
  );

  // Function to update CSS custom properties with restaurant theme
  const updateThemeVariables = (theme: MenuTheme | null) => {
    const root = document.documentElement;
    const activeTheme = mergeWithDefaultTheme(theme);

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

  // Save selected currency to localStorage
  const saveSelectedCurrency = (currency: string | null) => {
    try {
      if (currency) {
        localStorage.setItem(currencyStorageKey, currency);
      } else {
        localStorage.removeItem(currencyStorageKey);
      }
    } catch (error) {
      console.error("Failed to save selected currency:", error);
    }
  };

  // Load selected currency from localStorage
  const loadSelectedCurrency = () => {
    try {
      const savedCurrency = localStorage.getItem(currencyStorageKey);
      if (savedCurrency) {
        setSelectedPaymentCurrency(savedCurrency);
      }
    } catch (error) {
      console.error("Failed to load selected currency:", error);
    }
  };

  // Handle currency change
  const handleCurrencyChange = (currency: string | null) => {
    setSelectedPaymentCurrency(currency);
    saveSelectedCurrency(currency);
  };

  useEffect(() => {
    // Check for incomplete order first before loading menu
    // This prevents menu access if there's an incomplete order
    const checkIncompleteOrderBeforeLoad = async () => {
      // Only check if we have a tableNumber and NOT adding to existing order
      if (tableNumber && tableNumber !== "DELIVERY" && !addToOrderParam) {
        try {
          const response = await publicApi.get(
            `/order/incomplete/${restaurantId}?tableNumber=${tableNumber}`,
          );
          if (
            response.data.success &&
            response.data.data.order &&
            response.data.data.order.status !== "COMPLETED" &&
            response.data.data.order.status !== "CANCELLED"
          ) {
            // Incomplete order found - set it but don't redirect
            // This will prevent menu from being displayed
            const order = response.data.data.order;
            setIncompleteOrder(order);

            // Don't load menu if there's an incomplete order
            return;
          }
        } catch (error) {
          // No incomplete order found, continue with normal flow
          console.log("No incomplete order found, loading menu");
        }
      }
      // Load menu only if no incomplete order or if adding to existing order
      loadMenuData();
      checkIncompleteOrder();
      loadOrderFromStorage(); // Load saved order from localStorage
      loadSelectedCurrency(); // Load selected currency from localStorage
    };

    checkIncompleteOrderBeforeLoad();
  }, [restaurantId, tableNumber, addToOrderParam]);

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
          (prev) => new Set(Array.from(prev).concat(selectedCategory.id)),
        );
      });
    }
  }, [selectedCategory, loadedCategories]);

  const checkIncompleteOrder = async () => {
    try {
      // Check if there's an incomplete order for this table/customer
      // Only check if we have a tableNumber (not when adding to existing order)
      if (!tableNumber || addToOrderParam) {
        return; // Allow access if adding to existing order or no table number
      }

      const response = await publicApi.get(
        `/order/incomplete/${restaurantId}?tableNumber=${tableNumber}`,
      );
      if (response.data.success && response.data.data.order) {
        const order = response.data.data.order;
        // Only block if order is not completed or cancelled
        if (order.status !== "COMPLETED" && order.status !== "CANCELLED") {
          setIncompleteOrder(order);
          console.log(
            "🚫 Incomplete order found:",
            order.id,
            "Status:",
            order.status,
          );
        }
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

  // Keep ref in sync with selectedCategory
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Use ref to get current selectedCategory (always up-to-date)
      const currentSelectedCategory = selectedCategoryRef.current;

      // Check if we're going back from a category view
      if (currentSelectedCategory) {
        // Simply update state - no history manipulation
        // This prevents page reload
        setSelectedCategory(null);
        setCategorySearchQuery(""); // Clear category search when going back
        return;
      }

      // If no category is selected, prevent back button for security
      // Force user to scan QR again for security
      const confirmExit = window.confirm(
        isRTL
          ? "استخدم زر الرجوع ياسفل الشاشة للعودة إلى القائمة"
          : "Use the back button at the bottom of the screen to return to the menu",
      );

      if (confirmExit) {
        toast.success("شكرا لك  ");
      } else {
        // Push current state back to prevent back button from working
        window.history.pushState(
          { page: "menu", selectedCategory: null },
          "",
          window.location.href,
        );
      }
    };

    // Initialize history state only once when component mounts
    if (typeof window !== "undefined") {
      const currentState = window.history.state;
      if (!currentState || !currentState.page) {
        window.history.replaceState(
          { page: "menu", selectedCategory: selectedCategory?.id || null },
          "",
          window.location.href,
        );
      }
    }

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

      // Clear backup (order was successful)
      delete (window as any).__orderBackup;

      // Only process if this is our pending order
      if (pendingOrder && order.id) {
        setOrderId(order.id);
        setOrderStatus(order.status);
        setPendingOrder(null);
        setIsOrdering(false);

        // Clear order form (only after successful creation)
        setOrderItems([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setOrderNotes("");
        setShowOrderSummary(false);
        clearOrderFromStorage(); // Clear from localStorage

        const successMessage =
          tableNumber === "DELIVERY"
            ? t("menu.orderSuccess.delivery")
            : t("menu.orderSuccess.dineIn");
        toast.success(successMessage);
      }
    };

    // Listen for order creation errors
    const handleOrderError = (event: any) => {
      const { message } = event.detail || {};
      console.error("Order creation error:", message);

      setIsOrdering(false);
      setPendingOrder(null);

      // Restore order data from backup if available
      const orderBackup = (window as any).__orderBackup;
      if (orderBackup) {
        setOrderItems(orderBackup.items || []);
        setCustomerName(orderBackup.customerName || "");
        setCustomerPhone(orderBackup.customerPhone || "");
        setCustomerAddress(orderBackup.customerAddress || "");
        setOrderNotes(orderBackup.orderNotes || "");

        // Restore to localStorage
        if (orderBackup.items && orderBackup.items.length > 0) {
          saveOrderToStorage({
            items: orderBackup.items,
            customerName: orderBackup.customerName || "",
            customerPhone: orderBackup.customerPhone || "",
            customerAddress: orderBackup.customerAddress || "",
            orderNotes: orderBackup.orderNotes || "",
          });
          setShowOrderSummary(true);
        }

        // Clear backup
        delete (window as any).__orderBackup;
      }

      // Translate error message based on content
      let translatedMessage = message;
      if (message) {
        if (
          message.includes("Table is not occupied") ||
          message.includes("start a session")
        ) {
          translatedMessage = t("menu.orderError.tableNotOccupied");
        } else {
          // Try to find matching translation key
          const errorKeys = [
            "menu.orderError.failed",
            "menu.orderError.qrRequired",
            "menu.orderError.customerNameRequired",
            "menu.orderError.customerPhoneRequired",
            "menu.orderError.customerAddressRequired",
            "menu.orderError.addItemsFailed",
            "menu.orderError.tableNotOccupied",
          ];
          // If message matches a known error, use translation
          for (const key of errorKeys) {
            if (message.toLowerCase().includes(t(key).toLowerCase())) {
              translatedMessage = t(key);
              break;
            }
          }
        }
      }

      toast.error(translatedMessage || t("menu.orderError.failed"));
    };

    window.addEventListener(
      "orderStatusUpdate",
      handleOrderStatusUpdate as EventListener,
    );
    window.addEventListener(
      "orderCreated",
      handleOrderCreated as EventListener,
    );
    window.addEventListener("order_error", handleOrderError as EventListener);

    return () => {
      window.removeEventListener(
        "orderStatusUpdate",
        handleOrderStatusUpdate as EventListener,
      );
      window.removeEventListener(
        "orderCreated",
        handleOrderCreated as EventListener,
      );
      window.removeEventListener(
        "order_error",
        handleOrderError as EventListener,
      );
    };
  }, [orderId, pendingOrder, tableNumber]);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load only categories first for better performance
      const response = await publicApi.get(
        endpoints.public.menuCategories(restaurantId),
      );
      const { restaurant, categories, menuTheme, currency } =
        response.data.data;

      setRestaurant(restaurant);
      setRestaurantCurrency(currency || restaurant?.currency || "USD");

      // Merge custom theme with default theme
      const mergedTheme = mergeWithDefaultTheme(menuTheme);
      setMenuTheme(mergedTheme);

      // Load color opacity from merged theme
      setColorOpacity({
        primary: mergedTheme.primaryColorOpacity,
        secondary: mergedTheme.secondaryColorOpacity,
        background: mergedTheme.backgroundColorOpacity,
        text: mergedTheme.textColorOpacity,
        accent: mergedTheme.accentColorOpacity,
      });

      // Load background overlay opacity from merged theme
      setBackgroundOverlayOpacity(mergedTheme.backgroundOverlayOpacity);

      // Update CSS custom properties with merged theme
      updateThemeVariables(mergedTheme);

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

      // Fetch currency exchanges
      try {
        const currencyResponse = await publicApi.get(
          `/public/restaurant/${restaurantId}/currency-exchanges`,
        );
        if (currencyResponse.data.success) {
          // Filter only active currencies
          const activeCurrencies = currencyResponse.data.data.filter(
            (ce: any) => ce.isActive === true,
          );
          setCurrencyExchanges(activeCurrencies);
        }
      } catch (currencyError) {
        console.error("Error fetching currency exchanges:", currencyError);
        // Don't set error state, just log it - currencies are optional
      }
    } catch (error: any) {
      let message = error.response?.data?.message || "Failed to load menu";
      // Use Arabic message if available and user is using Arabic
      if (error.response?.data?.messageAr && isRTL) {
        message = error.response.data.messageAr;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (categoryId: string) => {
    try {
      setLoadingItems(true);

      const response = await publicApi.get(
        endpoints.public.categoryItems(restaurantId, categoryId),
      );
      const { category, items, currency } = response.data.data;

      // Update restaurant currency if provided
      if (currency) {
        setRestaurantCurrency(currency);
      }

      // Update the specific category with its items
      setMenus((prevMenus) =>
        prevMenus.map((menu) => ({
          ...menu,
          categories: menu.categories.map((cat) =>
            cat.id === categoryId ? { ...cat, items: items } : cat,
          ),
        })),
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

  // Search menu items
  const searchMenuItems = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await publicApi.get(
        endpoints.public.searchMenu(restaurantId, query),
      );

      if (response.data.success) {
        setSearchResults(response.data.data.items);
        setShowSearchResults(true);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(isRTL ? "خطأ في البحث" : "Search error");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchMenuItems(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addItemToOrder = (
    menuItem: MenuItem,
    quantity: number = 1,
    notes?: string,
    extras?: any,
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
                      (opt: any) => opt.id === extraId,
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
              : item,
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
              currency: restaurantCurrency,
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
            currency: restaurantCurrency,
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
        item.menuItemId === menuItemId ? { ...item, quantity } : item,
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

    // Push new state to history when selecting a category (enables back button)
    if (typeof window !== "undefined") {
      window.history.pushState(
        { page: "menu", selectedCategory: category.id },
        "",
        window.location.href,
      );
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategorySearchQuery(""); // Clear category search when going back

    // Replace state when going back to categories (no new history entry)
    if (typeof window !== "undefined") {
      window.history.replaceState(
        { page: "menu", selectedCategory: null },
        "",
        window.location.href,
      );
    }
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

  // Calculate total in selected currency
  const calculateTotalInCurrency = (
    totalInBaseCurrency: number,
    selectedCurrency: string | null,
  ): { amount: number; currency: string } => {
    if (!selectedCurrency || selectedCurrency === restaurantCurrency) {
      return { amount: totalInBaseCurrency, currency: restaurantCurrency };
    }

    const currencyExchange = currencyExchanges.find(
      (ce) =>
        ce.currency.toUpperCase() === selectedCurrency.toUpperCase() &&
        ce.isActive,
    );

    if (!currencyExchange) {
      return { amount: totalInBaseCurrency, currency: restaurantCurrency };
    }

    // Convert from base currency to selected currency
    // exchangeRate interpretation depends on its value:
    // - If exchangeRate >= 1: represents how many units of base currency equal 1 unit of selected currency
    //   Example: exchangeRate = 12100 means 1 USD = 12100 SYP → use division
    // - If exchangeRate < 1: represents how many units of selected currency equal 1 unit of base currency
    //   Example: exchangeRate = 0.01 means 1 SYP = 0.01 NEW → use multiplication
    const exchangeRate = Number(currencyExchange.exchangeRate);
    const convertedAmount =
      exchangeRate >= 1
        ? totalInBaseCurrency / exchangeRate
        : totalInBaseCurrency * exchangeRate;
    return {
      amount: convertedAmount,
      currency: selectedCurrency,
    };
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
          },
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

      // Store backup of order data before sending (for error recovery)
      const orderBackup = {
        items: [...orderItems],
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
      };

      // Save backup to state for error recovery
      (window as any).__orderBackup = orderBackup;

      // Emit order via socket only (don't clear data yet - wait for success/error event)
      emitCreateOrder(orderData);
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

  // If there's an incomplete order and we're not adding to it, block menu access
  // Only allow menu access if addToOrderParam (order ID) is in the URL
  if (
    incompleteOrder &&
    incompleteOrder.status !== "CANCELLED" &&
    incompleteOrder.status !== "COMPLETED" &&
    !addToOrderParam
  ) {
    // Block menu access - show message instead
    // Don't show order ID for security - only the person who created the order has the link
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isRTL ? "طلب قيد التنفيذ" : "Order in Progress"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL
              ? "يوجد طلب قيد التنفيذ لهذه الطاولة. لإضافة عناصر للطلب، يرجى استخدام رابط الطلب الذي تم إرساله لك."
              : "There is an order in progress for this table. To add items to the order, please use the order link that was sent to you."}
          </p>
        </Card>
      </div>
    );
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
            menuTheme?.backgroundColor || DEFAULT_THEME.backgroundColor,
            colorOpacity.background,
          ),
          backgroundImage: menuTheme?.backgroundImage
            ? `url(${menuTheme.backgroundImage})`
            : `url(${DEFAULT_THEME.backgroundImage})`,
          backgroundPosition:
            menuTheme?.backgroundPosition || DEFAULT_THEME.backgroundPosition,
          backgroundSize:
            menuTheme?.backgroundSize || DEFAULT_THEME.backgroundSize,
          backgroundRepeat:
            menuTheme?.backgroundRepeat || DEFAULT_THEME.backgroundRepeat,
          color: hexToRgba(
            menuTheme?.textColor || DEFAULT_THEME.textColor,
            colorOpacity.text,
          ),
          fontFamily: menuTheme?.fontFamily || DEFAULT_THEME.fontFamily,
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
              height: "200vh",
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
            restaurantCurrency={restaurantCurrency}
            currencyExchanges={currencyExchanges}
            selectedCurrency={selectedPaymentCurrency}
            onCurrencyChange={handleCurrencyChange}
          />

          <div className="max-w-7xl pt-[70px] sm:pt-[100px] mx-auto px-4 sm:px-6 lg:px-8 pb-24">
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
                {/* Search Bar */}
                <div className="mb-6 max-w-2xl mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        isRTL ? "ابحث عن وجبتك..." : "Search for your meal..."
                      }
                      className="w-full text-black px-4 py-3 ltr:pr-12 rtl:pl-12 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: hexToRgba(
                          menuTheme?.backgroundColor || "#ffffff",
                          0.9,
                        ),
                        borderColor: hexToRgba(
                          menuTheme?.secondaryColor || "#e5e7eb",
                          colorOpacity.secondary,
                        ),
                      }}
                    />
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} ${searchQuery.trim().length > 0 ? "ltr:right-4 rtl:left-4" : ""}`}
                    >
                      {isSearching ? (
                        <div
                          className="animate-spin rounded-full h-5 w-5 border-b-2"
                          style={{
                            borderColor: menuTheme?.primaryColor || "#f6b23c",
                          }}
                        ></div>
                      ) : searchQuery.trim().length > 0 ? (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="hover:opacity-70 mt-2 transition-opacity"
                          aria-label={isRTL ? "مسح البحث" : "Clear search"}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color: menuTheme?.secondaryColor || "#6b7280",
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          style={{
                            color: menuTheme?.secondaryColor || "#6b7280",
                          }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="mb-8">
                    <h3
                      className="text-lg font-semibold mb-4"
                      style={{
                        color: hexToRgba(
                          menuTheme?.textColor || "#1f2937",
                          colorOpacity.text,
                        ),
                      }}
                    >
                      {isRTL
                        ? `نتائج البحث (${searchResults.length})`
                        : `Search Results (${searchResults.length})`}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
                      {searchResults.map((item) => (
                        <MenuItem
                          key={item.id}
                          item={item}
                          currency={restaurantCurrency}
                          selectedCurrency={selectedPaymentCurrency}
                          currencyExchanges={currencyExchanges}
                          onAddToOrder={addItemToOrder}
                          onItemClick={handleItemClick}
                          isRTL={isRTL}
                          theme={menuTheme || undefined}
                          colorOpacity={colorOpacity}
                        />
                      ))}
                    </div>
                    <div
                      className="border-t-2 pt-6 mb-6"
                      style={{
                        borderColor: hexToRgba(
                          menuTheme?.secondaryColor || "#e5e7eb",
                          0.3,
                        ),
                      }}
                    ></div>
                  </div>
                )}

                {/* Categories Title */}
                {showSearchResults && searchResults.length > 0 && (
                  <h3
                    className="text-lg font-semibold mb-4 text-center"
                    style={{
                      color: hexToRgba(
                        menuTheme?.textColor || "#1f2937",
                        colorOpacity.text,
                      ),
                    }}
                  >
                    {isRTL ? "أو اختر من الفئات" : "Or choose from categories"}
                  </h3>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {menus.map((menu) =>
                    menu.categories.map((category) => (
                      <div
                        key={category.id}
                        className={`shadow-sm border cursor-pointer hover:shadow-md transition-shadow relative ${menuTheme?.borderRadius || "rounded-lg"} ${menuTheme?.cardPadding || "p-4"} ${loadingCategory === category.id ? "opacity-75" : ""}`}
                        style={{
                          backgroundColor: hexToRgba(
                            menuTheme?.primaryColor || "#ffffff",
                            colorOpacity.primary,
                          ),
                          borderColor: hexToRgba(
                            menuTheme?.secondaryColor || "#e5e7eb",
                            colorOpacity.secondary,
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
                                colorOpacity.text,
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
                    )),
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
                          colorOpacity.text,
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
                            colorOpacity.secondary,
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

                {/* Category Search Bar */}
                {selectedCategory.items &&
                  selectedCategory.items.length > 0 && (
                    <div className="mb-6 max-w-2xl mx-auto">
                      <div className="relative">
                        <input
                          type="text"
                          value={categorySearchQuery}
                          onChange={(e) =>
                            setCategorySearchQuery(e.target.value)
                          }
                          placeholder={
                            isRTL
                              ? "ابحث عن العناصر في هذه الفئة..."
                              : "Search items in this category..."
                          }
                          className="w-full !text-black px-4 py-3 ltr:pr-12 rtl:pl-12 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: hexToRgba(
                              menuTheme?.backgroundColor || "#ffffff",
                              0.9,
                            ),
                            borderColor: hexToRgba(
                              menuTheme?.secondaryColor || "#e5e7eb",
                              colorOpacity.secondary,
                            ),
                            color: menuTheme?.textColor || "#1f2937",
                          }}
                        />
                        <div className="absolute !text-black inset-y-0 ltr:right-0 rtl:left-0 flex items-center ltr:pr-3 rtl:pl-3 pointer-events-none">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color: "#6b7280",
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

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
                  <MenuLoadingSkeleton menuTheme={menuTheme} />
                ) : selectedCategory.items &&
                  selectedCategory.items.length > 0 ? (
                  (() => {
                    // Filter items based on category search query
                    const filteredItems = selectedCategory.items.filter(
                      (item) => {
                        if (!categorySearchQuery.trim()) return true;
                        const searchLower = categorySearchQuery
                          .toLowerCase()
                          .trim();
                        const nameMatch = item.name
                          ?.toLowerCase()
                          .includes(searchLower);
                        const nameArMatch = item.nameAr
                          ?.toLowerCase()
                          .includes(searchLower);
                        const descriptionMatch = item.description
                          ?.toLowerCase()
                          .includes(searchLower);
                        const descriptionArMatch = item.descriptionAr
                          ?.toLowerCase()
                          .includes(searchLower);
                        return (
                          nameMatch ||
                          nameArMatch ||
                          descriptionMatch ||
                          descriptionArMatch
                        );
                      },
                    );

                    return filteredItems.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filteredItems.map((item) => (
                          <MenuItem
                            key={item.id}
                            item={item}
                            currency={restaurantCurrency}
                            selectedCurrency={selectedPaymentCurrency}
                            currencyExchanges={currencyExchanges}
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
                        <p
                          style={{
                            color: hexToRgba(
                              menuTheme?.secondaryColor || "#6b7280",
                              colorOpacity.secondary,
                            ),
                          }}
                        >
                          {isRTL
                            ? "لا توجد نتائج للبحث"
                            : "No search results found"}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "لا توجد عناصر في هذه الفئة"
                        : "No items available in this category"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed bottom actions: Waiter at far left, Back to categories at far right (above order bar when present) */}
          <div
            className={`fixed inset-x-0 z-[60] pointer-events-none ${
              orderItems.length > 0 ? "bottom-36" : "bottom-16"
            }`}
          >
            <div className="absolute left-4 pointer-events-auto">
              {isAuthorizedAccess && tableNumber !== "DELIVERY" && (
                <WaiterRequestButton
                  restaurantId={restaurantId}
                  tableNumber={tableNumber || undefined}
                  orderType="DINE_IN"
                  menuTheme={menuTheme}
                  className="shadow-lg"
                />
              )}
            </div>
            <div className="absolute right-4 pointer-events-auto">
              {selectedCategory && (
                <button
                  onClick={handleBackToCategories}
                  className="shadow-lg hover:shadow-xl rounded-full w-14 h-14 flex items-center justify-center transition-all duration-200"
                  style={{
                    backgroundColor:
                      menuTheme?.accentColor || "var(--theme-accent)",
                    color: menuTheme?.textColor || "#ffffff",
                    border: `2px solid ${menuTheme?.secondaryColor || "#2797dd"}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      menuTheme?.secondaryColor || "var(--theme-secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      menuTheme?.accentColor || "var(--theme-accent)";
                  }}
                  aria-label={isRTL ? "الرجوع للفئات" : "Back to categories"}
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
              )}
            </div>
          </div>

          {/* Floating Order Summary */}
          {showOrderSummary && orderItems.length > 0 && (
            <FloatingOrderSummary
              orderItems={orderItems}
              total={calculateTotal()}
              currency={restaurantCurrency}
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
              currencyExchanges={currencyExchanges}
              selectedPaymentCurrency={selectedPaymentCurrency}
              setSelectedPaymentCurrency={setSelectedPaymentCurrency}
            />
          )}
        </div>
      </div>
    </>
  );
}
