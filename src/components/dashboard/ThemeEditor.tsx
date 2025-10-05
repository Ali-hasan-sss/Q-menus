"use client";

import { useState, useEffect } from "react";

// Add custom styles for range slider
const sliderStyles = `
  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  .slider::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = sliderStyles;
  document.head.appendChild(styleSheet);
}

import { useLanguage } from "@/contexts/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ImageUpload } from "@/components/ui/ImageUpload";

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

  // Function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return hex;
  };

  // Default theme for preview consistency
  const defaultTheme = {
    primaryColor: "#f58114",
    secondaryColor: "#2797dd",
    backgroundColor: "#ffe59e",
    textColor: "#000000",
    accentColor: "#e2ee44",
    primaryColorOpacity: 0.5,
    secondaryColorOpacity: 1,
    backgroundColorOpacity: 0.7,
    textColorOpacity: 1,
    accentColorOpacity: 1,
    backgroundOverlayOpacity: 0.1,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundImage:
      "https://res.cloudinary.com/dnojeu5cs/image/upload/v1759501200/mymenus-images/uvimvqchjpshc45ighmx.jpg",
    customBackgroundImage:
      "https://res.cloudinary.com/dnojeu5cs/image/upload/v1759501200/mymenus-images/uvimvqchjpshc45ighmx.jpg",
  };

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

  const loadTheme = async () => {
    try {
      setLoading(true);
      const response = await api.get("/menu-theme");
      if (response.data.success) {
        const themeData = response.data.data.theme;
        setTheme(themeData);
        setPreviewTheme(themeData);

        // Load color opacity from theme
        setColorOpacity({
          primary: themeData.primaryColorOpacity || 1,
          secondary: themeData.secondaryColorOpacity || 1,
          background: themeData.backgroundColorOpacity || 1,
          text: themeData.textColorOpacity || 1,
          accent: themeData.accentColorOpacity || 1,
        });

        // Load background overlay opacity from theme
        setBackgroundOverlayOpacity(themeData.backgroundOverlayOpacity || 0.5);

        // Load custom background image from theme
        setCustomBackgroundImage(themeData.customBackgroundImage || null);

        // Update CSS custom properties with loaded theme
        updateThemeVariables(themeData);
      }
    } catch (error) {
      console.error("Error loading theme:", error);
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
  const activePreviewTheme = previewTheme || defaultTheme;

  // Function to update CSS custom properties with restaurant theme
  const updateThemeVariables = (theme: MenuTheme) => {
    const root = document.documentElement;

    // Update CSS custom properties
    root.style.setProperty("--theme-primary", theme.primaryColor || "#f97316");
    root.style.setProperty(
      "--theme-secondary",
      theme.secondaryColor || "#ea580c"
    );
    root.style.setProperty(
      "--theme-background",
      theme.backgroundColor || "#ffffff"
    );
    root.style.setProperty("--theme-text", theme.textColor || "#1f2937");
    root.style.setProperty("--theme-accent", theme.accentColor || "#ef4444");
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
        backgroundImage: previewTheme.backgroundImage,
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
            <div className="space-y-4">
              {/* Color Controls Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Primary Color */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "أساسي" : "Primary"}
                  </label>
                  <input
                    type="color"
                    value={previewTheme.primaryColor}
                    onChange={(e) =>
                      updatePreviewTheme({ primaryColor: e.target.value })
                    }
                    className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-sm"
                  />
                </div>

                {/* Secondary Color */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "ثانوي" : "Secondary"}
                  </label>
                  <input
                    type="color"
                    value={previewTheme.secondaryColor}
                    onChange={(e) =>
                      updatePreviewTheme({ secondaryColor: e.target.value })
                    }
                    className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-sm"
                  />
                </div>

                {/* Background Color */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "خلفية" : "Background"}
                  </label>
                  <input
                    type="color"
                    value={previewTheme.backgroundColor}
                    onChange={(e) =>
                      updatePreviewTheme({ backgroundColor: e.target.value })
                    }
                    className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-sm"
                  />
                </div>

                {/* Text Color */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "نص" : "Text"}
                  </label>
                  <input
                    type="color"
                    value={previewTheme.textColor}
                    onChange={(e) =>
                      updatePreviewTheme({ textColor: e.target.value })
                    }
                    className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-sm"
                  />
                </div>

                {/* Accent Color */}
                <div className="flex flex-col items-center space-y-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    {isRTL ? "تمييز" : "Accent"}
                  </label>
                  <input
                    type="color"
                    value={previewTheme.accentColor}
                    onChange={(e) =>
                      updatePreviewTheme({ accentColor: e.target.value })
                    }
                    className="w-12 h-12 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer shadow-sm"
                  />
                </div>
              </div>

              {/* Opacity Controls - Single Column */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {isRTL ? "شفافية الألوان" : "Color Opacity"}
                </h4>
                <div className="space-y-3">
                  {/* Primary Opacity */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                      {isRTL ? "أساسي:" : "Primary:"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={colorOpacity.primary}
                      onChange={(e) =>
                        setColorOpacity((prev: any) => ({
                          ...prev,
                          primary: parseFloat(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(colorOpacity.primary * 100)}%
                    </span>
                  </div>

                  {/* Secondary Opacity */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                      {isRTL ? "ثانوي:" : "Secondary:"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={colorOpacity.secondary}
                      onChange={(e) =>
                        setColorOpacity((prev: any) => ({
                          ...prev,
                          secondary: parseFloat(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(colorOpacity.secondary * 100)}%
                    </span>
                  </div>

                  {/* Background Opacity */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                      {isRTL ? "خلفية:" : "Background:"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={colorOpacity.background}
                      onChange={(e) =>
                        setColorOpacity((prev: any) => ({
                          ...prev,
                          background: parseFloat(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(colorOpacity.background * 100)}%
                    </span>
                  </div>

                  {/* Text Opacity */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                      {isRTL ? "نص:" : "Text:"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={colorOpacity.text}
                      onChange={(e) =>
                        setColorOpacity((prev: any) => ({
                          ...prev,
                          text: parseFloat(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(colorOpacity.text * 100)}%
                    </span>
                  </div>

                  {/* Accent Opacity */}
                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                      {isRTL ? "تمييز:" : "Accent:"}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={colorOpacity.accent}
                      onChange={(e) =>
                        setColorOpacity((prev: any) => ({
                          ...prev,
                          accent: parseFloat(e.target.value),
                        }))
                      }
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 w-8">
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
            <div className="w-80 h-[500px] relative">
              {/* Mobile Frame */}
              <div
                className="w-full h-full rounded-2xl overflow-hidden relative"
                style={{
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

                {/* Content */}
                <div className="relative z-10 h-full">
                  {/* Mobile Header */}
                  <header
                    className="shadow-sm border-b"
                    style={{
                      backgroundColor: hexToRgba(
                        activePreviewTheme.primaryColor,
                        colorOpacity.primary
                      ),
                      borderColor: hexToRgba(
                        activePreviewTheme.secondaryColor,
                        colorOpacity.secondary
                      ),
                    }}
                  >
                    <div className="px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h1
                            className="text-lg font-semibold"
                            style={{
                              color: hexToRgba(
                                activePreviewTheme.textColor,
                                colorOpacity.text
                              ),
                            }}
                          >
                            {isRTL ? "مطعم الذوق الأصيل" : "Authentic Taste"}
                          </h1>
                          <p
                            className="text-xs opacity-75"
                            style={{
                              color: hexToRgba(
                                activePreviewTheme.secondaryColor,
                                colorOpacity.secondary
                              ),
                            }}
                          >
                            {isRTL ? "أطباق شهية" : "Delicious dishes"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* Categories View */}
                  <div className="p-4">
                    <h2
                      className="text-lg font-bold text-center mb-4"
                      style={{
                        color: hexToRgba(
                          activePreviewTheme.textColor,
                          colorOpacity.text
                        ),
                      }}
                    >
                      {isRTL ? "اختر وجبتك اللذيذة" : "Choose your Meal"}
                    </h2>

                    <div className="grid grid-cols-2 gap-3">
                      {mockMenuData.categories.map((category) => (
                        <div
                          key={category.id}
                          className={`shadow-sm border cursor-pointer hover:shadow-md transition-shadow`}
                          style={{
                            backgroundColor: hexToRgba(
                              activePreviewTheme.primaryColor,
                              colorOpacity.primary
                            ),
                            borderColor: hexToRgba(
                              activePreviewTheme.secondaryColor,
                              colorOpacity.secondary
                            ),
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
                            className={`shadow-sm border overflow-hidden hover:shadow-md transition-shadow rounded-sm `}
                            style={{
                              backgroundColor: hexToRgba(
                                activePreviewTheme.primaryColor,
                                colorOpacity.primary
                              ),
                              borderColor: hexToRgba(
                                activePreviewTheme.secondaryColor,
                                colorOpacity.secondary
                              ),
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
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-16">
                    {isRTL ? "تعتيم:" : "Overlay:"}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={backgroundOverlayOpacity}
                    onChange={(e) =>
                      setBackgroundOverlayOpacity(parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-8">
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
