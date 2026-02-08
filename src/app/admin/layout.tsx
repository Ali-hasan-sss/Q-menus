"use client";

import { useAuth } from "@/store/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import { AdminNotificationProvider } from "@/contexts/AdminNotificationContext";
import { Footer } from "@/components/ui/Footer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AdminNotificationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Desktop Navigation */}
        <AdminNavbar />

        {/* Mobile Navigation */}
        <AdminMobileHeader />

        {/* Main Content */}
        <main className="flex-1 pb-16 sm:pb-0">{children}</main>

        {/* Footer */}
        <Footer className="mt-auto" />
    </div>
    </AdminNotificationProvider>
  );
}
