"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
  plan?: {
    id: string;
    name: string;
    type: string;
  };
  subscription?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
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

  useEffect(() => {
    fetchInvoices();
  }, [filter, typeFilter, currentPage]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(filter !== "ALL" && { status: filter }),
        ...(typeFilter !== "ALL" && { type: typeFilter }),
      });

      const response = await api.get(`/restaurant/invoices?${params}`);
      if (response.data.success) {
        setInvoices(response.data.data.invoices);
        setTotalInvoices(response.data.data.total);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
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
    <div>
      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "فواتيري" : "My Invoices"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? "عرض فواتير الاشتراكات"
              : "View your subscription invoices"}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRTL ? "الحالة:" : "Status:"}
            </span>
            {["ALL", "PENDING", "PAID", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
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
                onClick={() => setTypeFilter(type)}
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
                    <div>
                      {invoice.planName && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {isRTL ? "الخطة:" : "Plan:"} {invoice.planName}
                          {invoice.planDuration &&
                            ` (${invoice.planDuration} ${isRTL ? "يوم" : "days"})`}
                        </p>
                      )}
                      {invoice.subscription && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {isRTL ? "حالة الاشتراك:" : "Subscription Status:"}{" "}
                          {getStatusText(invoice.subscription.status)}
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      // Here you would integrate with payment gateway
                      showToast(
                        isRTL
                          ? "سيتم توجيهك لصفحة الدفع"
                          : "You will be redirected to payment page",
                        "info"
                      );
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
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                    {isRTL ? "دفع الآن" : "Pay Now"}
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
                      {isRTL ? "تفاصيل الاشتراك" : "Subscription Details"}
                    </h4>
                    <div className="space-y-2">
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
                      {selectedInvoice.subscription && (
                        <>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isRTL
                                ? "حالة الاشتراك:"
                                : "Subscription Status:"}
                            </span>{" "}
                            {getStatusText(selectedInvoice.subscription.status)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "تاريخ البدء:" : "Start Date:"}
                            </span>{" "}
                            {new Date(
                              selectedInvoice.subscription.startDate
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {isRTL ? "تاريخ الانتهاء:" : "End Date:"}
                            </span>{" "}
                            {new Date(
                              selectedInvoice.subscription.endDate
                            ).toLocaleDateString()}
                          </p>
                        </>
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
