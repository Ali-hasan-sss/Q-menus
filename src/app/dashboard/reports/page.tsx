"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Navbar from "@/components/dashboard/Navbar";
import { api } from "@/lib/api";
import { formatCurrencyWithLanguage } from "@/lib/utils";

interface Order {
  id: string;
  orderType: string;
  tableNumber: string;
  totalPrice: number | string;
  currency: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    isCustomItem?: boolean;
    customItemName?: string;
    customItemNameAr?: string;
    menuItem?: {
      name: string;
      nameAr?: string;
    };
  }[];
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 25; // 25 طلب لكل صفحة
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initCurrency = async () => {
      const currency = await fetchRestaurantCurrency();
      // بعد جلب العملة، جلب التقارير مع تمرير العملة مباشرة
      setCurrentPage(1);
      setHasMoreOrders(true);
      // Pass currency directly to fetchReports to avoid race condition
      fetchReports(1, false, currency);
    };
    initCurrency();
  }, []);

  // دالة جلب المزيد من الطلبات
  const loadMoreOrders = useCallback(() => {
    if (!isLoadingMore && hasMoreOrders) {
      fetchReports(currentPage + 1, true);
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
    // إعادة تعيين pagination عند تغيير الفلتر
    // فقط إذا كانت العملة قد تم جلبها بالفعل
    if (restaurantCurrency !== null) {
      setCurrentPage(1);
      setHasMoreOrders(true);
      fetchReports(1, false);
    }
  }, [dateFilter, startDate, endDate]);

  // Fetch restaurant currency
  const fetchRestaurantCurrency = async () => {
    try {
      const response = await api.get("/restaurant/profile");
      console.log("🔍 Restaurant profile response:", response.data);
      if (response.data.success && response.data.data.currency) {
        console.log(
          "✅ Restaurant currency found:",
          response.data.data.currency
        );
        setRestaurantCurrency(response.data.data.currency);
        return response.data.data.currency;
      } else {
        console.warn("⚠️ No currency in restaurant profile response");
      }
    } catch (error) {
      console.error("Error fetching restaurant currency:", error);
      // Fallback: try to get from menu endpoint
      try {
        const menuResponse = await api.get("/menu");
        console.log("🔍 Menu response:", menuResponse.data);
        if (menuResponse.data.success && menuResponse.data.data.currency) {
          console.log(
            "✅ Currency found in menu:",
            menuResponse.data.data.currency
          );
          setRestaurantCurrency(menuResponse.data.data.currency);
          return menuResponse.data.data.currency;
        }
      } catch (menuError) {
        console.error("Error fetching currency from menu:", menuError);
      }
    }
    console.warn("⚠️ No currency found, returning null");
    return null;
  };

  // Helper function to get the correct currency for display
  const getDisplayCurrency = (orderCurrency?: string): string => {
    // Always prefer restaurant currency if available
    if (restaurantCurrency) {
      console.log("💰 Using restaurant currency:", restaurantCurrency);
      return restaurantCurrency;
    }
    // Fallback to order currency
    if (orderCurrency) {
      console.log("💰 Using order currency:", orderCurrency);
      return orderCurrency;
    }
    // Final fallback to USD
    console.log("💰 Using default currency: USD");
    return "USD";
  };

  const fetchReports = async (
    page: number = 1,
    append: boolean = false,
    currencyOverride?: string | null
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      // Use currencyOverride if provided, otherwise use current restaurantCurrency state
      const currentCurrency =
        currencyOverride !== undefined ? currencyOverride : restaurantCurrency;

      // Build query params
      const params: any = {
        page,
        limit: ordersPerPage,
      };

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
      }

      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await api.get("/order", { params });

      if (response.data.success) {
        const fetchedOrders = response.data.data.orders;

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
          setTotalOrders(total);
          setHasMoreOrders(currentPageNum < pages);
          setCurrentPage(currentPageNum);
        } else {
          // إذا لم يكن هناك pagination، تحقق من عدد الطلبات
          setHasMoreOrders(fetchedOrders.length === ordersPerPage);
        }

        // Try to get currency from response if available
        // IMPORTANT: Only update currency if we don't already have restaurant currency
        // Never override restaurant currency with order currency
        if (response.data.data.currency && !currentCurrency) {
          console.log(
            "💰 Currency from response:",
            response.data.data.currency
          );
          setRestaurantCurrency(response.data.data.currency);
        } else if (fetchedOrders.length > 0 && !currentCurrency) {
          // Only update currency from orders if we don't have restaurant currency yet
          // Try to find a non-USD currency from orders
          const orderWithCurrency = fetchedOrders.find(
            (order: Order) => order.currency && order.currency !== "USD"
          );
          if (orderWithCurrency && orderWithCurrency.currency) {
            console.log("💰 Currency from order:", orderWithCurrency.currency);
            setRestaurantCurrency(orderWithCurrency.currency);
          } else if (fetchedOrders[0].currency) {
            // Use currency from first order even if USD (only as last resort)
            console.log(
              "💰 Currency from first order (fallback):",
              fetchedOrders[0].currency
            );
            setRestaurantCurrency(fetchedOrders[0].currency);
          }
        } else if (currentCurrency) {
          console.log(
            "💰 Keeping restaurant currency:",
            currentCurrency,
            "(not overriding with order currency)"
          );
        }

        // Calculate stats - تحديث الإحصائيات من جميع الطلبات المحملة
        const allLoadedOrders = append
          ? [...orders, ...fetchedOrders]
          : fetchedOrders;
        const completed = allLoadedOrders.filter(
          (o: Order) => o.status === "COMPLETED"
        );
        const cancelled = allLoadedOrders.filter(
          (o: Order) => o.status === "CANCELLED"
        );
        const revenue = completed.reduce(
          (sum: number, o: Order) => sum + Number(o.totalPrice),
          0
        );

        setStats({
          totalOrders: allLoadedOrders.length,
          completedOrders: completed.length,
          cancelledOrders: cancelled.length,
          totalRevenue: revenue,
          averageOrderValue:
            completed.length > 0 ? revenue / completed.length : 0,
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      showToast(
        isRTL ? "حدث خطأ أثناء جلب التقارير" : "Error fetching reports",
        "error"
      );
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-5">
      <div className="max-w-7xl md:py-10 mx-auto py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "التقارير والإحصائيات" : "Reports & Analytics"}
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
              {isRTL
                ? "عرض إحصائيات المطعم والإيرادات"
                : "View restaurant statistics and revenue"}
            </p>
          </div>

          {/* Date Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateFilter("today")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "today"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "اليوم" : "Today"}
                </button>
                <button
                  onClick={() => setDateFilter("week")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "week"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "آخر 7 أيام" : "Last 7 Days"}
                </button>
                <button
                  onClick={() => setDateFilter("month")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "month"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "آخر 30 يوم" : "Last 30 Days"}
                </button>
                <button
                  onClick={() => setDateFilter("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "all"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "الكل" : "All Time"}
                </button>
              </div>

              {/* Custom Date Range */}
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder={isRTL ? "من" : "From"}
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder={isRTL ? "إلى" : "To"}
                />
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "إجمالي الطلبات" : "Total Orders"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                </div>
              </div>
            </Card>

            {/* Completed Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "الطلبات المكتملة" : "Completed Orders"}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {stats.completedOrders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Total Revenue */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "إجمالي الإيرادات" : "Total Revenue"}
                  </p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                    {formatCurrencyWithLanguage(
                      stats.totalRevenue,
                      restaurantCurrency || undefined,
                      language
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
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
                </div>
              </div>
            </Card>

            {/* Average Order Value */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "متوسط قيمة الطلب" : "Avg. Order Value"}
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                    {formatCurrencyWithLanguage(
                      stats.averageOrderValue,
                      restaurantCurrency || undefined,
                      language
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? "سجل الطلبات" : "Order History"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "رقم الطلب" : "Order ID"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "النوع" : "Type"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "الطاولة/العميل" : "Table/Customer"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "العناصر" : "Items"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "المجموع" : "Total"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "التاريخ" : "Date"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.orderType === "DINE_IN"
                          ? isRTL
                            ? "داخل المطعم"
                            : "Dine-in"
                          : isRTL
                            ? "توصيل"
                            : "Delivery"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.tableNumber
                          ? `${isRTL ? "طاولة" : "Table"} ${order.tableNumber}`
                          : order.customerName || "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        {isRTL ? "عنصر" : "items"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            order.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : order.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrencyWithLanguage(
                          Number(order.totalPrice),
                          getDisplayCurrency(order.currency),
                          language
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

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

              {orders.length === 0 && !loading && (
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
                    {isRTL ? "لا توجد طلبات" : "No orders"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "لا توجد طلبات في الفترة المحددة"
                      : "No orders found in the selected period"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
