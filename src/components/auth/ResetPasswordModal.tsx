"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
      const errorMessage =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء إعادة تعيين كلمة المرور"
          : "Error resetting password");
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setResetCode(value);
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
          <p className="font-semibold text-primary-600">{email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "رمز إعادة التعيين" : "Reset Code"}
          </label>
          <Input
            type="text"
            value={resetCode}
            onChange={handleResetCodeChange}
            placeholder={
              isRTL ? "أدخل الرمز المكون من 6 أرقام" : "Enter 6-digit code"
            }
            className="text-center text-xl tracking-widest"
            maxLength={6}
          />
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
