"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicApi, endpoints } from "@/lib/api";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

import { MenuItem } from "@/components/customer/MenuItem";
import { OrderSummary } from "@/components/customer/OrderSummary";
import { OrderStatus } from "@/components/customer/OrderStatus";
import { RestaurantHeader } from "@/components/customer/RestaurantHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import WaiterRequestButton from "@/components/customer/WaiterRequestButton";
import toast from "react-hot-toast";
import { hexToRgba } from "@/lib/helper";
import { formatCurrencyWithLanguage, formatDateTime } from "@/lib/utils";
import html2canvas from "html2canvas";

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
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  items: MenuItem[];
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
  customCSS?: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  extras?: any;
}

interface Order {
  id: string;
  orderType: string;
  tableNumber?: string;
  qrCodeId?: string;
  status: string;
  subtotal?: number | string;
  taxes?: Array<{
    name: string;
    nameAr?: string;
    percentage: number;
    amount: number;
  }>;
  totalPrice: number | string;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  restaurant: {
    id: string;
    name: string;
    nameAr?: string;
    currency?: string;
  };
  items: {
    id: string;
    quantity: number;
    price: number;
    discount?: number | null;
    notes?: string;
    isCustomItem?: boolean;
    customItemName?: string;
    customItemNameAr?: string;
    menuItem?: {
      id: string;
      name: string;
      nameAr?: string;
      price: number;
      discount?: number;
    };
  }[];
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params as { orderId: string };

  const { language, t, isRTL } = useLanguage();
  const { joinRestaurant, joinTable, emitCreateOrder } = useCustomerSocket();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");
  const [currencyExchanges, setCurrencyExchanges] = useState<any[]>([]);
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<
    string | null
  >(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuTheme, setMenuTheme] = useState<MenuTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurantTaxes, setRestaurantTaxes] = useState<any[]>([]);
  const [showAddItems, setShowAddItems] = useState(false);
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isAddingItems, setIsAddingItems] = useState(false);
  // Color opacity states (load from theme or default to 1)
  const [colorOpacity, setColorOpacity] = useState({
    primary: 1, // 100% opacity
    secondary: 1, // 100% opacity
    background: 1, // 100% opacity
    text: 1, // 100% opacity
    accent: 1, // 100% opacity
  });

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

  useEffect(() => {
    loadOrderData();
  }, [orderId]);

  useEffect(() => {
    if (order?.restaurant?.id) {
      joinRestaurant(order.restaurant.id);
    }
  }, [order?.restaurant?.id, joinRestaurant]);

  // Update restaurant currency when order data changes
  useEffect(() => {
    if (order?.restaurant?.currency) {
      setRestaurantCurrency(order.restaurant.currency);
    } else if (order?.currency) {
      setRestaurantCurrency(order.currency);
    }
  }, [order?.restaurant?.currency, order?.currency]);

  // Update selected payment currency when restaurant currency changes
  useEffect(() => {
    if (!restaurantCurrency || !order?.restaurant?.id) return;

    // Always try to load from localStorage first, then fall back to restaurant currency
    // This ensures we use the user's saved selection or the correct restaurant currency
    try {
      const savedCurrency = localStorage.getItem(
        `selectedCurrency_${order.restaurant.id}`
      );

      // Determine what currency to use
      let currencyToUse = restaurantCurrency;

      if (savedCurrency) {
        currencyToUse = savedCurrency;
      }

      // Only update if different from current selection to avoid unnecessary re-renders
      // This handles the case where USD is set as default but restaurant currency is different
      setSelectedPaymentCurrency((currentCurrency) => {
        // If current is null or USD (default) and restaurant currency is different, update it
        if (
          !currentCurrency ||
          (currentCurrency === "USD" && restaurantCurrency !== "USD")
        ) {
          return currencyToUse;
        }
        // If we have a saved currency, use it
        if (savedCurrency && savedCurrency !== currentCurrency) {
          return savedCurrency;
        }
        // Otherwise, keep current selection
        return currentCurrency;
      });
    } catch (error) {
      console.error("Failed to load selected currency:", error);
      // Fall back to restaurant currency on error
      setSelectedPaymentCurrency((currentCurrency) => {
        if (
          !currentCurrency ||
          (currentCurrency === "USD" && restaurantCurrency !== "USD")
        ) {
          return restaurantCurrency;
        }
        return currentCurrency;
      });
    }
  }, [restaurantCurrency, order?.restaurant?.id]);

  // Handle browser back button - redirect to menu with order ID
  useEffect(() => {
    if (!order?.restaurant?.id || !order?.id) return;

    // Push current state to history to enable back button detection
    window.history.pushState(
      { page: "order-details", orderId: order.id },
      "",
      window.location.href
    );

    const handlePopState = (event: PopStateEvent) => {
      // Navigate to menu page with order ID (same as "Add Items" button)
      const tableParam =
        order.orderType === "DELIVERY" ? "DELIVERY" : order.tableNumber;

      if (tableParam) {
        router.push(
          `/menu/${order.restaurant.id}?tableNumber=${tableParam}&addToOrder=${order.id}`
        );
      } else {
        // Fallback to restaurant QR
        router.push(
          `/menu/${order.restaurant.id}?tableNumber=DELIVERY&addToOrder=${order.id}`
        );
      }
    };

    // Add popstate listener
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    order?.restaurant?.id,
    order?.id,
    order?.orderType,
    order?.tableNumber,
    router,
  ]);

  // Function to play customer notification sound
  const playCustomerNotification = (status: string) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different statuses
      let frequency1 = 400;
      let frequency2 = 600;
      let duration = 0.4;

      switch (status) {
        case "PENDING":
          frequency1 = 400;
          frequency2 = 500;
          duration = 0.3;
          break;
        case "PREPARING":
          frequency1 = 500;
          frequency2 = 600;
          duration = 0.4;
          break;
        case "READY":
          frequency1 = 600;
          frequency2 = 800;
          duration = 0.5;
          break;
        case "DELIVERED":
        case "COMPLETED":
          frequency1 = 600;
          frequency2 = 800;
          frequency1 = 800; // Success sound
          duration = 0.6;
          break;
        default:
          frequency1 = 400;
          frequency2 = 600;
          duration = 0.4;
      }

      oscillator.frequency.setValueAtTime(frequency1, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(
        frequency2,
        audioContext.currentTime + 0.1
      );
      if (status === "DELIVERED" || status === "COMPLETED") {
        oscillator.frequency.setValueAtTime(
          1000,
          audioContext.currentTime + 0.2
        );
      }

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log("Could not play customer notification sound:", error);
    }
  };

  useEffect(() => {
    // Listen for order status updates
    const handleOrderStatusUpdate = (event: CustomEvent) => {
      const { order: updatedOrder, updatedBy } = event.detail;
      console.log("Order status update received:", updatedOrder);
      if (updatedOrder.id === orderId) {
        console.log("Updating order status to:", updatedOrder.status);

        // Play notification sound for all updates (restaurant AND customer)
        playCustomerNotification(updatedOrder.status);

        // Show toast for customer updates (when adding items)
        if (updatedBy === "customer") {
          toast.success(isRTL ? "تم تحديث الطلب" : "Order updated", {
            icon: "➕",
            duration: 2000,
          });
        }

        // If order is cancelled or completed, redirect to QR scanner
        if (
          updatedOrder.status === "CANCELLED" ||
          updatedOrder.status === "COMPLETED"
        ) {
          if (updatedOrder.restaurant?.id) {
            // Redirect to menu page without tableNumber to force QR scan
            router.push(`/menu/${updatedOrder.restaurant.id}`);
          } else {
            router.push("/");
          }
          return;
        }

        // Merge the updated order with existing order data to preserve restaurant info
        setOrder((prevOrder) => {
          if (prevOrder) {
            const mergedOrder = {
              ...updatedOrder,
              restaurant: updatedOrder.restaurant || prevOrder.restaurant,
            };

            // Update currency from updated order if available
            // The useEffect hook will handle currency updates automatically
            if (
              mergedOrder.restaurant?.currency &&
              mergedOrder.restaurant.currency !== restaurantCurrency
            ) {
              setRestaurantCurrency(mergedOrder.restaurant.currency);
            } else if (
              mergedOrder.currency &&
              mergedOrder.currency !== restaurantCurrency
            ) {
              setRestaurantCurrency(mergedOrder.currency);
            }

            return mergedOrder;
          }

          // Update currency from new order if available
          if (
            updatedOrder.restaurant?.currency &&
            updatedOrder.restaurant.currency !== restaurantCurrency
          ) {
            setRestaurantCurrency(updatedOrder.restaurant.currency);
          } else if (
            updatedOrder.currency &&
            updatedOrder.currency !== restaurantCurrency
          ) {
            setRestaurantCurrency(updatedOrder.currency);
          }

          return updatedOrder;
        });
      }
    };

    window.addEventListener(
      "orderStatusUpdate",
      handleOrderStatusUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "orderStatusUpdate",
        handleOrderStatusUpdate as EventListener
      );
    };
  }, [orderId]);

  // Join restaurant and table rooms for real-time updates
  useEffect(() => {
    console.log("🔍 Order data for socket joining:", {
      restaurantId: order?.restaurant?.id,
      qrCodeId: order?.qrCodeId,
      orderType: order?.orderType,
      hasQrCodeId: !!order?.qrCodeId,
    });

    if (order?.restaurant?.id) {
      console.log("🔔 Joining restaurant room:", order.restaurant.id);
      // Join restaurant room to receive order updates
      joinRestaurant(order.restaurant.id);

      // For dine-in orders, also join table room to receive updates
      if (order.qrCodeId) {
        console.log("🔔 Joining table room:", order.qrCodeId);
        joinTable(order.qrCodeId);
      } else {
        console.warn("⚠️ qrCodeId is missing! Order details:", {
          orderId: order?.id,
          orderType: order?.orderType,
          tableNumber: order?.tableNumber,
        });
      }
    }
  }, [order?.restaurant?.id, order?.qrCodeId, joinRestaurant, joinTable]);

  // Get currency display name (translated)
  const getCurrencyDisplayName = (currencyCode: string): string => {
    // Use formatCurrencyWithLanguage to get translated name, then extract just the name
    const formatted = formatCurrencyWithLanguage(0, currencyCode, language);
    // Extract currency name (everything after the number)
    const parts = formatted.split(" ");
    return parts.slice(1).join(" ") || currencyCode;
  };

  // Calculate total in selected currency
  const calculateTotalInCurrency = (
    totalInBaseCurrency: number,
    selectedCurrency: string | null
  ): { amount: number; currency: string } => {
    if (!selectedCurrency || selectedCurrency === restaurantCurrency) {
      return { amount: totalInBaseCurrency, currency: restaurantCurrency };
    }

    const currencyExchange = currencyExchanges.find(
      (ce) =>
        ce.currency.toUpperCase() === selectedCurrency.toUpperCase() &&
        ce.isActive
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

  const loadOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load order details
      const orderResponse = await publicApi.get(
        endpoints.orders.track(orderId)
      );
      const orderData = orderResponse.data.data.order;
      setOrder(orderData);

      // Extract currency from restaurant if available
      let currentRestaurantCurrency = "USD";
      if (orderData.restaurant?.currency) {
        currentRestaurantCurrency = orderData.restaurant.currency;
        setRestaurantCurrency(orderData.restaurant.currency);
      } else if (orderData.currency) {
        currentRestaurantCurrency = orderData.currency;
        setRestaurantCurrency(orderData.currency);
      }

      // Set customer details if available
      if (orderData.customerName) setCustomerName(orderData.customerName);
      if (orderData.customerPhone) setCustomerPhone(orderData.customerPhone);
      if (orderData.customerAddress)
        setCustomerAddress(orderData.customerAddress);
      if (orderData.notes) setOrderNotes(orderData.notes);

      // Load menu data for adding items (only for DINE_IN orders)
      if (orderData.orderType === "DINE_IN" && orderData.tableNumber) {
        const menuResponse = await publicApi.get(
          endpoints.public.menuCategories(orderData.restaurant.id)
        );
        const { restaurant, categories, menuTheme, currency } =
          menuResponse.data.data;

        setRestaurant(restaurant);
        setMenuTheme(menuTheme);

        // Update currency from menu response if available
        if (currency) {
          currentRestaurantCurrency = currency;
          setRestaurantCurrency(currency);
        } else if (restaurant?.currency) {
          currentRestaurantCurrency = restaurant.currency;
          setRestaurantCurrency(restaurant.currency);
        }

        // Update CSS custom properties with restaurant theme (or default)
        updateThemeVariables(menuTheme);

        setMenus([
          {
            id: "main-menu",
            name: "Main Menu",
            nameAr: "القائمة الرئيسية",
            categories: categories,
          },
        ]);
      } else {
        // For DELIVERY orders, still need to load restaurant and theme data
        try {
          const menuResponse = await publicApi.get(
            endpoints.public.menuCategories(orderData.restaurant.id)
          );
          const { restaurant, menuTheme, currency } = menuResponse.data.data;

          setRestaurant(restaurant);
          setMenuTheme(menuTheme);

          // Update currency from menu response if available
          if (currency) {
            currentRestaurantCurrency = currency;
            setRestaurantCurrency(currency);
          } else if (restaurant?.currency) {
            currentRestaurantCurrency = restaurant.currency;
            setRestaurantCurrency(restaurant.currency);
          }

          // Update CSS custom properties with restaurant theme (or default)
          updateThemeVariables(menuTheme);
        } catch (menuError) {
          console.error(
            "Error loading menu data for delivery order:",
            menuError
          );
        }
      }

      // Get restaurant taxes from order response (if available) or calculate from totalPrice
      // The /track endpoint returns subtotal and taxes, so we can derive tax percentages
      if (orderData.taxes && Array.isArray(orderData.taxes) && orderData.taxes.length > 0) {
        // Use taxes from order response
        setRestaurantTaxes(orderData.taxes.map((tax: any) => ({
          name: tax.name || "",
          nameAr: tax.nameAr || tax.name || "",
          percentage: tax.percentage || 0,
        })));
      } else if (orderData.subtotal && orderData.totalPrice) {
        // If taxes are not available, calculate from subtotal and totalPrice
        // taxPercentage = ((totalPrice - subtotal) / subtotal) * 100
        const subtotalNum = Number(orderData.subtotal);
        const totalPriceNum = Number(orderData.totalPrice);
        if (subtotalNum > 0 && totalPriceNum > subtotalNum) {
          const totalTaxPercentage = ((totalPriceNum - subtotalNum) / subtotalNum) * 100;
          // Create a single tax entry with the calculated percentage
          setRestaurantTaxes([{
            name: isRTL ? "ضريبة" : "Tax",
            nameAr: "ضريبة",
            percentage: totalTaxPercentage,
          }]);
        }
      }

      // Fetch currency exchanges for ALL order types (DINE_IN and DELIVERY)
      if (orderData.restaurant?.id) {
        try {
          const currencyResponse = await publicApi.get(
            `/public/restaurant/${orderData.restaurant.id}/currency-exchanges`
          );
          if (currencyResponse.data.success) {
            // Filter only active currencies
            const activeCurrencies = currencyResponse.data.data.filter(
              (ce: any) => ce.isActive === true
            );
            setCurrencyExchanges(activeCurrencies);
          }
            
            // Load selected currency from localStorage, or use restaurant default currency
          // This should happen regardless of whether exchanges were fetched successfully
            try {
              const savedCurrency = localStorage.getItem(
                `selectedCurrency_${orderData.restaurant.id}`
              );
              if (savedCurrency) {
                setSelectedPaymentCurrency(savedCurrency);
              } else {
                // Default to restaurant's base currency if no saved currency
              // Use currentRestaurantCurrency which is already updated
              setSelectedPaymentCurrency(currentRestaurantCurrency);
              }
            } catch (currencyError) {
              console.error("Failed to load selected currency:", currencyError);
              // Default to restaurant's base currency on error
            setSelectedPaymentCurrency(currentRestaurantCurrency);
          }
        } catch (currencyError) {
          console.error("Error fetching currency exchanges:", currencyError);
          // Set default currency even if exchanges fail
          setSelectedPaymentCurrency(currentRestaurantCurrency);
        }
      } else {
        // If no restaurant ID, still set the default currency
        setSelectedPaymentCurrency(currentRestaurantCurrency);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "فشل في تحميل الطلب" : "Failed to load order");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (order?.restaurant?.id) {
      // Always redirect to menu page without tableNumber to force QR scan for security
      router.push(`/menu/${order.restaurant.id}`);
    } else {
      router.push("/");
    }
  };

  // Function to export invoice as image
  const exportInvoice = async () => {
    if (!invoiceRef.current || !order) return;

    try {
      // Temporarily make the invoice visible for capturing
      invoiceRef.current.style.position = "fixed";
      invoiceRef.current.style.top = "0";
      invoiceRef.current.style.left = "0";
      invoiceRef.current.style.opacity = "1";
      invoiceRef.current.style.zIndex = "9999";

      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
      });

      // Hide it again
      invoiceRef.current.style.position = "fixed";
      invoiceRef.current.style.opacity = "0";
      invoiceRef.current.style.zIndex = "-50";

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${isRTL ? "فاتورة" : "invoice"}_${orderId.slice(-8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(
          isRTL ? "تم تحميل الفاتورة بنجاح" : "Invoice downloaded successfully"
        );
      });
    } catch (error) {
      console.error("Error exporting invoice:", error);
      toast.error(isRTL ? "حدث خطأ أثناء التصدير" : "Error exporting invoice");

      // Make sure to hide it even if there's an error
      if (invoiceRef.current) {
        invoiceRef.current.style.opacity = "0";
        invoiceRef.current.style.zIndex = "-50";
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadOrderData} />;
  }

  if (!order) {
    return (
      <ErrorMessage
        message={isRTL ? "الطلب غير موجود" : "Order not found"}
        onRetry={loadOrderData}
      />
    );
  }

  if (!order.restaurant) {
    return (
      <ErrorMessage
        message={
          isRTL
            ? "معلومات المطعم غير موجودة"
            : "Restaurant information not found"
        }
        onRetry={loadOrderData}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        fontFamily: isRTL
          ? "var(--font-cairo), Arial, sans-serif"
          : "var(--font-inter), system-ui, sans-serif",
      }}
      dir={isRTL ? "rtl" : "ltr"}
      lang={language}
    >
      {/* Header */}
      <RestaurantHeader
        restaurant={restaurant}
        menuTheme={menuTheme}
        tableNumber={order.tableNumber}
        colorOpacity={colorOpacity}
        restaurantCurrency={restaurantCurrency}
        currencyExchanges={currencyExchanges}
        selectedCurrency={selectedPaymentCurrency}
        onCurrencyChange={(currency) => {
          setSelectedPaymentCurrency(currency);
          // Save to localStorage
          try {
            if (currency && order?.restaurant?.id) {
              localStorage.setItem(
                `selectedCurrency_${order.restaurant.id}`,
                currency
              );
            } else if (order?.restaurant?.id) {
              localStorage.removeItem(
                `selectedCurrency_${order.restaurant.id}`
              );
            }
          } catch (error) {
            console.error("Failed to save selected currency:", error);
          }
        }}
      />

      {/* Fixed Download Invoice Button */}
      <div className="fixed top-[70px] sm:top-[80px] left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Button
            onClick={exportInvoice}
            className="w-full sm:w-auto flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all text-white"
            style={{
              backgroundColor: menuTheme?.primaryColor || "#f58114",
              color: menuTheme?.textColor || "#ffffff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                menuTheme?.secondaryColor || "#2797dd";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                menuTheme?.primaryColor || "#f58114";
            }}
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isRTL ? "تحميل الفاتورة" : "Download Invoice"}
          </Button>
        </div>
      </div>

      {/* Invoice Content (for export) - Hidden but in DOM */}
      {order && (
        <div
          ref={invoiceRef}
          className="fixed opacity-0 pointer-events-none -z-50 bg-white p-8 rounded-lg w-[400px]"
          style={{ direction: isRTL ? "rtl" : "ltr" }}
        >
          {/* Restaurant Name */}
          <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRTL
                ? order.restaurant?.nameAr || order.restaurant?.name
                : order.restaurant?.name}
            </h1>
            <p className="text-sm text-gray-600">
              {isRTL ? "فاتورة" : "Invoice"}
            </p>
          </div>

          {/* Order Info */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">
                {isRTL ? "رقم الطلب:" : "Order ID:"}
              </p>
              <p className="font-semibold text-gray-900">
                #{orderId.slice(-8)}
              </p>
            </div>
            {order.tableNumber && (
              <div>
                <p className="text-gray-600">{isRTL ? "الطاولة:" : "Table:"}</p>
                <p className="font-semibold text-gray-900">
                  {order.tableNumber}
                </p>
              </div>
            )}
            <div>
              <p className="text-gray-600">{isRTL ? "التاريخ:" : "Date:"}</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">{isRTL ? "الحالة:" : "Status:"}</p>
              <p className="font-semibold text-gray-900">
                {order.status === "PENDING"
                  ? isRTL
                    ? "في الانتظار"
                    : "Pending"
                  : order.status === "PREPARING"
                    ? isRTL
                      ? "قيد التحضير"
                      : "Preparing"
                    : order.status === "READY"
                      ? isRTL
                        ? "جاهز"
                        : "Ready"
                      : order.status === "DELIVERED"
                        ? isRTL
                          ? "في الطريق"
                          : "On the way"
                        : order.status === "COMPLETED"
                          ? isRTL
                            ? "مكتمل"
                            : "Completed"
                          : order.status}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <table className="w-full text-sm">
              <thead className="border-b-2 border-gray-300">
                <tr>
                  <th
                    className={`py-2 font-semibold text-gray-700 ${isRTL ? "text-right" : "text-left"}`}
                  >
                    {isRTL ? "العنصر" : "Item"}
                  </th>
                  <th className="py-2 text-center font-semibold text-gray-700">
                    {isRTL ? "الكمية" : "Qty"}
                  </th>
                  <th
                    className={`py-2 font-semibold text-gray-700 ${isRTL ? "text-left" : "text-right"}`}
                  >
                    {isRTL ? "السعر" : "Price"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => {
                  const itemName = item.isCustomItem
                    ? isRTL && item.customItemNameAr
                      ? item.customItemNameAr
                      : item.customItemName || "Custom Item"
                    : isRTL && item.menuItem?.nameAr
                      ? item.menuItem.nameAr
                      : item.menuItem?.name || "Item";

                  return (
                    <tr key={item.id} className="border-b border-gray-200">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{itemName}</p>
                        {item.notes && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </td>
                      <td className="text-center py-3 text-gray-900">
                        {item.quantity}
                      </td>
                      <td
                        className={`py-3 text-gray-900 ${isRTL ? "text-left" : "text-right"}`}
                      >
                        {(() => {
                          // Check if item has discount for display purposes
                          const itemDiscount = item.discount || (item.menuItem?.discount || 0);
                          const hasDiscount =
                            !item.isCustomItem &&
                            itemDiscount > 0 &&
                            item.menuItem?.price;

                          // item.price is TAX-INCLUSIVE (stored in database, AFTER discount if any)
                          const totalTaxPercentage = restaurantTaxes.reduce((sum, tax) => {
                            return sum + (tax.percentage || 0);
                          }, 0);

                          if (hasDiscount && item.menuItem?.price) {
                            // For items with discount:
                            // - item.price = tax-inclusive price AFTER discount (what customer pays)
                            // - item.menuItem.price = original tax-inclusive price (before discount)
                            const discountedPriceInclusive = Number(item.price); // Already includes discount and tax
                            const originalPriceInclusive = Number(item.menuItem.price); // Original price with tax
                            
                            // Calculate totals (per item * quantity)
                            const discountedTotal = discountedPriceInclusive * item.quantity;
                            const originalTotal = originalPriceInclusive * item.quantity;
                            
                            // Display: original price (strikethrough) and discounted price (red, what customer pays)
                            const originalDisplayPrice = calculateTotalInCurrency(
                              originalTotal,
                              selectedPaymentCurrency
                            );
                            const originalPriceDisplay = formatCurrencyWithLanguage(
                              originalDisplayPrice.amount,
                              originalDisplayPrice.currency,
                              language
                            );

                            const discountedDisplayPrice = calculateTotalInCurrency(
                              discountedTotal,
                              selectedPaymentCurrency
                            );
                            const discountedPriceDisplay = formatCurrencyWithLanguage(
                              discountedDisplayPrice.amount,
                              discountedDisplayPrice.currency,
                              language
                            );

                            // Display original price (tax-inclusive, before discount) with strikethrough and discounted price (tax-inclusive, after discount) in red
                            return (
                              <div className={`flex flex-col gap-0.5 ${isRTL ? "items-start" : "items-end"}`}>
                                <span className="line-through text-gray-400 text-xs">
                                  {originalPriceDisplay}
                                </span>
                                <span className="text-red-600 font-semibold">
                                  {discountedPriceDisplay}
                                </span>
                              </div>
                            );
                          }

                          // No discount - display price without tax (rounded to nearest integer) for consistency with subtotal calculation
                          const itemPriceInclusive = Number(item.price);
                          const itemPriceWithoutTax = totalTaxPercentage > 0
                            ? itemPriceInclusive / (1 + totalTaxPercentage / 100)
                            : itemPriceInclusive;
                          
                          // Round to nearest integer for each item total (without tax) * quantity
                          const basePrice = Math.round(itemPriceWithoutTax * item.quantity);
                          const displayPrice = calculateTotalInCurrency(
                            basePrice,
                            selectedPaymentCurrency
                          );
                          return formatCurrencyWithLanguage(
                            displayPrice.amount,
                            displayPrice.currency,
                            language
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                {(() => {
                  // Calculate subtotal from items (rounded) and taxes to match totalPrice
                  const totalPrice = Number(order.totalPrice || 0);
                  
                  // Calculate total tax percentage from restaurant settings
                  const totalTaxPercentage = restaurantTaxes.reduce((sum, tax) => {
                    return sum + (tax.percentage || 0);
                  }, 0);
                  
                  // Calculate subtotal from sum of all items (rounded, without tax)
                  const subtotalFromItems = order.items.reduce((sum, item) => {
                    const itemPriceInclusive = Number(item.price);
                    const itemPriceWithoutTax = totalTaxPercentage > 0
                      ? itemPriceInclusive / (1 + totalTaxPercentage / 100)
                      : itemPriceInclusive;
                    // Round to nearest integer for each item total
                    return sum + Math.round(itemPriceWithoutTax * item.quantity);
                  }, 0);
                  
                  // Use rounded subtotal from items
                  const baseSubtotal = subtotalFromItems;
                  
                  // Calculate taxes to ensure subtotal + taxes = totalPrice (exact match)
                  const calculatedTaxAmounts = restaurantTaxes.map((tax) => {
                    return baseSubtotal * ((tax.percentage || 0) / 100);
                  });
                  const totalCalculatedTaxes = calculatedTaxAmounts.reduce((sum, amount) => sum + amount, 0);
                  const taxDifference = totalPrice - baseSubtotal - totalCalculatedTaxes;
                  
                  // Calculate taxes with adjustment to match totalPrice exactly
                  const calculatedTaxes = restaurantTaxes.map((tax, index) => {
                    const baseTaxAmount = calculatedTaxAmounts[index];
                    // Distribute the difference proportionally
                    const adjustedTaxAmount = totalCalculatedTaxes > 0
                      ? baseTaxAmount + (taxDifference * (baseTaxAmount / totalCalculatedTaxes))
                      : baseTaxAmount;
                    return {
                      name: tax.name || "",
                      nameAr: tax.nameAr || tax.name || "",
                      percentage: tax.percentage || 0,
                      amount: adjustedTaxAmount,
                    };
                  });

                  return (
                    <>
                      {/* Always show subtotal (calculated from items) */}
                      <tr className="border-t border-gray-200">
                        <td className="py-2 text-sm text-gray-700">
                          {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                        </td>
                        <td></td>
                        <td
                          className={`py-2 text-sm text-gray-700 ${isRTL ? "text-left" : "text-right"}`}
                        >
                          {(() => {
                            const displaySubtotal = calculateTotalInCurrency(
                              baseSubtotal,
                              selectedPaymentCurrency
                            );
                            return formatCurrencyWithLanguage(
                              displaySubtotal.amount,
                              displaySubtotal.currency,
                              language
                            );
                          })()}
                        </td>
                      </tr>
                      {calculatedTaxes.length > 0 && (
                        <tr className="border-t-2 border-b-2 border-gray-400">
                          <td
                            colSpan={3}
                            className="py-3 px-3 bg-gray-50"
                            style={{ border: "2px solid #9ca3af" }}
                          >
                            <div className="mb-2">
                              <strong className="text-sm text-gray-900">
                                {isRTL ? "الضرائب:" : "Taxes:"}
                              </strong>
                            </div>
                            <div className="space-y-1">
                              {calculatedTaxes.map((tax: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-gray-700">
                                    {isRTL ? tax.nameAr || tax.name : tax.name} (
                                    {tax.percentage}%)
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {(() => {
                                      const displayTaxAmount =
                                        calculateTotalInCurrency(
                                          tax.amount,
                                          selectedPaymentCurrency
                                        );
                                      return formatCurrencyWithLanguage(
                                        displayTaxAmount.amount,
                                        displayTaxAmount.currency,
                                        language
                                      );
                                    })()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })()}
                <tr>
                  <td className="py-3 font-bold text-gray-900">
                    {isRTL ? "المجموع الكلي:" : "Total:"}
                  </td>
                  <td></td>
                  <td
                    className={`py-3 font-bold text-lg text-gray-900 ${isRTL ? "text-left" : "text-right"}`}
                  >
                    {(() => {
                      const baseTotal = Number(order.totalPrice);
                      const displayTotal = calculateTotalInCurrency(
                        baseTotal,
                        selectedPaymentCurrency
                      );
                      return formatCurrencyWithLanguage(
                        displayTotal.amount,
                        displayTotal.currency,
                        language
                      );
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>{isRTL ? "شكراً لزيارتكم" : "Thank you for your visit"}</p>
            <p className="mt-1">{new Date().toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[140px] sm:pt-[160px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Status */}
          <div className="lg:col-span-2">
            <OrderStatus
              orderId={order.id}
              status={order.status}
              tableNumber={order.tableNumber || ""}
              restaurantName={order.restaurant?.name || "Unknown Restaurant"}
              restaurantId={order.restaurant?.id}
              orderType={order.orderType}
              orderItems={order.items || []}
              subtotal={undefined}
              taxes={undefined}
              totalPrice={order.totalPrice?.toString()}
              restaurantTaxes={restaurantTaxes}
              currency={
                restaurantCurrency ||
                (order.restaurant as any)?.currency ||
                order.currency ||
                "USD"
              }
              currencyExchanges={currencyExchanges}
              selectedPaymentCurrency={selectedPaymentCurrency}
              menuTheme={menuTheme}
              onNewOrder={() => {
                // Navigate to menu page with appropriate tableNumber for adding items
                const tableParam =
                  order.orderType === "DELIVERY"
                    ? "DELIVERY"
                    : order.tableNumber;
                if (tableParam) {
                  router.push(
                    `/menu/${order.restaurant?.id}?tableNumber=${tableParam}&addToOrder=${order.id}`
                  );
                } else {
                  // Fallback to restaurant QR
                  router.push(
                    `/menu/${order.restaurant?.id}?tableNumber=DELIVERY`
                  );
                }
              }}
            />

            {/* Order Completed Message */}
            {order.status === "COMPLETED" && (
              <Card className="mt-8 p-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {isRTL ? "الطلب مكتمل" : "Order Completed"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {isRTL
                      ? "تم إكمال الطلب بنجاح. لطلب جديد، يرجى مسح رمز QR للطاولة مرة أخرى."
                      : "Order completed successfully. For a new order, please scan the table QR code again."}
                  </p>
                  <Button
                    onClick={() => router.push(`/menu/${order.restaurant?.id}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isRTL
                      ? "مسح رمز QR للطلب الجديد"
                      : "Scan QR for New Order"}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isRTL ? "تفاصيل الطلب" : "Order Details"}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "نوع الطلب" : "Order Type"}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.orderType === "DINE_IN"
                      ? isRTL
                        ? "داخل المطعم"
                        : "Dine In"
                      : isRTL
                        ? "توصيل"
                        : "Delivery"}
                  </p>
                </div>

                {order.tableNumber && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "رقم الطاولة" : "Table Number"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.tableNumber}
                    </p>
                  </div>
                )}

                {order.customerName && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "اسم العميل" : "Customer Name"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerName}
                    </p>
                  </div>
                )}

                {order.customerPhone && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "رقم الهاتف" : "Phone Number"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerPhone}
                    </p>
                  </div>
                )}

                {order.customerAddress && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "العنوان" : "Address"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.customerAddress}
                    </p>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "ملاحظات الطلب" : "Order Notes"}
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {order.notes}
                    </p>
                  </div>
                )}

                {/* Currency Selector */}
                {currencyExchanges.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {isRTL ? "عملة الدفع:" : "Payment Currency:"}
                    </label>
                    <select
                      value={selectedPaymentCurrency || restaurantCurrency}
                      onChange={(e) => {
                        const newCurrency =
                          e.target.value === restaurantCurrency
                            ? null
                            : e.target.value;
                        setSelectedPaymentCurrency(newCurrency);
                        // Save to localStorage
                        try {
                          if (newCurrency && order?.restaurant?.id) {
                            localStorage.setItem(
                              `selectedCurrency_${order.restaurant.id}`,
                              newCurrency
                            );
                          } else if (order?.restaurant?.id) {
                            localStorage.removeItem(
                              `selectedCurrency_${order.restaurant.id}`
                            );
                          }
                        } catch (error) {
                          console.error(
                            "Failed to save selected currency:",
                            error
                          );
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    >
                      <option value={restaurantCurrency}>
                        {getCurrencyDisplayName(restaurantCurrency)}{" "}
                        {isRTL ? "(أساسي)" : "(Base)"}
                      </option>
                      {currencyExchanges
                        .filter((ce) => ce.isActive)
                        .map((ce) => (
                          <option key={ce.id} value={ce.currency}>
                            {getCurrencyDisplayName(ce.currency)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "إجمالي الطلب" : "Total Amount"}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const baseTotal = Number(order.totalPrice);
                      const displayTotal = calculateTotalInCurrency(
                        baseTotal,
                        selectedPaymentCurrency
                      );
                      return (
                        <>
                          {formatCurrencyWithLanguage(
                            displayTotal.amount,
                            displayTotal.currency,
                            language
                          )}
                          {selectedPaymentCurrency &&
                            selectedPaymentCurrency !== restaurantCurrency && (
                              <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1">
                                (
                                {formatCurrencyWithLanguage(
                                  baseTotal,
                                  restaurantCurrency ||
                                    (order.restaurant as any)?.currency ||
                                    order.currency ||
                                    "USD",
                                  language
                                )}
                                )
                              </div>
                            )}
                        </>
                      );
                    })()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "وقت الطلب" : "Order Time"}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "حالة الطلب" : "Order Status"}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.status === "PENDING"
                      ? isRTL
                        ? "في الانتظار"
                        : "Pending"
                      : order.status === "PREPARING"
                        ? isRTL
                          ? "قيد التحضير"
                          : "Preparing"
                        : order.status === "READY"
                          ? isRTL
                            ? "جاهز"
                            : "Ready"
                          : order.status === "DELIVERED"
                            ? isRTL
                              ? "في الطريق"
                              : "On the way"
                            : order.status === "COMPLETED"
                              ? isRTL
                                ? "مكتمل"
                                : "Completed"
                              : order.status === "CANCELLED"
                                ? isRTL
                                  ? "ملغي"
                                  : "Cancelled"
                                : order.status}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Add Items Button (only for active orders) */}
      {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              // For delivery orders, use DELIVERY tableNumber; for dine-in, use actual tableNumber
              const tableParam =
                order.orderType === "DELIVERY" ? "DELIVERY" : order.tableNumber;
              const menuUrl = `/menu/${order.restaurant?.id}?tableNumber=${tableParam}&addToOrder=${order.id}`;
              router.push(menuUrl);
            }}
            className="flex items-center gap-1 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
            style={{
              backgroundColor:
                menuTheme?.primaryColor || defaultTheme.primaryColor,
              color: menuTheme?.textColor || defaultTheme.textColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                menuTheme?.primaryColor || defaultTheme.primaryColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                menuTheme?.secondaryColor || defaultTheme.secondaryColor;
            }}
            title={isRTL ? "إضافة عناصر للطلب" : "Add Items to Order"}
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className="hidden sm:inline">
              {isRTL ? "إضافة عناصر للطلب" : "Add Items to Order"}
            </span>
          </button>
        </div>
      )}

      {/* Floating Waiter Request Button (only for active orders and dine-in) */}
      {order.status !== "COMPLETED" &&
        order.status !== "CANCELLED" &&
        order.orderType === "DINE_IN" && (
          <div className="fixed bottom-6 left-6 z-50">
            <WaiterRequestButton
              restaurantId={order.restaurant?.id || ""}
              tableNumber={order.tableNumber || undefined}
              orderType="DINE_IN"
              menuTheme={menuTheme}
              className="shadow-lg"
            />
          </div>
        )}
    </div>
  );
}
