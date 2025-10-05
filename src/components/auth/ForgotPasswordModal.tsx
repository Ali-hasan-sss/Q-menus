"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast(
        isRTL
          ? "يرجى إدخال البريد الإلكتروني"
          : "Please enter your email address",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
            : "Password reset code has been sent to your email",
          "success"
        );
        onSuccess(email);
        onClose();
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      const errorMessage =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء إرسال رمز إعادة التعيين"
          : "Error sending reset code");
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRTL ? "نسيان كلمة المرور" : "Forgot Password"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL
              ? "أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة تعيين كلمة المرور"
              : "Enter your email address and we'll send you a password reset code"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "البريد الإلكتروني" : "Email Address"}
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
            required
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>

          <Button type="submit" disabled={loading} className="flex-1">
            {loading
              ? isRTL
                ? "جاري الإرسال..."
                : "Sending..."
              : isRTL
                ? "إرسال"
                : "Send"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
