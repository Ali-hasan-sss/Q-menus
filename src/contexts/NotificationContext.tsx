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

interface Notification {
  id: string;
  restaurantId: string;
  title: string;
  body: string;
  type: "GENERAL" | "NEW_ORDER" | "ORDER_UPDATE";
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  browserNotificationsEnabled: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
    (title: string, body: string, orderId?: string) => {
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
        tag: orderId || "notification",
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
    if (!user?.restaurant?.id || !socket) return;

    try {
      // Request unread count via WebSocket
      socket.emit("get_restaurant_unread_count", {
        restaurantId: user.restaurant.id,
      });
    } catch (error) {
      console.error("❌ Error requesting unread count:", error);
    }
  }, [user?.restaurant?.id, socket]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get("/notifications");
      if (response.data.success) {
        console.log(
          "📬 Notifications fetched:",
          response.data.data.notifications
        );
        setNotifications(response.data.data.notifications);

        // Fetch accurate unread count from API
        await fetchUnreadCount();
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/mark-all-read");

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);

      // Update local state
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === id);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Request notification permission and fetch data when user logs in
  useEffect(() => {
    if (user) {
      console.log("👤 User authenticated, fetching notifications...");

      // Request browser notification permission
      requestNotificationPermission();

      fetchNotifications();
      fetchUnreadCount(); // Get initial unread count quickly
    } else {
      console.log("⚠️ No user, skipping notifications fetch");
    }
  }, [
    user,
    fetchNotifications,
    fetchUnreadCount,
    requestNotificationPermission,
  ]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      console.log("📬 New notification received:", notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);

      // Increment unread count
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      // Show browser notification if user is not on the page
      showBrowserNotification(
        notification.title,
        notification.body,
        notification.orderId
      );
    };

    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      console.log("📊 Unread count updated:", data.unreadCount);
      setUnreadCount(data.unreadCount);
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("restaurant_unread_count", handleUnreadCountUpdate);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("restaurant_unread_count", handleUnreadCountUpdate);
    };
  }, [socket, showBrowserNotification]);

  return (
    <NotificationContext.Provider
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
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
