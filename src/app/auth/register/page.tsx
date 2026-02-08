"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useAuth } from "@/store/hooks/useAuth";

import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/layout/Header";
import { Logo } from "@/components/ui/Logo";
import { Footer } from "@/components/ui/Footer";

export default function RegisterPage() {
  const { isRTL } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath = user.role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  return (
    <>
      <Header />
      <div
        className={`min-h-screen flex flex-col lg:flex-row -mt-24 md:-mt-28 pt-24 md:pt-28 ${isRTL ? "lg:flex-row-reverse" : ""}`}
      >
        {/* النصف الأول: الفورم بدون حواف — يسار في LTR، يمين في RTL */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-16 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-lg">
            <RegisterForm noCard />
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
      <Footer />
    </>
  );
}
