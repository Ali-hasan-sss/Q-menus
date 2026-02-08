"use client";

import { useAuth } from "@/store/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/dashboard/Navbar";
import { Footer } from "@/components/ui/Footer";

export default function DashboardLayout({
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 pb-16 sm:pb-0">{children}</main>

      {/* Footer */}
      <Footer className="mt-auto mb-20 md:mb-0" />
    </div>
  );
}
