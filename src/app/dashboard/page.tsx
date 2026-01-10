"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Navbar from "@/components/dashboard/Navbar";
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string>("USD");

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
    }
  }, [user]);

  // Fetch restaurant currency
  const fetchRestaurantCurrency = async () => {
    try {
      const response = await api.get("/restaurant/profile");
      if (response.data.success && response.data.data.currency) {
        setRestaurantCurrency(response.data.data.currency);
        return response.data.data.currency;
      }
    } catch (error) {
      console.error("Error fetching restaurant currency:", error);
      // Fallback: try to get from menu endpoint
      try {
        const menuResponse = await api.get("/menu");
        if (menuResponse.data.success && menuResponse.data.data.currency) {
          setRestaurantCurrency(menuResponse.data.data.currency);
          return menuResponse.data.data.currency;
        }
      } catch (menuError) {
        console.error("Error fetching currency from menu:", menuError);
      }
    }
    return null;
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
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex  items-center justify-center">
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
                        ? "الإيرادات"
                        : t("dashboard.revenue") || "Revenue"}
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isRTL
                  ? "الإجراءات السريعة"
                  : t("dashboard.quickActions") || "Quick Actions"}
              </h3>
              <div className="space-y-3">
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
                  onClick={() => router.push("/dashboard/menu?tab=theme")}
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
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                    />
                  </svg>
                  {isRTL
                    ? "تصميم القائمة"
                    : t("dashboard.menuTheme") || "Menu Theme"}
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
              </div>
            </Card>

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
        </div>
      </main>
    </div>
  );
}
