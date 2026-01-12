"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { formatCurrencyWithLanguage } from "@/lib/utils";

interface RestaurantStats {
  totalOrders: number;
  activeQRCodes: number;
  activeMenuItems: number;
  revenue: number;
  orderStats: Record<string, number>;
}

interface RecentActivity {
  id: string;
  type: "order" | "qr" | "menu";
  message: string;
  messageAr: string;
  timestamp: string;
  color: string;
}

interface RestaurantInfo {
  id: string;
  name: string;
  nameAr?: string;
  address?: string;
  phone?: string;
  kitchenWhatsApp?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");
  const [showRestaurantSettingsModal, setShowRestaurantSettingsModal] =
    useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(
    null
  );
  const [restaurantForm, setRestaurantForm] = useState({
    address: "",
    phone: "",
    kitchenWhatsApp: "",
    currency: "USD",
  });
  const [savingRestaurant, setSavingRestaurant] = useState(false);

  // Currency exchange states
  const [currencyExchanges, setCurrencyExchanges] = useState<any[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkExchangeRates, setBulkExchangeRates] = useState<
    Record<string, string>
  >({});

  // Popular currencies list with translations
  const popularCurrencies = [
    { code: "USD", nameAr: "دولار", nameEn: "US Dollar" },
    { code: "EUR", nameAr: "يورو", nameEn: "Euro" },
    { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound" },
    { code: "SYP", nameAr: "ليرة سورية", nameEn: "Syrian Pound" },
    { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira" },
    { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal" },
    { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham" },
    { code: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar" },
    { code: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound" },
    { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar" },
    { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal" },
    { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial" },
    { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar" },
    { code: "LBP", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound" },
    { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar" },
    { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen" },
    { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan" },
    { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee" },
    { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar" },
    { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar" },
    { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc" },
    { code: "RUB", nameAr: "روبل روسي", nameEn: "Russian Ruble" },
    {
      code: "SYP_NEW",
      nameAr: "ليرة سورية جديدة",
      nameEn: "Syrian Pound (New)",
    },
    {
      code: "SYP_OLD",
      nameAr: "ليرة سورية قديمة",
      nameEn: "Syrian Pound (Old)",
    },
  ];

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      router.push("/admin");
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === "OWNER") {
      fetchRestaurantCurrency();
      fetchStats();
      fetchRecentActivities();
      fetchRestaurantInfo();
      fetchCurrencyExchanges();
    }
  }, [user]);

  // Reload restaurant info when modal opens to ensure currency is up to date
  useEffect(() => {
    if (showRestaurantSettingsModal) {
      fetchRestaurantInfo();
    }
  }, [showRestaurantSettingsModal]);

  // Fetch restaurant currency
  const fetchRestaurantCurrency = async () => {
    try {
      const response = await api.get("/restaurant");
      if (response.data.success && response.data.data.restaurant) {
        setRestaurantCurrency(response.data.data.restaurant.currency || "USD");
        return response.data.data.restaurant.currency || "USD";
      }
    } catch (error) {
      console.error("Error fetching restaurant currency:", error);
    }
    return null;
  };

  // Fetch restaurant info
  const fetchRestaurantInfo = async () => {
    try {
      const response = await api.get("/restaurant");
      if (response.data.success && response.data.data.restaurant) {
        const restaurant = response.data.data.restaurant;
        setRestaurantInfo(restaurant);
        setRestaurantForm({
          address: restaurant.address || "",
          phone: restaurant.phone || "",
          kitchenWhatsApp: restaurant.kitchenWhatsApp || "",
          currency: restaurant.currency || "USD",
        });
        setRestaurantCurrency(restaurant.currency || "USD");
      }
    } catch (error) {
      console.error("Error fetching restaurant info:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/restaurant/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Get recent orders (last 5)
      const ordersResponse = await api.get("/order?limit=5&sort=desc");
      const activities: RecentActivity[] = [];

      if (ordersResponse.data.success) {
        const orders = ordersResponse.data.data.orders || [];

        orders.forEach((order: any) => {
          const orderType =
            order.orderType === "DINE_IN" ? "داخل المطعم" : "توصيل";
          const orderTypeEn =
            order.orderType === "DINE_IN" ? "Dine-in" : "Delivery";
          const tableOrCustomer = order.tableNumber
            ? `${isRTL ? "طاولة" : "Table"} ${order.tableNumber}`
            : order.customerName || "Unknown";

          activities.push({
            id: `order-${order.id}`,
            type: "order",
            message: `New ${orderTypeEn} order received for ${tableOrCustomer}`,
            messageAr: `تم استلام طلب ${orderType} ${isRTL ? "لـ" : "for"} ${tableOrCustomer}`,
            timestamp: order.createdAt,
            color: "bg-green-500",
          });
        });
      }

      // Sort by timestamp (newest first) and limit to 3
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentActivities(activities.slice(0, 3));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      // Fallback to static activities if API fails
      setRecentActivities([
        {
          id: "static-1",
          type: "order",
          message: "New order received for Table 5",
          messageAr: "تم استلام طلب جديد للطاولة 5",
          timestamp: new Date().toISOString(),
          color: "bg-green-500",
        },
        {
          id: "static-2",
          type: "qr",
          message: "QR code generated for Table 8",
          messageAr: "تم إنشاء رمز QR للطاولة 8",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          color: "bg-blue-500",
        },
        {
          id: "static-3",
          type: "menu",
          message: "Menu item updated: Grilled Salmon",
          messageAr: "تم تحديث عنصر القائمة: سلمون مشوي",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          color: "bg-yellow-500",
        },
      ]);
    }
  };

  const handleRestaurantSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRestaurant(true);

      // Ensure currency is always sent
      const requestData: any = {};

      if (restaurantForm.address) requestData.address = restaurantForm.address;
      if (restaurantForm.phone) requestData.phone = restaurantForm.phone;
      if (restaurantForm.kitchenWhatsApp)
        requestData.kitchenWhatsApp = restaurantForm.kitchenWhatsApp;

      // Always include currency - it's required
      // Make sure we use the actual selected value, not the default
      const selectedCurrency = restaurantForm.currency || "USD";
      requestData.currency = selectedCurrency;

      console.log("Current restaurantForm:", restaurantForm);
      console.log("Selected currency:", selectedCurrency);
      console.log("Request data:", requestData);

      const response = await api.put("/restaurant", requestData);

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم تحديث إعدادات المطعم بنجاح"
            : "Restaurant settings updated successfully",
          "success"
        );
        setShowRestaurantSettingsModal(false);
        await fetchRestaurantInfo();
        await fetchRestaurantCurrency(); // Refresh currency
      }
    } catch (error: any) {
      console.error("Error updating restaurant settings:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء تحديث إعدادات المطعم"
            : "Error updating restaurant settings"),
        "error"
      );
    } finally {
      setSavingRestaurant(false);
    }
  };

  // Currency exchanges functions
  const fetchCurrencyExchanges = async () => {
    try {
      setLoadingCurrencies(true);
      const response = await api.get("/restaurant/currency-exchanges");
      if (response.data.success) {
        setCurrencyExchanges(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching currency exchanges:", error);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const handleBulkEditExchangeRates = () => {
    // Initialize bulkExchangeRates with current exchange rates
    const initialRates: Record<string, string> = {};
    currencyExchanges.forEach((currency) => {
      initialRates[currency.id] = currency.exchangeRate.toString();
    });
    setBulkExchangeRates(initialRates);
    setShowBulkEditModal(true);
  };

  const handleBulkSaveExchangeRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingRestaurant(true);

      // Prepare updates for all currencies
      const updates = Object.entries(bulkExchangeRates).map(([id, rate]) => ({
        id,
        exchangeRate: parseFloat(rate) || 0,
      }));

      // Update all currencies
      const updatePromises = updates.map((update) =>
        api.put(`/restaurant/currency-exchanges/${update.id}`, {
          exchangeRate: update.exchangeRate,
        })
      );

      await Promise.all(updatePromises);

      showToast(
        isRTL
          ? "تم تحديث أسعار الصرف بنجاح"
          : "Exchange rates updated successfully",
        "success"
      );
      setShowBulkEditModal(false);
      fetchCurrencyExchanges();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء تحديث أسعار الصرف"
          : "Error updating exchange rates");
      showToast(message, "error");
    } finally {
      setSavingRestaurant(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  const orderStatusLabels: Record<string, { en: string; ar: string }> = {
    PENDING: { en: "Pending Orders", ar: "الطلبات المعلقة" },
    PREPARING: { en: "Preparing", ar: "قيد التحضير" },
    READY: { en: "Ready", ar: "جاهزة" },
    COMPLETED: { en: "Completed", ar: "مكتملة" },
    DELIVERED: { en: "Delivered", ar: "تم التوصيل" },
  };

  const orderStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    PREPARING: "bg-orange-500",
    READY: "bg-green-500",
    COMPLETED: "bg-blue-500",
    DELIVERED: "bg-purple-500",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 md:py-10 sm:px-6 lg:px-8 pb-20 sm:pb-6">
        <div className="px-4 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-4 md:mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL
                ? `مرحباً بعودتك، ${user?.firstName}!`
                : `${t("dashboard.welcome") || "Welcome back,"} ${user?.firstName}!`}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isRTL
                ? "إليك ما يحدث في مطعمك اليوم."
                : t("dashboard.subtitle") ||
                  "Here's what's happening with your restaurant today."}
            </p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "إجمالي الطلبات"
                        : t("dashboard.totalOrders") || "Total Orders"}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.totalOrders}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "الطاولات النشطة"
                        : t("dashboard.activeTables") || "Active Tables"}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.activeQRCodes}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "عناصر القائمة"
                        : t("dashboard.menuItems") || "Menu Items"}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.activeMenuItems}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "الإيرادات (30 يوم)"
                        : t("dashboard.revenue") || "Revenue (30 days)"}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyWithLanguage(
                        Number(stats.revenue || 0),
                        restaurantCurrency,
                        language
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Order Status Stats */}
          {stats &&
            stats.orderStats &&
            Object.keys(stats.orderStats).length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {isRTL
                    ? "الطلبات حسب الحالة (30 يوم)"
                    : "Orders by Status (30 days)"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(stats.orderStats).map(([status, count]) => (
                    <Card key={status} className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${orderStatusColors[status] || "bg-gray-500"}`}
                        ></div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {isRTL
                              ? orderStatusLabels[status]?.ar || status
                              : orderStatusLabels[status]?.en || status}
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {count}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          {/* Quick Actions and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Actions */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isRTL
                  ? "الإجراءات السريعة"
                  : t("dashboard.quickActions") || "Quick Actions"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/dashboard/menu")}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {isRTL
                    ? "إدارة القائمة"
                    : t("dashboard.manageMenu") || "Manage Menu"}
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/dashboard/orders")}
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  {isRTL
                    ? "عرض الطلبات"
                    : t("dashboard.viewOrders") || "View Orders"}
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/dashboard/qr")}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  {isRTL
                    ? "إنشاء رموز QR"
                    : t("dashboard.generateQR") || "Generate QR Codes"}
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {isRTL ? "الإعدادات" : "Settings"}
                </Button>
              </div>
            </Card>

            {/* Quick Settings */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isRTL ? "إعدادات سريعة" : "Quick Settings"}
              </h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-primary-600 hover:bg-primary-700 text-white"
                  onClick={() => setShowRestaurantSettingsModal(true)}
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  {isRTL ? "إعدادات المطعم" : "Restaurant Settings"}
                </Button>
                {currencyExchanges.length > 0 && (
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleBulkEditExchangeRates}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {isRTL ? "تعديل أسعار الصرف" : "Edit Exchange Rates"}
                  </Button>
                )}
                {restaurantInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 text-sm">
                      {restaurantInfo.address && (
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">
                            {restaurantInfo.address}
                          </span>
                        </div>
                      )}
                      {restaurantInfo.phone && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">
                            {restaurantInfo.phone}
                          </span>
                        </div>
                      )}
                      {restaurantInfo.kitchenWhatsApp && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-green-600 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">
                            {restaurantInfo.kitchenWhatsApp}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isRTL
                ? "النشاط الأخير"
                : t("dashboard.recentActivity") || "Recent Activity"}
            </h3>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                  >
                    <div
                      className={`w-2 h-2 ${activity.color} rounded-full mr-3`}
                    ></div>
                    <div className="flex-1">
                      <span>
                        {isRTL ? activity.messageAr : activity.message}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString(
                          isRTL ? "ar-SA" : "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    {isRTL ? "لا توجد نشاطات حديثة" : "No recent activities"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Restaurant Settings Modal */}
      {showRestaurantSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? "إعدادات المطعم" : "Restaurant Settings"}
                </h2>
                <button
                  onClick={() => setShowRestaurantSettingsModal(false)}
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

            <form onSubmit={handleRestaurantSettingsSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "العنوان" : "Address"}
                  </label>
                  <Input
                    type="text"
                    value={restaurantForm.address}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder={isRTL ? "عنوان المطعم" : "Restaurant address"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "رقم الهاتف" : "Phone Number"}
                  </label>
                  <Input
                    type="tel"
                    value={restaurantForm.phone}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder={isRTL ? "رقم الهاتف" : "Phone number"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "العملة الأساسية" : "Base Currency"}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={restaurantForm.currency}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                  >
                    <option value="USD">
                      {isRTL ? "دولار أمريكي (USD)" : "US Dollar (USD)"}
                    </option>
                    <option value="SYP">
                      {isRTL ? "ليرة سورية (SYP)" : "Syrian Pound (SYP)"}
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isRTL
                      ? "العملة الأساسية التي سيتم استخدامها في جميع الأسعار"
                      : "The base currency that will be used for all prices"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span>
                        {isRTL ? "واتساب المطبخ" : "Kitchen WhatsApp"}
                      </span>
                    </div>
                  </label>
                  <Input
                    type="text"
                    placeholder={isRTL ? "رقم الواتساب" : "WhatsApp number"}
                    value={restaurantForm.kitchenWhatsApp}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        kitchenWhatsApp: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isRTL ? "مثال: 963999123456" : "Example: 963999123456"}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRestaurantSettingsModal(false)}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={savingRestaurant}>
                  {savingRestaurant
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? "حفظ"
                      : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Exchange Rates Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? "تعديل أسعار الصرف" : "Edit Exchange Rates"}
              </h3>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkExchangeRates({});
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

            <form onSubmit={handleBulkSaveExchangeRates} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {isRTL
                  ? "قم بتعديل أسعار الصرف لجميع العملات دفعة واحدة. سيتم حفظ جميع التعديلات عند الضغط على حفظ."
                  : "Edit exchange rates for all currencies at once. All changes will be saved when you click save."}
              </p>

              <div className="space-y-4">
                {currencyExchanges.map((currency) => {
                  const currencyInfo = popularCurrencies.find(
                    (c) => c.code === currency.currency
                  );
                  return (
                    <div
                      key={currency.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currency.currency}
                          </h4>
                          {currencyInfo && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {isRTL
                                ? currencyInfo.nameAr
                                : currencyInfo.nameEn}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            currency.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {currency.isActive
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                              ? "غير نشط"
                              : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "سعر الصرف" : "Exchange Rate"}
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          value={bulkExchangeRates[currency.id] || ""}
                          onChange={(e) =>
                            setBulkExchangeRates((prev) => ({
                              ...prev,
                              [currency.id]: e.target.value,
                            }))
                          }
                          placeholder={isRTL ? "مثال: 0.85" : "e.g., 0.85"}
                          required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {isRTL
                            ? `1 ${currency.currency} = كم ${restaurantForm.currency}؟`
                            : `1 ${currency.currency} = how many ${restaurantForm.currency}?`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkExchangeRates({});
                  }}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={savingRestaurant}>
                  {savingRestaurant
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? "حفظ جميع التعديلات"
                      : "Save All Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
