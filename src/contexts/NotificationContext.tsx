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
  const [loading, setLoading] = useState(false);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] =
    useState(false);

  // Calculate unread count from notifications array
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Show browser notification
  const showBrowserNotification = useCallback(
    (title: string, body: string, orderId?: string) => {
      if (
        !browserNotificationsEnabled ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      // Show notification even if user is on the page
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

  // Listen for socket notifications
  useEffect(() => {
    if (!socket) return;

    const handleSocketNotification = (event: CustomEvent) => {
      const data = event.detail;
      console.log("📨 Received notification via socket:", data);

      // Extract notification from the data object
      const notification = data.notification || data;

      if (!notification || !notification.id) {
        console.warn("⚠️ Invalid notification data received:", data);
        return;
      }

      console.log("✅ Processing notification:", notification);

      // Check if notification already exists to avoid duplicates
      setNotifications((prev) => {
        const exists = prev.find((n) => n.id === notification.id);
        if (exists) {
          console.log(
            "⚠️ Notification already exists, skipping:",
            notification.id
          );
          return prev;
        }
        return [notification, ...prev];
      });

      // unreadCount is now automatically calculated from notifications array

      // Show browser notification if enabled
      if (browserNotificationsEnabled) {
        showBrowserNotification(
          notification.title,
          notification.body,
          notification.orderId
        );
      }
    };

    window.addEventListener(
      "socketNotification",
      handleSocketNotification as EventListener
    );

    return () => {
      window.removeEventListener(
        "socketNotification",
        handleSocketNotification as EventListener
      );
    };
  }, [socket, browserNotificationsEnabled, showBrowserNotification]);

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

  const fetchNotifications = useCallback(
    async (retryCount = 0) => {
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
      } catch (error: any) {
        console.error("❌ Error fetching notifications:", error);
        // Don't redirect on 401 if user is still authenticated
        // This can happen right after login before cookie is fully set
        // Retry once after a delay (max 1 retry to prevent infinite loops)
        if (error.response?.status === 401 && user && retryCount === 0) {
          console.log("⚠️ 401 error but user exists - retrying after delay...");
          setTimeout(() => {
            if (user) {
              fetchNotifications(1); // Pass retryCount to prevent infinite loop
            }
          }, 1000);
          return; // Return early to avoid setting loading to false
        }
      } finally {
        setLoading(false);
      }
    },
    [user, fetchUnreadCount]
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      // unreadCount is now automatically calculated from notifications array
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put("/notifications/mark-all-read");

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // unreadCount is now automatically calculated from notifications array
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);

      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // unreadCount is now automatically calculated from notifications array
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

      // Add a small delay to ensure cookie is set after login
      // This prevents 401 errors right after login
      const timer = setTimeout(() => {
        fetchNotifications();
        fetchUnreadCount(); // Get initial unread count quickly
      }, 500); // 500ms delay to ensure cookie is ready

      return () => clearTimeout(timer);
    } else {
      console.log("⚠️ No user, skipping notifications fetch");
      // Clear notifications when user logs out
      setNotifications([]);
      // unreadCount is now automatically calculated from notifications array
    }
  }, [
    user,
    fetchNotifications,
    fetchUnreadCount,
    requestNotificationPermission,
  ]);

  // Note: Real-time notifications are handled via the socketNotification custom event
  // from SocketContext, which listens to the "notification" socket event

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
