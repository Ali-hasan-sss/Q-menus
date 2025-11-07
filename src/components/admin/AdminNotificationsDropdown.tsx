"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface AdminNotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  notificationsLoading: boolean;
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  isRTL: boolean;
  browserNotificationsEnabled?: boolean;
  requestNotificationPermission?: () => void;
}

export default function AdminNotificationsDropdown({
  isOpen,
  onClose,
  notifications,
  notificationsLoading,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  isRTL,
  browserNotificationsEnabled,
  requestNotificationPermission,
}: AdminNotificationsDropdownProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 ${
        isRTL ? "left-0" : "right-0"
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isRTL ? "الإشعارات" : "Notifications"}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 whitespace-nowrap"
            >
              {isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Browser Notification Toggle */}
        {requestNotificationPermission && !browserNotificationsEnabled && (
          <button
            onClick={requestNotificationPermission}
            className="w-full px-3 py-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            {isRTL ? "تفعيل إشعارات المتصفح" : "Enable Browser Notifications"}
          </button>
        )}

        {browserNotificationsEnabled && (
          <div className="flex items-center justify-center text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 py-2 px-3 rounded-md">
            <svg
              className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
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
            {isRTL ? "إشعارات المتصفح مفعلة" : "Browser Notifications Enabled"}
          </div>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notificationsLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {isRTL ? "لا توجد إشعارات" : "No notifications"}
          </div>
        ) : (
          <>
            {notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  !notification.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
                onClick={() => {
                  if (!notification.isRead) {
                    onMarkAsRead(notification.id);
                  }
                  router.push("/admin/notifications");
                  onClose();
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={isRTL ? "تحديد كمقروء" : "Mark as read"}
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notification.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title={isRTL ? "حذف" : "Delete"}
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
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* View All Notifications Link */}
            {notifications.length > 5 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/admin/notifications"
                  className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  onClick={() => onClose()}
                >
                  {isRTL ? "عرض جميع الإشعارات" : "View All Notifications"}
                  <span className="ml-2 rtl:ml-0 rtl:mr-2">
                    ({notifications.length})
                  </span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
