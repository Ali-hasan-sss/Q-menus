"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  description?: string;
  customerName: string;
  customerEmail: string;
  restaurantName: string;
  planName?: string;
  planDuration?: number;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  totalAmount: number;
  restaurant: {
    id: string;
    name: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  plan?: {
    id: string;
    name: string;
    type: string;
  };
}

export default function InvoicesPage() {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(filter !== "ALL" && { status: filter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await api.get(`/admin/invoices?${params}`);
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setTotalInvoices(response.data.data.total);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setShowSearchBar(false);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchInvoices();
  }, [filter, typeFilter, currentPage]);

  // Search with debounce
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchInvoices();
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        setIsSearching(false);
      };
    } else if (searchTerm === "") {
      // Only fetch when search is cleared, not on initial mount
      fetchInvoices();
    }
  }, [searchTerm]);

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      await api.put(`/admin/invoices/${invoiceId}/status`, {
        status: newStatus,
      });
      showToast(
        isRTL ? "تم تحديث حالة الفاتورة" : "Invoice status updated",
        "success"
      );
      fetchInvoices();
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء تحديث الفاتورة" : "Error updating invoice"),
        "error"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      REFUNDED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[status as keyof typeof colors] || colors.PENDING;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      SUBSCRIPTION:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      RENEWAL:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      UPGRADE:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      REFUND:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[type as keyof typeof colors] || colors.SUBSCRIPTION;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      PENDING: isRTL ? "معلق" : "Pending",
      PAID: isRTL ? "مدفوع" : "Paid",
      CANCELLED: isRTL ? "ملغي" : "Cancelled",
      REFUNDED: isRTL ? "مسترد" : "Refunded",
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      SUBSCRIPTION: isRTL ? "اشتراك" : "Subscription",
      RENEWAL: isRTL ? "تجديد" : "Renewal",
      UPGRADE: isRTL ? "ترقية" : "Upgrade",
      REFUND: isRTL ? "استرداد" : "Refund",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "SYP") {
      return `${amount} ${isRTL ? "ل.س" : "SYP"}`;
    }
    return `${amount} ${currency}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "إدارة الفواتير" : "Invoices Management"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? "عرض وإدارة فواتير الاشتراكات"
              : "View and manage subscription invoices"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              {showSearchBar ? (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      isRTL
                        ? "البحث باسم المطعم، المستخدم، أو الإيميل..."
                        : "Search by restaurant name, user name, or email..."
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg
                        className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-10 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowSearchBar(true)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    searchTerm
                      ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  {isRTL ? "البحث" : "Search"}
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isRTL
                  ? `نتائج البحث: ${totalInvoices}`
                  : `Search results: ${totalInvoices}`}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRTL ? "الحالة:" : "Status:"}
            </span>
            {["ALL", "PENDING", "PAID", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  filter === status
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {status === "ALL"
                  ? isRTL
                    ? "الكل"
                    : "All"
                  : getStatusText(status)}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRTL ? "النوع:" : "Type:"}
            </span>
            {["ALL", "SUBSCRIPTION", "RENEWAL", "UPGRADE"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === type
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {type === "ALL" ? (isRTL ? "الكل" : "All") : getTypeText(type)}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {invoice.invoiceNumber}
                    </h3>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(invoice.status)}`}
                      >
                        {getStatusText(invoice.status)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getTypeBadge(invoice.type)}`}
                      >
                        {getTypeText(invoice.type)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "المطعم:" : "Restaurant:"}{" "}
                        {invoice.restaurantName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "العميل:" : "Customer:"} {invoice.customerName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isRTL ? "الإيميل:" : "Email:"} {invoice.customerEmail}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "المبلغ:" : "Amount:"}{" "}
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {isRTL ? "تاريخ الإصدار:" : "Issue Date:"}{" "}
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </p>
                      {invoice.dueDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isRTL ? "تاريخ الاستحقاق:" : "Due Date:"}{" "}
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {invoice.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {isRTL ? "الوصف:" : "Description:"} {invoice.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowModal(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  {isRTL ? "عرض التفاصيل" : "View Details"}
                </Button>

                {invoice.status === "PENDING" && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusUpdate(invoice.id, "PAID")}
                      className="w-full sm:w-auto"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {isRTL ? "تم الدفع" : "Mark Paid"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handleStatusUpdate(invoice.id, "CANCELLED")
                      }
                      className="w-full sm:w-auto"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      {isRTL ? "إلغاء" : "Cancel"}
                    </Button>
                  </>
                )}

                {invoice.status === "PAID" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleStatusUpdate(invoice.id, "REFUNDED")}
                    className="w-full sm:w-auto"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                      />
                    </svg>
                    {isRTL ? "استرداد" : "Refund"}
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {invoices.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? "لا توجد فواتير" : "No invoices found"}
              </p>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {isRTL ? "السابق" : "Previous"}
            </Button>

            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === currentPage;
                return (
                  <Button
                    key={pageNum}
                    variant={isActive ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {isRTL ? "التالي" : "Next"}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
        )}

        {/* Results Summary */}
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {isRTL
            ? `إجمالي الفواتير: ${totalInvoices}`
            : `Total invoices: ${totalInvoices}`}
        </div>

        {/* Invoice Details Modal */}
        {showModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky z-50 top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                      <svg
                        className="w-6 h-6 text-primary-600 dark:text-primary-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? "تفاصيل الفاتورة" : "Invoice Details"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedInvoice.invoiceNumber}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

              {/* Modal Body */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {isRTL ? "معلومات الفاتورة" : "Invoice Information"}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "رقم الفاتورة:" : "Invoice Number:"}
                        </span>{" "}
                        {selectedInvoice.invoiceNumber}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "النوع:" : "Type:"}
                        </span>{" "}
                        {getTypeText(selectedInvoice.type)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الحالة:" : "Status:"}
                        </span>{" "}
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedInvoice.status)}`}
                        >
                          {getStatusText(selectedInvoice.status)}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "المبلغ:" : "Amount:"}
                        </span>{" "}
                        {formatCurrency(
                          selectedInvoice.totalAmount,
                          selectedInvoice.currency
                        )}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "تاريخ الإصدار:" : "Issue Date:"}
                        </span>{" "}
                        {new Date(
                          selectedInvoice.issueDate
                        ).toLocaleDateString()}
                      </p>
                      {selectedInvoice.dueDate && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? "تاريخ الاستحقاق:" : "Due Date:"}
                          </span>{" "}
                          {new Date(
                            selectedInvoice.dueDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                      {selectedInvoice.paidDate && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? "تاريخ الدفع:" : "Paid Date:"}
                          </span>{" "}
                          {new Date(
                            selectedInvoice.paidDate
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {isRTL ? "معلومات العميل" : "Customer Information"}
                    </h4>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الاسم:" : "Name:"}
                        </span>{" "}
                        {selectedInvoice.customerName}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "الإيميل:" : "Email:"}
                        </span>{" "}
                        {selectedInvoice.customerEmail}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? "المطعم:" : "Restaurant:"}
                        </span>{" "}
                        {selectedInvoice.restaurantName}
                      </p>
                      {selectedInvoice.planName && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? "الخطة:" : "Plan:"}
                          </span>{" "}
                          {selectedInvoice.planName}
                          {selectedInvoice.planDuration &&
                            ` (${selectedInvoice.planDuration} ${isRTL ? "يوم" : "days"})`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedInvoice.description && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {isRTL ? "الوصف" : "Description"}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedInvoice.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
