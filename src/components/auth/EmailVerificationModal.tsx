"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { useToast } from "@/store/hooks/useToast";
import { useLanguage } from "@/store/hooks/useLanguage";
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

  // Reset verification code when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setVerificationCode("");
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (!email) {
      showToast(
        isRTL ? "البريد الإلكتروني مفقود" : "Email is missing",
        "error"
      );
      return;
    }
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
        showToast(t("auth.success.emailVerified"), "success");
        onVerified();
        onClose();
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;

      // Translate error messages based on error code
      let translatedMessage = errorMessage;
      let translationKey = "";

      if (errorCode === "INVALID_VERIFICATION_CODE") {
        translationKey = "auth.error.verificationCodeInvalid";
        translatedMessage = t(translationKey);
      } else if (errorCode === "VERIFICATION_CODE_EXPIRED") {
        translationKey = "auth.error.verificationCodeExpired";
        translatedMessage = t(translationKey);
      } else if (errorCode === "SERVER_ERROR") {
        translationKey = "auth.error.serverError";
        translatedMessage = t(translationKey);
      } else {
        // Fallback to original message or default error
        translatedMessage =
          errorMessage || t("auth.error.verificationCodeInvalid");
      }

      showToast(translatedMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast(
        isRTL ? "البريد الإلكتروني مفقود" : "Email is missing",
        "error"
      );
      return;
    }
    try {
      setResending(true);
      const response = await api.post("/auth/resend-verification", {
        email,
      });

      if (response.data.success) {
        showToast(t("auth.error.resendCodeSuccess"), "success");
      }
    } catch (error: any) {
      console.error("Resend error:", error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      const remainingMinutes = error.response?.data?.remainingMinutes;

      // Translate error messages based on error code
      let translatedMessage = errorMessage;
      let translationKey = "";

      if (errorCode === "RATE_LIMIT_EXCEEDED") {
        if (remainingMinutes === 1) {
          translationKey = "auth.error.rateLimitExceededSingular";
          translatedMessage = t(translationKey);
        } else {
          translationKey = "auth.error.rateLimitExceeded";
          translatedMessage = t(translationKey).replace(
            "{minutes}",
            remainingMinutes?.toString() || "1"
          );
        }
      } else if (errorCode === "VERIFICATION_EMAIL_FAILED") {
        translationKey = "auth.error.resendCodeFailed";
        translatedMessage = t(translationKey);
      } else if (errorCode === "SERVER_ERROR") {
        translationKey = "auth.error.serverError";
        translatedMessage = t(translationKey);
      } else {
        // Fallback to original message or default error
        translatedMessage = errorMessage || t("auth.error.resendCodeFailed");
      }

      showToast(translatedMessage, "error");
    } finally {
      setResending(false);
    }
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

        <div dir="ltr">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "رمز التحقق" : "Verification Code"}
          </label>
          <CodeInput
            value={verificationCode}
            onChange={setVerificationCode}
            aria-label={isRTL ? "رمز التحقق" : "Verification code"}
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
              ? "لم تستلم الرمز؟ تحقق من مجلد الرسائل غير المرغوب بها في بريدك أو"
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
