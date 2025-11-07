"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface CustomerSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRestaurant: (restaurantId: string) => void;
  joinTable: (qrCodeId: string) => void;
  leaveRestaurant: () => void;
  leaveTable: () => void;
  emitCreateOrder: (data: CreateOrderData) => void;
  emitWaiterRequest: (data: WaiterRequestData) => void;
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

interface WaiterRequestData {
  restaurantId: string;
  tableNumber?: string;
  orderType: "DINE_IN" | "DELIVERY";
}

const CustomerSocketContext = createContext<
  CustomerSocketContextType | undefined
>(undefined);

export function CustomerSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection for customers (no auth required)
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";
    const newSocket = io(socketUrl, {
      autoConnect: false,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Customer socket connected");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("Customer socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      // Only log error if it's not a network error
      if (error.message !== "websocket error") {
        console.error("Customer socket connection error:", error);
      }
      setIsConnected(false);
    });

    // Order event handlers

    // Listen for order creation confirmation
    newSocket.on("order_created", (data) => {
      console.log("Socket: Order created successfully:", data);
      window.dispatchEvent(new CustomEvent("orderCreated", { detail: data }));
    });

    // Listen for order creation errors
    newSocket.on("order_error", (data) => {
      console.error("Socket: Order creation error:", data);
      window.dispatchEvent(new CustomEvent("order_error", { detail: data }));
    });

    // Listen for real-time order updates (when items are added)
    newSocket.on("order_update", (data) => {
      console.log("🔔 Socket: order_update received:", data);
      window.dispatchEvent(new CustomEvent("orderUpdate", { detail: data }));
    });

    // Listen for order status updates (when status changes or items added)
    newSocket.on("order_status_update", (data) => {
      console.log("🔔 Socket: order_status_update received:", data);
      window.dispatchEvent(
        new CustomEvent("orderStatusUpdate", { detail: data })
      );
    });

    // Listen for joined_table confirmation
    newSocket.on("joined_table", (data) => {
      console.log("✅ Successfully joined table room:", data);
    });

    // Listen for errors
    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    // Connect the socket
    newSocket.connect();

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    if (socket) {
      socket.emit("leave_restaurant");
    }
  };

  const leaveTable = () => {
    if (socket) {
      socket.emit("leave_table");
    }
  };

  const emitCreateOrder = (data: CreateOrderData) => {
    if (socket) {
      socket.emit("create_order", data);
    }
  };

  const emitWaiterRequest = (data: WaiterRequestData) => {
    if (socket) {
      socket.emit("request_waiter", data);
    }
  };

  const value = {
    socket,
    isConnected,
    joinRestaurant,
    joinTable,
    leaveRestaurant,
    leaveTable,
    emitCreateOrder,
    emitWaiterRequest,
  };

  return (
    <CustomerSocketContext.Provider value={value}>
      {children}
    </CustomerSocketContext.Provider>
  );
}

export function useCustomerSocket() {
  const context = useContext(CustomerSocketContext);
  if (context === undefined) {
    throw new Error(
      "useCustomerSocket must be used within a CustomerSocketProvider"
    );
  }
  return context;
}
