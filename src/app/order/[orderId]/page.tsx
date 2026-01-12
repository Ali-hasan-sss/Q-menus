"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicApi, endpoints } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MenuItem } from "@/components/customer/MenuItem";
import { OrderSummary } from "@/components/customer/OrderSummary";
import { OrderStatus } from "@/components/customer/OrderStatus";
import { RestaurantHeader } from "@/components/customer/RestaurantHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import WaiterRequestButton from "@/components/customer/WaiterRequestButton";
import toast from "react-hot-toast";
import { hexToRgba } from "@/lib/helper";
import { formatCurrencyWithLanguage } from "@/lib/utils";

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
    notes?: string;
    isCustomItem?: boolean;
    customItemName?: string;
    customItemNameAr?: string;
    menuItem?: {
      id: string;
      name: string;
      nameAr?: string;
      price: number;
    };
  }[];
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { orderId } = params as { orderId: string };

  const { language, t, isRTL } = useLanguage();
  const { joinRestaurant, joinTable, emitCreateOrder } = useCustomerSocket();

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
            if (mergedOrder.restaurant?.currency) {
              setRestaurantCurrency(mergedOrder.restaurant.currency);
            } else if (mergedOrder.currency) {
              setRestaurantCurrency(mergedOrder.currency);
            }

            return mergedOrder;
          }

          // Update currency from new order if available
          if (updatedOrder.restaurant?.currency) {
            setRestaurantCurrency(updatedOrder.restaurant.currency);
          } else if (updatedOrder.currency) {
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
      if (orderData.restaurant?.currency) {
        setRestaurantCurrency(orderData.restaurant.currency);
      } else if (orderData.currency) {
        setRestaurantCurrency(orderData.currency);
      }

      // Set customer details if available
      if (orderData.customerName) setCustomerName(orderData.customerName);
      if (orderData.customerPhone) setCustomerPhone(orderData.customerPhone);
      if (orderData.customerAddress)
        setCustomerAddress(orderData.customerAddress);
      if (orderData.notes) setOrderNotes(orderData.notes);

      // Load menu data for adding items
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
          setRestaurantCurrency(currency);
        } else if (restaurant?.currency) {
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

        // Fetch currency exchanges
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
            
            // Load selected currency from localStorage, or use restaurant default currency
            try {
              const savedCurrency = localStorage.getItem(
                `selectedCurrency_${orderData.restaurant.id}`
              );
              if (savedCurrency) {
                setSelectedPaymentCurrency(savedCurrency);
              } else {
                // Default to restaurant's base currency if no saved currency
                const defaultCurrency = restaurantCurrency || 
                  (orderData.restaurant as any)?.currency || 
                  orderData.currency || 
                  "USD";
                setSelectedPaymentCurrency(defaultCurrency);
              }
            } catch (currencyError) {
              console.error("Failed to load selected currency:", currencyError);
              // Default to restaurant's base currency on error
              const defaultCurrency = restaurantCurrency || 
                (orderData.restaurant as any)?.currency || 
                orderData.currency || 
                "USD";
              setSelectedPaymentCurrency(defaultCurrency);
            }
          }
        } catch (currencyError) {
          console.error("Error fetching currency exchanges:", currencyError);
          // Don't set error state, just log it - currencies are optional
        }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[100px]">
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
              subtotal={order.subtotal}
              taxes={order.taxes}
              totalPrice={order.totalPrice?.toString()}
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
