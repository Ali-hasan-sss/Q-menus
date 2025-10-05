"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface AdminNotificationContextType {
  notifications: AdminNotification[];
  unreadCount: number;
  loading: boolean;
  browserNotificationsEnabled: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
}

const AdminNotificationContext = createContext<
  AdminNotificationContextType | undefined
>(undefined);

export const AdminNotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
    useState(false);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      console.log("⚠️ Browser doesn't support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setBrowserNotificationsEnabled(true);
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setBrowserNotificationsEnabled(true);
        return true;
      }
    }

    return false;
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (
        !browserNotificationsEnabled ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      // Only show if user is not on the page
      if (!document.hidden) {
        return;
      }

      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: "admin-notification",
        requireInteraction: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    },
    [browserNotificationsEnabled]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id || !socket) return;

    try {
      // Request unread count via WebSocket
      socket.emit("get_admin_unread_count", {
        adminId: user.id,
      });
    } catch (error) {
      console.error("❌ Error requesting admin unread count:", error);
    }
  }, [user?.id, socket]);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role !== "ADMIN") return;

    try {
      setLoading(true);
      const response = await api.get("/admin/notifications");
      if (response.data.success) {
        console.log("📬 Admin notifications fetched:", response.data.data);
        setNotifications(response.data.data);

        // Fetch accurate unread count from API
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error("❌ Error fetching admin notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/admin/notifications/${id}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking admin notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((notification) =>
          api.put(`/admin/notifications/${notification.id}/read`)
        )
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all admin notifications as read:", error);
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/admin/notifications/${id}`);

      // Update local state
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Error deleting admin notification:", error);
    }
  }, []);

  // Request notification permission and fetch data when admin logs in
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      console.log("👤 Admin authenticated, fetching notifications...");

      // Request browser notification permission
      requestNotificationPermission();

      fetchNotifications();
      fetchUnreadCount(); // Get initial unread count quickly
    } else {
      console.log("⚠️ No admin user, skipping notifications fetch");
    }
  }, [
    user,
    fetchNotifications,
    fetchUnreadCount,
    requestNotificationPermission,
  ]);

  // Listen for real-time admin notifications via Socket.IO
  useEffect(() => {
    if (!socket || !user || user.role !== "ADMIN") return;

    const handleNewAdminNotification = (notification: AdminNotification) => {
      console.log("📬 New admin notification received:", notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Increment unread count
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show browser notification if user is not on the page
      showBrowserNotification(notification.title, notification.body);
    };

    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      console.log("📊 Admin unread count updated:", data.unreadCount);
      setUnreadCount(data.unreadCount);
    };

    socket.on("new_admin_notification", handleNewAdminNotification);
    socket.on("admin_unread_count", handleUnreadCountUpdate);

    return () => {
      socket.off("new_admin_notification", handleNewAdminNotification);
      socket.off("admin_unread_count", handleUnreadCountUpdate);
    };
  }, [socket, user, showBrowserNotification]);

  return (
    <AdminNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        browserNotificationsEnabled,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        requestNotificationPermission,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => {
  const context = useContext(AdminNotificationContext);
  if (context === undefined) {
    throw new Error(
      "useAdminNotifications must be used within an AdminNotificationProvider"
    );
  }
  return context;
};
