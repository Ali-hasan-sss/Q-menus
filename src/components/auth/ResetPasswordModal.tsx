"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CodeInput } from "@/components/ui/CodeInput";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/store/hooks/useToast";
import { useLanguage } from "@/store/hooks/useLanguage";
import { api } from "@/lib/api";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  email,
  onSuccess,
}: ResetPasswordModalProps) {
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetCode || resetCode.length !== 6) {
      showToast(
        isRTL
          ? "يرجى إدخال رمز إعادة التعيين المكون من 6 أرقام"
          : "Please enter a 6-digit reset code",
        "error"
      );
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast(
        isRTL
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/reset-password", {
        email,
        resetCode,
        newPassword,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم إعادة تعيين كلمة المرور بنجاح"
            : "Password reset successfully",
          "success"
        );
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      // Translate error messages based on error code
      let translatedMessage = errorMessage;
      
      if (errorCode === "USER_NOT_FOUND") {
        translatedMessage = t("auth.error.userNotFound");
      } else if (errorCode === "INVALID_RESET_CODE") {
        translatedMessage = t("auth.error.invalidVerificationCode");
      } else if (errorCode === "RESET_CODE_EXPIRED") {
        translatedMessage = t("auth.error.verificationCodeExpired");
      } else if (errorCode === "PASSWORD_RESET_FAILED") {
        translatedMessage = t("auth.error.passwordResetFailed");
      } else if (errorCode === "SERVER_ERROR") {
        translatedMessage = t("auth.error.serverError");
      } else if (errorMessage && (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("المستخدم غير موجود"))) {
        // Fallback: if message contains "user not found" but no code
        translatedMessage = t("auth.error.userNotFound");
      } else {
        // Fallback to original message or default error
        translatedMessage =
          errorMessage ||
          (isRTL
            ? "حدث خطأ أثناء إعادة تعيين كلمة المرور"
            : "Error resetting password");
      }
      
      showToast(translatedMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      showToast(t("auth.error.emailMissing"), "error");
      return;
    }

    try {
      setResendingCode(true);
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      if (response.data.success) {
        showToast(t("auth.passwordReset.resendCodeSuccess"), "success");
      }
    } catch (error: any) {
      console.error("Resend reset code error:", error);
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
      } else if (errorCode === "USER_NOT_FOUND") {
        translationKey = "auth.error.userNotFound";
        translatedMessage = t(translationKey);
      } else if (errorCode === "PASSWORD_RESET_EMAIL_FAILED") {
        translationKey = "auth.error.verificationCodeFailed";
        translatedMessage = t(translationKey);
      } else if (errorCode === "SERVER_ERROR") {
        translationKey = "auth.error.serverError";
        translatedMessage = t(translationKey);
      } else if (errorMessage && (errorMessage.toLowerCase().includes("user not found") || errorMessage.toLowerCase().includes("المستخدم غير موجود"))) {
        // Fallback: if message contains "user not found" but no code
        translationKey = "auth.error.userNotFound";
        translatedMessage = t(translationKey);
      } else {
        // Fallback to original message or default error
        translatedMessage =
          errorMessage || t("auth.error.verificationCodeFailed");
      }

      showToast(translatedMessage, "error");
    } finally {
      setResendingCode(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRTL ? "إعادة تعيين كلمة المرور" : "Reset Password"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {isRTL
              ? "أدخل رمز إعادة التعيين وكلمة المرور الجديدة"
              : "Enter the reset code and new password"}
          </p>
          <p className="font-semibold text-primary-600 mb-2">{email}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
            {t("auth.passwordReset.checkSpam")}
          </p>
        </div>

        <div dir="ltr">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "رمز إعادة التعيين" : "Reset Code"}
          </label>
          <CodeInput
            value={resetCode}
            onChange={setResetCode}
            aria-label={isRTL ? "رمز إعادة التعيين" : "Reset code"}
          />
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendingCode}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendingCode ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  {t("auth.passwordReset.resendingCode")}
                </span>
              ) : (
                t("auth.passwordReset.didNotReceiveCode")
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "كلمة المرور الجديدة" : "New Password"}
          </label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={
              isRTL ? "أدخل كلمة المرور الجديدة" : "Enter new password"
            }
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
          </label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={isRTL ? "أكد كلمة المرور" : "Confirm password"}
            minLength={6}
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

          <Button
            type="submit"
            disabled={
              loading ||
              resetCode.length !== 6 ||
              newPassword.length < 6 ||
              newPassword !== confirmPassword
            }
            className="flex-1"
          >
            {loading
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "حفظ"
                : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
