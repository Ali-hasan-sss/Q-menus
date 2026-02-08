"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

interface Restaurant {
  id: string;
  name: string;
  owner: {
    firstName: string;
    lastName: string;
  };
}

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: "GENERAL" | "NEW_ORDER" | "ORDER_UPDATE";
  isRead: boolean;
  createdAt: string;
  restaurant?: {
    id: string;
    name: string;
  };
}

export default function AdminNotificationsPage() {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"send" | "received">("received");
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const notificationsPerPage = 25;
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    type: "GENERAL" as "GENERAL" | "NEW_ORDER" | "ORDER_UPDATE",
    sendTo: "ALL" as "ALL" | "SELECTED" | "SINGLE",
    selectedRestaurants: [] as string[],
  });

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/restaurants");
      if (response.data.success) {
        setRestaurants(response.data.data.restaurants);
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setNotificationsLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: notificationsPerPage.toString(),
      });

      const response = await api.get(`/admin/notifications?${params}`);
      if (response.data.success) {
        const fetchedNotifications = response.data.data.notifications || [];

        if (append) {
          // إضافة الإشعارات الجديدة للقائمة الموجودة
          setNotifications((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((n) => n.id));
            const newNotifications = fetchedNotifications.filter(
              (n: AdminNotification) => !existingIds.has(n.id)
            );
            return [...prev, ...newNotifications];
          });
        } else {
          setNotifications(fetchedNotifications);
        }

        // تحديث pagination info
        if (response.data.data.pagination) {
          const {
            total,
            pages,
            page: currentPageNum,
          } = response.data.data.pagination;
          setHasMoreNotifications(
            currentPageNum < pages &&
              fetchedNotifications.length === notificationsPerPage
          );
          currentPageRef.current = currentPageNum;
        } else {
          setHasMoreNotifications(
            fetchedNotifications.length === notificationsPerPage
          );
          currentPageRef.current = page;
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // دالة جلب المزيد من الإشعارات
  const loadMoreNotifications = useCallback(() => {
    if (!isLoadingMore && hasMoreNotifications && !notificationsLoading) {
      const nextPage = currentPageRef.current + 1;
      fetchNotifications(nextPage, true);
    }
  }, [hasMoreNotifications, isLoadingMore, notificationsLoading]);

  useEffect(() => {
    fetchRestaurants();
    fetchNotifications(1, false);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (activeTab !== "received") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreNotifications &&
          !isLoadingMore &&
          !notificationsLoading
        ) {
          loadMoreNotifications();
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
  }, [
    hasMoreNotifications,
    isLoadingMore,
    notificationsLoading,
    activeTab,
    loadMoreNotifications,
  ]);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.body) {
      showToast(
        isRTL
          ? "الرجاء ملء جميع الحقول المطلوبة"
          : "Please fill all required fields",
        "error"
      );
      return;
    }

    if (
      formData.sendTo === "SELECTED" &&
      formData.selectedRestaurants.length === 0
    ) {
      showToast(
        isRTL
          ? "الرجاء اختيار مطعم واحد على الأقل"
          : "Please select at least one restaurant",
        "error"
      );
      return;
    }

    try {
      setSending(true);
      await api.post("/admin/notifications/send", {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        sendTo: formData.sendTo,
        restaurantIds:
          formData.sendTo === "SELECTED" ? formData.selectedRestaurants : [],
      });

      showToast(
        isRTL ? "تم إرسال الإشعار بنجاح" : "Notification sent successfully",
        "success"
      );

      // Reset form
      setFormData({
        title: "",
        body: "",
        type: "GENERAL",
        sendTo: "ALL",
        selectedRestaurants: [],
      });
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء إرسال الإشعار"
            : "Error sending notification"),
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  const toggleRestaurantSelection = (restaurantId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedRestaurants: prev.selectedRestaurants.includes(restaurantId)
        ? prev.selectedRestaurants.filter((id) => id !== restaurantId)
        : [...prev.selectedRestaurants, restaurantId],
    }));
  };

  const selectAllRestaurants = () => {
    setFormData((prev) => ({
      ...prev,
      selectedRestaurants: restaurants.map((r) => r.id),
    }));
  };

  const deselectAllRestaurants = () => {
    setFormData((prev) => ({
      ...prev,
      selectedRestaurants: [],
    }));
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      showToast(isRTL ? "تم حذف الإشعار" : "Notification deleted", "success");
      fetchNotifications(1, false);
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء حذف الإشعار" : "Error deleting notification"),
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL ? "إرسال وإدارة الإشعارات" : "Send and manage notifications"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("send")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "send"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  {isRTL ? "إرسال إشعار" : "Send Notification"}
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab("received");
                  if (notifications.length === 0) {
                    fetchNotifications(1, false);
                  }
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "received"
                    ? "border-primary-500 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
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
                  {isRTL ? "الإشعارات الواردة" : "Received Notifications"}
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "send" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send Form */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {isRTL ? "إشعار جديد" : "New Notification"}
              </h2>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <Input
                  label={isRTL ? "العنوان *" : "Title *"}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الرسالة *" : "Message *"}
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) =>
                      setFormData({ ...formData, body: e.target.value })
                    }
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "النوع" : "Type"}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="GENERAL">{isRTL ? "عام" : "General"}</option>
                    <option value="NEW_ORDER">
                      {isRTL ? "طلب جديد" : "New Order"}
                    </option>
                    <option value="ORDER_UPDATE">
                      {isRTL ? "تحديث طلب" : "Order Update"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "إرسال إلى" : "Send To"}
                  </label>
                  <select
                    value={formData.sendTo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sendTo: e.target.value as any,
                        selectedRestaurants: [],
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">
                      {isRTL ? "جميع المطاعم" : "All Restaurants"}
                    </option>
                    <option value="SELECTED">
                      {isRTL ? "مطاعم محددة" : "Selected Restaurants"}
                    </option>
                  </select>
                </div>

                <Button type="submit" disabled={sending} className="w-full">
                  {sending
                    ? isRTL
                      ? "جاري الإرسال..."
                      : "Sending..."
                    : isRTL
                      ? "إرسال الإشعار"
                      : "Send Notification"}
                </Button>
              </form>
            </Card>

            {/* Restaurant Selection */}
            {formData.sendTo === "SELECTED" && (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? "اختر المطاعم" : "Select Restaurants"}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={selectAllRestaurants}
                    >
                      {isRTL ? "تحديد الكل" : "Select All"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={deselectAllRestaurants}
                    >
                      {isRTL ? "إلغاء الكل" : "Deselect All"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {restaurants.map((restaurant) => (
                    <label
                      key={restaurant.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedRestaurants.includes(
                          restaurant.id
                        )}
                        onChange={() =>
                          toggleRestaurantSelection(restaurant.id)
                        }
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {restaurant.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {restaurant.owner.firstName}{" "}
                          {restaurant.owner.lastName}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {formData.selectedRestaurants.length}{" "}
                  {isRTL ? "مطعم محدد" : "restaurants selected"}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Received Notifications Tab */}
        {activeTab === "received" && (
          <div className="space-y-4">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <Card className="p-12 text-center">
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
                    d="M15 17h5l-5 5-5-5h5v-12h5v12z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {isRTL ? "لا توجد إشعارات" : "No notifications"}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isRTL
                    ? "لم يتم استلام أي إشعارات بعد"
                    : "No notifications received yet"}
                </p>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-6 ${!notification.isRead ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {isRTL ? "جديد" : "New"}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            notification.type === "GENERAL"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              : notification.type === "NEW_ORDER"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {notification.type === "GENERAL"
                            ? isRTL
                              ? "عام"
                              : "General"
                            : notification.type === "NEW_ORDER"
                              ? isRTL
                                ? "طلب جديد"
                                : "New Order"
                              : isRTL
                                ? "تحديث طلب"
                                : "Order Update"}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {notification.body}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {new Date(notification.createdAt).toLocaleString()}
                        {notification.restaurant && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{notification.restaurant.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                        className="flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        {isRTL ? "حذف" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* Infinite Scroll Trigger */}
            {hasMoreNotifications && activeTab === "received" && (
              <div
                ref={observerTarget}
                className="py-4 text-center border-t border-gray-200 dark:border-gray-700 mt-8"
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
          </div>
        )}
      </div>
    </div>
  );
}
