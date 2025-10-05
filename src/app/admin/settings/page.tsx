"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);
      const response = await api.put("/admin/profile", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });

      if (response.data.success) {
        // Update local state
        setFormData({
          ...formData,
          firstName: response.data.data.user.firstName,
          lastName: response.data.data.user.lastName,
          email: response.data.data.user.email,
        });

        showToast(
          isRTL
            ? "تم تحديث الملف الشخصي بنجاح"
            : "Profile updated successfully",
          "success"
        );
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء تحديث الملف الشخصي"
            : "Error updating profile"),
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      showToast(
        isRTL ? "كلمات المرور غير متطابقة" : "Passwords do not match",
        "error"
      );
      return;
    }

    if (formData.newPassword.length < 6) {
      showToast(
        isRTL
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    try {
      setUpdating(true);
      await api.put("/admin/password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      showToast(
        isRTL ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully",
        "success"
      );

      // Reset password fields
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء تغيير كلمة المرور"
            : "Error changing password"),
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <div className="px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "الإعدادات" : "Settings"}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {isRTL
              ? "إدارة الملف الشخصي والإعدادات"
              : "Manage your profile and settings"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? "الملف الشخصي" : "Profile"}
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label={isRTL ? "الاسم الأول" : "First Name"}
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />

              <Input
                label={isRTL ? "الاسم الأخير" : "Last Name"}
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />

              <Input
                type="email"
                label={isRTL ? "البريد الإلكتروني" : "Email"}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />

              <Button type="submit" disabled={updating} className="w-full">
                {updating
                  ? isRTL
                    ? "جاري التحديث..."
                    : "Updating..."
                  : isRTL
                    ? "تحديث الملف الشخصي"
                    : "Update Profile"}
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL ? "تغيير كلمة المرور" : "Change Password"}
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                label={isRTL ? "كلمة المرور الحالية" : "Current Password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
              />

              <Input
                type="password"
                label={isRTL ? "كلمة المرور الجديدة" : "New Password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
              />

              <Input
                type="password"
                label={isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />

              <Button type="submit" disabled={updating} className="w-full">
                {updating
                  ? isRTL
                    ? "جاري التغيير..."
                    : "Changing..."
                  : isRTL
                    ? "تغيير كلمة المرور"
                    : "Change Password"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {isRTL ? "معلومات الحساب" : "Account Information"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {isRTL ? "الدور:" : "Role:"}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {user?.role}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">
                {isRTL ? "معرف المستخدم:" : "User ID:"}
              </p>
              <p className="font-medium text-gray-900 dark:text-white text-xs">
                {user?.id || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {isRTL
                ? "⚠️ لا يمكنك حذف حسابك الخاص كأدمن. اتصل بمسؤول النظام إذا كنت بحاجة للمساعدة."
                : "⚠️ You cannot delete your own admin account. Contact system administrator if you need assistance."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
