"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Card } from "../ui/Card";
import { EmailVerificationModal } from "./EmailVerificationModal";

interface FormData {
  // Step 1: Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;

  // Step 2: Restaurant Information
  restaurantName: string;
  restaurantNameAr: string;
  restaurantDescription: string;
  restaurantDescriptionAr: string;

  // Step 3: Logo
  logo: string;
}

const initialFormData: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  restaurantName: "",
  restaurantNameAr: "",
  restaurantDescription: "",
  restaurantDescriptionAr: "",
  logo: "",
};

export default function RegisterForm() {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const { loginWithToken } = useAuth();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Validation functions
  const validateStep1 = () => {
    const errors: Partial<FormData> = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      errors.firstName = isRTL
        ? "الاسم الأول يجب أن يكون حرفين على الأقل"
        : "First name must be at least 2 characters";
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      errors.lastName = isRTL
        ? "الاسم الأخير يجب أن يكون حرفين على الأقل"
        : "Last name must be at least 2 characters";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = isRTL
        ? "البريد الإلكتروني غير صحيح"
        : "Invalid email address";
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = isRTL
        ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        : "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = isRTL
        ? "كلمات المرور غير متطابقة"
        : "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Partial<FormData> = {};

    if (!formData.restaurantName || formData.restaurantName.length < 2) {
      errors.restaurantName = isRTL
        ? "اسم المطعم بالإنجليزية يجب أن يكون حرفين على الأقل"
        : "Restaurant name must be at least 2 characters";
    }

    if (!formData.restaurantNameAr || formData.restaurantNameAr.length < 2) {
      errors.restaurantNameAr = isRTL
        ? "اسم المطعم بالعربية يجب أن يكون حرفين على الأقل"
        : "Arabic restaurant name must be at least 2 characters";
    }

    if (
      formData.restaurantDescription &&
      formData.restaurantDescription.length > 500
    ) {
      errors.restaurantDescription = isRTL
        ? "وصف المطعم لا يمكن أن يتجاوز 500 حرف"
        : "Restaurant description cannot exceed 500 characters";
    }

    if (
      formData.restaurantDescriptionAr &&
      formData.restaurantDescriptionAr.length > 500
    ) {
      errors.restaurantDescriptionAr = isRTL
        ? "وصف المطعم بالعربية لا يمكن أن يتجاوز 500 حرف"
        : "Arabic restaurant description cannot exceed 500 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid && currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      setError("");
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all steps before submitting
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();

    if (!step1Valid || !step2Valid) {
      showToast(
        isRTL
          ? "يرجى تصحيح الأخطاء قبل المتابعة"
          : "Please fix errors before proceeding",
        "error"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await api.post("/auth/register", submitData);

      if (response.data.success) {
        const { token, user, requiresEmailVerification } = response.data.data;

        if (requiresEmailVerification) {
          // Show email verification modal
          setUserEmail(user.email);
          setShowEmailVerification(true);
          showToast(
            isRTL
              ? "تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني"
              : "Account created successfully! Please verify your email",
            "success"
          );
        } else {
          // Use loginWithToken function from AuthContext to update the context
          await loginWithToken(token, user);

          showToast(
            isRTL
              ? "تم إنشاء الحساب وتسجيل الدخول بنجاح!"
              : "Account created and logged in successfully!",
            "success"
          );

          // Redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerified = async () => {
    setShowEmailVerification(false);
    showToast(
      isRTL
        ? "تم التحقق من البريد الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول"
        : "Email verified successfully! You can now log in",
      "success"
    );

    // Redirect to login page
    router.push("/auth/login");
  };

  const isStep1Valid =
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword &&
    Object.keys(fieldErrors).length === 0;
  const isStep2Valid = formData.restaurantName && formData.restaurantNameAr;
  const isFormValid = isStep1Valid && isStep2Valid;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="mt-8  w-full max-w-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold ">
            {isRTL ? "إنشاء حساب جديد" : "Create New Account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRTL ? "الخطوة" : "Step"} {currentStep} {isRTL ? "من" : "of"} 3
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        <div className="mt-8 space-y-6">
          {error && <ErrorMessage message={error} />}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium ">
                {isRTL ? "البيانات الشخصية" : "Personal Information"}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label={isRTL ? "الاسم الأول" : "First Name"}
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={fieldErrors.firstName ? "border-red-500" : ""}
                    required
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    label={isRTL ? "الاسم الأخير" : "Last Name"}
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={fieldErrors.lastName ? "border-red-500" : ""}
                    required
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  label={isRTL ? "البريد الإلكتروني" : "Email"}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={fieldErrors.email ? "border-red-500" : ""}
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label={isRTL ? "كلمة المرور" : "Password"}
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className={fieldErrors.password ? "border-red-500" : ""}
                  required
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={
                    fieldErrors.confirmPassword ? "border-red-500" : ""
                  }
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Restaurant Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium ">
                {isRTL ? "معلومات المطعم" : "Restaurant Information"}
              </h3>

              <div>
                <Input
                  label={
                    isRTL ? "اسم المطعم (عربي)" : "Restaurant Name (Arabic)"
                  }
                  value={formData.restaurantNameAr}
                  onChange={(e) =>
                    handleInputChange("restaurantNameAr", e.target.value)
                  }
                  className={
                    fieldErrors.restaurantNameAr ? "border-red-500" : ""
                  }
                  required
                />
                {fieldErrors.restaurantNameAr && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.restaurantNameAr}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label={
                    isRTL ? "اسم المطعم (إنجليزي)" : "Restaurant Name (English)"
                  }
                  value={formData.restaurantName}
                  onChange={(e) =>
                    handleInputChange("restaurantName", e.target.value)
                  }
                  className={fieldErrors.restaurantName ? "border-red-500" : ""}
                  required
                />
                {fieldErrors.restaurantName && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.restaurantName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL
                    ? "وصف المطعم (عربي)"
                    : "Restaurant Description (Arabic)"}
                </label>
                <textarea
                  value={formData.restaurantDescriptionAr}
                  onChange={(e) =>
                    handleInputChange("restaurantDescriptionAr", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    fieldErrors.restaurantDescriptionAr
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={
                    isRTL
                      ? "وصف مختصر عن المطعم..."
                      : "Brief description about the restaurant..."
                  }
                />
                {fieldErrors.restaurantDescriptionAr && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.restaurantDescriptionAr}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRTL
                    ? "وصف المطعم (إنجليزي)"
                    : "Restaurant Description (English)"}
                </label>
                <textarea
                  value={formData.restaurantDescription}
                  onChange={(e) =>
                    handleInputChange("restaurantDescription", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                    fieldErrors.restaurantDescription
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={
                    isRTL
                      ? "Brief description about the restaurant..."
                      : "وصف مختصر عن المطعم..."
                  }
                />
                {fieldErrors.restaurantDescription && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.restaurantDescription}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Logo Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {isRTL ? "شعار المطعم" : "Restaurant Logo"}
              </h3>

              <div>
                <label className="block text-sm font-medium  mb-1">
                  {isRTL
                    ? "رفع شعار المطعم (اختياري)"
                    : "Upload Restaurant Logo (Optional)"}
                </label>
                <ImageUpload
                  value={formData.logo}
                  onChange={(url) => handleInputChange("logo", url || "")}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              {isRTL ? "السابق" : "Previous"}
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
              >
                {isRTL ? "التالي" : "Next"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : isRTL ? (
                  "إنشاء الحساب"
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            {isRTL ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <a
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {isRTL ? "تسجيل الدخول" : "Sign in"}
            </a>
          </p>
        </div>
      </Card>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        email={userEmail}
        onVerified={handleEmailVerified}
      />
    </div>
  );
}
