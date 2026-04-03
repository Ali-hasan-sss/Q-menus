"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { api } from "@/lib/api";
import { useToast } from "@/store/hooks/useToast";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { DEFAULT_THEME, mergeWithDefaultTheme } from "@/lib/defaultTheme";
import { hexToRgba } from "@/lib/helper";
import { RestaurantHeader } from "@/components/customer/RestaurantHeader";
import { CustomerSocialLinks } from "@/components/customer/CustomerSocialLinks";

// Range sliders: larger thumb for touch; dir=ltr on wrapper keeps min/max consistent
const sliderStyles = `
  .theme-editor-slider::-webkit-slider-thumb {
    appearance: none;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: #f6b23c;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .theme-editor-slider::-moz-range-thumb {
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: #f6b23c;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .theme-editor-slider {
    min-height: 44px;
  }
`;

function normalizeThemeHex(raw: string): string | null {
  let h = raw.trim();
  if (!h.startsWith("#")) h = `#${h.replace(/#/g, "")}`;
  const body = h.slice(1).replace(/[^0-9A-Fa-f]/g, "");
  if (body.length === 3) {
    const r = body[0]!;
    const g = body[1]!;
    const b = body[2]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  if (body.length >= 6) {
    return `#${body.slice(0, 6).toLowerCase()}`;
  }
  return null;
}

function ThemeColorField({
  label,
  value,
  onColorChange,
}: {
  label: string;
  value: string;
  onColorChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? value;

  const commitDraft = () => {
    if (draft == null) return;
    const normalized = normalizeThemeHex(draft);
    if (normalized && /^#[0-9a-f]{6}$/.test(normalized)) {
      onColorChange(normalized);
    }
    setDraft(null);
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 min-h-[52px] w-full">
      <label className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-[4.25rem] sm:w-24 leading-tight">
        {label}
      </label>
      <input
        type="color"
        value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#000000"}
        onChange={(e) => {
          setDraft(null);
          onColorChange(e.target.value.toLowerCase());
        }}
        className="h-12 w-12 min-h-[48px] min-w-[48px] sm:h-14 sm:w-14 shrink-0 cursor-pointer rounded-xl border-2 border-gray-300 p-0 shadow-sm dark:border-gray-600 overflow-hidden [color-scheme:light] dark:[color-scheme:dark]"
      />
      <input
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        spellCheck={false}
        value={display}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="#RRGGBB"
        className="flex-1 min-w-0 text-sm font-mono uppercase px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
        aria-label={label}
      />
    </div>
  );
}

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
}

/** Minimal shape for theme preview (matches GET /restaurant fields we need). */
interface ThemePreviewRestaurant {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  phone?: string | null;
  customerWhatsApp?: string | null;
  socialLinks?: Record<string, string> | null;
}

interface MenuTheme {
  id: string;
  layoutType: string;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // Color Opacity Settings
  primaryColorOpacity?: number;
  secondaryColorOpacity?: number;
  backgroundColorOpacity?: number;
  textColorOpacity?: number;
  accentColorOpacity?: number;

  fontFamily: string;
  headingSize: string;
  bodySize: string;
  priceSize: string;
  cardPadding: string;
  cardMargin: string;
  borderRadius: string;
  categoryStyle: string;
  showCategoryImages: boolean;
  itemLayout: string;
  imageAspect: string;
  backgroundImage?: string;
  backgroundOverlay?: string;
  backgroundPosition: string;
  backgroundSize: string;
  backgroundRepeat: string;
  customCSS?: string;
  customBackgroundImage?: string;
}

interface ThemeEditorProps {
  onThemeChange?: (theme: MenuTheme) => void;
}

export function ThemeEditor({ onThemeChange }: ThemeEditorProps) {
  const { isRTL } = useLanguage();
  const { showToast } = useToast();
  const [theme, setTheme] = useState<MenuTheme | null>(null);
  const [previewTheme, setPreviewTheme] = useState<MenuTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Color opacity states (load from theme or default to 1)
  const [colorOpacity, setColorOpacity] = useState({
    primary: 1,
    secondary: 1,
    background: 1,
    text: 1,
    accent: 1,
  });

  // Background overlay opacity state
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("menuBackgroundOverlayOpacity");
        if (saved) {
          try {
            return parseFloat(saved);
          } catch (e) {
            console.error("Error parsing saved background overlay opacity:", e);
          }
        }
      }
      return 0.5; // Default 50% opacity
    }
  );

  // Custom background image upload state
  const [customBackgroundImage, setCustomBackgroundImage] = useState<
    string | null
  >(null);

  const [previewRestaurant, setPreviewRestaurant] =
    useState<ThemePreviewRestaurant | null>(null);

  // Save color opacity to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log(
        "ThemeEditor: Saving color opacity to localStorage:",
        colorOpacity
      );
      localStorage.setItem("menuColorOpacity", JSON.stringify(colorOpacity));
    }
  }, [colorOpacity]);

  // Save background overlay opacity to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "menuBackgroundOverlayOpacity",
        backgroundOverlayOpacity.toString()
      );
    }
  }, [backgroundOverlayOpacity]);

  // Mock menu data for preview
  const mockMenuData = {
    categories: [
      {
        id: "1",
        name: "Appetizers",
        nameAr: "مقبلات",
        items: [
          { id: "1", name: "Bruschetta", nameAr: "بروشيتا", price: 8.99 },
          { id: "2", name: "Caesar Salad", nameAr: "سلطة سيزر", price: 12.99 },
        ],
      },
      {
        id: "2",
        name: "Main Courses",
        nameAr: "الأطباق الرئيسية",
        items: [
          {
            id: "3",
            name: "Grilled Salmon",
            nameAr: "سلمون مشوي",
            price: 24.99,
          },
          { id: "4", name: "Beef Steak", nameAr: "ستيك لحم", price: 28.99 },
        ],
      },
    ],
  };

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await api.get("/restaurant");
        if (cancelled || !response.data.success) return;
        const r = response.data.data?.restaurant;
        if (!r) return;
        setPreviewRestaurant({
          id: r.id,
          name: r.name,
          nameAr: r.nameAr,
          logo: r.logo,
          phone: r.phone,
          customerWhatsApp: r.customerWhatsApp,
          socialLinks: r.socialLinks ?? null,
        });
      } catch {
        /* keep fallback mock below */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const response = await api.get("/menu-theme");
      if (response.data.success) {
        const themeData = response.data.data.theme;

        // Merge with default theme
        const mergedTheme = mergeWithDefaultTheme(themeData);

        setTheme(mergedTheme);
        setPreviewTheme(mergedTheme);

        // Load color opacity from merged theme
        setColorOpacity({
          primary: mergedTheme.primaryColorOpacity,
          secondary: mergedTheme.secondaryColorOpacity,
          background: mergedTheme.backgroundColorOpacity,
          text: mergedTheme.textColorOpacity,
          accent: mergedTheme.accentColorOpacity,
        });

        // Load background overlay opacity from merged theme
        setBackgroundOverlayOpacity(mergedTheme.backgroundOverlayOpacity);

        // Load custom background image from merged theme
        setCustomBackgroundImage(mergedTheme.customBackgroundImage || null);

        // Update CSS custom properties with merged theme
        updateThemeVariables(mergedTheme);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
      // If error loading theme, use default theme
      const mergedTheme = mergeWithDefaultTheme(null);
      setTheme(mergedTheme);
      setPreviewTheme(mergedTheme);
      setCustomBackgroundImage(mergedTheme.customBackgroundImage || null);
    } finally {
      setLoading(false);
    }
  };

  const updatePreviewTheme = (updates: Partial<MenuTheme>) => {
    if (previewTheme) {
      const updated = { ...previewTheme, ...updates };
      setPreviewTheme(updated);
      onThemeChange?.(updated);
    }
  };

  // Use default theme if no custom theme exists
  const activePreviewTheme = previewTheme || DEFAULT_THEME;

  const fallbackPreviewRestaurant: ThemePreviewRestaurant = {
    id: "theme-preview",
    name: "Authentic Taste",
    nameAr: "مطعم الذوق الأصيل",
  };
  const previewRestaurantForHeader =
    previewRestaurant ?? fallbackPreviewRestaurant;

  // Function to update CSS custom properties with restaurant theme
  const updateThemeVariables = (theme: MenuTheme) => {
    const root = document.documentElement;

    // Update CSS custom properties
    root.style.setProperty(
      "--theme-primary",
      theme.primaryColor || DEFAULT_THEME.primaryColor
    );
    root.style.setProperty(
      "--theme-secondary",
      theme.secondaryColor || DEFAULT_THEME.secondaryColor
    );
    root.style.setProperty(
      "--theme-background",
      theme.backgroundColor || DEFAULT_THEME.backgroundColor
    );
    root.style.setProperty(
      "--theme-text",
      theme.textColor || DEFAULT_THEME.textColor
    );
    root.style.setProperty(
      "--theme-accent",
      theme.accentColor || DEFAULT_THEME.accentColor
    );
  };

  const handleUpdateTheme = async () => {
    if (!previewTheme) return;

    setSaving(true);
    try {
      const updateData = {
        primaryColor: previewTheme.primaryColor,
        secondaryColor: previewTheme.secondaryColor,
        backgroundColor: previewTheme.backgroundColor,
        textColor: previewTheme.textColor,
        accentColor: previewTheme.accentColor,
        // If backgroundImage تمت إزالتها من المعاينة نرسل null بدلاً من ترك القيمة القديمة
        backgroundImage:
          previewTheme.backgroundImage === undefined
            ? null
            : previewTheme.backgroundImage,
        backgroundOverlay: previewTheme.backgroundOverlay,
        backgroundPosition: previewTheme.backgroundPosition,
        backgroundSize: previewTheme.backgroundSize,
        backgroundRepeat: previewTheme.backgroundRepeat,

        // Color Opacity Settings
        primaryColorOpacity: colorOpacity.primary,
        secondaryColorOpacity: colorOpacity.secondary,
        backgroundColorOpacity: colorOpacity.background,
        textColorOpacity: colorOpacity.text,
        accentColorOpacity: colorOpacity.accent,

        // Background Overlay Opacity
        backgroundOverlayOpacity: backgroundOverlayOpacity,

        // Custom Background Image
        customBackgroundImage: customBackgroundImage,
      };

      const response = await api.put("/menu-theme", updateData);
      if (response.data.success) {
        setTheme(previewTheme);
        // Update CSS custom properties with new theme
        updateThemeVariables(previewTheme);
        showToast(
          isRTL ? "تم حفظ التصميم بنجاح" : "Theme saved successfully",
          "success"
        );
      }
    } catch (error: any) {
      console.error("Error updating theme:", error);
      showToast(
        error.response?.data?.message ||
          (isRTL ? "خطأ في حفظ التصميم" : "Error saving theme"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const resetPreview = () => {
    if (theme) {
      setPreviewTheme(theme);
      setCustomBackgroundImage(theme.customBackgroundImage || null);
      onThemeChange?.(theme);
    }
  };

  const handleCustomBackgroundUpload = (imageUrl: string) => {
    setCustomBackgroundImage(imageUrl);
    updatePreviewTheme({ backgroundImage: imageUrl });
  };

  const handleCustomBackgroundRemove = () => {
    setCustomBackgroundImage(null);
    // استخدم undefined في الـ preview، وسيتم تحويلها إلى null عند الإرسال للـ API
    updatePreviewTheme({ backgroundImage: undefined });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!previewTheme) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          {isRTL ? "لا يمكن تحميل بيانات التصميم" : "Unable to load theme data"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              {isRTL ? "محرر التصميم" : "Theme Editor"}
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              {isRTL
                ? "قم بتخصيص ألوان وتصميم قائمة مطعمك"
                : "Customize your menu colors and design"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={resetPreview}
              className="px-3 md:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
            >
              {isRTL ? "إعادة تعيين" : "Reset"}
            </button>
            <button
              onClick={handleUpdateTheme}
              disabled={saving}
              className="px-3 md:px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {saving
                ? isRTL
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isRTL
                  ? "حفظ التصميم"
                  : "Save Theme"}
            </button>
          </div>
        </div>
      </div>

      {/* Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Color Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {isRTL ? "ألوان التصميم" : "Theme Colors"}
            </h3>
            <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
              {/* Full-width rows on mobile: label + picker + hex (RTL-aware via dir) */}
              <div className="space-y-3">
                <ThemeColorField
                  label={isRTL ? "أساسي" : "Primary"}
                  value={previewTheme.primaryColor}
                  onColorChange={(hex) =>
                    updatePreviewTheme({ primaryColor: hex })
                  }
                />
                <ThemeColorField
                  label={isRTL ? "ثانوي" : "Secondary"}
                  value={previewTheme.secondaryColor}
                  onColorChange={(hex) =>
                    updatePreviewTheme({ secondaryColor: hex })
                  }
                />
                <ThemeColorField
                  label={isRTL ? "خلفية" : "Background"}
                  value={previewTheme.backgroundColor}
                  onColorChange={(hex) =>
                    updatePreviewTheme({ backgroundColor: hex })
                  }
                />
                <ThemeColorField
                  label={isRTL ? "نص" : "Text"}
                  value={previewTheme.textColor}
                  onColorChange={(hex) =>
                    updatePreviewTheme({ textColor: hex })
                  }
                />
                <ThemeColorField
                  label={isRTL ? "تمييز" : "Accent"}
                  value={previewTheme.accentColor}
                  onColorChange={(hex) =>
                    updatePreviewTheme({ accentColor: hex })
                  }
                />
              </div>

              {/* Opacity: gap (not space-x) for RTL; slider in ltr wrapper for predictable min/max */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {isRTL ? "شفافية الألوان" : "Color Opacity"}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16 tabular-nums">
                      {isRTL ? "أساسي" : "Primary"}
                    </span>
                    <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={colorOpacity.primary}
                        onChange={(e) =>
                          setColorOpacity((prev) => ({
                            ...prev,
                            primary: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                      {Math.round(colorOpacity.primary * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16 tabular-nums">
                      {isRTL ? "ثانوي" : "Secondary"}
                    </span>
                    <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={colorOpacity.secondary}
                        onChange={(e) =>
                          setColorOpacity((prev) => ({
                            ...prev,
                            secondary: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                      {Math.round(colorOpacity.secondary * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16 tabular-nums">
                      {isRTL ? "خلفية" : "Background"}
                    </span>
                    <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={colorOpacity.background}
                        onChange={(e) =>
                          setColorOpacity((prev) => ({
                            ...prev,
                            background: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                      {Math.round(colorOpacity.background * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16 tabular-nums">
                      {isRTL ? "نص" : "Text"}
                    </span>
                    <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={colorOpacity.text}
                        onChange={(e) =>
                          setColorOpacity((prev) => ({
                            ...prev,
                            text: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                      {Math.round(colorOpacity.text * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16 tabular-nums">
                      {isRTL ? "تمييز" : "Accent"}
                    </span>
                    <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={colorOpacity.accent}
                        onChange={(e) =>
                          setColorOpacity((prev) => ({
                            ...prev,
                            accent: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                      {Math.round(colorOpacity.accent * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Preview */}
        <div className="lg:col-span-4 flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
            <div className="w-80 h-[600px] relative">
              {/* Mobile Frame */}
              <div
                className="w-full h-full rounded-2xl overflow-hidden relative"
                style={{
                  transform: "translateZ(0)",
                  backgroundColor: hexToRgba(
                    activePreviewTheme.backgroundColor,
                    colorOpacity.background
                  ),
                  backgroundImage: activePreviewTheme.backgroundImage
                    ? `url(${activePreviewTheme.backgroundImage})`
                    : undefined,
                  backgroundPosition:
                    activePreviewTheme.backgroundPosition || "center",
                  backgroundSize: activePreviewTheme.backgroundSize || "cover",
                  backgroundRepeat:
                    activePreviewTheme.backgroundRepeat || "no-repeat",
                  color: hexToRgba(
                    activePreviewTheme.textColor,
                    colorOpacity.text
                  ),
                }}
              >
                {/* Background Overlay */}
                {activePreviewTheme.backgroundImage && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: `rgba(0, 0, 0, ${backgroundOverlayOpacity})`,
                    }}
                  />
                )}

                {/* Content — translateZ(0) on parent makes fixed header/social match customer menu */}
                <div className="relative z-10 h-full flex flex-col min-h-0">
                  <RestaurantHeader
                    restaurant={previewRestaurantForHeader}
                    menuTheme={activePreviewTheme}
                    colorOpacity={colorOpacity}
                  />
                  <CustomerSocialLinks
                    links={previewRestaurantForHeader.socialLinks}
                    phone={previewRestaurantForHeader.phone}
                    customerWhatsApp={
                      previewRestaurantForHeader.customerWhatsApp
                    }
                    isRTL={isRTL}
                  />

                  {/* Categories View (scroll like customer menu) */}
                  <div className="flex-1 overflow-y-auto min-h-0 pt-[70px] sm:pt-[100px] pb-24 px-4">
                    {/* Search Bar Preview */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={
                            isRTL
                              ? "ابحث عن وجبتك..."
                              : "Search for your meal..."
                          }
                          className="w-full px-3 py-2 text-xs ltr:pr-10 rtl:pl-10 rounded-lg border focus:outline-none focus:ring-1 transition-all"
                          style={{
                            backgroundColor: hexToRgba(
                              activePreviewTheme.backgroundColor,
                              0.9
                            ),
                            borderColor: hexToRgba(
                              activePreviewTheme.secondaryColor,
                              colorOpacity.secondary
                            ),
                            color: hexToRgba(
                              activePreviewTheme.textColor,
                              colorOpacity.text
                            ),
                          }}
                          disabled
                        />
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                              color: hexToRgba(
                                activePreviewTheme.secondaryColor,
                                colorOpacity.secondary
                              ),
                            }}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {mockMenuData.categories.map((category) => (
                        <div
                          key={category.id}
                          className={`cursor-pointer transition-shadow relative hover:shadow-xl rounded-lg p-4`}
                          style={{
                            backgroundColor: hexToRgba(
                              activePreviewTheme.primaryColor,
                              colorOpacity.primary
                            ),
                            boxShadow: `0 10px 25px -5px ${hexToRgba(
                              activePreviewTheme.secondaryColor,
                              colorOpacity.secondary
                            )}, 0 8px 10px -6px ${hexToRgba(
                              activePreviewTheme.secondaryColor,
                              colorOpacity.secondary * 0.8
                            )}`,
                          }}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>
                            <h3
                              className="text-xs font-medium"
                              style={{
                                color: hexToRgba(
                                  activePreviewTheme.textColor,
                                  colorOpacity.text
                                ),
                              }}
                            >
                              {isRTL && category.nameAr
                                ? category.nameAr
                                : category.name}
                            </h3>
                            <p
                              className="text-xs mt-1"
                              style={{
                                color: hexToRgba(
                                  activePreviewTheme.secondaryColor,
                                  colorOpacity.secondary
                                ),
                              }}
                            >
                              {category.items.length} {isRTL ? "عنصر" : "items"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Show first category items as preview */}
                    <div className="mt-6">
                      <h3
                        className="text-sm font-semibold mb-3"
                        style={{
                          color: hexToRgba(
                            activePreviewTheme.secondaryColor,
                            colorOpacity.secondary
                          ),
                        }}
                      >
                        {isRTL && mockMenuData.categories[0].nameAr
                          ? mockMenuData.categories[0].nameAr
                          : mockMenuData.categories[0].name}
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        {mockMenuData.categories[0].items.map((item) => (
                          <div
                            key={item.id}
                            className={`overflow-hidden hover:shadow-xl transition-shadow rounded-lg`}
                            style={{
                              backgroundColor: hexToRgba(
                                activePreviewTheme.primaryColor,
                                colorOpacity.primary
                              ),
                              boxShadow: `0 10px 25px -5px ${hexToRgba(
                                activePreviewTheme.secondaryColor,
                                colorOpacity.secondary
                              )}, 0 8px 10px -6px ${hexToRgba(
                                activePreviewTheme.secondaryColor,
                                colorOpacity.secondary * 0.8
                              )}`,
                            }}
                          >
                            {/* Image */}
                            <div className="w-full h-20 relative overflow-hidden">
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <svg
                                  className="w-8 h-8 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="p-3">
                              <h4
                                className="text-xs font-medium mb-1"
                                style={{
                                  color: hexToRgba(
                                    activePreviewTheme.textColor,
                                    colorOpacity.text
                                  ),
                                }}
                              >
                                {isRTL && item.nameAr ? item.nameAr : item.name}
                              </h4>
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-xs font-bold"
                                  style={{
                                    color: hexToRgba(
                                      activePreviewTheme.accentColor,
                                      colorOpacity.accent
                                    ),
                                  }}
                                >
                                  ${item.price}
                                </span>
                                <button
                                  className="w-6 h-6 text-white rounded-full flex items-center justify-center transition-colors"
                                  style={{
                                    backgroundColor: hexToRgba(
                                      activePreviewTheme.accentColor,
                                      colorOpacity.accent
                                    ),
                                  }}
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Floating Back Button Preview */}
                  <div
                    className={`absolute bottom-20 ${isRTL ? "right-4" : "left-4"} z-40`}
                  >
                    <button
                      className="shadow-lg hover:shadow-xl rounded-full w-14 h-14 flex items-center justify-center transition-all duration-200"
                      style={{
                        backgroundColor: hexToRgba(
                          activePreviewTheme.primaryColor,
                          colorOpacity.primary
                        ),
                        color: hexToRgba(
                          activePreviewTheme.textColor,
                          colorOpacity.text
                        ),
                      }}
                    >
                      {isRTL ? (
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      ) : (
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
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Floating Order Bar Preview */}
                  <div
                    className="absolute bottom-2 left-0 right-0 rounded-b-full rounded-t-[20px] mx-3 px-6 py-3 z-50 shadow-lg"
                    style={{
                      backgroundColor: hexToRgba(
                        activePreviewTheme.primaryColor,
                        colorOpacity.primary
                      ),
                      color: hexToRgba(
                        activePreviewTheme.textColor,
                        colorOpacity.text
                      ),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="text-sm font-medium"
                          style={{
                            color: hexToRgba(
                              activePreviewTheme.textColor,
                              colorOpacity.text
                            ),
                          }}
                        >
                          2 {isRTL ? "عنصر" : "items"}
                        </div>
                        <div
                          className="text-sm font-semibold"
                          style={{
                            color: hexToRgba(
                              activePreviewTheme.textColor,
                              colorOpacity.text
                            ),
                          }}
                        >
                          $25.98
                        </div>
                      </div>
                      <button
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: hexToRgba(
                            activePreviewTheme.accentColor,
                            colorOpacity.accent
                          ),
                          color: hexToRgba(
                            activePreviewTheme.textColor,
                            colorOpacity.text
                          ),
                        }}
                      >
                        {isRTL ? "ارسال الطلب" : "Place Order"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Background Image Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {isRTL ? "صورة الخلفية" : "Background Image"}
            </h3>
            <div className="space-y-4">
              {/* Custom Background Upload */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "رفع صورة مخصصة" : "Upload Custom Image"}
                </h4>
                <ImageUpload
                  value={customBackgroundImage || undefined}
                  onChange={(url) => {
                    if (url) {
                      handleCustomBackgroundUpload(url);
                    } else {
                      handleCustomBackgroundRemove();
                    }
                  }}
                  placeholder={
                    isRTL ? "اختر صورة خلفية" : "Choose background image"
                  }
                />
              </div>
              {/* Background Image Thumbnails */}
              <div>
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? "صور جاهزة" : "Pre-made Images"}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      name: isRTL ? "مطعم" : "Restaurant",
                      url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop",
                    },
                    {
                      name: isRTL ? "ديكور" : "Decor",
                      url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=200&fit=crop",
                    },
                    {
                      name: isRTL ? "مطبخ" : "Kitchen",
                      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
                    },
                    {
                      name: isRTL ? "طاولات" : "Tables",
                      url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=200&fit=crop",
                    },
                  ].map((image, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        updatePreviewTheme({ backgroundImage: image.url })
                      }
                      className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                        previewTheme.backgroundImage === image.url
                          ? "border-primary-500 ring-2 ring-primary-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-16 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all" />
                      <span className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                        {image.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Settings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "الموضع:" : "Position:"}
                  </span>
                  <select
                    value={previewTheme.backgroundPosition}
                    onChange={(e) =>
                      updatePreviewTheme({ backgroundPosition: e.target.value })
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "الحجم:" : "Size:"}
                  </span>
                  <select
                    value={previewTheme.backgroundSize}
                    onChange={(e) =>
                      updatePreviewTheme({ backgroundSize: e.target.value })
                    }
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>

                {/* Background Overlay Opacity */}
                <div
                  className="flex items-center gap-3"
                  dir={isRTL ? "rtl" : "ltr"}
                >
                  <span className="text-xs text-gray-600 dark:text-gray-400 shrink-0 w-14 sm:w-16">
                    {isRTL ? "تعتيم" : "Overlay"}
                  </span>
                  <div dir="ltr" className="flex-1 min-w-0 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={backgroundOverlayOpacity}
                      onChange={(e) =>
                        setBackgroundOverlayOpacity(parseFloat(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer theme-editor-slider"
                    />
                  </div>
                  <span className="text-xs text-gray-500 shrink-0 w-9 text-end tabular-nums">
                    {Math.round(backgroundOverlayOpacity * 100)}%
                  </span>
                </div>
              </div>

              {/* Remove Background Button */}
              {previewTheme.backgroundImage && (
                <button
                  onClick={() =>
                    updatePreviewTheme({ backgroundImage: undefined })
                  }
                  className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded-lg transition-colors"
                >
                  {isRTL ? "إزالة صورة الخلفية" : "Remove Background"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
