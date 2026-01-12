"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  newOrdersCount: number;
  updatedOrdersCount: number;
  isSoundMuted: boolean;
  toggleSound: () => void;
  joinRestaurant: (restaurantId: string) => void;
  joinTable: (qrCodeId: string) => void;
  joinAdmin: (adminId: string) => void;
  leaveRestaurant: () => void;
  leaveTable: () => void;
  leaveAdmin: () => void;
  emitOrderUpdate: (
    orderId: string,
    status: string,
    restaurantId: string
  ) => void;
  emitCreateOrder: (data: CreateOrderData) => void;
  clearNewOrdersCount: () => void;
  clearUpdatedOrdersCount: () => void;
}

interface CreateOrderData {
  restaurantId: string;
  orderType: "DINE_IN" | "DELIVERY";
  tableNumber?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
    extras?: any;
  }>;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [updatedOrdersCount, setUpdatedOrdersCount] = useState(0);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const isSoundMutedRef = useRef(isSoundMuted);
  const { user } = useAuth();

  // Keep ref in sync with state
  useEffect(() => {
    isSoundMutedRef.current = isSoundMuted;
  }, [isSoundMuted]);

  // Load sound preference from localStorage on mount
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem("ordersSoundMuted");
    if (savedSoundPreference !== null) {
      setIsSoundMuted(savedSoundPreference === "true");
    }
  }, []);

  // Function to toggle sound mute/unmute
  const toggleSound = () => {
    const newMutedState = !isSoundMuted;
    setIsSoundMuted(newMutedState);
    localStorage.setItem("ordersSoundMuted", newMutedState.toString());
  };

  // Function to play notification sound for new orders
  const playNewOrderSound = () => {
    if (isSoundMutedRef.current) return;
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sound for new orders (distinct from updates)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);

      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.4
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Function to play notification sound for order updates
  const playOrderUpdateSound = () => {
    if (isSoundMutedRef.current) return;
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Sound for order updates (different from new orders)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Function to play notification sound for waiter requests
  const playWaiterRequestSound = () => {
    if (isSoundMutedRef.current) return;
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Distinct sound for waiter requests - bell-like sound
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.4);

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log("Could not play waiter request sound:", error);
    }
  };

  useEffect(() => {
    // Initialize socket connection
    // Use Socket Service on port 5001
    const getSocketUrl = () => {
      if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        return process.env.NEXT_PUBLIC_SOCKET_URL;
      }

      // If running on localhost, use localhost
      if (
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ) {
        return "http://localhost:5001";
      }

      // Otherwise use the same hostname with port 5001
      return `http://${window.location.hostname}:5001`;
    };

    const socketUrl = getSocketUrl();
    console.log("Connecting to Socket.IO:", socketUrl);

    const newSocket = io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      // Only log error if it's not a network error
      if (error.message !== "websocket error") {
        console.error("Socket connection error:", error);
      }
      setIsConnected(false);
    });

    // Order event handlers
    newSocket.on("new_order", (data) => {
      console.log("New order received:", data);

      // Check if order was successfully created (not failed)
      if (data.order && data.order.id) {
        // Check if this is a quick order (created by cashier)
        const isQuickOrder = data.order.tableNumber === "QUICK";

        // Increment new orders count (including quick orders)
        setNewOrdersCount((prev) => prev + 1);

        // Play notification sound for all new orders (including quick orders)
        playNewOrderSound();

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent("newOrder", { detail: data }));
      } else {
        // Order creation failed - no sound, no count increment
        console.log("Order creation failed - no notification");
      }
    });

    newSocket.on("order_updated", (data) => {
      console.log("Order updated:", data);

      // Check if order exists and is not cancelled or completed
      if (data.order && data.order.id && data.order.status) {
        const status = data.order.status;

        // Check if this is a quick order (created by cashier)
        const isQuickOrder = data.order.tableNumber === "QUICK";

        // Skip notifications for quick orders
        if (isQuickOrder) {
          console.log(
            "⚡ Quick order update detected - skipping sound and visual effects"
          );
          window.dispatchEvent(
            new CustomEvent("orderUpdated", { detail: data })
          );
          return;
        }

        // Only show notifications for customer-initiated updates (new order or adding items)
        // Don't show notifications for restaurant/kitchen status changes
        // Don't show notifications for cancelled or completed orders
        if (
          status !== "CANCELLED" &&
          status !== "COMPLETED" &&
          data.updatedBy === "customer"
        ) {
          // Increment updated orders count
          setUpdatedOrdersCount((prev) => prev + 1);

          // Play notification sound for customer updates only (new order or items added)
          playOrderUpdateSound();
        } else {
          console.log(
            "Order update ignored - cancelled/completed order or not from customer (updatedBy:",
            data.updatedBy,
            ")"
          );
        }
      }

      window.dispatchEvent(new CustomEvent("orderUpdated", { detail: data }));
    });

    newSocket.on("order_status_update", (data) => {
      console.log("Order status update:", data);

      // Check if this is a quick order (created by cashier)
      const isQuickOrder = data.order?.tableNumber === "QUICK";

      // Skip notifications for quick orders
      if (isQuickOrder) {
        console.log(
          "⚡ Quick order status update detected - skipping sound and visual effects"
        );
        // Still dispatch events for UI updates, but without sound/visual effects
        window.dispatchEvent(
          new CustomEvent("orderStatusUpdate", { detail: data })
        );
        window.dispatchEvent(new CustomEvent("orderUpdated", { detail: data }));
        return;
      }

      // Only show notifications for customer-initiated updates (new order or adding items)
      // Don't show notifications for restaurant/kitchen status changes
      // Don't show notifications for cancelled or completed orders
      if (data.order && data.order.id && data.order.status) {
        const status = data.order.status;
        if (
          status !== "CANCELLED" &&
          status !== "COMPLETED" &&
          data.updatedBy === "customer"
        ) {
          setUpdatedOrdersCount((prev) => prev + 1);
          playOrderUpdateSound();
        } else {
          console.log(
            "Order status update ignored - cancelled/completed order or not from customer (updatedBy:",
            data.updatedBy,
            ")"
          );
        }
      }

      // Dispatch both events so existing listeners react
      window.dispatchEvent(
        new CustomEvent("orderStatusUpdate", { detail: data })
      );
      window.dispatchEvent(new CustomEvent("orderUpdated", { detail: data }));
    });

    // Waiter request event handler
    newSocket.on("waiter_request", (data) => {
      console.log("Waiter request received:", data);

      // Check if we're on the kitchen display page - don't play sound there
      const isKitchenPage =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/kitchen");

      // Play notification sound for waiter requests only if not on kitchen page
      if (!isKitchenPage) {
        playWaiterRequestSound();
      } else {
        console.log("🔇 Kitchen display page - skipping waiter request sound");
      }

      // Dispatch custom event for components to listen
      window.dispatchEvent(new CustomEvent("waiterRequest", { detail: data }));
    });

    // Notification event handler (for admin notifications to restaurants)
    newSocket.on("notification", (data) => {
      console.log("Notification received via socket:", data);

      // Dispatch custom event for NotificationContext to listen
      window.dispatchEvent(
        new CustomEvent("socketNotification", { detail: data })
      );
    });

    // Error handlers
    newSocket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    newSocket.on("joined_restaurant", (data) => {
      console.log("Joined restaurant room:", data);
    });

    newSocket.on("joined_table", (data) => {
      console.log("Joined table room:", data);
    });

    newSocket.on("order_update_success", (data) => {
      console.log("Order update success:", data);
    });

    setSocket(newSocket);

    // Connect socket
    newSocket.connect();

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []); // Only run once on mount

  // Auto-join appropriate room when user changes
  useEffect(() => {
    if (socket && user) {
      if (user.role === "ADMIN") {
        joinAdmin(user.id);
      } else if (user.restaurant?.id) {
        joinRestaurant(user.restaurant.id);
      }
    }
  }, [socket, user]);

  const joinRestaurant = (restaurantId: string) => {
    if (socket) {
      socket.emit("join_restaurant", { restaurantId });
    }
  };

  const joinTable = (qrCodeId: string) => {
    if (socket) {
      socket.emit("join_table", { qrCodeId });
    }
  };

  const leaveRestaurant = () => {
    if (socket && user?.restaurant?.id) {
      socket.emit("leave_restaurant", { restaurantId: user.restaurant.id });
    }
  };

  const leaveTable = () => {
    if (socket) {
      socket.emit("leave_table");
    }
  };

  const joinAdmin = (adminId: string) => {
    if (socket) {
      console.log("🔗 Joining admin room:", adminId);
      socket.emit("join_admin", { adminId });
      
      // Listen for confirmation
      socket.once("joined_admin", (data) => {
        console.log("✅ Successfully joined admin room:", data);
      });
    }
  };

  const leaveAdmin = () => {
    if (socket && user?.id) {
      socket.emit("leave_admin", { adminId: user.id });
    }
  };

  const emitOrderUpdate = (
    orderId: string,
    status: string,
    restaurantId: string
  ) => {
    if (socket) {
      socket.emit("update_order_status", {
        orderId,
        status,
        restaurantId,
      });
    }
  };

  const emitCreateOrder = (data: CreateOrderData) => {
    if (socket) {
      socket.emit("create_order", data);
    }
  };

  const clearNewOrdersCount = () => {
    setNewOrdersCount(0);
  };

  const clearUpdatedOrdersCount = () => {
    setUpdatedOrdersCount(0);
  };

  const value = {
    socket,
    isConnected,
    newOrdersCount,
    updatedOrdersCount,
    isSoundMuted,
    toggleSound,
    joinRestaurant,
    joinTable,
    joinAdmin,
    leaveRestaurant,
    leaveTable,
    leaveAdmin,
    emitOrderUpdate,
    emitCreateOrder,
    clearNewOrdersCount,
    clearUpdatedOrdersCount,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
