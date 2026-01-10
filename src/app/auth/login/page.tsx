"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import Header from "@/components/layout/Header";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal";
import { ResetPasswordModal } from "@/components/auth/ResetPasswordModal";
import { useToast } from "@/components/ui/Toast";
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
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === "ADMIN" ? "/admin" : "/dashboard";
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

  const watchedFields = watch();

  // Debug: Log form values
  console.log("Form values:", watchedFields);
  console.log("Form errors:", errors);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      // Don't set loading to false here - let the redirect happen
    } catch (error: any) {
      setIsLoading(false);
      // Check if email verification is required
      if (error.response?.data?.requiresEmailVerification) {
        setUserEmail(data.email);
        setShowEmailVerification(true);
      } else {
        // Error is handled by the auth context
        console.error("Login error:", error);
      }
    }
  };

  const handleEmailVerified = () => {
    setShowEmailVerification(false);
    showToast(
      isRTL
        ? "تم التحقق من البريد الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول"
        : "Email verified successfully. You can now log in",
      "success"
    );
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
      {" "}
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -mt-24 md:-mt-28 pt-24 md:pt-28 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Decorative bubbles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-56 h-56 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>
        <div className="max-w-md w-full space-y-8">
          {/* Header */}

          {/* Login Form */}
          <Card className="mt-8 p-6 w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl">
            <div>
              <h2 className="my-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                {isRTL
                  ? "سجّل الدخول إلى حساب مطعمك"
                  : "Sign in to your restaurant account"}
              </h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "QMenus مخصّصة للمطاعم والكافيهات"
                  : "QMenus is built for restaurants and cafes"}
              </p>
            </div>
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
                  className="block  text-sm font-medium text-gray-700 dark:text-gray-300"
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
                    onClick={() => setShowForgotPassword(true)}
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
                  </span>
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
                    className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
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
          </Card>
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
