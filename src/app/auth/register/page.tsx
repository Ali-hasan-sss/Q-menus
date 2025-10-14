"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import RegisterForm from "@/components/auth/RegisterForm";
import Header from "@/components/layout/Header";
import { Footer } from "@/components/ui/Footer";

export default function RegisterPage() {
  const { t } = useLanguage();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 -mt-24 md:-mt-28 pt-24 md:pt-28 relative overflow-hidden">
        {/* Decorative bubbles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-56 h-56 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>
        {/* Registration Form */}
        <RegisterForm />
      </div>
      <Footer />
    </>
  );
}
