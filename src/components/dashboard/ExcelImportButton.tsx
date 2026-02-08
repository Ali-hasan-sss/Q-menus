"use client";

import { useState, useRef } from "react";
import {
  Download,
  Archive,
  RotateCcw,
  Upload,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useMenu } from "@/store/hooks/useMenu";
import { useToast } from "@/store/hooks/useToast";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";

interface ExcelImportButtonProps {
  onImportSuccess?: () => void;
}

export function ExcelImportButton({ onImportSuccess }: ExcelImportButtonProps) {
  const { t, isRTL } = useLanguage();
  const {
    downloadExcelTemplate,
    importExcelFile,
    downloadMenuBackup,
    restoreMenuBackup,
  } = useMenu();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDownloadBackup = async () => {
    try {
      const blob = await downloadMenuBackup();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `menu_backup_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(
        isRTL ? "تم تصدير النسخة الاحتياطية بنجاح" : "Backup exported successfully",
        "success"
      );
      setShowMenu(false);
      onImportSuccess?.();
    } catch (error: any) {
      console.error("Error downloading backup:", error);
      if (error.response?.status === 401) {
        showToast(
          isRTL ? "انتهت صلاحية الجلسة" : "Session expired",
          "error"
        );
        return;
      }
      if (error.response?.status === 404) {
        showToast(
          isRTL ? "لا توجد قائمة للنسخ الاحتياطي" : "No menu to backup",
          "error"
        );
        return;
      }
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (isRTL ? "خطأ في تصدير النسخة الاحتياطية" : "Error exporting backup"),
        "error"
      );
    }
  };

  const handleRestoreBackupSelect = () => {
    setShowMenu(false);
    showConfirm({
      title: isRTL ? "استعادة النسخة الاحتياطية" : "Restore Backup",
      message: isRTL
        ? "سيتم استبدال القائمة الحالية بالكامل بالنسخة الاحتياطية. هل أنت متأكد؟"
        : "This will replace your current menu entirely with the backup. Are you sure?",
      confirmText: isRTL ? "استعادة" : "Restore",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: () => {
        restoreFileInputRef.current?.click();
      },
    });
  };

  const handleRestoreBackupChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast(
        isRTL ? "يرجى اختيار ملف Excel" : "Please select an Excel file",
        "error"
      );
      return;
    }

    setIsUploading(true);

    try {
      const result = await restoreMenuBackup(file);

      showToast(
        isRTL
          ? `تم استعادة النسخة الاحتياطية: ${result.categoriesRestored} فئة و ${result.itemsRestored} عنصر`
          : `Backup restored: ${result.categoriesRestored} categories and ${result.itemsRestored} items`,
        "success"
      );

      if (restoreFileInputRef.current) {
        restoreFileInputRef.current.value = "";
      }

      onImportSuccess?.();
    } catch (error: any) {
      console.error("Error restoring backup:", error);

      if (error.response?.status === 401) {
        showToast(isRTL ? "انتهت صلاحية الجلسة" : "Session expired", "error");
        return;
      }

      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (isRTL ? "خطأ في استعادة النسخة الاحتياطية" : "Error restoring backup"),
        "error"
      );
    } finally {
      setIsUploading(false);
    }
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
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={restoreFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleRestoreBackupChange}
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
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{isRTL ? "جاري الاستيراد..." : "Importing..."}</span>
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            <span>{isRTL ? "استيراد Excel" : "Import Excel"}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showMenu ? "rotate-180" : ""}`}
            />
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
            className={`absolute ${isRTL ? "right-0 sm:left-0" : "left-0 sm:right-0"} mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
          >
            <div className="py-1">
              {/* حاوية: تحميل النموذج + رفع ملف Excel */}
              <div className="mx-2 p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/80">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-3 transition-colors"
                  >
                    <Download className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <span className="font-medium">
                        {isRTL ? "تحميل النموذج" : "Download Template"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {isRTL ? "ملف Excel فارغ" : "Empty Excel file"}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleFileSelect}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-3 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-green-600 shrink-0" />
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <span className="font-medium">
                        {isRTL ? "رفع ملف Excel" : "Upload Excel File"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {isRTL
                          ? "استيراد الفئات والأصناف"
                          : "Import categories & items"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* إطار النسخ الاحتياطية - أسفل الدروب داون */}
              <div className="mx-2 mt-2 mb-1 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-900/10">
                <div className="px-2 py-1 mb-1.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                  {isRTL ? "النسخ الاحتياطية" : "Backup"}
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-3 transition-colors"
                  >
                    <Archive className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <span className="font-medium">
                        {isRTL ? "تحميل نسخة احتياطية" : "Download Backup"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {isRTL
                          ? "تصدير القائمة (جميع الخصائص)"
                          : "Full menu (all properties)"}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={handleRestoreBackupSelect}
                    className="w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-3 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                      <span className="font-medium">
                        {isRTL ? "استعادة النسخة الاحتياطية" : "Restore Backup"}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block">
                        {isRTL
                          ? "استيراد نسخة احتياطية سابقة"
                          : "Import a previous backup"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
