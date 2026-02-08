"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  nameAr?: string;
  type: string;
  price: number;
  duration: number;
  maxCategories: number;
  maxItems: number;
  canCustomizeTheme: boolean;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

export default function AddUserModal({
  isOpen,
  onClose,
  onUserAdded,
}: AddUserModalProps) {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "OWNER",
    restaurantName: "",
    restaurantNameAr: "",
    planId: "",
  });

  // Load plans on component mount
  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "OWNER",
      restaurantName: "",
      restaurantNameAr: "",
      planId: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.firstName ||
        !formData.lastName ||
        !formData.email ||
        !formData.password
      ) {
        showToast(
          isRTL
            ? "الرجاء ملء جميع الحقول المطلوبة"
            : "Please fill in all required fields",
          "error"
        );
        return;
      }

      if (
        formData.role === "OWNER" &&
        (!formData.restaurantName || !formData.planId)
      ) {
        showToast(
          isRTL
            ? "الرجاء إدخال اسم المطعم واختيار خطة"
            : "Please enter restaurant name and select a plan",
          "error"
        );
        return;
      }

      // Create user data
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "OWNER" && {
          restaurant: {
            name: formData.restaurantName,
            nameAr: formData.restaurantNameAr,
          },
          planId: formData.planId,
        }),
      };

      console.log("📤 Sending user data:", userData);

      const response = await api.post("/admin/users", userData);
      const data = response.data;

      console.log("📤 User creation response:", data);

      if (data.success) {
        showToast(
          isRTL ? "تم إنشاء المستخدم بنجاح" : "User created successfully",
          "success"
        );
        resetForm();
        onUserAdded();
        onClose();
      } else {
        showToast(
          data.message ||
            (isRTL ? "حدث خطأ أثناء إنشاء المستخدم" : "Error creating user"),
          "error"
        );
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showToast(
        isRTL ? "حدث خطأ أثناء إنشاء المستخدم" : "Error creating user",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "إضافة مستخدم جديد" : "Add New User"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="w-6 h-6"
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

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          <div className="space-y-6">
            {/* Personal Information */}
            <Card className="p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isRTL ? "المعلومات الشخصية" : "Personal Information"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "الاسم الأول *" : "First Name *"}
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder={
                      isRTL ? "أدخل الاسم الأول" : "Enter first name"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "الاسم الأخير *" : "Last Name *"}
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder={
                      isRTL ? "أدخل الاسم الأخير" : "Enter last name"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "البريد الإلكتروني *" : "Email *"}
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder={
                      isRTL ? "أدخل البريد الإلكتروني" : "Enter email address"
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "كلمة المرور *" : "Password *"}
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder={isRTL ? "أدخل كلمة المرور" : "Enter password"}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </Card>

            {/* Role Selection */}
            <Card className="p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {isRTL ? "نوع المستخدم" : "User Type"}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL ? "الدور *" : "Role *"}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="ADMIN">{isRTL ? "أدمن" : "Admin"}</option>
                    <option value="OWNER">
                      {isRTL ? "صاحب مطعم" : "Restaurant Owner"}
                    </option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Restaurant Information (only for OWNER role) */}
            {formData.role === "OWNER" && (
              <Card className="p-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {isRTL ? "معلومات المطعم" : "Restaurant Information"}
                </h4>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL
                          ? "اسم المطعم (عربي) *"
                          : "Restaurant Name (Arabic) *"}
                      </label>
                      <Input
                        type="text"
                        value={formData.restaurantNameAr}
                        onChange={(e) =>
                          handleInputChange("restaurantNameAr", e.target.value)
                        }
                        placeholder={
                          isRTL
                            ? "أدخل اسم المطعم بالعربية"
                            : "Enter restaurant name in Arabic"
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL
                          ? "اسم المطعم (إنجليزي) *"
                          : "Restaurant Name (English) *"}
                      </label>
                      <Input
                        type="text"
                        value={formData.restaurantName}
                        onChange={(e) =>
                          handleInputChange("restaurantName", e.target.value)
                        }
                        placeholder={
                          isRTL
                            ? "أدخل اسم المطعم بالإنجليزية"
                            : "Enter restaurant name in English"
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isRTL
                        ? "اختيار خطة الاشتراك *"
                        : "Select Subscription Plan *"}
                    </label>
                    <select
                      value={formData.planId}
                      onChange={(e) =>
                        handleInputChange("planId", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">
                        {isRTL ? "-- اختر خطة --" : "-- Select Plan --"}
                      </option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {isRTL && plan.nameAr ? plan.nameAr : plan.name} -{" "}
                          {plan.price} {isRTL ? "ل.س" : "SYP"} / {plan.duration}{" "}
                          {isRTL ? "يوم" : "days"}
                        </option>
                      ))}
                    </select>
                    {formData.planId && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        {(() => {
                          const selectedPlan = plans.find(
                            (p) => p.id === formData.planId
                          );
                          return selectedPlan ? (
                            <div className="text-sm text-blue-800 dark:text-blue-200">
                              <p className="font-medium">
                                {isRTL && selectedPlan.nameAr
                                  ? selectedPlan.nameAr
                                  : selectedPlan.name}
                              </p>
                              <p className="text-xs mt-1">
                                {isRTL ? "الميزات:" : "Features:"}{" "}
                                {selectedPlan.maxCategories}{" "}
                                {isRTL ? "فئة" : "categories"},{" "}
                                {selectedPlan.maxItems}{" "}
                                {isRTL ? "عنصر لكل فئة" : "items per category"}
                                {selectedPlan.canCustomizeTheme &&
                                  `, ${isRTL ? "تخصيص الثيم" : "theme customization"}`}
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700`}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
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
              type="submit"
              loading={loading}
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
              {isRTL ? "إنشاء المستخدم" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
