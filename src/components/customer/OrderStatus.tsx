"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatCurrencyWithLanguage } from "@/lib/utils";
import { useCustomerSocket } from "@/contexts/CustomerSocketContext";
import { useLanguage } from "@/contexts/LanguageContext";
import html2canvas from "html2canvas";

interface OrderItem {
  id: string;
  quantity: number;
  price: string | number;
  notes?: string;
  extras?: any;
  isCustomItem?: boolean;
  customItemName?: string;
  customItemNameAr?: string;
  menuItem?: {
    id: string;
    name: string;
    nameAr?: string;
    currency?: string;
    category?: {
      id: string;
      name: string;
      nameAr?: string;
    };
  };
}

interface OrderStatusProps {
  orderId: string;
  status: string;
  tableNumber: string;
  restaurantName: string;
  restaurantId?: string;
  orderType?: string;
  orderItems?: OrderItem[];
  subtotal?: string | number;
  taxes?: Array<{
    name: string;
    nameAr?: string;
    percentage: number;
    amount: number;
  }>;
  totalPrice?: string | number;
  currency?: string;
  onNewOrder?: () => void;
  menuTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  } | null;
}

// Status configuration with translations
const getStatusConfig = (isRTL: boolean) => ({
  PENDING: {
    label: isRTL ? "في الانتظار" : "Pending",
    description: isRTL
      ? "تم استلام طلبك وهو قيد المعالجة"
      : "Your order has been received and is being processed",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: "📝",
  },
  PREPARING: {
    label: isRTL ? "قيد التحضير" : "Preparing",
    description: isRTL
      ? "طلبك قيد التحضير من قبل طهاةنا"
      : "Your order is being prepared by our chefs",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    icon: "🔥",
  },
  READY: {
    label: isRTL ? "جاهز" : "Ready",
    description: isRTL
      ? "طلبك جاهز! يرجى التوجه للكاونتر"
      : "Your order is ready! Please come to the counter",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: "✅",
  },
  DELIVERED: {
    label: isRTL ? "في الطريق" : "On the way",
    description: isRTL
      ? "طلبك في الطريق إليك"
      : "Your order is on the way to you",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: "🚚",
  },
  COMPLETED: {
    label: isRTL ? "مكتمل" : "Completed",
    description: isRTL
      ? "شكراً لك على طلبك! استمتع بوجبتك"
      : "Thank you for your order! Enjoy your meal",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: "🎉",
  },
  CANCELLED: {
    label: isRTL ? "ملغي" : "Cancelled",
    description: isRTL ? "تم إلغاء طلبك" : "Your order has been cancelled",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: "❌",
  },
});

export function OrderStatus({
  orderId,
  status,
  tableNumber,
  restaurantName,
  restaurantId,
  orderType = "DINE_IN",
  orderItems = [],
  subtotal,
  taxes,
  totalPrice = "0",
  currency = "USD",
  onNewOrder,
  menuTheme,
}: OrderStatusProps) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [orderTime] = useState(new Date());
  const { isConnected } = useCustomerSocket();
  const { isRTL, language } = useLanguage();
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Function to get extras names
  const getExtrasNames = (extras: any, originalMenuItem?: any): string[] => {
    if (!extras || typeof extras !== "object") return [];

    const extrasNames: string[] = [];
    Object.values(extras).forEach((extraGroup: any) => {
      if (Array.isArray(extraGroup)) {
        // This is an array of selected extra IDs
        extraGroup.forEach((extraId: string) => {
          // Find the extra name from the original menu item data
          if (originalMenuItem?.extras) {
            Object.values(originalMenuItem.extras).forEach(
              (originalExtraGroup: any) => {
                if (originalExtraGroup.options) {
                  const option = originalExtraGroup.options.find(
                    (opt: any) => opt.id === extraId
                  );
                  if (option) {
                    const extraName = isRTL
                      ? option.nameAr || option.name
                      : option.name;
                    extrasNames.push(extraName);
                  }
                }
              }
            );
          } else {
            // Fallback to showing ID if no original data
            extrasNames.push(`Extra: ${extraId}`);
          }
        });
      }
    });
    return extrasNames;
  };

  // Function to export invoice as image
  const exportInvoice = async () => {
    if (!invoiceRef.current) return;

    try {
      // Temporarily make the invoice visible for capturing
      invoiceRef.current.style.position = "fixed";
      invoiceRef.current.style.top = "0";
      invoiceRef.current.style.left = "0";
      invoiceRef.current.style.opacity = "1";
      invoiceRef.current.style.zIndex = "9999";

      // Wait a bit for rendering
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(invoiceRef.current, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
      });

      // Hide it again
      invoiceRef.current.style.position = "fixed";
      invoiceRef.current.style.opacity = "0";
      invoiceRef.current.style.zIndex = "-50";

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${isRTL ? "فاتورة" : "invoice"}_${orderId.slice(-8)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error("Error exporting invoice:", error);
      alert(isRTL ? "حدث خطأ أثناء التصدير" : "Error exporting invoice");

      // Make sure to hide it even if there's an error
      if (invoiceRef.current) {
        invoiceRef.current.style.opacity = "0";
        invoiceRef.current.style.zIndex = "-50";
      }
    }
  };

  // Function to play status update sound
  const playStatusUpdateSound = (status: string) => {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different statuses
      let frequency1 = 400;
      let frequency2 = 600;
      let duration = 0.3;

      switch (status) {
        case "PENDING":
          frequency1 = 400;
          frequency2 = 500;
          duration = 0.2;
          break;
        case "PREPARING":
          frequency1 = 500;
          frequency2 = 600;
          duration = 0.3;
          break;
        case "READY":
          frequency1 = 600;
          frequency2 = 800;
          duration = 0.4;
          break;
        case "DELIVERED":
        case "COMPLETED":
          frequency1 = 800;
          frequency2 = 1000;
          duration = 0.5;
          break;
        default:
          frequency1 = 400;
          frequency2 = 600;
          duration = 0.3;
      }

      oscillator.frequency.setValueAtTime(frequency1, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(
        frequency2,
        audioContext.currentTime + 0.1
      );

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log("Could not play status update sound:", error);
    }
  };

  useEffect(() => {
    // Listen for status updates
    const handleStatusUpdate = (event: CustomEvent) => {
      const { order, updatedBy } = event.detail;
      if (order.id === orderId) {
        const previousStatus = currentStatus;
        setCurrentStatus(order.status);

        // Play sound only if status actually changed and not updated by restaurant
        if (previousStatus !== order.status && updatedBy !== "restaurant") {
          playStatusUpdateSound(order.status);
        } else if (updatedBy === "restaurant") {
          console.log("Order updated by restaurant - no sound notification");
        }
      }
    };

    window.addEventListener(
      "orderStatusUpdate",
      handleStatusUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "orderStatusUpdate",
        handleStatusUpdate as EventListener
      );
    };
  }, [orderId]);

  const statusConfig = getStatusConfig(isRTL);
  const statusInfo =
    statusConfig[currentStatus as keyof typeof statusConfig] ||
    statusConfig.PENDING;

  // Define order flow based on order type
  const getOrderFlow = () => {
    if (orderType === "DELIVERY") {
      return ["PENDING", "PREPARING", "READY", "DELIVERED", "COMPLETED"];
    }
    return ["PENDING", "PREPARING", "READY", "COMPLETED"];
  };

  const orderFlow = getOrderFlow();
  const currentIndex = orderFlow.indexOf(currentStatus);

  const handleNewOrder = () => {
    if (onNewOrder) {
      onNewOrder();
    } else if (restaurantId) {
      // For security, always redirect to QR scanner for new orders
      router.push(`/menu/${restaurantId}`);
    } else {
      router.refresh();
    }
  };

  const handleViewOrder = () => {
    router.push(`/order/${orderId}`);
  };

  // Show cancelled badge if order is cancelled
  if (currentStatus === "CANCELLED") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "حالة الطلب" : "Order Status"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {restaurantName}
            </p>
            {tableNumber && (
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 font-medium">
                {isRTL ? `طاولة ${tableNumber}` : `Table ${tableNumber}`}
              </p>
            )}
          </div>

          {/* Cancelled Order */}
          <Card className="p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isRTL ? "الطلب ملغي" : "Order Cancelled"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isRTL ? "تم إلغاء طلبك" : "Your order has been cancelled"}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isRTL ? "رقم الطلب:" : "Order ID:"} #{orderId.slice(-8)}
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRTL
                ? "تحتاج مساعدة؟ تواصل مع موظفي المطعم"
                : "Need help? Contact the restaurant staff"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:px-6 lg:px-8">
      {/* Invoice Content (for export) - Hidden but in DOM */}
      <div
        ref={invoiceRef}
        className="fixed opacity-0 pointer-events-none -z-50 bg-white p-8 rounded-lg w-[400px]"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Restaurant Name */}
        <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {restaurantName}
          </h1>
          <p className="text-sm text-gray-600">
            {isRTL ? "فاتورة" : "Invoice"}
          </p>
        </div>

        {/* Order Info */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">
              {isRTL ? "رقم الطلب:" : "Order ID:"}
            </p>
            <p className="font-semibold text-gray-900">#{orderId.slice(-8)}</p>
          </div>
          {tableNumber && (
            <div>
              <p className="text-gray-600">{isRTL ? "الطاولة:" : "Table:"}</p>
              <p className="font-semibold text-gray-900">{tableNumber}</p>
            </div>
          )}
          <div>
            <p className="text-gray-600">{isRTL ? "التاريخ:" : "Date:"}</p>
            <p className="font-semibold text-gray-900">
              {formatDateTime(orderTime)}
            </p>
          </div>
          <div>
            <p className="text-gray-600">{isRTL ? "الحالة:" : "Status:"}</p>
            <p className="font-semibold text-gray-900">
              {statusConfig[currentStatus as keyof typeof statusConfig]
                ?.label || currentStatus}
            </p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-gray-300">
              <tr>
                <th
                  className={`py-2 font-semibold text-gray-700 ${isRTL ? "text-right" : "text-left"}`}
                >
                  {isRTL ? "العنصر" : "Item"}
                </th>
                <th className="py-2 text-center font-semibold text-gray-700">
                  {isRTL ? "الكمية" : "Qty"}
                </th>
                <th
                  className={`py-2 font-semibold text-gray-700 ${isRTL ? "text-left" : "text-right"}`}
                >
                  {isRTL ? "السعر" : "Price"}
                </th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => {
                const itemName = item.isCustomItem
                  ? isRTL && item.customItemNameAr
                    ? item.customItemNameAr
                    : item.customItemName || "Custom Item"
                  : isRTL && item.menuItem?.nameAr
                    ? item.menuItem.nameAr
                    : item.menuItem?.name || "Item";

                const categoryName = item.isCustomItem
                  ? isRTL
                    ? "خدمة إضافية"
                    : "Additional Service"
                  : item.menuItem?.category
                    ? isRTL && item.menuItem.category.nameAr
                      ? item.menuItem.category.nameAr
                      : item.menuItem.category.name
                    : null;

                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3">
                      {categoryName && (
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          {categoryName}
                        </p>
                      )}
                      <p className="font-medium text-gray-900">{itemName}</p>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.notes}
                        </p>
                      )}
                      {item.extras &&
                        getExtrasNames(item.extras, item.menuItem).length >
                          0 && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            {getExtrasNames(item.extras, item.menuItem).join(
                              ", "
                            )}
                          </p>
                        )}
                    </td>
                    <td className="text-center py-3 text-gray-900">
                      {item.quantity}
                    </td>
                    <td
                      className={`py-3 text-gray-900 ${isRTL ? "text-left" : "text-right"}`}
                    >
                      {formatCurrencyWithLanguage(
                        Number(item.price) * item.quantity,
                        currency,
                        language
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-gray-300">
              {subtotal !== undefined && (
                <tr className="border-t border-gray-200">
                  <td className="py-2 text-sm text-gray-700">
                    {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                  </td>
                  <td></td>
                  <td
                    className={`py-2 text-sm text-gray-700 ${isRTL ? "text-left" : "text-right"}`}
                  >
                    {formatCurrencyWithLanguage(
                      Number(subtotal),
                      currency,
                      language
                    )}
                  </td>
                </tr>
              )}
              {taxes && taxes.length > 0 && (
                <tr className="border-t-2 border-b-2 border-gray-400">
                  <td
                    colSpan={3}
                    className="py-3 px-3 bg-gray-50 dark:bg-gray-800"
                    style={{ border: "2px solid #9ca3af" }}
                  >
                    <div className="mb-2">
                      <strong className="text-sm text-gray-900 dark:text-white">
                        {isRTL ? "الضرائب:" : "Taxes:"}
                      </strong>
                    </div>
                    <div className="space-y-1">
                      {taxes.map((tax, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {isRTL ? tax.nameAr || tax.name : tax.name} (
                            {tax.percentage}%)
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {formatCurrencyWithLanguage(
                              tax.amount,
                              currency,
                              language
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-3 font-bold text-gray-900">
                  {isRTL ? "المجموع الكلي:" : "Total:"}
                </td>
                <td></td>
                <td
                  className={`py-3 font-bold text-lg text-gray-900 ${isRTL ? "text-left" : "text-right"}`}
                >
                  {formatCurrencyWithLanguage(
                    Number(totalPrice),
                    currency,
                    language
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p>{isRTL ? "شكراً لزيارتكم" : "Thank you for your visit"}</p>
          <p className="mt-1">{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Display Content (visible to user) */}
      <div className="max-w-md w-full space-y-8">
        {/* Export Invoice Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={exportInvoice}
            className="flex items-center gap-2"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isRTL ? "تحميل الفاتورة" : "Download Invoice"}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "حالة الطلب" : "Order Status"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? `طاولة ${tableNumber} • ${restaurantName}`
              : `Table ${tableNumber} • ${restaurantName}`}
          </p>
          {/* Socket Connection Status */}
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isConnected
                ? isRTL
                  ? "التحديثات المباشرة مفعلة"
                  : "Live updates enabled"
                : isRTL
                  ? "جاري الاتصال..."
                  : "Connecting..."}
            </span>
          </div>
        </div>
        {/* Progress Indicator - Horizontal Stepper */}
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
            {isRTL ? "تقدم الطلب" : "Order Progress"}
          </h3>

          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width:
                    currentIndex >= 0
                      ? `${(currentIndex / (orderFlow.length - 1)) * 100}%`
                      : "0%",
                  backgroundColor:
                    menuTheme?.primaryColor || "var(--theme-primary)",
                }}
              />
            </div>

            {/* Steps */}
            <div className="flex justify-between">
              {orderFlow.map((step, index) => {
                const isActive = step === currentStatus;
                const isCompleted = currentIndex > index;
                const stepConfig =
                  statusConfig[step as keyof typeof statusConfig];

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative  ${
                        isCompleted
                          ? "text-white"
                          : isActive
                            ? "text-white"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      }`}
                      style={{
                        backgroundColor:
                          isCompleted || isActive
                            ? menuTheme?.primaryColor || "var(--theme-primary)"
                            : undefined,
                      }}
                    >
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="mt-2 text-center">
                      <p
                        className={`text-xs font-medium ${
                          isActive || isCompleted
                            ? ""
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                        style={{
                          color:
                            isActive || isCompleted
                              ? menuTheme?.primaryColor ||
                                "var(--theme-primary)"
                              : undefined,
                        }}
                      >
                        {stepConfig.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        {/* Order Status Card */}
        <Card>
          <div className="text-center">
            {/* Status Icon */}
            <div
              className={`mx-auto w-16 h-16 rounded-full ${statusInfo.bgColor} flex items-center justify-center text-3xl mb-4`}
            >
              {statusInfo.icon}
            </div>

            {/* Status Label */}
            <h2 className={`text-xl font-semibold ${statusInfo.color} mb-2`}>
              {statusInfo.label}
            </h2>

            {/* Status Description */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {statusInfo.description}
            </p>

            {/* Order Details */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? "رقم الطلب:" : "Order ID:"}
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    #{orderId.slice(-8)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    {isRTL ? "وقت الطلب:" : "Order Time:"}
                  </span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(orderTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            {orderItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {isRTL ? "عناصر الطلب" : "Order Items"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th
                          className={`py-2 px-3 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? "text-right" : "text-left"}`}
                        >
                          {isRTL ? "العنصر" : "Item"}
                        </th>
                        <th className="text-center py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الكمية" : "Qty"}
                        </th>
                        <th
                          className={`py-2 px-3 font-medium text-gray-700 dark:text-gray-300 ${isRTL ? "text-left" : "text-right"}`}
                        >
                          {isRTL ? "السعر" : "Price"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item) => {
                        // Get item name
                        const itemName = item.isCustomItem
                          ? isRTL && item.customItemNameAr
                            ? item.customItemNameAr
                            : item.customItemName || "Custom Item"
                          : isRTL && item.menuItem?.nameAr
                            ? item.menuItem.nameAr
                            : item.menuItem?.name || "Item";

                        // Get category name
                        const categoryName = item.isCustomItem
                          ? isRTL
                            ? "خدمة إضافية"
                            : "Additional Service"
                          : item.menuItem?.category
                            ? isRTL && item.menuItem.category.nameAr
                              ? item.menuItem.category.nameAr
                              : item.menuItem.category.name
                            : null;

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="py-3 px-3">
                              <div>
                                {categoryName && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                    {categoryName}
                                  </p>
                                )}
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {itemName}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {isRTL ? "ملاحظة:" : "Note:"} {item.notes}
                                  </p>
                                )}
                                {item.extras &&
                                  getExtrasNames(item.extras, item.menuItem)
                                    .length > 0 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {isRTL ? "إضافات:" : "Extras:"}{" "}
                                      {getExtrasNames(
                                        item.extras,
                                        item.menuItem
                                      ).join(", ")}
                                    </p>
                                  )}
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {item.quantity}
                            </td>
                            <td
                              className={`py-3 px-3 text-gray-900 dark:text-white ${isRTL ? "text-left" : "text-right"}`}
                            >
                              {formatCurrencyWithLanguage(
                                Number(item.price) * item.quantity,
                                currency,
                                language
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {subtotal !== undefined && (
                        <tr className="border-t border-gray-300 dark:border-gray-600">
                          <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300">
                            {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                          </td>
                          <td></td>
                          <td
                            className={`py-2 px-3 text-sm text-gray-700 dark:text-gray-300 ${isRTL ? "text-left" : "text-right"}`}
                          >
                            {formatCurrencyWithLanguage(
                              Number(subtotal),
                              currency,
                              language
                            )}
                          </td>
                        </tr>
                      )}
                      {taxes && taxes.length > 0 && (
                        <tr className="border-t-2 border-b-2 border-gray-400 dark:border-gray-500">
                          <td
                            colSpan={3}
                            className="py-3 px-3 bg-gray-50 dark:bg-gray-800"
                            style={{ border: "2px solid #9ca3af" }}
                          >
                            <div className="mb-2">
                              <strong className="text-sm text-gray-900 dark:text-white">
                                {isRTL ? "الضرائب:" : "Taxes:"}
                              </strong>
                            </div>
                            <div className="space-y-1">
                              {taxes.map((tax, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {isRTL ? tax.nameAr || tax.name : tax.name} (
                                    {tax.percentage}%)
                                  </span>
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {formatCurrencyWithLanguage(
                                      tax.amount,
                                      currency,
                                      language
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                        <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "المجموع الكلي:" : "Total:"}
                        </td>
                        <td></td>
                        <td
                          className={`py-3 px-3 font-bold text-lg text-gray-900 dark:text-white ${isRTL ? "text-left" : "text-right"}`}
                        >
                          {formatCurrencyWithLanguage(
                            Number(totalPrice),
                            currency,
                            language
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {currentStatus === "COMPLETED" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleNewOrder}
                >
                  {isRTL ? "طلب جديد" : "Place New Order"}
                </Button>
              )}

              {currentStatus === "CANCELLED" && (
                <Button className="w-full" onClick={handleNewOrder}>
                  {isRTL ? "حاول مرة أخرى" : "Try Again"}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isRTL
              ? "تحتاج مساعدة؟ تواصل مع موظفي المطعم"
              : "Need help? Contact the restaurant staff"}
          </p>
        </div>
      </div>
    </div>
  );
}
