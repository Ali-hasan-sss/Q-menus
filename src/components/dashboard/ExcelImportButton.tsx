"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMenu } from "@/contexts/MenuContext";
import { useToast } from "@/components/ui/Toast";

interface ExcelImportButtonProps {
  onImportSuccess?: () => void;
}

export function ExcelImportButton({ onImportSuccess }: ExcelImportButtonProps) {
  const { t, isRTL } = useLanguage();
  const { downloadExcelTemplate, importExcelFile } = useMenu();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const lang = isRTL ? "ar" : "en";
      const blob = await downloadExcelTemplate(lang);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "menu_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        isRTL ? "تم تحميل النموذج بنجاح" : "Template downloaded successfully",
        "success"
      );
      setShowMenu(false);
    } catch (error: any) {
      console.error("Error downloading template:", error);

      // Check for authentication errors
      if (error.response?.status === 401) {
        showToast(
          isRTL
            ? "انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى"
            : "Session expired, please login again",
          "error"
        );
        return;
      }

      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (isRTL ? "خطأ في تحميل النموذج" : "Error downloading template"),
        "error"
      );
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast(
        isRTL
          ? "يرجى اختيار ملف Excel (.xlsx أو .xls)"
          : "Please select an Excel file (.xlsx or .xls)",
        "error"
      );
      return;
    }

    setIsUploading(true);

    try {
      const result = await importExcelFile(file);

      showToast(
        isRTL
          ? `تم استيراد ${result.categoriesCreated} فئة و ${result.itemsCreated} عنصر بنجاح`
          : `Successfully imported ${result.categoriesCreated} categories and ${result.itemsCreated} items`,
        "success"
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Notify parent component
      onImportSuccess?.();
    } catch (error: any) {
      console.error("Error importing file:", error);

      // Check for authentication errors
      if (error.response?.status === 401) {
        showToast(
          isRTL
            ? "انتهت صلاحية الجلسة، الرجاء تسجيل الدخول مرة أخرى"
            : "Session expired, please login again",
          "error"
        );
        return;
      }

      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (isRTL ? "خطأ في استيراد الملف" : "Error importing file"),
        "error"
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isUploading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{isRTL ? "جاري الاستيراد..." : "Importing..."}</span>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span>{isRTL ? "استيراد Excel" : "Import Excel"}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${showMenu ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {showMenu && !isUploading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div
            className={`absolute ${isRTL ? "right-0 sm:left-0" : "left-0 sm:right-0"} mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
          >
            <div className="py-1">
              <button
                onClick={handleDownloadTemplate}
                className="w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                  <div className="font-medium">
                    {isRTL ? "تحميل النموذج" : "Download Template"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL ? "احصل على ملف Excel فارغ" : "Get empty Excel file"}
                  </div>
                </div>
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700" />

              <button
                onClick={handleFileSelect}
                className="w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                  <div className="font-medium">
                    {isRTL ? "رفع ملف Excel" : "Upload Excel File"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL
                      ? "استيراد الفئات والأصناف"
                      : "Import categories & items"}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
