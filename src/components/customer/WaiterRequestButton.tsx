"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";
import toast from "react-hot-toast";

interface WaiterRequestButtonProps {
  restaurantId: string;
  tableNumber?: string;
  orderType: "DINE_IN" | "DELIVERY";
  menuTheme?: any;
  className?: string;
}

export default function WaiterRequestButton({
  restaurantId,
  tableNumber,
  orderType,
  menuTheme,
  className = "",
}: WaiterRequestButtonProps) {
  const { isRTL, t } = useLanguage();
  const { socket, isConnected } = useCustomerSocket();
  const [isRequesting, setIsRequesting] = useState(false);
  const handlersRef = useRef<{
    errorHandler?: (data: { message: string }) => void;
    successHandler?: () => void;
  }>({});

  // Cleanup handlers on unmount
  useEffect(() => {
    return () => {
      if (socket && handlersRef.current.errorHandler) {
        socket.off("waiter_request_error", handlersRef.current.errorHandler);
      }
      if (socket && handlersRef.current.successHandler) {
        socket.off("waiter_request_sent", handlersRef.current.successHandler);
      }
    };
  }, [socket]);

  const handleWaiterRequest = async () => {
    if (!socket || !isConnected) {
      toast.error(isRTL ? "غير متصل بالخادم" : "Not connected to server");
      return;
    }

    if (isRequesting) return;

    try {
      setIsRequesting(true);

      // Remove old handlers if they exist
      if (handlersRef.current.errorHandler) {
        socket.off("waiter_request_error", handlersRef.current.errorHandler);
      }
      if (handlersRef.current.successHandler) {
        socket.off("waiter_request_sent", handlersRef.current.successHandler);
      }

      // Set up error handler before emitting
      const errorHandler = (data: { message: string }) => {
        console.error("Waiter request error:", data);

        // Translate error message based on content
        let translatedMessage = data.message;
        if (data.message) {
          if (
            data.message.includes("Table is not occupied") ||
            data.message.includes("start a session")
          ) {
            translatedMessage = t("menu.orderError.tableNotOccupied");
          } else {
            // Default error message
            translatedMessage = t("waiter.requestError.failed");
          }
        } else {
          translatedMessage = t("waiter.requestError.failed");
        }

        toast.error(translatedMessage);
        setIsRequesting(false);
        if (socket) {
          socket.off("waiter_request_error", errorHandler);
        }
      };

      // Set up success handler
      const successHandler = () => {
        toast.success(
          isRTL
            ? "تم إرسال طلب النادل بنجاح"
            : "Waiter request sent successfully"
        );
        setIsRequesting(false);
        if (socket) {
          socket.off("waiter_request_sent", successHandler);
        }
      };

      handlersRef.current.errorHandler = errorHandler;
      handlersRef.current.successHandler = successHandler;

      socket.on("waiter_request_error", errorHandler);
      socket.on("waiter_request_sent", successHandler);

      // Emit waiter request via socket
      socket.emit("request_waiter", {
        restaurantId,
        tableNumber: orderType === "DINE_IN" ? tableNumber : undefined,
        orderType,
      });

      // Cleanup handlers after timeout
      setTimeout(() => {
        if (socket) {
          socket.off("waiter_request_error", errorHandler);
          socket.off("waiter_request_sent", successHandler);
        }
        setIsRequesting(false);
      }, 5000);
    } catch (error) {
      console.error("Error sending waiter request:", error);
      toast.error(
        isRTL ? "فشل في إرسال طلب النادل" : "Failed to send waiter request"
      );
      setIsRequesting(false);
    }
  };

  // Check if this is a circular button (for bottom floating position)
  const isCircular =
    className.includes("rounded-full") &&
    className.includes("w-14") &&
    className.includes("h-14");

  return (
    <button
      onClick={handleWaiterRequest}
      disabled={isRequesting || !isConnected}
      className={`${isCircular ? "flex items-center justify-center" : "flex items-center gap-2 px-4 py-2 rounded-lg font-medium"} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: menuTheme?.primaryColor || "#f58114",
        color: menuTheme?.textColor || "#ffffff",
        border: `2px solid ${menuTheme?.secondaryColor || "#27ae1e"}`,
      }}
      title={isRTL ? "طلب النادل" : "Call Waiter"}
    >
      {isRequesting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>{isRTL ? "جاري الإرسال..." : "Sending..."}</span>
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 96c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm-16 128h32c26.5 0 48 21.5 48 48v32h32v64H160v-64h32v-32c0-26.5 21.5-48 48-48z" />
          </svg>

          <span>{isRTL ? "طلب النادل" : "Call Waiter"}</span>
        </>
      )}
    </button>
  );
}
