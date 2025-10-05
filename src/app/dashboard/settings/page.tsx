"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Navbar from "@/components/dashboard/Navbar";
import { api } from "@/lib/api";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RestaurantProfile {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  address?: string;
  phone?: string;
  logo?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();

  // Profile states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    address: "",
    phone: "",
    logo: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const profileResponse = await api.get("/auth/profile");
      if (profileResponse.data.success) {
        const profileData = profileResponse.data.data;
        setProfile(profileData);
        setProfileForm({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
        });
      }

      // Fetch restaurant profile
      const restaurantResponse = await api.get("/restaurant/profile");
      if (restaurantResponse.data.success) {
        const restaurantData = restaurantResponse.data.data;
        setRestaurant(restaurantData);
        setRestaurantForm({
          name: restaurantData.name || "",
          nameAr: restaurantData.nameAr || "",
          description: restaurantData.description || "",
          descriptionAr: restaurantData.descriptionAr || "",
          address: restaurantData.address || "",
          phone: restaurantData.phone || "",
          logo: restaurantData.logo || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      showToast(
        isRTL ? "حدث خطأ أثناء جلب البيانات" : "Error fetching profile data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const response = await api.put("/auth/profile", profileForm);
      if (response.data.success) {
        showToast(
          isRTL
            ? "تم تحديث البيانات الشخصية بنجاح"
            : "Profile updated successfully",
          "success"
        );
        setProfile(response.data.data);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء تحديث البيانات" : "Error updating profile");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const response = await api.put("/restaurant/profile", restaurantForm);
      if (response.data.success) {
        showToast(
          isRTL
            ? "تم تحديث بيانات المطعم بنجاح"
            : "Restaurant updated successfully",
          "success"
        );
        setRestaurant(response.data.data);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء تحديث بيانات المطعم"
          : "Error updating restaurant");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast(
        isRTL
          ? "كلمة المرور الجديدة غير متطابقة"
          : "New passwords do not match",
        "error"
      );
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showToast(
        isRTL
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters",
        "error"
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم تغيير كلمة المرور بنجاح"
            : "Password changed successfully",
          "success"
        );
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء تغيير كلمة المرور" : "Error changing password");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (url: string | null) => {
    setRestaurantForm((prev) => ({ ...prev, logo: url || "" }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-5">
      <div className="max-w-4xl mx-auto py-4 md:py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "الإعدادات" : "Settings"}
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
            {isRTL
              ? "إدارة بياناتك الشخصية وبيانات المطعم"
              : "Manage your personal and restaurant information"}
          </p>
        </div>

        <div className="space-y-8">
          {/* Personal Profile */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {isRTL ? "البيانات الشخصية" : "Personal Information"}
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الاسم الأول" : "First Name"}
                  </label>
                  <Input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "الاسم الأخير" : "Last Name"}
                  </label>
                  <Input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "البريد الإلكتروني" : "Email"}
                </label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? "حفظ البيانات الشخصية"
                      : "Save Personal Info"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Restaurant Profile */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {isRTL ? "بيانات المطعم" : "Restaurant Information"}
            </h2>

            <form onSubmit={handleRestaurantSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "شعار المطعم" : "Restaurant Logo"}
                </label>
                <ImageUpload
                  value={restaurantForm.logo}
                  onChange={handleLogoUpload}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "اسم المطعم (عربي)" : "Restaurant Name (Arabic)"}
                  </label>
                  <Input
                    type="text"
                    value={restaurantForm.nameAr}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        nameAr: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL
                      ? "اسم المطعم (إنجليزي)"
                      : "Restaurant Name (English)"}
                  </label>
                  <Input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "وصف المطعم (عربي)" : "Description (Arabic)"}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    value={restaurantForm.descriptionAr}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        descriptionAr: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "وصف المطعم (إنجليزي)" : "Description (English)"}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                    value={restaurantForm.description}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "العنوان" : "Address"}
                </label>
                <Input
                  type="text"
                  value={restaurantForm.address}
                  onChange={(e) =>
                    setRestaurantForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "رقم الهاتف" : "Phone Number"}
                </label>
                <Input
                  type="tel"
                  value={restaurantForm.phone}
                  onChange={(e) =>
                    setRestaurantForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? "حفظ بيانات المطعم"
                      : "Save Restaurant Info"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {isRTL ? "تغيير كلمة المرور" : "Change Password"}
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "كلمة المرور الحالية" : "Current Password"}
                </label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? isRTL
                      ? "جاري التغيير..."
                      : "Changing..."
                    : isRTL
                      ? "تغيير كلمة المرور"
                      : "Change Password"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
