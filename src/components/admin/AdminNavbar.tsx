"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSocket } from "@/contexts/SocketContext";
import { useAdminNotifications } from "@/contexts/AdminNotificationContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import AdminNotificationsDropdown from "./AdminNotificationsDropdown";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "../ui/LanguageToggle";

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const { isRTL } = useLanguage();
  const { showConfirm } = useConfirmDialog();
  const { socket } = useSocket();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    browserNotificationsEnabled,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
  } = useAdminNotifications();
  const router = useRouter();
  const pathname = usePathname();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Navigation items
  const navigation = [
    {
      name: "Dashboard",
      nameAr: "لوحة التحكم",
      href: "/admin",
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z",
    },
    {
      name: "Users",
      nameAr: "المستخدمين",
      href: "/admin/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
    },
    {
      name: "Plans",
      nameAr: "الخطط",
      href: "/admin/plans",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      name: "Subscriptions",
      nameAr: "الاشتراكات",
      href: "/admin/subscriptions",
      icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      name: "Invoices",
      nameAr: "الفواتير",
      href: "/admin/invoices",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      name: "Gallery",
      nameAr: "المعرض",
      href: "/admin/gallery",
      icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".user-menu") &&
        !target.closest(".notifications-dropdown")
      ) {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    showConfirm({
      title: isRTL ? "تأكيد تسجيل الخروج" : "Confirm Logout",
      message: isRTL
        ? "هل أنت متأكد من تسجيل الخروج؟"
        : "Are you sure you want to logout?",
      onConfirm: () => {
        logout();
        router.push("/auth/login");
      },
    });
  };

  return (
    <nav className="hidden lg:block bg-trancparent backdrop-blur-lg  sticky top-0 z-50 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/admin"
              className="flex items-center text-2xl font-bold text-primary-600"
            >
              <Logo size="lg" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex lg:gap-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary-500 text-gray-900 dark:text-white"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <svg
                    className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={item.icon}
                    />
                  </svg>
                  {isRTL ? item.nameAr : item.name}
                </Link>
              );
            })}
          </div>

          {/* Right side - Theme Toggle, Notifications and User Menu */}
          <div className="flex items-center gap-4 ">
            {/* Theme Toggle */}
            <ThemeToggle />
            <LanguageToggle />
            {/* Notifications */}
            <div className="relative notifications-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isNotificationsOpen) {
                    // Fetch notifications when opening dropdown
                    fetchNotifications();
                  }
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative"
              >
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              <AdminNotificationsDropdown
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                notificationsLoading={notificationsLoading}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDeleteNotification={deleteNotification}
                isRTL={isRTL}
                browserNotificationsEnabled={browserNotificationsEnabled}
                requestNotificationPermission={requestNotificationPermission}
              />
            </div>

            {/* User Menu */}
            <div className="relative user-menu">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">Open user menu</span>
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  {user?.firstName} {user?.lastName}
                </span>
                <svg
                  className="ml-2 h-4 w-4 text-gray-400"
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
              </button>

              {isUserMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700`}
                >
                  <Link
                    href="/admin/notifications"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {isRTL ? "الإشعارات" : "Notifications"}
                    </div>
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {isRTL ? "الإعدادات" : "Settings"}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      {isRTL ? "تسجيل الخروج" : "Logout"}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
