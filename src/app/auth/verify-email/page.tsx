"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { EmailVerificationModal } from "@/components/auth/EmailVerificationModal";
import { Card } from "@/components/ui/Card";
import Header from "@/components/layout/Header";

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.emailVerified) {
        router.push("/dashboard");
      } else {
        setShowModal(true);
      }
    }
  }, [user, loading, router]);

  const handleVerified = () => {
    setShowModal(false);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {isRTL ? "تحقق من بريدك الإلكتروني" : "Verify Your Email"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isRTL
                  ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد أو مجلد الرسائل المزعجة."
                  : "A verification code has been sent to your email. Please check your inbox or spam folder."}
              </p>
              <p className="font-semibold text-primary-600 mb-6">
                {user.email}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
              >
                {isRTL ? "أدخل رمز التحقق" : "Enter Verification Code"}
              </button>
            </div>
          </Card>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        email={user.email}
        onVerified={handleVerified}
      />
    </>
  );
}
