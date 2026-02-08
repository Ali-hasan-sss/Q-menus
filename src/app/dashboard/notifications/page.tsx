"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import Navbar from "@/components/dashboard/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const notificationsPerPage = 25;
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);

  const fetchNotifications = async (
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: notificationsPerPage.toString(),
      });

      const response = await api.get(`/notifications?${params}`);
      if (response.data.success) {
        const fetchedNotifications = response.data.data.notifications || [];

        if (append) {
          // إضافة الإشعارات الجديدة للقائمة الموجودة
          setNotifications((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((n) => n.id));
            const newNotifications = fetchedNotifications.filter(
              (n: Notification) => !existingIds.has(n.id)
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
      setError("Failed to fetch notifications");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // دالة جلب المزيد من الإشعارات
  const loadMoreNotifications = useCallback(() => {
    if (!isLoadingMore && hasMoreNotifications && !loading) {
      const nextPage = currentPageRef.current + 1;
      fetchNotifications(nextPage, true);
    }
  }, [hasMoreNotifications, isLoadingMore, loading]);

  useEffect(() => {
    if (user) {
      fetchNotifications(1, false);
    }
  }, [user]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreNotifications &&
          !isLoadingMore &&
          !loading
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
  }, [hasMoreNotifications, isLoadingMore, loading, loadMoreNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead("all");
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map((notification) =>
          api.put(`/notifications/${notification.id}/read`)
        )
      );

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
      // Refresh to update pagination
      if (notifications.length === 1) {
        fetchNotifications(1, false);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "WELCOME":
        return "🎉";
      case "SUBSCRIPTION":
        return "✨";
      case "ORDER":
        return "📦";
      case "PAYMENT":
        return "💳";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "WELCOME":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "SUBSCRIPTION":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "ORDER":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "PAYMENT":
        return "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800";
      default:
        return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <ErrorMessage message={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20 sm:pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isRTL ? "الإشعارات" : "Notifications"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "إدارة جميع إشعارات مطعمك"
                  : "Manage all your restaurant notifications"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {notifications.some((n) => !n.isRead) && (
                <Button
                  onClick={markAllAsRead}
                  disabled={markingAsRead === "all"}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {markingAsRead === "all" ? (
                    <LoadingSpinner />
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isRTL ? "تحديد الكل كمقروء" : "Mark All as Read"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRTL ? "لا توجد إشعارات" : "No notifications"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "ستظهر إشعاراتك هنا عند توفرها"
                  : "Your notifications will appear here when available"}
              </p>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  notification.isRead
                    ? "opacity-75"
                    : "border-l-4 border-l-primary-500 dark:border-l-primary-400 shadow-sm"
                } ${getNotificationColor(notification.type)}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className={`text-lg font-semibold ${
                          notification.isRead
                            ? "text-gray-600 dark:text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>

                    <p
                      className={`text-sm mb-3 ${
                        notification.isRead
                          ? "text-gray-500 dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {notification.body}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: language === "AR" ? ar : undefined,
                        })}
                      </span>

                      <div className="flex gap-2">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            disabled={markingAsRead === notification.id}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                          >
                            {markingAsRead === notification.id ? (
                              <LoadingSpinner />
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            <span className="text-xs">
                              {isRTL ? "مقروء" : "Read"}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors flex items-center gap-1"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          <span className="text-xs">
                            {isRTL ? "حذف" : "Delete"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}

          {/* Infinite Scroll Trigger */}
          {hasMoreNotifications && (
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
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedNotification.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.body}
                </p>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
                <span>
                  {formatDistanceToNow(
                    new Date(selectedNotification.createdAt),
                    {
                      addSuffix: true,
                      locale: language === "AR" ? ar : undefined,
                    }
                  )}
                </span>

                <div className="flex gap-3">
                  {!selectedNotification.isRead && (
                    <Button
                      onClick={() => {
                        markAsRead(selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          isRead: true,
                        });
                      }}
                      disabled={markingAsRead === selectedNotification.id}
                      variant="outline"
                      className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                    >
                      {markingAsRead === selectedNotification.id ? (
                        <LoadingSpinner />
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {isRTL ? "تحديد كمقروء" : "Mark as Read"}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      deleteNotification(selectedNotification.id);
                      setSelectedNotification(null);
                    }}
                    variant="outline"
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    {isRTL ? "حذف" : "Delete"}
                  </Button>
                  <Button
                    onClick={() => setSelectedNotification(null)}
                    variant="outline"
                  >
                    {isRTL ? "إغلاق" : "Close"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
