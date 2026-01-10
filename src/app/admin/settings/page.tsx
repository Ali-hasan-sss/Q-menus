"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminMobileHeader from "@/components/admin/AdminMobileHeader";
import {
  SectionFormModal,
  Section,
  SectionAttribute,
} from "@/components/dashboard/SectionFormModal";
import {
  Edit,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

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

  // Contact Section States
  const [contactSection, setContactSection] = useState<Section | null>(null);
  const [loadingContact, setLoadingContact] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Available Icons for Contact
  const availableIcons = [
    { name: "Phone", component: Phone, value: "phone" },
    { name: "Mail", component: Mail, value: "mail" },
    { name: "MapPin", component: MapPin, value: "map-pin" },
    {
      name: "MessageCircle",
      component: MessageCircle,
      value: "message-circle",
    },
    { name: "Globe", component: Globe, value: "globe" },
    { name: "Facebook", component: Facebook, value: "facebook" },
    { name: "Instagram", component: Instagram, value: "instagram" },
    { name: "Twitter", component: Twitter, value: "twitter" },
  ];

  // Fetch Contact Section
  useEffect(() => {
    fetchContactSection();
  }, []);

  const fetchContactSection = async () => {
    try {
      setLoadingContact(true);
      const response = await api.get("/section/type/CONTACT");
      if (response.data.success && response.data.data.sections.length > 0) {
        setContactSection(response.data.data.sections[0]);
      }
    } catch (error) {
      console.error("Error fetching contact section:", error);
    } finally {
      setLoadingContact(false);
    }
  };

  const handleSaveContactSection = async (data: Omit<Section, "id">) => {
    try {
      if (contactSection?.id) {
        // Update existing section
        await api.put(`/section/${contactSection.id}`, {
          ...data,
          type: "CONTACT",
        });
        showToast(
          isRTL
            ? "تم تحديث قسم الاتصال بنجاح"
            : "Contact section updated successfully",
          "success"
        );
      } else {
        // Create new section
        await api.post("/section", {
          ...data,
          type: "CONTACT",
        });
        showToast(
          isRTL
            ? "تم إنشاء قسم الاتصال بنجاح"
            : "Contact section created successfully",
          "success"
        );
      }
      await fetchContactSection();
      setShowContactModal(false);
    } catch (error: any) {
      showToast(
        error.response?.data?.message ||
          (isRTL
            ? "حدث خطأ أثناء حفظ قسم الاتصال"
            : "Error saving contact section"),
        "error"
      );
    }
  };

  const getIconComponent = (iconName: string) => {
    const icon = availableIcons.find((i) => i.value === iconName);
    return icon ? icon.component : Phone;
  };

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

        {/* Contact Section */}
        <Card className="p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "قسم اتصل بنا" : "Contact Us Section"}
            </h2>
            <Button
              onClick={() => setShowContactModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {contactSection
                ? isRTL
                  ? "تعديل"
                  : "Edit"
                : isRTL
                  ? "إنشاء"
                  : "Create"}
            </Button>
          </div>

          {loadingContact ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {isRTL ? "جاري التحميل..." : "Loading..."}
              </p>
            </div>
          ) : contactSection ? (
            <div className="space-y-4">
              {/* Section Title */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {isRTL ? contactSection.titleAr : contactSection.title}
                </h3>
                {contactSection.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {isRTL
                      ? contactSection.descriptionAr
                      : contactSection.description}
                  </p>
                )}
              </div>

              {/* Contact Attributes */}
              {contactSection.attributes &&
                contactSection.attributes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contactSection.attributes.map(
                      (attr: SectionAttribute, index: number) => {
                        const IconComponent = getIconComponent(attr.icon);
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                          >
                            <div className="flex-shrink-0 mt-1">
                              {attr.icon && attr.icon.startsWith("http") ? (
                                <img
                                  src={attr.icon}
                                  alt={isRTL ? attr.keyAr : attr.key}
                                  className="w-5 h-5"
                                />
                              ) : (
                                <IconComponent className="w-5 h-5 text-primary-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {isRTL ? attr.keyAr : attr.key}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                {isRTL ? attr.valueAr : attr.value}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

              {(!contactSection.attributes ||
                contactSection.attributes.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>
                    {isRTL ? "لا توجد معلومات اتصال" : "No contact information"}
                  </p>
                  <Button
                    onClick={() => setShowContactModal(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    {isRTL ? "إضافة معلومات اتصال" : "Add Contact Information"}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {isRTL
                  ? "لم يتم إنشاء قسم الاتصال بعد"
                  : "Contact section not created yet"}
              </p>
              <Button onClick={() => setShowContactModal(true)}>
                {isRTL ? "إنشاء قسم الاتصال" : "Create Contact Section"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Contact Section Modal */}
      <SectionFormModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSubmit={handleSaveContactSection}
        section={contactSection}
        title={isRTL ? "إدارة قسم اتصل بنا" : "Manage Contact Us Section"}
      />
    </div>
  );
}
