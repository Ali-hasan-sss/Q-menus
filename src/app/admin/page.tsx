"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    recentOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Redirect non-admin users to appropriate dashboard
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      if (user.role === "OWNER") {
        router.push("/dashboard");
      } else {
        router.push("/auth/login");
      }
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchStats();
      fetchRecentActivities();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      console.log("📊 Fetching admin stats...");
      const response = await api.get("/admin/stats");
      console.log("✅ Admin stats response:", response.data);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error(
        "❌ Error fetching stats:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      console.log("📋 Fetching recent activities...");
      const response = await api.get("/admin/activities");
      console.log("✅ Activities response:", response.data);
      if (response.data.success) {
        setRecentActivities(response.data.data);
      }
    } catch (error: any) {
      console.error(
        "❌ Error fetching activities:",
        error.response?.data || error.message
      );
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + (isRTL ? " مليون" : "M");
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + (isRTL ? " ألف" : "K");
    }
    return num.toLocaleString();
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) {
      return isRTL ? "الآن" : "Just now";
    } else if (diffInMinutes < 60) {
      return isRTL ? `منذ ${diffInMinutes} دقيقة` : `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
    }
  };

  const statCards = [
    {
      title: isRTL ? "إجمالي المستخدمين" : "Total Users",
      value: formatNumber(stats.totalUsers),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      color: "bg-blue-500",
    },
    {
      title: isRTL ? "المطاعم" : "Restaurants",
      value: formatNumber(stats.totalRestaurants),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      color: "bg-green-500",
    },
    {
      title: isRTL ? "الاشتراكات النشطة" : "Active Subscriptions",
      value: formatNumber(stats.activeSubscriptions),
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-purple-500",
    },
    {
      title: isRTL ? "الإيرادات" : "Revenue",
      value: `${formatNumber(stats.totalRevenue)} ${isRTL ? "ل.س" : "SYP"}`,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      color: "bg-yellow-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "لوحة تحكم الأدمن" : "Admin Dashboard"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? "نظرة عامة على النظام والإحصائيات"
              : "System overview and statistics"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white`}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "أحدث النشاطات" : "Recent Activities"}
            </h2>
            <button
              onClick={fetchRecentActivities}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              {isRTL ? "تحديث" : "Refresh"}
            </button>
          </div>

          <Card className="p-6">
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {isRTL ? "لا توجد نشاطات حديثة" : "No recent activities"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isRTL
                    ? "ستظهر النشاطات الجديدة هنا"
                    : "Recent activities will appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === "restaurant_registered"
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : activity.type === "subscription_expired"
                              ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                              : activity.type === "subscription_created"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                                : "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400"
                        }`}
                      >
                        {activity.type === "restaurant_registered" ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        ) : activity.type === "subscription_expired" ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        ) : activity.type === "subscription_created" ? (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-5 5-5-5h5v-12h5v12z"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
