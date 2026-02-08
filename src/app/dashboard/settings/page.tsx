"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useToast } from "@/store/hooks/useToast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Navbar from "@/components/dashboard/Navbar";
import { KitchenSectionsManager } from "@/components/dashboard/KitchenSectionsManager";
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
  currency?: string;
  kitchenWhatsApp?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial tab from URL query parameter
  const getInitialTab = (): "personal" | "restaurant" | "settings" => {
    const tab = searchParams.get("tab");
    if (tab === "personal" || tab === "restaurant" || tab === "settings") {
      return tab;
    }
    return "personal"; // Default tab
  };

  // Active tab state - initialize from URL
  const [activeTab, setActiveTab] = useState<
    "personal" | "restaurant" | "settings"
  >(() => {
    // Use function initializer to get tab from URL on first render
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "personal" || tab === "restaurant" || tab === "settings") {
        return tab;
      }
    }
    return "personal"; // Default tab
  });

  // Update URL when tab changes
  const handleTabChange = (tab: "personal" | "restaurant" | "settings") => {
    setActiveTab(tab);
    // Update URL without page reload
    const newUrl = `/dashboard/settings?tab=${tab}`;
    router.push(newUrl, { scroll: false });
    // Also update browser history without reload
    window.history.pushState({}, "", newUrl);
  };

  // Sync tab with URL on mount and when searchParams change
  useEffect(() => {
    const tab = getInitialTab();
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
    phoneCountry: "SY", // SY for Syria, LB for Lebanon
    kitchenWhatsApp: "",
    kitchenWhatsAppCountry: "SY", // SY for Syria, LB for Lebanon
    logo: "",
    currency: "USD",
  });
  
  const [formErrors, setFormErrors] = useState<{
    phone?: string;
    kitchenWhatsApp?: string;
  }>({});

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Tax settings state
  const [taxSettings, setTaxSettings] = useState<any[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Currency exchanges state
  const [currencyExchanges, setCurrencyExchanges] = useState<any[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<any>(null);
  const [currencyForm, setCurrencyForm] = useState({
    currency: "",
    exchangeRate: "",
  });
  const [bulkExchangeRates, setBulkExchangeRates] = useState<
    Record<string, string>
  >({});

  // Popular currencies list with translations
  const popularCurrencies = [
    { code: "USD", nameAr: "دولار", nameEn: "US Dollar" },
    { code: "EUR", nameAr: "يورو", nameEn: "Euro" },
    { code: "GBP", nameAr: "جنيه إسترليني", nameEn: "British Pound" },
    { code: "SYP", nameAr: "ليرة سورية", nameEn: "Syrian Pound" },
    { code: "TRY", nameAr: "ليرة تركية", nameEn: "Turkish Lira" },
    { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal" },
    { code: "AED", nameAr: "درهم إماراتي", nameEn: "UAE Dirham" },
    { code: "JOD", nameAr: "دينار أردني", nameEn: "Jordanian Dinar" },
    { code: "EGP", nameAr: "جنيه مصري", nameEn: "Egyptian Pound" },
    { code: "KWD", nameAr: "دينار كويتي", nameEn: "Kuwaiti Dinar" },
    { code: "QAR", nameAr: "ريال قطري", nameEn: "Qatari Riyal" },
    { code: "OMR", nameAr: "ريال عماني", nameEn: "Omani Rial" },
    { code: "BHD", nameAr: "دينار بحريني", nameEn: "Bahraini Dinar" },
    { code: "LBP", nameAr: "ليرة لبنانية", nameEn: "Lebanese Pound" },
    { code: "IQD", nameAr: "دينار عراقي", nameEn: "Iraqi Dinar" },
    { code: "JPY", nameAr: "ين ياباني", nameEn: "Japanese Yen" },
    { code: "CNY", nameAr: "يوان صيني", nameEn: "Chinese Yuan" },
    { code: "INR", nameAr: "روبية هندية", nameEn: "Indian Rupee" },
    { code: "CAD", nameAr: "دولار كندي", nameEn: "Canadian Dollar" },
    { code: "AUD", nameAr: "دولار أسترالي", nameEn: "Australian Dollar" },
    { code: "CHF", nameAr: "فرنك سويسري", nameEn: "Swiss Franc" },
    { code: "RUB", nameAr: "روبل روسي", nameEn: "Russian Ruble" },
    // Special Syrian Pound variants
    {
      code: "SYP_NEW",
      nameAr: "ليرة سورية جديدة",
      nameEn: "Syrian Pound (New)",
    },
    {
      code: "SYP_OLD",
      nameAr: "ليرة سورية قديمة",
      nameEn: "Syrian Pound (Old)",
    },
  ];

  useEffect(() => {
    fetchProfileData();
    fetchTaxSettings();
    fetchCurrencyExchanges();
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
      const restaurantResponse = await api.get("/restaurant");
      if (restaurantResponse.data.success) {
        const restaurantData =
          restaurantResponse.data.data.restaurant ||
          restaurantResponse.data.data;
        setRestaurant(restaurantData);
        
        // Extract country code from phone if exists
        let phoneCountry = "SY"; // Default to Syria
        let phoneNumber = restaurantData.phone || "";
        
        // Check if phone starts with country code
        if (phoneNumber.startsWith("+963")) {
          phoneCountry = "SY";
          phoneNumber = phoneNumber.replace("+963", "").trim();
        } else if (phoneNumber.startsWith("+961")) {
          phoneCountry = "LB";
          phoneNumber = phoneNumber.replace("+961", "").trim();
        } else if (phoneNumber.startsWith("963")) {
          phoneCountry = "SY";
          phoneNumber = phoneNumber.replace("963", "").trim();
        } else if (phoneNumber.startsWith("961")) {
          phoneCountry = "LB";
          phoneNumber = phoneNumber.replace("961", "").trim();
        }
        
        // Extract country code from kitchenWhatsApp if exists
        let kitchenWhatsAppCountry = "SY"; // Default to Syria
        let kitchenWhatsAppNumber = restaurantData.kitchenWhatsApp || "";
        
        // Check if kitchenWhatsApp starts with country code
        if (kitchenWhatsAppNumber.startsWith("+963")) {
          kitchenWhatsAppCountry = "SY";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("+963", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("+961")) {
          kitchenWhatsAppCountry = "LB";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("+961", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("963")) {
          kitchenWhatsAppCountry = "SY";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("963", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("961")) {
          kitchenWhatsAppCountry = "LB";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("961", "").trim();
        }
        
        setRestaurantForm({
          name: restaurantData.name || "",
          nameAr: restaurantData.nameAr || "",
          description: restaurantData.description || "",
          descriptionAr: restaurantData.descriptionAr || "",
          address: restaurantData.address || "",
          phone: phoneNumber,
          phoneCountry: phoneCountry,
          kitchenWhatsApp: kitchenWhatsAppNumber,
          kitchenWhatsAppCountry: kitchenWhatsAppCountry,
          logo: restaurantData.logo || "",
          currency: restaurantData.currency || "USD",
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

  // Validate phone number
  const validatePhone = (phone: string, country: string): string | undefined => {
    if (!phone) return undefined; // Phone is optional
    
    // Remove any non-digit characters
    const digitsOnly = phone.replace(/\D/g, "");
    
    // Check length (must be 9 digits)
    if (digitsOnly.length !== 9) {
      return isRTL
        ? "يجب أن يتكون رقم الهاتف من 9 أرقام"
        : "Phone number must be exactly 9 digits";
    }
    
    // Check first digit (must be 9)
    if (digitsOnly[0] !== "9") {
      return isRTL
        ? "يجب أن يبدأ رقم الهاتف بالرقم 9"
        : "Phone number must start with 9";
    }
    
    return undefined;
  };

  // Validate kitchen WhatsApp number (same validation as phone)
  const validateKitchenWhatsApp = (whatsapp: string, country: string): string | undefined => {
    return validatePhone(whatsapp, country);
  };

  const handleRestaurantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate form
    const errors: {
      phone?: string;
      kitchenWhatsApp?: string;
    } = {};
    
    // Validate phone if provided
    if (restaurantForm.phone) {
      const phoneError = validatePhone(restaurantForm.phone, restaurantForm.phoneCountry);
      if (phoneError) {
        errors.phone = phoneError;
      }
    }
    
    // Validate kitchenWhatsApp if provided
    if (restaurantForm.kitchenWhatsApp) {
      const whatsappError = validateKitchenWhatsApp(restaurantForm.kitchenWhatsApp, restaurantForm.kitchenWhatsAppCountry);
      if (whatsappError) {
        errors.kitchenWhatsApp = whatsappError;
      }
    }
    
    // If there are errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setSaving(true);

      // Format phone with country code
      const formData: any = {
        name: restaurantForm.name,
        nameAr: restaurantForm.nameAr,
        description: restaurantForm.description,
        descriptionAr: restaurantForm.descriptionAr,
        address: restaurantForm.address,
        logo: restaurantForm.logo || "", // Ensure logo is always a string
        currency: restaurantForm.currency || "USD",
      };
      
      // Format phone with country code if provided
      if (restaurantForm.phone) {
        const countryCode = restaurantForm.phoneCountry === "SY" ? "+963" : "+961";
        formData.phone = `${countryCode}${restaurantForm.phone.replace(/\D/g, "")}`;
      }
      
      // Format kitchenWhatsApp with country code if provided
      if (restaurantForm.kitchenWhatsApp) {
        const countryCode = restaurantForm.kitchenWhatsAppCountry === "SY" ? "+963" : "+961";
        formData.kitchenWhatsApp = `${countryCode}${restaurantForm.kitchenWhatsApp.replace(/\D/g, "")}`;
      }

      const response = await api.put("/restaurant", formData);
      if (response.data.success) {
        showToast(
          isRTL
            ? "تم تحديث بيانات المطعم بنجاح"
            : "Restaurant updated successfully",
          "success"
        );
        const updatedData = response.data.data.restaurant || response.data.data;
        setRestaurant(updatedData);
        
        // Extract country codes from updated data
        let phoneCountry = "SY";
        let phoneNumber = updatedData.phone || "";
        if (phoneNumber.startsWith("+963")) {
          phoneCountry = "SY";
          phoneNumber = phoneNumber.replace("+963", "").trim();
        } else if (phoneNumber.startsWith("+961")) {
          phoneCountry = "LB";
          phoneNumber = phoneNumber.replace("+961", "").trim();
        } else if (phoneNumber.startsWith("963")) {
          phoneCountry = "SY";
          phoneNumber = phoneNumber.replace("963", "").trim();
        } else if (phoneNumber.startsWith("961")) {
          phoneCountry = "LB";
          phoneNumber = phoneNumber.replace("961", "").trim();
        }
        
        let kitchenWhatsAppCountry = "SY";
        let kitchenWhatsAppNumber = updatedData.kitchenWhatsApp || "";
        if (kitchenWhatsAppNumber.startsWith("+963")) {
          kitchenWhatsAppCountry = "SY";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("+963", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("+961")) {
          kitchenWhatsAppCountry = "LB";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("+961", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("963")) {
          kitchenWhatsAppCountry = "SY";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("963", "").trim();
        } else if (kitchenWhatsAppNumber.startsWith("961")) {
          kitchenWhatsAppCountry = "LB";
          kitchenWhatsAppNumber = kitchenWhatsAppNumber.replace("961", "").trim();
        }
        
        // Update restaurantForm with the updated data to keep it in sync
        setRestaurantForm((prev) => ({
          ...prev,
          ...updatedData,
          phone: phoneNumber,
          phoneCountry: phoneCountry,
          kitchenWhatsApp: kitchenWhatsAppNumber,
          kitchenWhatsAppCountry: kitchenWhatsAppCountry,
        }));
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

  const fetchTaxSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await api.get("/restaurant/settings");
      if (response.data.success) {
        const taxes = response.data.data.taxes || [];
        setTaxSettings(taxes);
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleTaxSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Filter out empty taxes
      const validTaxes = taxSettings.filter(
        (tax) => tax.name && tax.percentage !== undefined && tax.percentage > 0
      );

      const response = await api.put("/restaurant/settings", {
        taxes: validTaxes,
      });

      if (response.data.success) {
        showToast(
          isRTL
            ? "تم حفظ إعدادات الضرائب بنجاح"
            : "Tax settings saved successfully",
          "success"
        );
        setTaxSettings(validTaxes);
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء حفظ إعدادات الضرائب"
          : "Error saving tax settings");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const addTax = () => {
    if (taxSettings.length >= 3) {
      showToast(
        isRTL ? "يمكن إضافة 3 ضرائب فقط" : "Maximum 3 taxes allowed",
        "error"
      );
      return;
    }
    setTaxSettings([...taxSettings, { name: "", nameAr: "", percentage: 0 }]);
  };

  const removeTax = (index: number) => {
    setTaxSettings(taxSettings.filter((_, i) => i !== index));
  };

  const updateTax = (index: number, field: string, value: any) => {
    const updated = [...taxSettings];
    updated[index] = { ...updated[index], [field]: value };
    setTaxSettings(updated);
  };

  // Currency exchanges functions
  const fetchCurrencyExchanges = async () => {
    try {
      setLoadingCurrencies(true);
      const response = await api.get("/restaurant/currency-exchanges");
      if (response.data.success) {
        setCurrencyExchanges(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching currency exchanges:", error);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const handleAddCurrency = () => {
    setEditingCurrency(null);
    setCurrencyForm({ currency: "", exchangeRate: "" });
    setShowAddCurrencyModal(true);
  };

  const handleEditCurrency = (currency: any) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      currency: currency.currency,
      exchangeRate: currency.exchangeRate.toString(),
    });
    setShowAddCurrencyModal(true);
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      if (editingCurrency) {
        // Update existing
        const response = await api.put(
          `/restaurant/currency-exchanges/${editingCurrency.id}`,
          {
            exchangeRate: parseFloat(currencyForm.exchangeRate),
          }
        );
        if (response.data.success) {
          showToast(
            isRTL ? "تم تحديث العملة بنجاح" : "Currency updated successfully",
            "success"
          );
          setShowAddCurrencyModal(false);
          fetchCurrencyExchanges();
        }
      } else {
        // Create new
        const response = await api.post("/restaurant/currency-exchanges", {
          currency: currencyForm.currency,
          exchangeRate: parseFloat(currencyForm.exchangeRate),
        });
        if (response.data.success) {
          showToast(
            isRTL ? "تم إضافة العملة بنجاح" : "Currency added successfully",
            "success"
          );
          setShowAddCurrencyModal(false);
          setCurrencyForm({ currency: "", exchangeRate: "" });
          fetchCurrencyExchanges();
        }
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء حفظ العملة" : "Error saving currency");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCurrency = async (id: string) => {
    if (
      !confirm(
        isRTL
          ? "هل أنت متأكد من حذف هذه العملة؟"
          : "Are you sure you want to delete this currency?"
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/restaurant/currency-exchanges/${id}`);
      if (response.data.success) {
        showToast(
          isRTL ? "تم حذف العملة بنجاح" : "Currency deleted successfully",
          "success"
        );
        fetchCurrencyExchanges();
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء حذف العملة" : "Error deleting currency");
      showToast(message, "error");
    }
  };

  const toggleCurrencyActive = async (currency: any) => {
    try {
      const response = await api.put(
        `/restaurant/currency-exchanges/${currency.id}`,
        {
          isActive: !currency.isActive,
        }
      );
      if (response.data.success) {
        showToast(
          isRTL ? "تم تحديث العملة بنجاح" : "Currency updated successfully",
          "success"
        );
        fetchCurrencyExchanges();
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL ? "حدث خطأ أثناء تحديث العملة" : "Error updating currency");
      showToast(message, "error");
    }
  };

  const handleBulkEditExchangeRates = () => {
    // Initialize bulkExchangeRates with current exchange rates
    const initialRates: Record<string, string> = {};
    currencyExchanges.forEach((currency) => {
      initialRates[currency.id] = currency.exchangeRate.toString();
    });
    setBulkExchangeRates(initialRates);
    setShowBulkEditModal(true);
  };

  const handleBulkSaveExchangeRates = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      // Prepare updates for all currencies
      const updates = Object.entries(bulkExchangeRates).map(([id, rate]) => ({
        id,
        exchangeRate: parseFloat(rate) || 0,
      }));

      // Update all currencies
      const updatePromises = updates.map((update) =>
        api.put(`/restaurant/currency-exchanges/${update.id}`, {
          exchangeRate: update.exchangeRate,
        })
      );

      await Promise.all(updatePromises);

      showToast(
        isRTL
          ? "تم تحديث أسعار الصرف بنجاح"
          : "Exchange rates updated successfully",
        "success"
      );
      setShowBulkEditModal(false);
      fetchCurrencyExchanges();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        (isRTL
          ? "حدث خطأ أثناء تحديث أسعار الصرف"
          : "Error updating exchange rates");
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
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

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
          <nav
            className="flex -mb-px gap-2 sm:gap-4 md:gap-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            aria-label="Tabs"
          >
            <button
              onClick={() => handleTabChange("personal")}
              className={`${
                activeTab === "personal"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0`}
            >
              {isRTL ? "البيانات الشخصية" : "Personal Information"}
            </button>
            <button
              onClick={() => handleTabChange("restaurant")}
              className={`${
                activeTab === "restaurant"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0`}
            >
              {isRTL ? "بيانات المطعم" : "Restaurant Information"}
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className={`${
                activeTab === "settings"
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              } whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors flex-shrink-0`}
            >
              {isRTL ? "إعدادات المطعم" : "Restaurant Settings"}
            </button>
          </nav>
        </div>

        <div className="space-y-8">
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <>
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
            </>
          )}

          {/* Restaurant Information Tab */}
          {activeTab === "restaurant" && (
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
                  <div className="flex flex-row">
                    {/* Phone Input - Always on the right */}
                    <div className="flex-1">
                      <Input
                        type="tel"
                        value={restaurantForm.phone}
                        onChange={(e) => {
                          // Only allow digits, max 9 digits
                          const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                          setRestaurantForm((prev) => ({
                            ...prev,
                            phone: value,
                          }));
                          // Clear error when user starts typing
                          if (formErrors.phone) {
                            setFormErrors((prev) => ({ ...prev, phone: undefined }));
                          }
                        }}
                        placeholder={isRTL ? "9XXXXXXXX" : "9XXXXXXXX"}
                        className={`rounded-r-md border-l-0 ${
                          formErrors.phone ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        maxLength={9}
                      />
                    </div>
                    {/* Country Select - Always on the left */}
                    <select
                      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none rounded-l-md border-r-0 ${
                        formErrors.phone ? "border-red-500" : ""
                      }`}
                      value={restaurantForm.phoneCountry}
                      onChange={(e) => {
                        setRestaurantForm((prev) => ({
                          ...prev,
                          phoneCountry: e.target.value,
                          phone: "", // Clear phone when country changes
                        }));
                        setFormErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                    >
                      <option value="SY">
                        {isRTL ? "🇸🇾 +963" : "🇸🇾 +963"}
                      </option>
                      <option value="LB">
                        {isRTL ? "🇱🇧 +961" : "🇱🇧 +961"}
                      </option>
                    </select>
                  </div>
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formErrors.phone}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "يجب أن يتكون من 9 أرقام ويبدأ بالرقم 9"
                      : "Must be 9 digits starting with 9"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRTL ? "العملة" : "Currency"}
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={restaurantForm.currency}
                    onChange={(e) =>
                      setRestaurantForm((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                  >
                    <option value="USD">
                      {isRTL ? "دولار أمريكي (USD)" : "US Dollar (USD)"}
                    </option>
                    <option value="SYP">
                      {isRTL ? "ليرة سورية (SYP)" : "Syrian Pound (SYP)"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      <span>
                        {isRTL ? "واتساب المطبخ (لارسال الطلبات)" : "Kitchen WhatsApp (for sending orders)"}
                      </span>
                    </div>
                  </label>
                  <div className="flex flex-row">
                    {/* Kitchen WhatsApp Input - Always on the right */}
                    <div className="flex-1">
                      <Input
                        type="tel"
                        value={restaurantForm.kitchenWhatsApp}
                        onChange={(e) => {
                          // Only allow digits, max 9 digits
                          const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                          setRestaurantForm((prev) => ({
                            ...prev,
                            kitchenWhatsApp: value,
                          }));
                          // Clear error when user starts typing
                          if (formErrors.kitchenWhatsApp) {
                            setFormErrors((prev) => ({ ...prev, kitchenWhatsApp: undefined }));
                          }
                        }}
                        placeholder={isRTL ? "9XXXXXXXX" : "9XXXXXXXX"}
                        className={`rounded-r-md border-l-0 ${
                          formErrors.kitchenWhatsApp ? "border-red-500 focus:ring-red-500" : ""
                        }`}
                        maxLength={9}
                      />
                    </div>
                    {/* Country Select - Always on the left */}
                    <select
                      className={`px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:outline-none rounded-l-md border-r-0 ${
                        formErrors.kitchenWhatsApp ? "border-red-500" : ""
                      }`}
                      value={restaurantForm.kitchenWhatsAppCountry}
                      onChange={(e) => {
                        setRestaurantForm((prev) => ({
                          ...prev,
                          kitchenWhatsAppCountry: e.target.value,
                          kitchenWhatsApp: "", // Clear phone when country changes
                        }));
                        setFormErrors((prev) => ({ ...prev, kitchenWhatsApp: undefined }));
                      }}
                    >
                      <option value="SY">
                        {isRTL ? "🇸🇾 +963" : "🇸🇾 +963"}
                      </option>
                      <option value="LB">
                        {isRTL ? "🇱🇧 +961" : "🇱🇧 +961"}
                      </option>
                    </select>
                  </div>
                  {formErrors.kitchenWhatsApp && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {formErrors.kitchenWhatsApp}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "يجب أن يتكون من 9 أرقام ويبدأ بالرقم 9"
                      : "Must be 9 digits starting with 9"}
                  </p>
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
          )}

          {/* Restaurant Settings Tab */}
          {activeTab === "settings" && (
            <>
              {/* Tax Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isRTL ? "إعدادات الضرائب" : "Tax Settings"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isRTL
                    ? "يمكنك إضافة حتى 3 ضرائب. سيتم حسابها تلقائياً وإضافتها إلى قيمة الطلبات."
                    : "You can add up to 3 taxes. They will be automatically calculated and added to order totals."}
                </p>

                <form onSubmit={handleTaxSettingsSubmit} className="space-y-4">
                  {taxSettings.map((tax, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isRTL ? `ضريبة ${index + 1}` : `Tax ${index + 1}`}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeTax(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                        >
                          {isRTL ? "حذف" : "Remove"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isRTL ? "اسم الضريبة (عربي)" : "Tax Name (Arabic)"}
                          </label>
                          <Input
                            type="text"
                            value={tax.nameAr || ""}
                            onChange={(e) =>
                              updateTax(index, "nameAr", e.target.value)
                            }
                            placeholder={
                              isRTL ? "مثال: ضريبة القيمة المضافة" : "e.g., VAT"
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isRTL
                              ? "اسم الضريبة (إنجليزي)"
                              : "Tax Name (English)"}
                          </label>
                          <Input
                            type="text"
                            value={tax.name || ""}
                            onChange={(e) =>
                              updateTax(index, "name", e.target.value)
                            }
                            placeholder={isRTL ? "مثال: VAT" : "e.g., VAT"}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "النسبة المئوية (%)" : "Percentage (%)"}
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={tax.percentage || 0}
                          onChange={(e) =>
                            updateTax(
                              index,
                              "percentage",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  ))}

                  {taxSettings.length < 3 && (
                    <button
                      type="button"
                      onClick={addTax}
                      className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                    >
                      {isRTL ? "+ إضافة ضريبة" : "+ Add Tax"}
                    </button>
                  )}

                  {taxSettings.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {isRTL
                        ? "لا توجد ضرائب مضافة. اضغط على 'إضافة ضريبة' لإضافة ضريبة جديدة."
                        : "No taxes added. Click 'Add Tax' to add a new tax."}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving || loadingSettings}>
                      {saving
                        ? isRTL
                          ? "جاري الحفظ..."
                          : "Saving..."
                        : isRTL
                          ? "حفظ إعدادات الضرائب"
                          : "Save Tax Settings"}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Currency Exchange Settings */}
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {isRTL ? "إعدادات العملات" : "Currency Exchange Settings"}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {currencyExchanges.length > 0 && (
                      <Button
                        onClick={handleBulkEditExchangeRates}
                        type="button"
                        variant="outline"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex-1 sm:flex-initial"
                      >
                        {isRTL ? "تعديل أسعار الصرف" : "Edit Exchange Rates"}
                      </Button>
                    )}
                    <Button
                      onClick={handleAddCurrency}
                      type="button"
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 flex-1 sm:flex-initial"
                    >
                      {isRTL ? "+ إضافة عملة" : "+ Add Currency"}
                    </Button>
                  </div>
                </div>

                {/* Base Currency Selector */}
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isRTL
                      ? "العملة الأساسية للمطعم"
                      : "Restaurant Base Currency"}
                  </label>
                  <select
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={restaurantForm.currency}
                    onChange={async (e) => {
                      const newCurrency = e.target.value;
                      setRestaurantForm((prev) => ({
                        ...prev,
                        currency: newCurrency,
                      }));

                      // Save immediately when currency changes
                      try {
                        // Only send the fields that the API expects
                        const updateData: any = {
                          name: restaurantForm.name,
                          nameAr: restaurantForm.nameAr,
                          description: restaurantForm.description,
                          descriptionAr: restaurantForm.descriptionAr,
                          address: restaurantForm.address,
                          logo: restaurantForm.logo || "", // Ensure logo is always a string
                          currency: newCurrency,
                        };
                        
                        // Format phone with country code if provided
                        if (restaurantForm.phone) {
                          const countryCode = restaurantForm.phoneCountry === "SY" ? "+963" : "+961";
                          updateData.phone = `${countryCode}${restaurantForm.phone.replace(/\D/g, "")}`;
                        }
                        
                        // Format kitchenWhatsApp with country code if provided
                        if (restaurantForm.kitchenWhatsApp) {
                          const countryCode = restaurantForm.kitchenWhatsAppCountry === "SY" ? "+963" : "+961";
                          updateData.kitchenWhatsApp = `${countryCode}${restaurantForm.kitchenWhatsApp.replace(/\D/g, "")}`;
                        }
                        
                        const response = await api.put("/restaurant", updateData);
                        if (response.data.success) {
                          showToast(
                            isRTL
                              ? "تم تحديث العملة الأساسية بنجاح"
                              : "Base currency updated successfully",
                            "success"
                          );
                          const updatedData =
                            response.data.data.restaurant || response.data.data;
                          setRestaurant(updatedData);
                        }
                      } catch (error: any) {
                        // Revert on error
                        setRestaurantForm((prev) => ({
                          ...prev,
                          currency: restaurantForm.currency,
                        }));
                        const message =
                          error.response?.data?.message ||
                          (isRTL
                            ? "حدث خطأ أثناء تحديث العملة الأساسية"
                            : "Error updating base currency");
                        showToast(message, "error");
                      }
                    }}
                  >
                    <option value="USD">
                      {isRTL ? "دولار أمريكي (USD)" : "US Dollar (USD)"}
                    </option>
                    <option value="SYP">
                      {isRTL ? "ليرة سورية (SYP)" : "Syrian Pound (SYP)"}
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isRTL
                      ? "العملة الأساسية التي سيتم استخدامها في جميع الأسعار والعروض"
                      : "The base currency that will be used for all prices and displays"}
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  {isRTL
                    ? "أضف عملات بديلة مع أسعار صرفها بالنسبة للعملة الأساسية. سيتمكن الزبائن من اختيار العملة التي يريدون الدفع بها."
                    : "Add alternative currencies with their exchange rates relative to the base currency. Customers will be able to choose the currency they want to pay with."}
                </p>

                {loadingCurrencies ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      {isRTL ? "جاري التحميل..." : "Loading..."}
                    </p>
                  </div>
                ) : currencyExchanges.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "لا توجد عملات مضافة. اضغط على 'إضافة عملة' لإضافة عملة جديدة."
                        : "No currencies added. Click 'Add Currency' to add a new currency."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currencyExchanges.map((currency) => (
                      <div
                        key={currency.id}
                        className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="flex-1 min-w-0 w-full sm:w-auto">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                              {currency.currency}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                currency.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {currency.isActive
                                ? isRTL
                                  ? "نشط"
                                  : "Active"
                                : isRTL
                                  ? "غير نشط"
                                  : "Inactive"}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                            {isRTL
                              ? `سعر الصرف: 1 ${currency.currency} = ${currency.exchangeRate} ${restaurantForm.currency}`
                              : `Exchange Rate: 1 ${currency.currency} = ${currency.exchangeRate} ${restaurantForm.currency}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          {/* Switch for Active/Inactive */}
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={currency.isActive}
                              onChange={() => toggleCurrencyActive(currency)}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 after:content-[''] after:absolute after:top-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600 peer-checked:after:border-white ${
                              isRTL 
                                ? "after:right-[2px] peer-checked:after:-translate-x-full" 
                                : "after:left-[2px] peer-checked:after:translate-x-full"
                            }`}></div>
                            <span className={`${isRTL ? "mr-2 sm:mr-3" : "ml-2 sm:ml-3"} text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline`}>
                              {currency.isActive
                                ? isRTL
                                  ? "نشط"
                                  : "Active"
                                : isRTL
                                  ? "غير نشط"
                                  : "Inactive"}
                            </span>
                          </label>
                          <button
                            onClick={() => handleEditCurrency(currency)}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded dark:bg-blue-900 dark:text-blue-300 flex-shrink-0"
                          >
                            {isRTL ? "تعديل" : "Edit"}
                          </button>
                          <button
                            onClick={() => handleDeleteCurrency(currency.id)}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded dark:bg-red-900 dark:text-red-300 flex-shrink-0"
                          >
                            {isRTL ? "حذف" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Kitchen Display Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  {isRTL ? "إعدادات لوحة المطبخ" : "Kitchen Display Settings"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {isRTL
                    ? "إدارة أقسام المطبخ لتوزيع الطلبات حسب نوع التحضير"
                    : "Manage kitchen sections to organize orders by preparation type"}
                </p>
                <KitchenSectionsManager />
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Currency Modal */}
      {showAddCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCurrency
                  ? isRTL
                    ? "تعديل العملة"
                    : "Edit Currency"
                  : isRTL
                    ? "إضافة عملة"
                    : "Add Currency"}
              </h3>
              <button
                onClick={() => {
                  setShowAddCurrencyModal(false);
                  setCurrencyForm({ currency: "", exchangeRate: "" });
                  setEditingCurrency(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveCurrency} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "اختر العملة" : "Select Currency"}
                </label>
                {editingCurrency ? (
                  <Input
                    type="text"
                    value={currencyForm.currency}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700"
                  />
                ) : (
                  <select
                    value={currencyForm.currency}
                    onChange={(e) =>
                      setCurrencyForm((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">
                      {isRTL ? "-- اختر العملة --" : "-- Select Currency --"}
                    </option>
                    {popularCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {isRTL
                          ? `${curr.code} - ${curr.nameAr}`
                          : `${curr.code} - ${curr.nameEn}`}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRTL
                    ? "اختر العملة من القائمة المترجمة"
                    : "Select currency from the translated list"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? "سعر الصرف" : "Exchange Rate"}
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={currencyForm.exchangeRate}
                  onChange={(e) =>
                    setCurrencyForm((prev) => ({
                      ...prev,
                      exchangeRate: e.target.value,
                    }))
                  }
                  placeholder={isRTL ? "مثال: 0.85" : "e.g., 0.85"}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRTL
                    ? `1 ${currencyForm.currency || "XXX"} = كم ${restaurantForm.currency}؟`
                    : `1 ${currencyForm.currency || "XXX"} = how many ${restaurantForm.currency}?`}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCurrencyModal(false);
                    setCurrencyForm({ currency: "", exchangeRate: "" });
                    setEditingCurrency(null);
                  }}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : editingCurrency
                      ? isRTL
                        ? "تحديث"
                        : "Update"
                      : isRTL
                        ? "إضافة"
                        : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Exchange Rates Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isRTL ? "تعديل أسعار الصرف" : "Edit Exchange Rates"}
              </h3>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkExchangeRates({});
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBulkSaveExchangeRates} className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {isRTL
                  ? "قم بتعديل أسعار الصرف لجميع العملات دفعة واحدة. سيتم حفظ جميع التعديلات عند الضغط على حفظ."
                  : "Edit exchange rates for all currencies at once. All changes will be saved when you click save."}
              </p>

              <div className="space-y-4">
                {currencyExchanges.map((currency) => {
                  const currencyInfo = popularCurrencies.find(
                    (c) => c.code === currency.currency
                  );
                  return (
                    <div
                      key={currency.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currency.currency}
                          </h4>
                          {currencyInfo && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {isRTL
                                ? currencyInfo.nameAr
                                : currencyInfo.nameEn}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            currency.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {currency.isActive
                            ? isRTL
                              ? "نشط"
                              : "Active"
                            : isRTL
                              ? "غير نشط"
                              : "Inactive"}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "سعر الصرف" : "Exchange Rate"}
                        </label>
                        <Input
                          type="number"
                          step="0.000001"
                          min="0.000001"
                          value={bulkExchangeRates[currency.id] || ""}
                          onChange={(e) =>
                            setBulkExchangeRates((prev) => ({
                              ...prev,
                              [currency.id]: e.target.value,
                            }))
                          }
                          placeholder={isRTL ? "مثال: 0.85" : "e.g., 0.85"}
                          required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {isRTL
                            ? `1 ${currency.currency} = كم ${restaurantForm.currency}؟`
                            : `1 ${currency.currency} = how many ${restaurantForm.currency}?`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkExchangeRates({});
                  }}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving
                    ? isRTL
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : isRTL
                      ? "حفظ جميع التعديلات"
                      : "Save All Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
