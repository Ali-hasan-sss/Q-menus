"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerified: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerified,
}: EmailVerificationModalProps) {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showToast(
        isRTL
          ? "يرجى إدخال رمز التحقق المكون من 6 أرقام"
          : "Please enter a 6-digit verification code",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/verify-email", {
        email,
        verificationCode,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم التحقق من البريد الإلكتروني بنجاح"
            : "Email verified successfully",
          "success"
        );
        onVerified();
        onClose();
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      const errorMessage =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء التحقق من البريد الإلكتروني"
          : "Error verifying email");
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setResending(true);
      const response = await api.post("/auth/resend-verification", {
        email,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم إرسال رمز التحقق بنجاح"
            : "Verification code sent successfully",
          "success"
        );
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      const errorMessage =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء إرسال رمز التحقق"
          : "Error sending verification code");
      showToast(errorMessage, "error");
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRTL ? "تحقق من البريد الإلكتروني" : "Verify Email"}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isRTL
              ? "تم إرسال رمز التحقق إلى بريدك الإلكتروني:"
              : "Verification code has been sent to your email:"}
          </p>
          <p className="font-semibold text-primary-600">{email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "رمز التحقق" : "Verification Code"}
          </label>
          <Input
            type="text"
            value={verificationCode}
            onChange={handleCodeChange}
            placeholder={
              isRTL ? "أدخل الرمز المكون من 6 أرقام" : "Enter 6-digit code"
            }
            className="text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleVerify}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1"
          >
            {loading
              ? isRTL
                ? "جاري التحقق..."
                : "Verifying..."
              : isRTL
                ? "تحقق"
                : "Verify"}
          </Button>

          <Button
            onClick={handleResendCode}
            disabled={resending}
            variant="outline"
            className="flex-1"
          >
            {resending
              ? isRTL
                ? "جاري الإرسال..."
                : "Sending..."
              : isRTL
                ? "إعادة إرسال"
                : "Resend"}
          </Button>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            {isRTL
              ? "لم تستلم الرمز؟ تحقق من مجلد الرسائل المزعجة أو"
              : "Didn't receive the code? Check your spam folder or"}
          </p>
          <button
            onClick={handleResendCode}
            disabled={resending}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {isRTL ? "أعد الإرسال" : "resend"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
