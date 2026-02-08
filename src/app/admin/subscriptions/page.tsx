"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  restaurant: {
    id: string;
    name: string;
    owner: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  plan: {
    id: string;
    name: string;
    nameAr?: string;
    type: string;
    price: number;
    duration: number;
  };
}

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  price: number;
  duration: number;
  maxTables: number;
  maxMenus: number;
  maxCategories: number;
  maxItems: number;
  canCustomizeTheme: boolean;
  isFree: boolean;
}

export default function SubscriptionsPage() {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [hasMoreSubscriptions, setHasMoreSubscriptions] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const subscriptionsPerPage = 25;
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);

  const fetchSubscriptions = async (
    page: number = 1,
    append: boolean = false
  ) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: subscriptionsPerPage.toString(),
        ...(filter !== "ALL" && { status: filter }),
      });

      const response = await api.get(`/admin/subscriptions?${params}`);
      if (response.data.success) {
        const fetchedSubscriptions = response.data.data.subscriptions || [];

        if (append) {
          // إضافة الاشتراكات الجديدة للقائمة الموجودة
          setSubscriptions((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((s) => s.id));
            const newSubscriptions = fetchedSubscriptions.filter(
              (s: Subscription) => !existingIds.has(s.id)
            );
            return [...prev, ...newSubscriptions];
          });
        } else {
          setSubscriptions(fetchedSubscriptions);
        }

        // تحديث pagination info
        if (response.data.data.pagination) {
          const {
            total,
            pages,
            page: currentPageNum,
          } = response.data.data.pagination;
          setTotalSubscriptions(total);
          setHasMoreSubscriptions(
            currentPageNum < pages &&
              fetchedSubscriptions.length === subscriptionsPerPage
          );
          setCurrentPage(currentPageNum);
          currentPageRef.current = currentPageNum;
        } else {
          // Fallback
          const total = response.data.data.total || fetchedSubscriptions.length;
          const totalPages =
            response.data.data.totalPages ||
            Math.ceil(total / subscriptionsPerPage);
          setTotalSubscriptions(total);
          setTotalPages(totalPages);
          setHasMoreSubscriptions(
            fetchedSubscriptions.length === subscriptionsPerPage
          );
          currentPageRef.current = page;
        }
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  // دالة جلب المزيد من الاشتراكات
  const loadMoreSubscriptions = useCallback(() => {
    if (!isLoadingMore && hasMoreSubscriptions && !loading) {
      const nextPage = currentPageRef.current + 1;
      fetchSubscriptions(nextPage, true);
    }
  }, [hasMoreSubscriptions, isLoadingMore, loading, filter]);

  useEffect(() => {
    fetchSubscriptions(1, false);
    fetchPlans();
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    if (filter !== "ALL") {
      setCurrentPage(1);
      currentPageRef.current = 1;
      setHasMoreSubscriptions(true);
      fetchSubscriptions(1, false);
    }
  }, [filter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreSubscriptions &&
          !isLoadingMore &&
          !loading
        ) {
          loadMoreSubscriptions();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreSubscriptions, isLoadingMore, loading, loadMoreSubscriptions]);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/admin/plans");
      if (response.data.success) {
        setPlans(response.data.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handleCancelSubscription = (subId: string, restaurantName: string) => {
    showConfirm({
      title: isRTL ? "إلغاء الاشتراك" : "Cancel Subscription",
      message: isRTL
        ? `هل أنت متأكد من إلغاء اشتراك "${restaurantName}"؟`
        : `Are you sure you want to cancel subscription for "${restaurantName}"?`,
      confirmText: isRTL ? "إلغاء الاشتراك" : "Cancel Subscription",
      cancelText: isRTL ? "رجوع" : "Go Back",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/admin/subscriptions/${subId}/cancel`);
          setSubscriptions(
            subscriptions.map((s) =>
              s.id === subId ? { ...s, status: "CANCELLED" } : s
            )
          );
          showToast(
            isRTL
              ? "تم إلغاء الاشتراك بنجاح"
              : "Subscription cancelled successfully",
            "success"
          );
          // Refresh to update the list
          fetchSubscriptions(1, false);
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL
                ? "حدث خطأ أثناء إلغاء الاشتراك"
                : "Error cancelling subscription"),
            "error"
          );
        }
      },
    });
  };

  const handleRenewSubscription = async (subId: string) => {
    try {
      await api.put(`/admin/subscriptions/${subId}/renew`);
      fetchSubscriptions(1, false);
      showToast(
        isRTL ? "تم تجديد الاشتراك بنجاح" : "Subscription renewed successfully",
        "success"
      );
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء تجديد الاشتراك"
            : "Error renewing subscription"),
        "error"
      );
    }
  };

  const handleUpgradeSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setShowUpgradeModal(true);
  };

  const handleUpgradeToPlan = async (planId: string) => {
    if (!selectedSubscription) return;

    try {
      await api.put(`/admin/subscriptions/${selectedSubscription.id}/upgrade`, {
        planId: planId,
      });
      fetchSubscriptions(1, false);
      setShowUpgradeModal(false);
      setSelectedSubscription(null);
      showToast(
        isRTL
          ? "تم ترقية الاشتراك بنجاح"
          : "Subscription upgraded successfully",
        "success"
      );
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء ترقية الاشتراك"
            : "Error upgrading subscription"),
        "error"
      );
    }
  };

  // لا نحتاج filteredSubscriptions لأن الفلترة تتم في الـ backend

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      INACTIVE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      CANCELLED:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return colors[status as keyof typeof colors] || colors.INACTIVE;
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
            {isRTL ? "إدارة الاشتراكات" : "Subscriptions Management"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? "عرض وإدارة اشتراكات المطاعم"
              : "View and manage restaurant subscriptions"}
          </p>
        </div>

        {/* Filter - Mobile Responsive */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {["ALL", "ACTIVE", "EXPIRED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  filter === status
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {status === "ALL" ? (isRTL ? "الكل" : "All") : status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const isExpired = sub.endDate && new Date(sub.endDate) < new Date();
            const daysLeft = sub.endDate
              ? Math.ceil(
                  (new Date(sub.endDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0;

            return (
              <Card key={sub.id} className="p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {sub.restaurant.name}
                      </h3>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(sub.status)}`}
                        >
                          {sub.status}
                        </span>
                        {isExpired && sub.status === "ACTIVE" && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            {isRTL ? "منتهي" : "EXPIRED"}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {isRTL ? "المالك: " : "Owner: "}
                      {sub.restaurant.owner.firstName}{" "}
                      {sub.restaurant.owner.lastName} (
                      {sub.restaurant.owner.email})
                    </p>
                  </div>
                </div>

                {/* Plan Details */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {isRTL ? "الخطة: " : "Plan: "}
                    {isRTL && sub.plan.nameAr
                      ? sub.plan.nameAr
                      : sub.plan.name}{" "}
                    ({sub.plan.type})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "السعر: " : "Price: "}
                    {sub.plan.price} {isRTL ? "ل.س" : "SYP"} /{" "}
                    {sub.plan.duration} {isRTL ? "يوم" : "days"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isRTL ? "تاريخ البدء: " : "Start: "}
                    {new Date(sub.startDate).toLocaleDateString()}
                  </p>
                  {sub.endDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isRTL ? "تاريخ الانتهاء: " : "End: "}
                      {new Date(sub.endDate).toLocaleDateString()}
                      {sub.status === "ACTIVE" && daysLeft > 0 && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          ({daysLeft} {isRTL ? "يوم متبقي" : "days left"})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Action Buttons - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {sub.status === "ACTIVE" && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRenewSubscription(sub.id)}
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        {isRTL ? "تجديد" : "Renew"}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpgradeSubscription(sub)}
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
                            d="M7 11l5-5m0 0l5 5m-5-5v12"
                          />
                        </svg>
                        {isRTL ? "ترقية" : "Upgrade"}
                      </Button>
                    </>
                  )}
                  {(sub.status === "ACTIVE" || sub.status === "INACTIVE") && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        handleCancelSubscription(sub.id, sub.restaurant.name)
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
                  )}
                </div>
              </Card>
            );
          })}

          {subscriptions.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? "لا توجد اشتراكات" : "No subscriptions found"}
              </p>
            </Card>
          )}
        </div>

        {/* Infinite Scroll Trigger */}
        {hasMoreSubscriptions && (
          <div
            ref={observerTarget}
            className="py-4 text-center border-t border-gray-200 dark:border-gray-700 mt-8"
          >
            {isLoadingMore ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {isRTL ? "جاري تحميل المزيد..." : "Loading more..."}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {isRTL
            ? `إجمالي الاشتراكات: ${totalSubscriptions}`
            : `Total subscriptions: ${totalSubscriptions}`}
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && selectedSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky z-50 top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
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
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {isRTL ? "ترقية الاشتراك" : "Upgrade Subscription"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isRTL
                          ? `ترقية اشتراك ${selectedSubscription.restaurant.name}`
                          : `Upgrade subscription for ${selectedSubscription.restaurant.name}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setSelectedSubscription(null);
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
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {isRTL ? "الخطة الحالية" : "Current Plan"}
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {isRTL && selectedSubscription.plan.nameAr
                        ? selectedSubscription.plan.nameAr
                        : selectedSubscription.plan.name}{" "}
                      ({selectedSubscription.plan.type})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedSubscription.plan.type === "FREE"
                        ? isRTL
                          ? "مجانية"
                          : "Free"
                        : `${selectedSubscription.plan.price} ${isRTL ? "ل.س" : "SYP"} / ${selectedSubscription.plan.duration} ${isRTL ? "يوم" : "days"}`}
                    </p>
                    {selectedSubscription.plan.type === "FREE" && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {isRTL
                          ? "يمكنك الترقية إلى خطة مدفوعة للحصول على ميزات أكثر"
                          : "You can upgrade to a paid plan for more features"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {selectedSubscription.plan.type === "FREE"
                      ? isRTL
                        ? "اختر خطة مدفوعة"
                        : "Choose Paid Plan"
                      : isRTL
                        ? "اختر خطة جديدة"
                        : "Choose New Plan"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.filter(
                      (plan) =>
                        plan.id !== selectedSubscription.plan.id &&
                        !plan.isFree &&
                        plan.type !== "FREE"
                    ).length === 0 ? (
                      <div className="col-span-2 text-center py-8">
                        <div className="text-gray-500 dark:text-gray-400 mb-2">
                          <svg
                            className="w-12 h-12 mx-auto mb-4"
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
                          <p className="text-lg font-medium">
                            {isRTL
                              ? "لا توجد خطط متاحة للترقية"
                              : "No upgrade plans available"}
                          </p>
                          <p className="text-sm">
                            {isRTL
                              ? "جميع الخطط المدفوعة متاحة بالفعل"
                              : "All paid plans are already available"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      plans
                        .filter(
                          (plan) =>
                            plan.id !== selectedSubscription.plan.id &&
                            !plan.isFree &&
                            plan.type !== "FREE"
                        )
                        .map((plan) => (
                          <div
                            key={plan.id}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-primary-500 dark:hover:border-primary-400 cursor-pointer transition-colors"
                            onClick={() => handleUpgradeToPlan(plan.id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold text-gray-900 dark:text-white">
                                {isRTL && plan.nameAr ? plan.nameAr : plan.name}
                              </h5>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {plan.type}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                              {plan.price} {isRTL ? "ل.س" : "SYP"}
                              <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                                /{plan.duration} {isRTL ? "يوم" : "days"}
                              </span>
                            </p>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <p>
                                • {plan.maxTables} {isRTL ? "طاولة" : "tables"}
                              </p>
                              <p>
                                • {plan.maxMenus} {isRTL ? "قائمة" : "menus"}
                              </p>
                              <p>
                                • {plan.maxCategories}{" "}
                                {isRTL ? "فئة" : "categories"}
                              </p>
                              <p>
                                • {plan.maxItems}{" "}
                                {isRTL ? "عنصر لكل فئة" : "items per category"}
                              </p>
                              {plan.canCustomizeTheme && (
                                <p>
                                  •{" "}
                                  {isRTL
                                    ? "تخصيص التصميم"
                                    : "Theme customization"}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
