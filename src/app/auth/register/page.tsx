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
      <div className="min-h-screen ">
        {/* Registration Form */}
        <RegisterForm />
      </div>
      <Footer />
    </>
  );
}
