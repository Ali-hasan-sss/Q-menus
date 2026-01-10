"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/ui/Footer";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function KitchenLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isAuthenticated } = useAuth();
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  // Redirect if already authenticated and has restaurant
  useEffect(() => {
    if (isAuthenticated && user?.restaurant) {
      router.push("/kitchen");
    }
  }, [isAuthenticated, user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

      // Login using API directly to get response
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const loggedInUser = response.data.data.user;

      if (!loggedInUser.restaurant) {
        showToast(
          isRTL
            ? "يجب أن يكون لديك حساب مطعم للوصول إلى لوحة المطبخ"
            : "You must have a restaurant account to access the kitchen display",
          "error"
        );
        setIsLoading(false);
        return;
      }

      // Update user in context
      await login(data.email, data.password);

      // Redirect to kitchen after login completes
      // The AuthContext will skip its redirect if on /kitchen/login
      setTimeout(() => {
        router.push("/kitchen");
      }, 100);
    } catch (error: any) {
      setIsLoading(false);
      console.error("Login error:", error);
      if (error.response?.data?.message) {
        showToast(error.response.data.message, "error");
      } else {
        showToast(
          isRTL
            ? "حدث خطأ أثناء تسجيل الدخول"
            : "An error occurred during login",
          "error"
        );
      }
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -mt-24 md:-mt-28 pt-24 md:pt-28 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        {/* Decorative bubbles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 rounded-full"></div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-56 h-56 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-red-500 to-orange-500 rounded-full"></div>
        </div>

        <div className="max-w-md w-full space-y-8 relative z-10">
          {/* Header with Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? "لوحة المطبخ" : "Kitchen Display"}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isRTL
                ? "سجّل الدخول لعرض وإدارة الطلبات"
                : "Sign in to view and manage orders"}
            </p>
          </div>

          {/* Login Form */}
          <Card className="p-6 w-full bg-white dark:bg-gray-800 shadow-xl">
            <div>
              <h2 className="my-4 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </h2>
              <p className="text-center text-sm text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "استخدم حساب مطعمك للوصول إلى لوحة المطبخ"
                  : "Use your restaurant account to access the kitchen display"}
              </p>
            </div>
            <form className="space-y-6 mt-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("auth.email")}
                </label>
                <div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      errors.email
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                    } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
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
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t("auth.password")}
                </label>
                <div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                      errors.password
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                    } dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500`}
                    {...register("password", { required: true })}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading
                    ? isRTL
                      ? "جاري تسجيل الدخول..."
                      : "Signing in..."
                    : isRTL
                      ? "تسجيل الدخول"
                      : "Sign In"}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <div>
                  <Link
                    href="/auth/login"
                    className="text-sm font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                  >
                    {isRTL
                      ? "العودة إلى تسجيل الدخول الرئيسي"
                      : "Back to main login"}
                  </Link>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {isRTL ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
                  </Link>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
