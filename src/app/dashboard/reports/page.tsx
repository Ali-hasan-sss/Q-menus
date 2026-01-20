"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Navbar from "@/components/dashboard/Navbar";
import { api } from "@/lib/api";
import { formatCurrencyWithLanguage } from "@/lib/utils";

interface Order {
  id: string;
  orderType: string;
  tableNumber: string;
  subtotal?: number | string;
  taxes?: Array<{
    name: string;
    nameAr?: string;
    percentage: number;
    amount: number;
  }>;
  totalPrice: number | string;
  currency: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    discount?: number | null; // Discount percentage stored with the item when order was created
    notes?: string;
    extras?: any;
    isCustomItem?: boolean;
    customItemName?: string;
    customItemNameAr?: string;
    menuItem?: {
      name: string;
      nameAr?: string;
      price?: number;
      discount?: number;
      currency?: string;
      category?: {
        id: string;
      name: string;
      nameAr?: string;
      };
    };
  }[];
}

interface Stats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [restaurantCurrency, setRestaurantCurrency] = useState<string | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const ordersPerPage = 25; // 25 طلب لكل صفحة
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const initCurrency = async () => {
      const currency = await fetchRestaurantCurrency();
      // بعد جلب العملة، جلب التقارير مع تمرير العملة مباشرة
      setCurrentPage(1);
      // Pass currency directly to fetchReports to avoid race condition
      fetchReports(1, false, currency);
    };
    initCurrency();
  }, []);

  useEffect(() => {
    // إعادة تعيين pagination عند تغيير الفلتر
    // فقط إذا كانت العملة قد تم جلبها بالفعل
    if (restaurantCurrency !== null) {
      setCurrentPage(1);
      fetchReports(1, false);
    }
  }, [dateFilter, startDate, endDate]);

  // Fetch restaurant currency
  const fetchRestaurantCurrency = async () => {
    try {
      const response = await api.get("/restaurant/profile");
      console.log("🔍 Restaurant profile response:", response.data);
      if (response.data.success && response.data.data.currency) {
        console.log(
          "✅ Restaurant currency found:",
          response.data.data.currency
        );
        setRestaurantCurrency(response.data.data.currency);
        return response.data.data.currency;
      } else {
        console.warn("⚠️ No currency in restaurant profile response");
      }
    } catch (error) {
      console.error("Error fetching restaurant currency:", error);
      // Fallback: try to get from menu endpoint
      try {
        const menuResponse = await api.get("/menu");
        console.log("🔍 Menu response:", menuResponse.data);
        if (menuResponse.data.success && menuResponse.data.data.currency) {
          console.log(
            "✅ Currency found in menu:",
            menuResponse.data.data.currency
          );
          setRestaurantCurrency(menuResponse.data.data.currency);
          return menuResponse.data.data.currency;
        }
      } catch (menuError) {
        console.error("Error fetching currency from menu:", menuError);
      }
    }
    console.warn("⚠️ No currency found, returning null");
    return null;
  };

  // Helper function to get the correct currency for display
  const getDisplayCurrency = (orderCurrency?: string): string => {
    // Always prefer restaurant currency if available
    if (restaurantCurrency) {
      console.log("💰 Using restaurant currency:", restaurantCurrency);
      return restaurantCurrency;
    }
    // Fallback to order currency
    if (orderCurrency) {
      console.log("💰 Using order currency:", orderCurrency);
      return orderCurrency;
    }
    // Final fallback to USD
    console.log("💰 Using default currency: USD");
    return "USD";
  };

  const fetchReports = async (
    page: number = 1,
    append: boolean = false,
    currencyOverride?: string | null
  ) => {
    try {
        setLoading(true);

      // Use currencyOverride if provided, otherwise use current restaurantCurrency state
      const currentCurrency =
        currencyOverride !== undefined ? currencyOverride : restaurantCurrency;

      // Build query params
      const params: any = {
        page,
        limit: ordersPerPage,
      };

      if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        params.startDate = today.toISOString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString();
      }

      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();

      const response = await api.get("/order", { params });

      if (response.data.success) {
        // Use orders as-is from backend - totalPrice is already calculated and stored correctly
        const fetchedOrders = response.data.data.orders;
          setOrders(fetchedOrders);

        // تحديث pagination info
        if (response.data.data.pagination) {
          const {
            total,
            pages,
            page: currentPageNum,
          } = response.data.data.pagination;
          setTotalOrders(total || 0);
          setTotalPages(Math.max(pages || 1, 1)); // على الأقل صفحة واحدة
          setCurrentPage(currentPageNum || 1);
        } else {
          // إذا لم يكن هناك pagination، احسب من عدد الطلبات
          setTotalOrders(fetchedOrders.length);
          setTotalPages(1);
          setCurrentPage(page);
        }

        // Try to get currency from response if available
        // IMPORTANT: Only update currency if we don't already have restaurant currency
        // Never override restaurant currency with order currency
        if (response.data.data.currency && !currentCurrency) {
          console.log(
            "💰 Currency from response:",
            response.data.data.currency
          );
          setRestaurantCurrency(response.data.data.currency);
        } else if (fetchedOrders.length > 0 && !currentCurrency) {
          // Only update currency from orders if we don't have restaurant currency yet
          // Try to find a non-USD currency from orders
          const orderWithCurrency = fetchedOrders.find(
            (order: Order) => order.currency && order.currency !== "USD"
          );
          if (orderWithCurrency && orderWithCurrency.currency) {
            console.log("💰 Currency from order:", orderWithCurrency.currency);
            setRestaurantCurrency(orderWithCurrency.currency);
          } else if (fetchedOrders.length > 0 && fetchedOrders[0]?.currency) {
            // Use currency from first order even if USD (only as last resort)
            console.log(
              "💰 Currency from first order (fallback):",
              fetchedOrders[0].currency
            );
            setRestaurantCurrency(fetchedOrders[0].currency);
          }
        } else if (currentCurrency) {
          console.log(
            "💰 Keeping restaurant currency:",
            currentCurrency,
            "(not overriding with order currency)"
          );
        }

        // Calculate stats - تحديث الإحصائيات من جميع الطلبات (فقط الصفحة الحالية للعرض)
        // ملاحظة: الإحصائيات تعتمد على الفلتر المحدد، وليس على الصفحة الحالية فقط
        // Use recalculated totalPrice which includes discounts
        const completed = fetchedOrders.filter(
          (o: Order) => o.status === "COMPLETED"
        );
        const cancelled = fetchedOrders.filter(
          (o: Order) => o.status === "CANCELLED"
        );
        const revenue = completed.reduce(
          (sum: number, o: Order) => sum + Number(o.totalPrice), // totalPrice already recalculated with discounts
          0
        );

        // تحديث الإحصائيات بناءً على العدد الإجمالي من pagination
        const paginationTotal = response.data.data.pagination?.total || 0;
        setStats({
          totalOrders: paginationTotal || fetchedOrders.length,
          completedOrders: completed.length, // ملاحظة: هذا للصفحة الحالية فقط
          cancelledOrders: cancelled.length, // ملاحظة: هذا للصفحة الحالية فقط
          totalRevenue: revenue, // ملاحظة: هذا للصفحة الحالية فقط
          averageOrderValue:
            completed.length > 0 ? revenue / completed.length : 0,
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      showToast(
        isRTL ? "حدث خطأ أثناء جلب التقارير" : "Error fetching reports",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !loading) {
      setCurrentPage(newPage);
      fetchReports(newPage, false);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7;

    // إذا لم تكن هناك صفحات، ارجع مصفوفة فارغة
    if (totalPages <= 0) {
      return pages;
    }

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Show first 5 pages, then ellipsis, then last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show first page, ellipsis, then last 5 pages
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, ellipsis, current page and neighbors, ellipsis, last page
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const getStatusLabel = (status: string): string => {
    const statusTranslations: Record<string, { en: string; ar: string }> = {
      PENDING: { en: "Pending", ar: "قيد الانتظار" },
      PREPARING: { en: "Preparing", ar: "قيد التحضير" },
      READY: { en: "Ready", ar: "جاهز" },
      DELIVERED: { en: "On the way", ar: "في الطريق" },
      COMPLETED: { en: "Completed", ar: "مكتمل" },
      CANCELLED: { en: "Cancelled", ar: "ملغي" },
    };
    return isRTL
      ? statusTranslations[status]?.ar || status
      : statusTranslations[status]?.en || status;
  };


  // Helper function to get item name
  const getItemName = (item: Order["items"][0]): string => {
    if (item.isCustomItem) {
      return isRTL
        ? item.customItemNameAr || item.customItemName || ""
        : item.customItemName || "";
    }
    return isRTL
      ? item.menuItem?.nameAr || item.menuItem?.name || ""
      : item.menuItem?.name || "";
  };

  // Function to print invoice directly (thermal printer compatible)
  const handlePrintInvoice = (order: Order) => {
    const itemsHtml = order.items
      .map((item) => {
        const itemPrice = Number(item.price);
        const itemTotal = itemPrice * item.quantity;
        const displayCurrency = getDisplayCurrency(order.currency);

        return `
          <div style="margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #ccc;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="font-weight: bold; flex: 1; color: #000;">${getItemName(item)}</span>
              <span style="white-space: nowrap; margin-left: 4px; color: #000;">${item.quantity}x</span>
            </div>
            ${item.notes ? `<div style="font-size: 9px; color: #000; margin-top: 2px;">${isRTL ? "ملاحظات:" : "Note:"} ${item.notes}</div>` : ""}
            <div style="display: flex; justify-content: space-between; margin-top: 2px; font-size: 10px; color: #000;">
              <span>${formatCurrencyWithLanguage(itemPrice, displayCurrency, language)}</span>
              <span style="font-weight: bold;">${formatCurrencyWithLanguage(itemTotal, displayCurrency, language)}</span>
            </div>
          </div>
        `;
      })
      .join("");

    const subtotalHtml =
      order.subtotal !== undefined
        ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>${isRTL ? "المجموع الفرعي:" : "Subtotal:"}</span>
          <span>${formatCurrencyWithLanguage(Number(order.subtotal), getDisplayCurrency(order.currency), language)}</span>
        </div>`
        : "";

    const taxesHtml =
      order.taxes && order.taxes.length > 0
        ? order.taxes
            .map((tax: any) => {
              return `
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;">
                      <span>${isRTL ? tax.nameAr || tax.name : tax.name} (${tax.percentage}%)</span>
                      <span>${formatCurrencyWithLanguage(tax.amount, getDisplayCurrency(order.currency), language)}</span>
                    </div>
                  `;
            })
            .join("")
        : "";

    const totalHtml = `<div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 2px solid #000; font-size: 14px; font-weight: bold;">
          <span>${isRTL ? "المجموع الكلي:" : "TOTAL:"}</span>
          <span>${formatCurrencyWithLanguage(Number(order.totalPrice), getDisplayCurrency(order.currency), language)}</span>
        </div>`;

    // Remove any existing print container
    const existingContainer = document.getElementById(
      "print-invoice-container"
    );
    if (existingContainer) {
      existingContainer.remove();
    }
    const existingStyles = document.getElementById("print-invoice-styles");
    if (existingStyles) {
      existingStyles.remove();
    }

    // Create print container
    const printContainer = document.createElement("div");
    printContainer.id = "print-invoice-container";
    printContainer.innerHTML = `
      <div style="text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #000; padding-bottom: 8px;">
        <h1 style="font-size: 18px; margin: 0; font-weight: bold; color: #000;">${isRTL ? "فاتورة" : "INVOICE"}</h1>
        <p style="font-size: 11px; margin: 4px 0 0 0; color: #000;">#${order.id.slice(-8)}</p>
          </div>
          
      <div style="margin-bottom: 8px; font-size: 10px; color: #000;">
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "رقم الطلب:" : "Order:"}</strong> #${order.id.slice(-8)}</div>
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "النوع:" : "Type:"}</strong> ${
          order.orderType === "DINE_IN"
            ? isRTL
              ? "داخل المطعم"
              : "Dine-in"
            : isRTL
              ? "توصيل"
              : "Delivery"
        }</div>
        ${order.tableNumber ? `<div style="margin-bottom: 4px;"><strong>${isRTL ? "طاولة:" : "Table:"}</strong> ${order.tableNumber}</div>` : ""}
        <div style="margin-bottom: 4px;"><strong>${isRTL ? "التاريخ:" : "Date:"}</strong> ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
            
            ${
              order.customerName || order.customerPhone || order.customerAddress
                ? `<div style="margin-bottom: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #000;">
        ${order.customerName ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "الاسم:" : "Name:"}</strong> ${order.customerName}</div>` : ""}
        ${order.customerPhone ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "الهاتف:" : "Phone:"}</strong> ${order.customerPhone}</div>` : ""}
        ${order.customerAddress ? `<div style="margin-bottom: 2px;"><strong>${isRTL ? "العنوان:" : "Address:"}</strong> ${order.customerAddress}</div>` : ""}
            </div>`
                : ""
            }
      
      <div style="margin: 8px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0;">
              ${itemsHtml}
      </div>
      
      <div style="margin-top: 8px; font-size: 11px; color: #000;">
              ${subtotalHtml}
              ${taxesHtml}
        ${totalHtml}
      </div>
          
          ${
            order.notes
              ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ccc; font-size: 10px; color: #000;">
        <div style="font-weight: bold; margin-bottom: 4px;">${isRTL ? "ملاحظات:" : "Notes:"}</div>
        <div>${order.notes}</div>
            </div>`
              : ""
          }
          
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px dashed #000; text-align: center; font-size: 10px; color: #000;">
        <div style="margin-bottom: 4px;">${isRTL ? "شكراً لزيارتك!" : "Thank you!"}</div>
        <div style="font-size: 9px; color: #000;">${new Date().toLocaleString()}</div>
          </div>
    `;

    // Add styles for print container (thermal printer: 80mm width)
    printContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      background: white;
      color: black;
      font-family: 'Courier New', 'Courier', monospace;
      padding: 5mm;
      font-size: 12px;
      line-height: 1.4;
      direction: ${isRTL ? "rtl" : "ltr"};
      box-sizing: border-box;
      overflow: hidden;
    `;

    document.body.appendChild(printContainer);

    // Add print styles for thermal printer (80mm width)
    const printStyles = document.createElement("style");
    printStyles.id = "print-invoice-styles";
    printStyles.textContent = `
      @media print {
        @page {
          size: 80mm auto;
          margin: 0;
          padding: 0;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        html, body {
          width: 80mm;
          margin: 0;
          padding: 0;
        }
        body * {
          visibility: hidden !important;
        }
        #print-invoice-container,
        #print-invoice-container * {
          visibility: visible !important;
          color: #000 !important;
          background: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        #print-invoice-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          max-width: 80mm !important;
          min-width: 80mm !important;
          margin: 0 !important;
          padding: 5mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          page-break-after: auto !important;
          page-break-inside: avoid !important;
        }
        #print-invoice-container * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        body > *:not(#print-invoice-container) {
          display: none !important;
        }
      }
      #print-invoice-container {
        position: absolute;
        left: -9999px;
        top: 0;
      }
    `;
    document.head.appendChild(printStyles);

    // Trigger print after a short delay
    setTimeout(() => {
      window.print();
      // Clean up after printing
      setTimeout(() => {
        if (document.getElementById("print-invoice-container")) {
          document.body.removeChild(printContainer);
        }
        if (document.getElementById("print-invoice-styles")) {
          document.head.removeChild(printStyles);
        }
      }, 500);
    }, 200);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [customStartDateTime, setCustomStartDateTime] = useState("");
  const [customEndDateTime, setCustomEndDateTime] = useState("");
  const [isExportingCustom, setIsExportingCustom] = useState(false);

  const handleExportDailyReport = async () => {
    try {
      setIsExporting(true);
      const lang = isRTL ? "ar" : "en";
      const response = await api.get(
        `/order/export-daily-report?lang=${lang}`,
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `daily_report_${new Date().toISOString().split("T")[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
          // Decode URI if needed
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        isRTL ? "تم تصدير التقرير بنجاح" : "Report exported successfully",
        "success"
      );
    } catch (error: any) {
      console.error("Error exporting daily report:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء تصدير التقرير" : "Error exporting report"),
        "error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCustomReport = async () => {
    if (!customStartDateTime || !customEndDateTime) {
      showToast(
        isRTL
          ? "يرجى تحديد تاريخ ووقت البداية والنهاية"
          : "Please select start and end date/time",
        "error"
      );
      return;
    }

    const startDate = new Date(customStartDateTime);
    const endDate = new Date(customEndDateTime);

    if (startDate >= endDate) {
      showToast(
        isRTL
          ? "تاريخ البداية يجب أن يكون قبل تاريخ النهاية"
          : "Start date must be before end date",
        "error"
      );
      return;
    }

    try {
      setIsExportingCustom(true);
      const lang = isRTL ? "ar" : "en";
      const response = await api.post(
        `/order/export-custom-report`,
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          lang,
        },
        {
          responseType: "blob",
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `custom_report_${startDate.toISOString().split("T")[0]}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
          // Decode URI if needed
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {
            // If decoding fails, use as is
          }
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        isRTL ? "تم تصدير التقرير بنجاح" : "Report exported successfully",
        "success"
      );
      setShowCustomReportModal(false);
      setCustomStartDateTime("");
      setCustomEndDateTime("");
    } catch (error: any) {
      console.error("Error exporting custom report:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء تصدير التقرير" : "Error exporting report"),
        "error"
      );
    } finally {
      setIsExportingCustom(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-5">
      <div className="max-w-7xl md:py-10 mx-auto py-2 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "التقارير والإحصائيات" : "Reports & Analytics"}
            </h1>
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
              {isRTL
                ? "عرض إحصائيات المطعم والإيرادات"
                : "View restaurant statistics and revenue"}
            </p>
          </div>

          {/* Date Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDateFilter("today")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "today"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "اليوم" : "Today"}
                </button>
                <button
                  onClick={() => setDateFilter("week")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "week"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "آخر 7 أيام" : "Last 7 Days"}
                </button>
                <button
                  onClick={() => setDateFilter("month")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "month"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "آخر 30 يوم" : "Last 30 Days"}
                </button>
                <button
                  onClick={() => setDateFilter("all")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateFilter === "all"
                      ? "bg-primary-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRTL ? "الكل" : "All Time"}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 md:gap-2 items-stretch md:items-center w-full md:w-auto">
              {/* Custom Date Range */}
                <div className="flex gap-2 items-center w-full md:w-auto">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 md:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder={isRTL ? "من" : "From"}
                />
                  <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
                    -
                  </span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 md:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder={isRTL ? "إلى" : "To"}
                />
                </div>

                {/* Export Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  {/* Export Daily Report Button */}
                  <Button
                    onClick={handleExportDailyReport}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">
                          {isRTL ? "جاري التصدير..." : "Exporting..."}
                        </span>
                        <span className="sm:hidden">
                          {isRTL ? "جاري..." : "Exporting..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          {isRTL ? "تصدير تقرير يومي" : "Export Daily Report"}
                        </span>
                        <span className="sm:hidden">
                          {isRTL ? "تقرير يومي" : "Daily Report"}
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Export Custom Report Button */}
                  <Button
                    onClick={() => setShowCustomReportModal(true)}
                    disabled={isExportingCustom}
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      {isRTL ? "تصدير تقرير مخصص" : "Export Custom Report"}
                    </span>
                    <span className="sm:hidden">
                      {isRTL ? "تقرير مخصص" : "Custom Report"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "إجمالي الطلبات" : "Total Orders"}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.totalOrders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
                </div>
              </div>
            </Card>

            {/* Completed Orders */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "الطلبات المكتملة" : "Completed Orders"}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {stats.completedOrders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
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
                </div>
              </div>
            </Card>

            {/* Total Revenue */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "إجمالي الإيرادات" : "Total Revenue"}
                  </p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                    {formatCurrencyWithLanguage(
                      stats.totalRevenue,
                      restaurantCurrency || undefined,
                      language
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </Card>

            {/* Average Order Value */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "متوسط قيمة الطلب" : "Avg. Order Value"}
                  </p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                    {formatCurrencyWithLanguage(
                      stats.averageOrderValue,
                      restaurantCurrency || undefined,
                      language
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-600 dark:text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Orders Table */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? "سجل الطلبات" : "Order History"}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "رقم الطلب" : "Order ID"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "النوع" : "Type"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "الطاولة/العميل" : "Table/Customer"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "العناصر" : "Items"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "المجموع" : "Total"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "التاريخ" : "Date"}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.orderType === "DINE_IN"
                          ? isRTL
                            ? "داخل المطعم"
                            : "Dine-in"
                          : isRTL
                            ? "توصيل"
                            : "Delivery"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.tableNumber
                          ? `${isRTL ? "طاولة" : "Table"} ${order.tableNumber}`
                          : order.customerName || "-"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0
                        )}{" "}
                        {isRTL ? "عنصر" : "items"}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-semibold ${
                            order.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : order.status === "CANCELLED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          }`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrencyWithLanguage(
                          Number(order.totalPrice),
                          getDisplayCurrency(order.currency),
                          language
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors"
                        >
                          {isRTL ? "عرض" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {isRTL ? (
                      <>
                        عرض{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * ordersPerPage + 1}
                        </span>{" "}
                        إلى{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * ordersPerPage, totalOrders)}
                        </span>{" "}
                        من أصل <span className="font-medium">{totalOrders}</span>{" "}
                        طلب
                      </>
                    ) : (
                      <>
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * ordersPerPage + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * ordersPerPage, totalOrders)}
                        </span>{" "}
                        of <span className="font-medium">{totalOrders}</span>{" "}
                        orders
                      </>
                    )}
                  </div>

                  {/* Pagination Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      variant="outline"
                      className="px-3 py-2 text-sm"
                    >
                      <svg
                        className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="hidden sm:inline ml-1">
                        {isRTL ? "التالي" : "Previous"}
                      </span>
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            typeof page === "number"
                              ? handlePageChange(page)
                              : undefined
                          }
                          disabled={page === "..." || loading}
                          className={`px-3 py-2 text-sm rounded-md transition-colors ${
                            page === currentPage
                              ? "bg-primary-600 text-white"
                              : page === "..."
                                ? "text-gray-400 cursor-default"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      variant="outline"
                      className="px-3 py-2 text-sm"
                    >
                      <span className="hidden sm:inline mr-1">
                        {isRTL ? "السابق" : "Next"}
                      </span>
                      <svg
                        className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}

              {orders.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {isRTL ? "لا توجد طلبات" : "No orders"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "لا توجد طلبات في الفترة المحددة"
                      : "No orders found in the selected period"}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Custom Report Modal */}
      {showCustomReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 my-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? "تصدير تقرير مخصص" : "Export Custom Report"}
              </h3>
              <button
                onClick={() => {
                  setShowCustomReportModal(false);
                  setCustomStartDateTime("");
                  setCustomEndDateTime("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
    </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "من" : "From"}
                </label>
                <input
                  type="datetime-local"
                  value={customStartDateTime}
                  onChange={(e) => setCustomStartDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "إلى" : "To"}
                </label>
                <input
                  type="datetime-local"
                  value={customEndDateTime}
                  onChange={(e) => setCustomEndDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {isRTL
                  ? "سيتم تصدير جميع الطلبات المكتملة في الفترة المحددة"
                  : "All completed orders in the selected time range will be exported"}
              </p>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCustomReportModal(false);
                    setCustomStartDateTime("");
                    setCustomEndDateTime("");
                  }}
                  className="w-full sm:w-auto"
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleExportCustomReport}
                  disabled={
                    isExportingCustom ||
                    !customStartDateTime ||
                    !customEndDateTime
                  }
                  className="w-full sm:w-auto"
                >
                  {isExportingCustom ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isRTL ? "جاري التصدير..." : "Exporting..."}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {isRTL ? "تصدير" : "Export"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? "تفاصيل الطلب" : "Order Details"}
                </h2>
                <button
                  onClick={() => {
                    setShowOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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

              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {isRTL ? "معلومات الطلب" : "Order Information"}
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "رقم الطلب:" : "Order ID:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        #{selectedOrder.id.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "النوع:" : "Type:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedOrder.orderType === "DINE_IN"
                          ? isRTL
                            ? "داخل المطعم"
                            : "Dine-in"
                          : isRTL
                            ? "توصيل"
                            : "Delivery"}
                      </span>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "طاولة:" : "Table:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.tableNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "الحالة:" : "Status:"}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedOrder.status === "COMPLETED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : selectedOrder.status === "CANCELLED"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {isRTL ? "التاريخ:" : "Date:"}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {(() => {
                      // Recalculate subtotal from items with discounts applied
                      let recalculatedSubtotal = 0;
                      for (const item of selectedOrder.items) {
                        if (item.isCustomItem) {
                          // Custom items use item.price directly
                          recalculatedSubtotal += Number(item.price) * item.quantity;
                        } else if (item.menuItem) {
                          // Menu items: check if discount exists
                          const itemDiscount = item.discount || (item.menuItem.discount || 0);
                          if (itemDiscount > 0 && item.menuItem.price) {
                            // Calculate discounted price
                            const discountPercentage = itemDiscount / 100;
                            const discountedPricePerItem = Number(item.menuItem.price) * (1 - discountPercentage);
                            recalculatedSubtotal += discountedPricePerItem * item.quantity;
                          } else {
                            // No discount, use item.price
                            recalculatedSubtotal += Number(item.price) * item.quantity;
                          }
                        } else {
                          // Fallback to item.price
                          recalculatedSubtotal += Number(item.price) * item.quantity;
                        }
                      }

                      // Recalculate taxes based on recalculated subtotal (after discounts)
                      const storedTaxes = selectedOrder.taxes && Array.isArray(selectedOrder.taxes)
                        ? selectedOrder.taxes.map((tax) => ({
                            ...tax,
                            amount: (recalculatedSubtotal * tax.percentage) / 100,
                          }))
                        : [];

                      // Calculate total = subtotal + taxes
                      const totalTaxAmount = storedTaxes.reduce(
                        (sum, tax) => sum + tax.amount,
                        0
                      );
                      const recalculatedTotal = recalculatedSubtotal + totalTaxAmount;

                      return (
                        <>
                          {selectedOrder.subtotal !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">
                                {isRTL ? "المجموع الفرعي:" : "Subtotal:"}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatCurrencyWithLanguage(
                                  recalculatedSubtotal,
                                  getDisplayCurrency(selectedOrder.currency),
                                  language
                                )}
                              </span>
                            </div>
                          )}
                          {storedTaxes.length > 0 && (
                            <>
                              {storedTaxes.map((tax, index) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {isRTL ? tax.nameAr || tax.name : tax.name} (
                                    {tax.percentage}%):
                                  </span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {formatCurrencyWithLanguage(
                                      tax.amount,
                                      getDisplayCurrency(selectedOrder.currency),
                                      language
                                    )}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {isRTL ? "المجموع:" : "Total:"}
                            </span>
                            <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                              {formatCurrencyWithLanguage(
                                recalculatedTotal,
                                getDisplayCurrency(selectedOrder.currency),
                                language
                              )}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {isRTL ? "معلومات العميل" : "Customer Information"}
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    {selectedOrder.customerName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "الاسم:" : "Name:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerName}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerPhone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "الهاتف:" : "Phone:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerPhone}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customerAddress && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "العنوان:" : "Address:"}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.customerAddress}
                        </span>
                      </div>
                    )}
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {isRTL ? "ملاحظات:" : "Notes:"}
                        </span>
                        <p className="font-medium text-gray-900 dark:text-white mt-1">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {isRTL ? "عناصر الطلب" : "Order Items"}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "العنصر" : "Item"}
                        </th>
                        <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الكمية" : "Qty"}
                        </th>
                        <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "السعر" : "Price"}
                        </th>
                        <th className="text-center py-2 px-2 sm:px-3 font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "المجموع" : "Total"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => {
                        const itemName = item.isCustomItem
                          ? isRTL
                            ? item.customItemNameAr || item.customItemName
                            : item.customItemName
                          : isRTL
                            ? item.menuItem?.nameAr || item.menuItem?.name
                            : item.menuItem?.name || "-";
                        
                        // Use stored item.discount if available, otherwise use menuItem.discount
                        const itemDiscount = item.discount || (item.menuItem?.discount || 0);
                        const hasDiscount =
                          !item.isCustomItem &&
                          itemDiscount > 0 &&
                          item.menuItem?.price;

                        // Calculate price after discount
                        let itemPrice = Number(item.price);
                        if (hasDiscount && item.menuItem?.price) {
                          // Calculate discounted price from menuItem.price and discount
                          const discountPercentage = itemDiscount / 100;
                          const discountedPricePerItem = Number(item.menuItem.price) * (1 - discountPercentage);
                          itemPrice = discountedPricePerItem;
                        }
                        const itemTotal = itemPrice * item.quantity;

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="py-2 sm:py-3 text-center px-2 sm:px-3 text-gray-900 dark:text-white">
                              <div className="relative inline-block">
                                {itemName}
                                {/* Discount Badge - Use stored item.discount if available, otherwise use menuItem.discount */}
                                {!item.isCustomItem &&
                                  ((item.discount && item.discount > 0) ||
                                    (item.menuItem &&
                                      item.menuItem.discount &&
                                      item.menuItem.discount > 0)) && (
                                    <span className="absolute -top-1 -right-1 bg-red-500/80 text-white text-[9px] px-1 py-0.5 rounded-full font-medium shadow-sm z-10 whitespace-nowrap">
                                      {(item.discount || item.menuItem?.discount || 0)}%
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 text-center px-2 sm:px-3 text-gray-900 dark:text-white">
                              {item.quantity}
                            </td>
                            <td className="py-2 sm:py-3 text-center px-2 sm:px-3 text-gray-900 dark:text-white">
                              {hasDiscount && item.menuItem?.price ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="line-through text-gray-400 dark:text-gray-500 text-xs">
                                    {formatCurrencyWithLanguage(
                                      Number(item.menuItem.price),
                                      getDisplayCurrency(selectedOrder.currency),
                                      language
                                    )}
                                  </span>
                                  <span className="text-red-600 dark:text-red-400 font-semibold">
                                    {formatCurrencyWithLanguage(
                                      itemPrice,
                                      getDisplayCurrency(selectedOrder.currency),
                                      language
                                    )}
                                  </span>
                                </div>
                              ) : (
                                formatCurrencyWithLanguage(
                                  itemPrice,
                                  getDisplayCurrency(selectedOrder.currency),
                                  language
                                )
                              )}
                            </td>
                            <td className="py-2 sm:py-3 text-center px-2 sm:px-3 font-semibold text-gray-900 dark:text-white">
                              {formatCurrencyWithLanguage(
                                itemTotal,
                                getDisplayCurrency(selectedOrder.currency),
                                language
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        // Recalculate subtotal from items with discounts applied
                        let recalculatedSubtotal = 0;
                        for (const item of selectedOrder.items) {
                          if (item.isCustomItem) {
                            // Custom items use item.price directly
                            recalculatedSubtotal += Number(item.price) * item.quantity;
                          } else if (item.menuItem) {
                            // Menu items: check if discount exists
                            const itemDiscount = item.discount || (item.menuItem.discount || 0);
                            if (itemDiscount > 0 && item.menuItem.price) {
                              // Calculate discounted price
                              const discountPercentage = itemDiscount / 100;
                              const discountedPricePerItem = Number(item.menuItem.price) * (1 - discountPercentage);
                              recalculatedSubtotal += discountedPricePerItem * item.quantity;
                            } else {
                              // No discount, use item.price
                              recalculatedSubtotal += Number(item.price) * item.quantity;
                            }
                          } else {
                            // Fallback to item.price
                            recalculatedSubtotal += Number(item.price) * item.quantity;
                          }
                        }

                        // Recalculate taxes based on recalculated subtotal (after discounts)
                        const storedTaxes = selectedOrder.taxes && Array.isArray(selectedOrder.taxes)
                          ? selectedOrder.taxes.map((tax) => ({
                              ...tax,
                              amount: (recalculatedSubtotal * tax.percentage) / 100,
                            }))
                          : [];

                        // Calculate total = subtotal + taxes
                        const totalTaxAmount = storedTaxes.reduce(
                          (sum, tax) => sum + tax.amount,
                          0
                        );
                        const recalculatedTotal = recalculatedSubtotal + totalTaxAmount;

                        return (
                          <>
                            {storedTaxes.length > 0 && (
                              <>
                                {storedTaxes.map((tax, index) => (
                                  <tr
                                    key={index}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                  >
                                    <td
                                      colSpan={3}
                                      className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400"
                                    >
                                      {isRTL ? tax.nameAr || tax.name : tax.name} (
                                      {tax.percentage}%):
                                    </td>
                                    <td className="text-right py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                                      {formatCurrencyWithLanguage(
                                        tax.amount,
                                        getDisplayCurrency(selectedOrder.currency),
                                        language
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </>
                            )}
                            <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                              <td
                                colSpan={3}
                                className="py-3 px-3 font-semibold text-gray-900 dark:text-white"
                              >
                                {isRTL ? "المجموع:" : "Total:"}
                              </td>
                              <td className="text-right py-3 px-3 font-bold text-gray-900 dark:text-white">
                                {formatCurrencyWithLanguage(
                                  recalculatedTotal,
                                  getDisplayCurrency(selectedOrder.currency),
                                  language
                                )}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Print Invoice Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
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
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  {isRTL ? "طباعة الفاتورة" : "Print Invoice"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
