"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Header from "@/components/layout/Header";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { ResetPasswordModal } from "@/components/auth/ResetPasswordModal";
import { useToast } from "@/store/hooks/useToast";
import { Footer } from "@/components/ui/Footer";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { login, user, isAuthenticated } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🔄 Login page: User authenticated, redirecting...", {
        role: user.role,
        hasRestaurant: !!user.restaurant,
      });
      let dashboardPath = "/dashboard";

      if (user.role === "ADMIN") {
        dashboardPath = "/admin";
      } else if (user.restaurant) {
        dashboardPath = "/dashboard";
      } else {
        dashboardPath = "/onboarding";
      }

      console.log("🔄 Redirecting to:", dashboardPath);
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      // Login function will handle redirect
      // The useEffect above will also catch the redirect if needed
      // Don't set loading to false here - let the redirect happen
    } catch (error: any) {
      setIsLoading(false);
      // Check if email verification is required
      if (error.response?.data?.requiresEmailVerification) {
        setUserEmail(data.email);
        setShowEmailVerification(true);
      } else {
        // Translate error message
        const errorCode = error.response?.data?.code;
        const errorMessage = error.response?.data?.message;
        const statusCode = error.response?.status;
        
        console.log("🔍 Login error details:", {
          errorCode,
          errorMessage,
          statusCode,
          fullResponse: error.response?.data,
          errorResponse: error.response,
        });
        
        let translatedMessage = errorMessage;
        
        // Check for rate limit (429 status or LOGIN_RATE_LIMIT_EXCEEDED code)
        if (statusCode === 429 || errorCode === "LOGIN_RATE_LIMIT_EXCEEDED") {
          translatedMessage = t("auth.error.loginRateLimitExceeded");
        } else if (errorCode === "INVALID_CREDENTIALS") {
          translatedMessage = t("auth.error.invalidCredentials");
        } else if (errorCode === "USER_NOT_FOUND") {
          translatedMessage = t("auth.error.userNotFound");
          console.log("✅ Using translation for USER_NOT_FOUND:", {
            errorCode,
            translationKey: "auth.error.userNotFound",
            translatedMessage,
            language: language,
          });
        } else if (errorCode === "EMAIL_NOT_VERIFIED") {
          translatedMessage = t("auth.error.emailNotVerified");
        } else if (errorCode === "SERVER_ERROR") {
          translatedMessage = t("auth.error.serverError");
        } else if (errorMessage && (errorMessage.toLowerCase().includes("invalid credentials") || errorMessage.toLowerCase().includes("بيانات الدخول"))) {
          // Fallback: if message contains "invalid credentials" but no code
          translatedMessage = t("auth.error.invalidCredentials");
        } else if (errorMessage && (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("المستخدم غير موجود"))) {
          // Fallback: if message contains "user not found" but no code
          translatedMessage = t("auth.error.userNotFound");
        } else {
          translatedMessage = errorMessage || t("auth.error.loginFailed");
        }
        
        console.log("📤 Showing toast with translated message:", {
          originalMessage: errorMessage,
          translatedMessage,
          errorCode,
          language: language,
          translationKey: errorCode === "USER_NOT_FOUND" ? "auth.error.userNotFound" : "other",
        });
        showToast(translatedMessage, "error");
        console.error("Login error:", error);
      }
    }
  };

  const handleEmailVerified = () => {
    setShowEmailVerification(false);
    showToast(t("auth.success.emailVerified"), "success");
  };

  const handleForgotPasswordSuccess = (email: string) => {
    setUserEmail(email);
    setShowForgotPassword(false);
    setShowResetPassword(true);
  };

  const handleResetPasswordSuccess = () => {
    setShowResetPassword(false);
    showToast(
      isRTL
        ? "تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول"
        : "Password reset successfully. You can now log in",
      "success"
    );
  };

  return (
    <>
      <Header />
      <div className={`min-h-screen flex flex-col lg:flex-row -mt-24 md:-mt-28 pt-24 md:pt-28 ${isRTL ? "lg:flex-row-reverse" : ""}`}>
        {/* النصف الأول: الفورم بدون حواف — يسار في LTR، يمين في RTL */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md">
            <h2 className="mb-2 text-3xl font-extrabold text-gray-900 dark:text-white">
              {isRTL
                ? "سجّل الدخول إلى حساب مطعمك"
                : "Sign in to your restaurant account"}
            </h2>
            <p className="mb-8 text-sm text-gray-600 dark:text-gray-300">
              {isRTL
                ? "QMenus مخصّصة للمطاعم والكافيهات"
                : "QMenus is built for restaurants and cafes"}
            </p>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("auth.email")}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block mt-2 w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
                    {...register("email", { required: true })}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("auth.password")}
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                    } dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
                    {...register("password", { required: true })}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const currentEmail = watch("email");
                      if (currentEmail) {
                        setUserEmail(currentEmail);
                      }
                      setShowForgotPassword(true);
                    }}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-tm-blue hover:bg-tm-orange text-white"
                  disabled={isLoading}
                >
                  {isLoading ? t("common.loading") : t("auth.login")}
                </Button>
              </div>

              <div className="text-center space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("auth.noAccount")}
                  </span>{" "}
                  <Link
                    href="/auth/register"
                    className="font-medium text-tm-blue hover:text-tm-orange"
                  >
                    {t("auth.register")}
                  </Link>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/kitchen/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 dark:from-orange-600 dark:to-orange-700 dark:hover:from-orange-700 dark:hover:to-orange-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
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
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    {isRTL
                      ? "تسجيل الدخول إلى لوحة المطبخ"
                      : "Kitchen Display Login"}
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* النصف الثاني: تدرج ألوان الموقع + اللوجو — يظهر فقط من lg فما فوق */}
        <div className="hidden lg:flex flex-1 items-center justify-center min-h-0 bg-gradient-to-br from-tm-blue via-blue-100 to-tm-orange dark:from-tm-blue/90 dark:via-gray-800 dark:to-tm-orange/90 px-6 py-0">
          <div className="flex items-center justify-center w-full drop-shadow-2xl">
            <div className="scale-150 sm:scale-[1.8] md:scale-[2]">
              <Logo size="lg" className="opacity-95" />
            </div>
          </div>
        </div>
      </div>
      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        email={userEmail}
        onVerified={handleEmailVerified}
      />
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={handleForgotPasswordSuccess}
        initialEmail={userEmail}
      />
      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
        email={userEmail}
        onSuccess={handleResetPasswordSuccess}
      />
      <Footer />
    </>
  );
}
