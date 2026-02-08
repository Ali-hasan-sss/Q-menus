"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  type: string;
  billingPeriod?: string;
  price: number;
  currency: string;
  duration: number;
  maxTables: number;
  maxMenus: number;
  maxCategories: number;
  maxItems: number;
  canCustomizeTheme: boolean;
  features: string[];
  isActive: boolean;
  isFree: boolean;
  _count?: {
    subscriptions: number;
  };
}

export default function PlansPage() {
  const { isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    type: "BASIC",
    billingPeriod: "MONTHLY",
    price: 0,
    currency: "USD",
    duration: 30,
    maxTables: 10,
    maxMenus: 1,
    maxCategories: 10,
    maxItems: 50,
    canCustomizeTheme: false,
    isFree: false,
    features: [] as string[],
  });

  // Available features
  const availableFeatures = [
    {
      value: "KITCHEN_DISPLAY_SYSTEM",
      label: "Kitchen Display System",
      labelAr: "لوحة المطبخ",
    },
  ];

  // Popular currencies list with translations
  const popularCurrencies = [
    { code: "USD", nameAr: "دولار", nameEn: "US Dollar" },
    { code: "EUR", nameAr: "يورو", nameEn: "Euro" },
    { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound" },
    { code: "SYP", nameAr: "ليرة سورية", nameEn: "Syrian Pound" },
    { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira" },
    { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal" },
    { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham" },
    { code: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar" },
    { code: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound" },
    { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar" },
    { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal" },
    { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial" },
    { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar" },
    { code: "LBP", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound" },
    { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar" },
    { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen" },
    { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan" },
    { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee" },
    { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar" },
    { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar" },
    { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc" },
    { code: "RUB", nameAr: "روبل روسي", nameEn: "Russian Ruble" },
    {
      code: "SYP_NEW",
      nameAr: "ليرة سورية جديدة",
      nameEn: "Syrian Pound (New)",
    },
    {
      code: "SYP_OLD",
      nameAr: "ليرة سورية قديمة",
      nameEn: "Syrian Pound (Old)",
    },
  ];

  // Function to format currency based on language and currency type
  const formatCurrency = (price: number, currency: string) => {
    if (currency === "SYP") {
      return language === "AR"
        ? `${price.toLocaleString()} ل.س`
        : `${price.toLocaleString()} SYP`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/admin/plans");
      if (response.data.success) {
        setPlans(response.data.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.name ||
      !formData.type ||
      (!formData.isFree && (!formData.price || !formData.currency)) ||
      !formData.description.trim()
    ) {
      showToast(
        isRTL
          ? "الرجاء ملء جميع الحقول المطلوبة"
          : "Please fill all required fields",
        "error"
      );
      return;
    }

    try {
      // Prepare data to send
      const planData = {
        ...formData,
        // Ensure currency is sent even for free plans (for consistency)
        currency: formData.currency || "USD",
      };

      if (editingPlan) {
        await api.put(`/admin/plans/${editingPlan.id}`, planData);
        showToast(
          isRTL ? "تم تحديث الخطة بنجاح" : "Plan updated successfully",
          "success"
        );
      } else {
        await api.post("/admin/plans", planData);
        showToast(
          isRTL ? "تم إضافة الخطة بنجاح" : "Plan added successfully",
          "success"
        );
      }
      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL ? "حدث خطأ أثناء حفظ الخطة" : "Error saving plan"),
        "error"
      );
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      nameAr: plan.nameAr || "",
      description: plan.description || "",
      descriptionAr: plan.descriptionAr || "",
      type: plan.type,
      billingPeriod: plan.billingPeriod || "MONTHLY",
      price: Number(plan.price),
      currency: plan.currency || "USD",
      duration: plan.duration,
      maxTables: plan.maxTables,
      maxMenus: plan.maxMenus,
      maxCategories: plan.maxCategories,
      maxItems: plan.maxItems,
      canCustomizeTheme: plan.canCustomizeTheme,
      isFree: plan.isFree,
      features: plan.features || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      type: "BASIC",
      billingPeriod: "MONTHLY",
      price: 0,
      currency: "USD",
      duration: 30,
      maxTables: 10,
      maxMenus: 1,
      maxCategories: 10,
      maxItems: 50,
      canCustomizeTheme: false,
      isFree: false,
      features: [],
    });
    setEditingPlan(null);
  };

  const toggleFeature = (featureValue: string) => {
    setFormData((prev) => {
      const features = prev.features.includes(featureValue)
        ? prev.features.filter((f) => f !== featureValue)
        : [...prev.features, featureValue];
      return { ...prev, features };
    });
  };

  const handleDelete = (planId: string, planName: string) => {
    showConfirm({
      title: isRTL ? "حذف الخطة" : "Delete Plan",
      message: isRTL
        ? `هل أنت متأكد من حذف خطة "${planName}"؟`
        : `Are you sure you want to delete plan "${planName}"?`,
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/plans/${planId}`);
          setPlans(plans.filter((p) => p.id !== planId));
          showToast(
            isRTL ? "تم حذف الخطة بنجاح" : "Plan deleted successfully",
            "success"
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف الخطة" : "Error deleting plan"),
            "error"
          );
        }
      },
    });
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "إدارة الخطط" : "Plans Management"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isRTL
                ? "إدارة خطط الاشتراك والميزات"
                : "Manage subscription plans and features"}
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            {isRTL ? "إضافة خطة" : "Add Plan"}
          </Button>
        </div>

        {/* Billing Period Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSelectedBillingPeriod("ALL")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedBillingPeriod === "ALL"
                  ? "bg-white dark:bg-gray-600 text-tm-blue dark:text-tm-orange shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {isRTL ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setSelectedBillingPeriod("MONTHLY")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedBillingPeriod === "MONTHLY"
                  ? "bg-white dark:bg-gray-600 text-tm-blue dark:text-tm-orange shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {isRTL ? "شهري" : "Monthly"}
            </button>
            <button
              onClick={() => setSelectedBillingPeriod("YEARLY")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedBillingPeriod === "YEARLY"
                  ? "bg-white dark:bg-gray-600 text-tm-blue dark:text-tm-orange shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {isRTL ? "سنوي" : "Yearly"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans
            .filter((plan) => {
              if (selectedBillingPeriod === "ALL") return true;
              if (selectedBillingPeriod === "MONTHLY") {
                return plan.billingPeriod === "MONTHLY" || !plan.billingPeriod;
              }
              if (selectedBillingPeriod === "YEARLY") {
                return plan.billingPeriod === "YEARLY";
              }
              return true;
            })
            .map((plan) => (
            <Card key={plan.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isRTL && plan.nameAr ? plan.nameAr : plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.type}
                  </p>
                </div>
                <div className="flex gap-2">
                  {plan.isFree && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {isRTL ? "مجاني" : "FREE"}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      plan.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {plan.isActive
                      ? isRTL
                        ? "نشط"
                        : "Active"
                      : isRTL
                        ? "معطل"
                        : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="text-3xl font-bold text-primary-600 mb-4">
                {plan.isFree
                  ? isRTL
                    ? "مجاني"
                    : "Free"
                  : formatCurrency(plan.price, plan.currency)}
                {!plan.isFree && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                    /{plan.billingPeriod === "YEARLY"
                      ? isRTL
                        ? "سنوياً"
                        : "yearly"
                      : isRTL
                        ? "شهرياً"
                        : "monthly"}{" "}
                    ({plan.duration} {isRTL ? "يوم" : "days"})
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  {plan.maxMenus} {isRTL ? "قائمة" : "menus"}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  {plan.maxCategories}{" "}
                  {isRTL ? "فئة كحد أقصى" : "categories max"}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  {plan.maxItems}{" "}
                  {isRTL ? "عنصر لكل فئة" : "items per category"}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <span className="mr-2">✓</span>
                  {plan.maxTables} {isRTL ? "طاولة" : "tables"}
                </p>
                {plan.canCustomizeTheme && (
                  <p className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="mr-2">✓</span>
                    {isRTL ? "تخصيص التصميم" : "Theme customization"}
                  </p>
                )}
                {plan.features && plan.features.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    {plan.features.includes("KITCHEN_DISPLAY_SYSTEM") && (
                      <p className="flex items-center text-gray-600 dark:text-gray-400">
                        <span className="mr-2">✓</span>
                        {isRTL ? "لوحة المطبخ" : "Kitchen Display System"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {plan._count && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                  {plan._count.subscriptions}{" "}
                  {isRTL ? "اشتراك نشط" : "active subscriptions"}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                >
                  {isRTL ? "تعديل" : "Edit"}
                </Button>
                {!plan.isFree && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(plan.id, plan.name)}
                  >
                    {isRTL ? "حذف" : "Delete"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Add/Edit Plan Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {editingPlan
                          ? isRTL
                            ? "تعديل الخطة"
                            : "Edit Plan"
                          : isRTL
                            ? "إضافة خطة جديدة"
                            : "Add New Plan"}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isRTL
                          ? "قم بتكوين تفاصيل الخطة"
                          : "Configure plan details"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {isRTL ? "المعلومات الأساسية" : "Basic Information"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={isRTL ? "الاسم (إنجليزي)" : "Name (English)"}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                      <Input
                        label={isRTL ? "الاسم (عربي)" : "Name (Arabic)"}
                        value={formData.nameAr}
                        onChange={(e) =>
                          setFormData({ ...formData, nameAr: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 pt-4 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL
                            ? "الوصف (إنجليزي) *"
                            : "Description (English) *"}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          required
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={
                            isRTL ? "وصف الخطة..." : "Plan description..."
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "الوصف (عربي)" : "Description (Arabic)"}
                        </label>
                        <textarea
                          value={formData.descriptionAr}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              descriptionAr: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={
                            isRTL
                              ? "وصف الخطة بالعربية..."
                              : "Plan description in Arabic..."
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "النوع" : "Type"}
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="BASIC">BASIC</option>
                          <option value="PREMIUM">PREMIUM</option>
                          <option value="ENTERPRISE">ENTERPRISE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "نوع الفترة" : "Billing Period"}
                        </label>
                        <select
                          value={formData.billingPeriod}
                          onChange={(e) =>
                            setFormData({ ...formData, billingPeriod: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="MONTHLY">
                            {isRTL ? "شهرية" : "Monthly"}
                          </option>
                          <option value="YEARLY">
                            {isRTL ? "سنوية" : "Yearly"}
                          </option>
                        </select>
                      </div>
                      <Input
                        type="number"
                        label={isRTL ? "السعر" : "Price"}
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        min="0"
                        required
                        disabled={formData.isFree}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "العملة" : "Currency"} *
                        </label>
                        <select
                          value={formData.currency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              currency: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                          disabled={formData.isFree}
                        >
                          {popularCurrencies.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {isRTL
                                ? `${curr.code} - ${curr.nameAr}`
                                : `${curr.code} - ${curr.nameEn}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Limits & Features */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      {isRTL ? "الحدود والميزات" : "Limits & Features"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input
                        type="number"
                        label={isRTL ? "المدة (أيام)" : "Duration (days)"}
                        value={formData.duration}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: parseInt(e.target.value) || 30,
                          })
                        }
                        min="1"
                        required
                      />
                      <Input
                        type="number"
                        label={isRTL ? "عدد الطاولات" : "Max Tables"}
                        value={formData.maxTables}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxTables: parseInt(e.target.value) || 10,
                          })
                        }
                        min="1"
                        required
                      />
                      <Input
                        type="number"
                        label={isRTL ? "عدد القوائم" : "Max Menus"}
                        value={formData.maxMenus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxMenus: parseInt(e.target.value) || 1,
                          })
                        }
                        min="1"
                        required
                      />
                      <Input
                        type="number"
                        label={isRTL ? "عدد الفئات" : "Max Categories"}
                        value={formData.maxCategories}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxCategories: parseInt(e.target.value) || 10,
                          })
                        }
                        min="1"
                        required
                      />
                    </div>

                    <Input
                      type="number"
                      label={
                        isRTL ? "عدد العناصر لكل فئة" : "Max Items per Category"
                      }
                      value={formData.maxItems}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxItems: parseInt(e.target.value) || 50,
                        })
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.canCustomizeTheme}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            canCustomizeTheme: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isRTL
                          ? "السماح بتخصيص التصميم"
                          : "Allow Theme Customization"}
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFree}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isFree: e.target.checked,
                            price: e.target.checked ? 0 : formData.price,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {isRTL ? "خطة مجانية" : "Free Plan"}
                      </span>
                    </label>
                  </div>

                  {/* Features Section */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-primary-600"
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
                      {isRTL ? "الميزات" : "Features"}
                    </h4>
                    <div className="space-y-2">
                      {availableFeatures.map((feature) => (
                        <label
                          key={feature.value}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.features.includes(feature.value)}
                            onChange={() => toggleFeature(feature.value)}
                            className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {isRTL ? feature.labelAr : feature.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
                    <div
                      className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3`}
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
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
                        {isRTL ? "إلغاء" : "Cancel"}
                      </Button>
                      <Button type="submit">
                        {editingPlan ? (
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        ) : (
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
                        )}
                        {editingPlan
                          ? isRTL
                            ? "تحديث"
                            : "Update"
                          : isRTL
                            ? "إضافة"
                            : "Add"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
