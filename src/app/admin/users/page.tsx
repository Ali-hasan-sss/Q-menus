"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useAuth } from "@/store/hooks/useAuth";
import { useToast } from "@/store/hooks/useToast";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import Switch from "@/components/ui/Switch";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import AddUserModal from "@/components/admin/AddUserModal";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  restaurants?: {
    id: string;
    name: string;
    nameAr?: string;
    subscriptions: {
      id: string;
      status: string;
      plan: {
        id: string;
        name: string;
        nameAr?: string;
        type: string;
        billingPeriod?: string;
        price: number;
        duration: number;
      };
    }[];
  }[];
}

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  billingPeriod?: string;
  price: number;
  duration: number;
  maxCategories: number;
  maxItems: number;
  canCustomizeTheme: boolean;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] =
    useState(false);
  const [showViewSubscriptionsModal, setShowViewSubscriptionsModal] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [openActionsDropdown, setOpenActionsDropdown] = useState<string | null>(
    null
  );
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const usersPerPage = 25;
  const observerTarget = useRef<HTMLDivElement>(null);
  const currentPageRef = useRef(1);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".actions-dropdown")) {
        setOpenActionsDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUsers = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: usersPerPage.toString(),
      });

      const response = await api.get(`/admin/users?${params}`);
      if (response.data.success) {
        const fetchedUsers = response.data.data.users || [];

        if (append) {
          // إضافة المستخدمين الجدد للقائمة الموجودة
          setUsers((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((u) => u.id));
            const newUsers = fetchedUsers.filter(
              (u: User) => !existingIds.has(u.id)
            );
            return [...prev, ...newUsers];
          });
        } else {
          setUsers(fetchedUsers);
        }

        // تحديث pagination info
        if (response.data.data.pagination) {
          const {
            total,
            pages,
            page: currentPageNum,
          } = response.data.data.pagination;
          setTotalUsers(total);
          setHasMoreUsers(
            currentPageNum < pages && fetchedUsers.length === usersPerPage
          );
          setCurrentPage(currentPageNum);
          currentPageRef.current = currentPageNum;
        } else {
          setTotalUsers(response.data.data.total || fetchedUsers.length);
          setTotalPages(response.data.data.totalPages || 1);
          setHasMoreUsers(fetchedUsers.length === usersPerPage);
          currentPageRef.current = page;
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const searchUsers = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsSearching(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: usersPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== "ALL" && { role: roleFilter }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await api.get(`/admin/users/search?${params}`);
      if (response.data.success) {
        const fetchedUsers = response.data.data.users || [];

        if (append) {
          // إضافة المستخدمين الجدد للقائمة الموجودة
          setUsers((prev) => {
            // تجنب التكرار
            const existingIds = new Set(prev.map((u) => u.id));
            const newUsers = fetchedUsers.filter(
              (u: User) => !existingIds.has(u.id)
            );
            return [...prev, ...newUsers];
          });
        } else {
          setUsers(fetchedUsers);
        }

        // تحديث pagination info
        // search endpoint يستخدم بنية مختلفة (total, totalPages, currentPage)
        const total = response.data.data.total || fetchedUsers.length;
        const totalPages =
          response.data.data.totalPages || Math.ceil(total / usersPerPage);
        const currentPageNum = response.data.data.currentPage || page;

        setTotalUsers(total);
        setTotalPages(totalPages);
        setHasMoreUsers(
          currentPageNum < totalPages && fetchedUsers.length === usersPerPage
        );
        setCurrentPage(currentPageNum);
        currentPageRef.current = currentPageNum;
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  };

  // دالة جلب المزيد من المستخدمين
  const loadMoreUsers = useCallback(() => {
    if (!isLoadingMore && hasMoreUsers && !loading) {
      const nextPage = currentPageRef.current + 1;
      if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
        searchUsers(nextPage, true);
      } else {
        fetchUsers(nextPage, true);
      }
    }
  }, [
    hasMoreUsers,
    isLoadingMore,
    loading,
    searchTerm,
    roleFilter,
    statusFilter,
  ]);

  useEffect(() => {
    fetchUsers(1, false);
    fetchPlans();
  }, []);

  // Update selectedUser when users list changes (e.g., after canceling subscription)
  useEffect(() => {
    if (selectedUser && showViewSubscriptionsModal && users.length > 0) {
      const updatedUser = users.find((u) => u.id === selectedUser.id);
      if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(selectedUser)) {
        setSelectedUser(updatedUser);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, showViewSubscriptionsModal]);

  // Reset pagination when filters change
  useEffect(() => {
    if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
      setCurrentPage(1);
      currentPageRef.current = 1;
      setHasMoreUsers(true);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    // Only run search when filters change, not on initial load
    if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
      const timeoutId = setTimeout(() => {
        searchUsers(1, false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreUsers &&
          !isLoadingMore &&
          !loading
        ) {
          loadMoreUsers();
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
  }, [hasMoreUsers, isLoadingMore, loading, loadMoreUsers]);

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

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isActive: !currentStatus } : u
        )
      );

      showToast(
        isRTL
          ? `تم ${!currentStatus ? "تفعيل" : "تعطيل"} المستخدم بنجاح`
          : `User ${!currentStatus ? "activated" : "deactivated"} successfully`,
        "success"
      );
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء تحديث المستخدم" : "Error updating user"),
        "error"
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      showToast(
        isRTL
          ? "لا يمكنك حذف حسابك الخاص"
          : "You cannot delete your own account",
        "error"
      );
      return;
    }

    // Find the user to check if they have restaurants
    const userToDelete = users.find((u) => u.id === userId);
    const hasRestaurants =
      userToDelete?.restaurants && userToDelete.restaurants.length > 0;

    showConfirm({
      title: isRTL ? "حذف المستخدم" : "Delete User",
      message: hasRestaurants
        ? isRTL
          ? `هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف المستخدم وجميع المطاعم المرتبطة به (${userToDelete?.restaurants?.length} مطعم) وجميع البيانات المرتبطة (الاشتراكات، الطلبات، إلخ).`
          : `Are you sure you want to delete this user? This will delete the user and all associated restaurants (${userToDelete?.restaurants?.length} restaurants) and all related data (subscriptions, orders, etc.).`
        : isRTL
          ? "هل أنت متأكد من حذف هذا المستخدم؟"
          : "Are you sure you want to delete this user?",
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          setUsers(users.filter((u) => u.id !== userId));
          showToast(
            isRTL
              ? hasRestaurants
                ? "تم حذف المستخدم والمطاعم المرتبطة به بنجاح"
                : "تم حذف المستخدم بنجاح"
              : hasRestaurants
                ? "User and associated restaurants deleted successfully"
                : "User deleted successfully",
            "success"
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف المستخدم" : "Error deleting user"),
            "error"
          );
        }
      },
    });
  };

  const handleAddSubscription = async () => {
    if (!selectedRestaurant || !selectedPlan) {
      showToast(
        isRTL
          ? "الرجاء اختيار مطعم وخطة"
          : "Please select a restaurant and plan",
        "error"
      );
      return;
    }

    // Get the selected plan to use its duration
    const plan = plans.find((p) => p.id === selectedPlan);
    const duration = plan?.duration || 30;

    try {
      await api.post("/admin/subscriptions", {
        restaurantId: selectedRestaurant,
        planId: selectedPlan,
        duration: duration,
      });

      showToast(
        isRTL ? "تم إضافة الاشتراك بنجاح" : "Subscription added successfully",
        "success"
      );

      setShowAddSubscriptionModal(false);
      setSelectedRestaurant("");
      setSelectedPlan("");

      // Refresh users data to show updated subscriptions
      if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
        searchUsers(1, false);
      } else {
        fetchUsers(1, false);
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء إضافة الاشتراك"
            : "Error adding subscription"),
        "error"
      );
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    showConfirm({
      title: isRTL ? "إلغاء الاشتراك" : "Cancel Subscription",
      message: isRTL
        ? "هل أنت متأكد من إلغاء هذا الاشتراك؟"
        : "Are you sure you want to cancel this subscription?",
      confirmText: isRTL ? "إلغاء الاشتراك" : "Cancel Subscription",
      cancelText: isRTL ? "رجوع" : "Go Back",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.put(`/admin/subscriptions/${subscriptionId}/cancel`);
          showToast(
            isRTL
              ? "تم إلغاء الاشتراك بنجاح"
              : "Subscription cancelled successfully",
            "success"
          );

          // Refresh users data to show updated subscriptions
          if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
            await searchUsers(1, false);
          } else {
            await fetchUsers(1, false);
          }
          // selectedUser will be updated automatically via useEffect when users changes
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

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
    currentPageRef.current = 1;
    setHasMoreUsers(true);
    setShowSearchBar(false);
    setShowFilters(false);
    fetchUsers(1, false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Get all restaurants from all users
  const allRestaurants = users.flatMap((u) => u.restaurants || []);
  const filteredRestaurants = selectedUser
    ? selectedUser.restaurants || []
    : allRestaurants;

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "إدارة المستخدمين" : "User Management"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isRTL
                ? "إدارة المستخدمين والمطاعم والاشتراكات"
                : "Manage users, restaurants, and subscriptions"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {isRTL ? "بطاقات" : "Cards"}
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                    d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1z"
                  />
                </svg>
                {isRTL ? "جدول" : "Table"}
              </button>
            </div>

            <Button
              onClick={() => {
                setSelectedRestaurant("");
                setSelectedPlan("");
                setShowAddSubscriptionModal(true);
              }}
              className={isRTL ? "flex-row-reverse" : "flex-row"}
            >
              <svg
                className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {isRTL ? "إضافة اشتراك" : "Add Subscription"}
            </Button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* Search Button */}
            <button
              onClick={() => {
                setShowSearchBar(!showSearchBar);
                setShowFilters(false);
              }}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showSearchBar || searchTerm
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

            {/* Filter Button */}
            <button
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSearchBar(false);
              }}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                showFilters || roleFilter !== "ALL" || statusFilter !== "ALL"
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
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {isRTL ? "فلترة" : "Filter"}
              {(roleFilter !== "ALL" || statusFilter !== "ALL") && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                  {
                    [roleFilter !== "ALL", statusFilter !== "ALL"].filter(
                      Boolean
                    ).length
                  }
                </span>
              )}
            </button>

            {/* Clear Filters Button */}
            {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                {isRTL ? "مسح الفلاتر" : "Clear Filters"}
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isRTL
              ? `إجمالي النتائج: ${totalUsers}`
              : `Total results: ${totalUsers}`}
            {isSearching && (
              <span className="ml-2 inline-flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isRTL ? "جاري البحث..." : "Searching..."}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {showSearchBar && (
          <Card className="p-4 mb-4">
            <div className="relative">
              <Input
                type="text"
                placeholder={
                  isRTL
                    ? "البحث بالاسم، الإيميل، أو اسم المطعم..."
                    : "Search by name, email, or restaurant..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
            </div>
          </Card>
        )}

        {/* Filters */}
        {showFilters && (
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "الدور" : "Role"}
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ALL">
                    {isRTL ? "جميع الأدوار" : "All Roles"}
                  </option>
                  <option value="ADMIN">{isRTL ? "أدمن" : "Admin"}</option>
                  <option value="OWNER">{isRTL ? "مالك" : "Owner"}</option>
                  <option value="CASHIER">{isRTL ? "كاشير" : "Cashier"}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "الحالة" : "Status"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ALL">
                    {isRTL ? "جميع الحالات" : "All Status"}
                  </option>
                  <option value="ACTIVE">{isRTL ? "نشط" : "Active"}</option>
                  <option value="INACTIVE">
                    {isRTL ? "معطل" : "Inactive"}
                  </option>
                </select>
              </div>
            </div>
          </Card>
        )}
        {/* Add User Button */}
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center mb-2 px-3 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {isRTL ? "إضافة مستخدم" : "Add User"}
        </button>
        {/* Users Display */}
        {viewMode === "cards" ? (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-6">
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {user.isActive
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                              ? "معطل"
                              : "Inactive"}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {isRTL ? "تاريخ التسجيل: " : "Joined: "}
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Restaurant Summary */}
                  {user.restaurants && user.restaurants.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? "المطاعم:" : "Restaurants:"}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {isRTL
                              ? `${user.restaurants.length} مطعم`
                              : `${user.restaurants.length} restaurant${user.restaurants.length > 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div
                      className={`flex items-center ${isRTL ? "flex-row-reverse" : "flex-row"} ${isRTL ? "justify-between sm:justify-end" : "justify-between sm:justify-start"}`}
                    >
                      <span
                        className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${isRTL ? "ml-3" : "mr-3"}`}
                      >
                        {isRTL ? "الحالة:" : "Status:"}
                      </span>
                      <Switch
                        checked={user.isActive}
                        onChange={() =>
                          handleToggleUserStatus(user.id, user.isActive)
                        }
                        color={user.isActive ? "success" : "danger"}
                        size="sm"
                        isRTL={isRTL}
                        label={
                          user.isActive
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                              ? "معطل"
                              : "Inactive"
                        }
                      />
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row gap-2 ${isRTL ? "justify-start sm:justify-end" : "justify-end sm:justify-start"}`}
                    >
                      {/* View Subscriptions Button */}
                      {user.restaurants && user.restaurants.length > 0 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowViewSubscriptionsModal(true);
                          }}
                          className={`flex items-center w-full sm:w-auto ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <svg
                            className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
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
                          {isRTL ? "عرض الاشتراكات" : "View Subscriptions"}
                        </Button>
                      )}

                      {/* Add Subscription (per user) */}
                      {user.restaurants && user.restaurants.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setSelectedRestaurant("");
                            setSelectedPlan("");
                            setShowAddSubscriptionModal(true);
                          }}
                          className={`flex items-center w-full sm:w-auto ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <svg
                            className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          {isRTL ? "إضافة اشتراك" : "Add Subscription"}
                        </Button>
                      )}

                      {/* Delete Button */}
                      {user.id !== currentUser?.id && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className={`flex items-center w-full sm:w-auto ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <svg
                            className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          {isRTL ? "حذف" : "Delete"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "المستخدم" : "User"}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "البريد الإلكتروني" : "Email"}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "الدور" : "Role"}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "المطاعم" : "Restaurants"}
                    </th>

                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {isRTL ? "الإجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                                {user.firstName.charAt(0)}
                                {user.lastName.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className={`ml-4 ${isRTL ? "mr-4 ml-0" : ""}`}>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {isRTL ? "تاريخ التسجيل: " : "Joined: "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Switch
                            checked={user.isActive}
                            onChange={() =>
                              handleToggleUserStatus(user.id, user.isActive)
                            }
                            color={user.isActive ? "success" : "danger"}
                            size="sm"
                            isRTL={isRTL}
                            label={
                              user.isActive
                                ? isRTL
                                  ? "نشط"
                                  : "Active"
                                : isRTL
                                  ? "معطل"
                                  : "Inactive"
                            }
                          />
                        </div>
                      </td>

                      {/* Restaurants */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.restaurants && user.restaurants.length > 0 ? (
                            <div className="space-y-1">
                              {user.restaurants
                                .slice(0, 2)
                                .map((restaurant) => (
                                  <div
                                    key={restaurant.id}
                                    className="flex items-center"
                                  >
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-xs">
                                      {isRTL && restaurant.nameAr
                                        ? restaurant.nameAr
                                        : restaurant.name}
                                    </span>
                                  </div>
                                ))}
                              {user.restaurants.length > 2 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  +{user.restaurants.length - 2}{" "}
                                  {isRTL ? "أخرى" : "more"}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              {isRTL ? "لا يوجد" : "None"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="relative actions-dropdown">
                          <button
                            onClick={() =>
                              setOpenActionsDropdown(
                                openActionsDropdown === user.id ? null : user.id
                              )
                            }
                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            title={isRTL ? "الإجراءات" : "Actions"}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openActionsDropdown === user.id && (
                            <div
                              className={`absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${isRTL ? "left-0" : "right-0"}`}
                            >
                              <div className="py-1" role="menu">
                                {/* View Subscriptions */}
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowViewSubscriptionsModal(true);
                                    setOpenActionsDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  role="menuitem"
                                >
                                  <svg
                                    className="w-4 h-4 mr-3 text-blue-500"
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
                                  {isRTL
                                    ? "عرض الاشتراكات"
                                    : "View Subscriptions"}
                                </button>

                                {/* Add Subscription */}
                                <button
                                  onClick={() => {
                                    setSelectedRestaurant("");
                                    setSelectedPlan("");
                                    setShowAddSubscriptionModal(true);
                                    setOpenActionsDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  role="menuitem"
                                >
                                  <svg
                                    className="w-4 h-4 mr-3 text-green-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                  {isRTL ? "إضافة اشتراك" : "Add Subscription"}
                                </button>

                                {/* Delete User */}
                                {user.id !== currentUser?.id && (
                                  <button
                                    onClick={() => {
                                      handleDeleteUser(user.id);
                                      setOpenActionsDropdown(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    role="menuitem"
                                  >
                                    <svg
                                      className="w-4 h-4 mr-3 text-red-500"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                    {isRTL ? "حذف المستخدم" : "Delete User"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Infinite Scroll Trigger */}
        {hasMoreUsers && (
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

        {users.length === 0 && !loading && (
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {isRTL ? "لا يوجد مستخدمين" : "No users"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {isRTL
                ? "لا يوجد مستخدمين في النظام"
                : "No users found in the system"}
            </p>
          </div>
        )}

        {/* Add Subscription Modal */}
        {showAddSubscriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {isRTL ? "إضافة اشتراك" : "Add Subscription"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "المطعم" : "Restaurant"}
                  </label>
                  <select
                    value={selectedRestaurant}
                    onChange={(e) => setSelectedRestaurant(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">
                      {isRTL ? "-- اختر مطعم --" : "-- Select Restaurant --"}
                    </option>
                    {filteredRestaurants.map((restaurant) => (
                      <option key={restaurant.id} value={restaurant.id}>
                        {isRTL && restaurant.nameAr
                          ? restaurant.nameAr
                          : restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الخطة" : "Plan"}
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">
                      {isRTL ? "-- اختر خطة --" : "-- Select Plan --"}
                    </option>
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {isRTL && plan.nameAr ? plan.nameAr : plan.name} -
                        {plan.price} {isRTL ? "ل.س" : "SYP"} /{" "}
                        {plan.billingPeriod === "YEARLY"
                          ? isRTL
                            ? "سنوياً"
                            : "yearly"
                          : isRTL
                            ? "شهرياً"
                            : "monthly"}{" "}
                        ({plan.duration} {isRTL ? "يوم" : "days"})
                      </option>
                    ))}
                  </select>
                  {selectedPlan && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {isRTL
                        ? `المدة: ${plans.find((p) => p.id === selectedPlan)?.duration || 30} يوم`
                        : `Duration: ${plans.find((p) => p.id === selectedPlan)?.duration || 30} days`}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3 mt-6`}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAddSubscriptionModal(false);
                    setSelectedUser(null);
                    setSelectedRestaurant("");
                    setSelectedPlan("");
                  }}
                  className={isRTL ? "flex-row-reverse" : "flex-row"}
                >
                  <svg
                    className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
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
                <Button
                  onClick={handleAddSubscription}
                  className={isRTL ? "flex-row-reverse" : "flex-row"}
                >
                  <svg
                    className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {isRTL ? "إضافة" : "Add"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* View Subscriptions Modal */}
        {showViewSubscriptionsModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? "اشتراكات المستخدم" : "User Subscriptions"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowViewSubscriptionsModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
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
                    {isRTL ? "إغلاق" : "Close"}
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>
                      {selectedUser.firstName} {selectedUser.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>
                      {selectedUser.restaurants?.length || 0}{" "}
                      {isRTL ? "مطعم" : "restaurant"}
                      {(selectedUser.restaurants?.length || 0) > 1
                        ? isRTL
                          ? "ات"
                          : "s"
                        : ""}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {selectedUser.restaurants &&
                selectedUser.restaurants.length > 0 ? (
                  <div className="space-y-6">
                    {selectedUser.restaurants.map((restaurant) => (
                      <div
                        key={restaurant.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {isRTL && restaurant.nameAr
                              ? restaurant.nameAr
                              : restaurant.name}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {isRTL ? "المطعم" : "Restaurant"}
                          </span>
                        </div>

                        {restaurant.subscriptions &&
                        restaurant.subscriptions.length > 0 ? (
                          <div className="space-y-3">
                            {restaurant.subscriptions.map((subscription) => (
                              <div
                                key={subscription.id}
                                className={`p-4 rounded-lg border ${
                                  subscription.status === "ACTIVE"
                                    ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                                    : subscription.status === "EXPIRED"
                                      ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                      : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                                }`}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          subscription.status === "ACTIVE"
                                            ? "bg-green-500"
                                            : subscription.status === "EXPIRED"
                                              ? "bg-red-500"
                                              : "bg-gray-400"
                                        }`}
                                      ></div>
                                      <div>
                                        <h5 className="font-medium text-gray-900 dark:text-white">
                                          {isRTL && subscription.plan.nameAr
                                            ? subscription.plan.nameAr
                                            : subscription.plan.name}
                                        </h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {subscription.plan.type} -{" "}
                                          {subscription.plan.price}{" "}
                                          {isRTL ? "ل.س" : "SYP"} /{" "}
                                          {subscription.plan.billingPeriod === "YEARLY"
                                            ? isRTL
                                              ? "سنوياً"
                                              : "yearly"
                                            : isRTL
                                              ? "شهرياً"
                                              : "monthly"}{" "}
                                          ({subscription.plan.duration}{" "}
                                          {isRTL ? "يوم" : "days"})
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          subscription.status === "ACTIVE"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : subscription.status === "EXPIRED"
                                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                        }`}
                                      >
                                        {subscription.status === "ACTIVE"
                                          ? isRTL
                                            ? "نشط"
                                            : "Active"
                                          : subscription.status === "EXPIRED"
                                            ? isRTL
                                              ? "منتهي"
                                              : "Expired"
                                            : subscription.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Subscription Details */}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                        />
                                      </svg>
                                      <span>
                                        {isRTL ? "السعر:" : "Price:"}{" "}
                                        {subscription.plan.price}{" "}
                                        {isRTL ? "ل.س" : "SYP"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cancel Subscription Button */}
                                  {subscription.status === "ACTIVE" && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() =>
                                          handleCancelSubscription(subscription.id)
                                        }
                                        className={`w-full flex items-center justify-center ${isRTL ? "flex-row-reverse" : "flex-row"}`}
                                      >
                                        <svg
                                          className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`}
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
                                        {isRTL
                                          ? "إلغاء الاشتراك"
                                          : "Cancel Subscription"}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
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
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                              {isRTL ? "لا توجد اشتراكات" : "No subscriptions"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {isRTL
                                ? "هذا المطعم لا يملك أي اشتراكات"
                                : "This restaurant has no subscriptions"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {isRTL ? "لا توجد مطاعم" : "No restaurants"}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isRTL
                        ? "هذا المستخدم لا يملك أي مطاعم"
                        : "This user has no restaurants"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onUserAdded={() => {
            // Refresh users data
            if (searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") {
              searchUsers(1, false);
            } else {
              fetchUsers(1, false);
            }
          }}
        />
      </div>
    </div>
  );
}
