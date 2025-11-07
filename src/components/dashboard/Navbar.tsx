"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSocket } from "@/contexts/SocketContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Logo } from "@/components/ui/Logo";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    key: "nav.dashboard",
  },
  { name: "Menu", href: "/dashboard/menu", icon: "menu", key: "nav.menu" },
  { name: "QR Codes", href: "/dashboard/qr", icon: "qr", key: "nav.qr" },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: "orders",
    key: "nav.orders",
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: "reports",
    key: "nav.reports",
  },
];

const iconMap = {
  dashboard: (
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
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
      />
    </svg>
  ),
  menu: (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  qr: (
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
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
      />
    </svg>
  ),
  orders: (
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
        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  ),
  reports: (
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
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  invoices: (
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
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  settings: (
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
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();
  const { newOrdersCount, updatedOrdersCount } = useSocket();
  const { showConfirm } = useConfirmDialog();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    browserNotificationsEnabled,
    requestNotificationPermission,
  } = useNotifications();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [waiterRequests, setWaiterRequests] = useState<any[]>([]);
  const [isWaiterRequestsOpen, setIsWaiterRequestsOpen] = useState(false);
  const [waiterRequestsCount, setWaiterRequestsCount] = useState(0);
  const desktopNotificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    showConfirm({
      title: isRTL ? "تسجيل الخروج" : "Logout",
      message: isRTL
        ? "هل أنت متأكد من رغبتك في تسجيل الخروج؟"
        : "Are you sure you want to logout?",
      confirmText: isRTL ? "تسجيل الخروج" : "Logout",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: () => {
        logout();
      },
    });
  };

  // Debug: Log notification state changes
  useEffect(() => {
    console.log("🔔 Notifications state changed:", {
      isOpen: isNotificationsOpen,
      count: notifications.length,
      unread: unreadCount,
    });
  }, [isNotificationsOpen, notifications, unreadCount]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
      if (isNotificationsOpen) {
        const clickedInsideDesktop = desktopNotificationRef.current?.contains(
          event.target as Node
        );
        const clickedInsideMobile = mobileNotificationRef.current?.contains(
          event.target as Node
        );

        if (!clickedInsideDesktop && !clickedInsideMobile) {
          setIsNotificationsOpen(false);
          setIsWaiterRequestsOpen(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isUserMenuOpen, isNotificationsOpen, isWaiterRequestsOpen]);

  // Handle waiter requests
  useEffect(() => {
    const handleWaiterRequest = (event: CustomEvent) => {
      const { notification, tableNumber, orderType } = event.detail;

      // Add to waiter requests list
      setWaiterRequests((prev) => [notification, ...prev]);
      setWaiterRequestsCount((prev) => prev + 1);

      // Show browser notification if enabled
      if (browserNotificationsEnabled) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      }
    };

    window.addEventListener(
      "waiterRequest",
      handleWaiterRequest as EventListener
    );

    return () => {
      window.removeEventListener(
        "waiterRequest",
        handleWaiterRequest as EventListener
      );
    };
  }, [browserNotificationsEnabled]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block  shadow-sm border-b border-gray-200 dark:border-gray-700 bg-trancparent backdrop-blur-lg  sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 mx-2 flex items-center">
                <Link
                  href="/"
                  className="flex items-center text-lg rounded-lg lg:text-xl font-bold text-gray-900 dark:text-white"
                >
                  <Logo size="lg" />
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:ml-3 lg:ml-6 md:flex gap-1 lg:gap-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  const totalNotifications =
                    newOrdersCount + updatedOrdersCount;
                  const showBadge =
                    item.name === "Orders" && totalNotifications > 0;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-1 lg:px-2 pt-1 border-b-2 text-xs lg:text-sm font-medium whitespace-nowrap ${
                        isActive
                          ? "border-primary-500 text-gray-900 dark:text-white"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      <span className="relative flex items-center gap-1">
                        {iconMap[item.icon as keyof typeof iconMap]}
                        {showBadge && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center font-bold text-[10px] lg:text-xs">
                            {totalNotifications > 9 ? "9+" : totalNotifications}
                          </span>
                        )}
                        <span className="hidden lg:inline">{t(item.key)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Waiter Requests */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWaiterRequestsOpen(!isWaiterRequestsOpen);
                  }}
                  className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 96c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm-16 128h32c26.5 0 48 21.5 48 48v32h32v64H160v-64h32v-32c0-26.5 21.5-48 48-48z" />
                  </svg>

                  {waiterRequestsCount > 0 && (
                    <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {waiterRequestsCount > 9 ? "9+" : waiterRequestsCount}
                    </span>
                  )}
                </button>

                {/* Waiter Requests Dropdown */}
                {isWaiterRequestsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "طلبات النادل" : "Waiter Requests"}
                        </h3>
                        {waiterRequestsCount > 0 && (
                          <button
                            onClick={() => {
                              setWaiterRequests([]);
                              setWaiterRequestsCount(0);
                            }}
                            className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                          >
                            {isRTL ? "مسح الكل" : "Clear All"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {waiterRequests.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          {isRTL ? "لا توجد طلبات نادل" : "No waiter requests"}
                        </div>
                      ) : (
                        waiterRequests.map((request, index) => (
                          <div
                            key={index}
                            className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {request.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {request.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(request.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setWaiterRequests((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                  setWaiterRequestsCount((prev) =>
                                    Math.max(0, prev - 1)
                                  );
                                }}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={desktopNotificationRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(
                      "🔔 Desktop Notification button clicked. Current state:",
                      isNotificationsOpen
                    );
                    console.log(
                      "📊 Notifications:",
                      notifications.length,
                      "Unread:",
                      unreadCount
                    );
                    if (!isNotificationsOpen) {
                      // Fetch notifications when opening dropdown
                      fetchNotifications();
                    }
                    setIsNotificationsOpen(!isNotificationsOpen);
                  }}
                  className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 ${
                      isRTL ? "left-0" : "right-0"
                    }`}
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "الإشعارات" : "Notifications"}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                          >
                            {isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}
                          </button>
                        )}
                      </div>

                      {/* Browser Notification Toggle */}
                      {!browserNotificationsEnabled && (
                        <button
                          onClick={requestNotificationPermission}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
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
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          {isRTL
                            ? "تفعيل الإشعارات الفورية"
                            : "Enable Browser Notifications"}
                        </button>
                      )}

                      {browserNotificationsEnabled && (
                        <div className="flex items-center gap-2 px-3 py-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {isRTL
                            ? "الإشعارات الفورية مفعلة"
                            : "Browser Notifications Enabled"}
                        </div>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                          {isRTL ? "لا توجد إشعارات" : "No notifications"}
                        </div>
                      ) : (
                        <>
                          {notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                                !notification.isRead
                                  ? "bg-blue-50 dark:bg-blue-900/20"
                                  : ""
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsRead(notification.id);
                                }
                                router.push("/dashboard/notifications");
                                setIsNotificationsOpen(false);
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
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      title={
                                        isRTL ? "تحديد كمقروء" : "Mark as read"
                                      }
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
                                      deleteNotification(notification.id);
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
                                href="/dashboard/notifications"
                                className="block w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                onClick={() => setIsNotificationsOpen(false)}
                              >
                                {isRTL
                                  ? "عرض جميع الإشعارات"
                                  : "View All Notifications"}
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
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isRTL ? "space-x-reverse space-x-3" : "space-x-3"
                  }`}
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  {!isRTL && (
                    <div className="text-sm text-left">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isUserMenuOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {isRTL && (
                    <div className="text-sm text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>
                  )}
                </button>

                {/* Dropdown menu */}
                {isUserMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 ${
                      isRTL ? "left-0" : "right-0"
                    }`}
                  >
                    <div className="py-1">
                      {/* Language and Theme Toggle in Menu */}
                      <div className="px-4 flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {isRTL ? "اللغة" : "Language"}
                        </p>
                        <LanguageToggle />
                      </div>
                      <div className="px-4 flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {isRTL ? "المظهر" : "Theme"}
                        </p>
                        <ThemeToggle />
                      </div>

                      <Link
                        href={"/dashboard/settings"}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
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
                        {t("nav.settings")}
                      </Link>
                      <Link
                        href="/dashboard/subscription"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 1.343-3 3v5h6v-5c0-1.657-1.343-3-3-3zm0-5a5 5 0 00-5 5v1H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1V8a5 5 0 00-5-5z"
                          />
                        </svg>
                        {isRTL ? "اشتراكي" : "Subscription"}
                      </Link>
                      <Link
                        href="/dashboard/invoices"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
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
                        {isRTL ? "فواتيري" : "My Invoices"}
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {t("nav.logout")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile & Tablet Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 shadow-lg">
        <div className="flex justify-around items-center py-2 px-2 sm:px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const totalNotifications = newOrdersCount + updatedOrdersCount;
            const showBadge = item.name === "Orders" && totalNotifications > 0;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1 sm:px-3 ${
                  isActive
                    ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-105"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <span className="relative mb-1">
                  <div
                    className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}
                  >
                    {iconMap[item.icon as keyof typeof iconMap]}
                  </div>
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                      {totalNotifications > 9 ? "9+" : totalNotifications}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium truncate">
                  {t(item.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile & Tablet Top Bar */}
      <div className="lg:hidden bg-trancparent backdrop-blur-lg  sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href={"/"}>
              <Logo size="md" />
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Waiter Requests */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWaiterRequestsOpen(!isWaiterRequestsOpen);
                }}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 96c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm-16 128h32c26.5 0 48 21.5 48 48v32h32v64H160v-64h32v-32c0-26.5 21.5-48 48-48z" />
                </svg>

                {waiterRequestsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                    {waiterRequestsCount > 9 ? "9+" : waiterRequestsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Notifications */}
            <div className="relative" ref={mobileNotificationRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    "🔔 Mobile Notification button clicked. Current state:",
                    isNotificationsOpen
                  );
                  console.log(
                    "📊 Notifications:",
                    notifications.length,
                    "Unread:",
                    unreadCount
                  );
                  if (!isNotificationsOpen) {
                    // Fetch notifications when opening dropdown
                    fetchNotifications();
                  }
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Notifications Dropdown */}
              {isNotificationsOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`fixed inset-x-0 top-16 sm:absolute sm:top-auto sm:inset-auto sm:mt-2 sm:w-96 mx-4 sm:mx-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 ${
                    isRTL ? "sm:left-0" : "sm:right-0"
                  }`}
                >
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isRTL ? "الإشعارات" : "Notifications"}
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          {isRTL ? "تحديد الكل كمقروء" : "Mark all as read"}
                        </button>
                      )}
                    </div>

                    {/* Browser Notification Toggle */}
                    {!browserNotificationsEnabled && (
                      <button
                        onClick={requestNotificationPermission}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
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
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        {isRTL
                          ? "تفعيل الإشعارات الفورية"
                          : "Enable Browser Notifications"}
                      </button>
                    )}

                    {browserNotificationsEnabled && (
                      <div className="flex items-center gap-2 px-3 py-2 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {isRTL
                          ? "الإشعارات الفورية مفعلة"
                          : "Browser Notifications Enabled"}
                      </div>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {isRTL ? "لا توجد إشعارات" : "No notifications"}
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            router.push("/dashboard/notifications");
                            setIsNotificationsOpen(false);
                          }}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                            !notification.isRead
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
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
                                {new Date(
                                  notification.createdAt
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              {!notification.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title={
                                    isRTL ? "تحديد كمقروء" : "Mark as read"
                                  }
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
                                  deleteNotification(notification.id);
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
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile User Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isRTL ? "space-x-reverse space-x-2" : "space-x-2"
                }`}
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </button>

              {/* Mobile Dropdown menu */}
              {isUserMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`absolute mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 ${
                    isRTL ? "left-0" : "right-0"
                  }`}
                >
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role?.toLowerCase()}
                      </p>
                    </div>

                    {/* Language and Theme Toggle in Mobile Menu */}
                    <div className="px-4 flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isRTL ? "اللغة" : "Language"}
                      </p>
                      <LanguageToggle />
                    </div>
                    <div className="px-4 flex items-center gap-3 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isRTL ? "المظهر" : "Theme"}
                      </p>
                      <ThemeToggle />
                    </div>

                    <Link
                      href={"/dashboard/settings"}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
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
                      {t("nav.settings")}
                    </Link>
                    <Link
                      href="/dashboard/subscription"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 1.343-3 3v5h6v-5c0-1.657-1.343-3-3-3zm0-5a5 5 0 00-5 5v1H6a2 2 0 00-2 2v7a2 2 0 002 2h12a2 2 0 002-2v-7a2 2 0 00-2-2h-1V8a5 5 0 00-5-5z"
                        />
                      </svg>
                      {isRTL ? "اشتراكي" : "Subscription"}
                    </Link>
                    <Link
                      href="/dashboard/invoices"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
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
                      {isRTL ? "فواتيري" : "My Invoices"}
                    </Link>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {t("nav.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Waiter Requests Dropdown */}
      {isWaiterRequestsOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setIsWaiterRequestsOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-lg max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRTL ? "طلبات النادل" : "Waiter Requests"}
                </h3>
                {waiterRequestsCount > 0 && (
                  <button
                    onClick={() => {
                      setWaiterRequests([]);
                      setWaiterRequestsCount(0);
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                  >
                    {isRTL ? "مسح الكل" : "Clear All"}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {waiterRequests.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {isRTL ? "لا توجد طلبات نادل" : "No waiter requests"}
                </div>
              ) : (
                waiterRequests.map((request, index) => (
                  <div
                    key={index}
                    className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {request.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setWaiterRequests((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                          setWaiterRequestsCount((prev) =>
                            Math.max(0, prev - 1)
                          );
                        }}
                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
