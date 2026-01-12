"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMenu } from "@/contexts/MenuContext";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import jsPDF from "jspdf";

function QRPageContent() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { showToast } = useToast();
  const { showConfirm } = useConfirmDialog();
  const {
    qrCodes,
    restaurantQR,
    loading,
    fetchQRCodes,
    createRestaurantQR,
    toggleQRStatus,
    toggleTableOccupied,
    deleteQRCode,
    bulkCreateSequentialQRCodes,
    bulkDeleteQRCodes,
  } = useMenu();

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [tableCount, setTableCount] = useState("");
  const [activeTab, setActiveTab] = useState<"restaurant" | "tables">(
    "restaurant"
  );
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [hasTriedAutoCreate, setHasTriedAutoCreate] = useState(false);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // Separate effect for auto-creating restaurant QR (only once)
  useEffect(() => {
    if (!restaurantQR && !loading && !hasTriedAutoCreate) {
      setHasTriedAutoCreate(true);
      createRestaurantQR().catch(console.error);
    }
  }, [restaurantQR, loading, hasTriedAutoCreate, createRestaurantQR]);

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const count = parseInt(tableCount);
    if (count <= 0 || count > 100) {
      alert(
        isRTL
          ? "يرجى إدخال عدد صحيح بين 1 و 100"
          : "Please enter a number between 1 and 100"
      );
      return;
    }

    try {
      // استخدام الروت الجديد للإنشاء المتسلسل
      const response = await bulkCreateSequentialQRCodes(count);

      setTableCount("");
      setShowBulkModal(false);

      // إظهار رسالة نجاح مع التفاصيل
      const message = isRTL
        ? `تم إنشاء ${response.length} كود جديد للطاولات من 1 إلى ${count}`
        : `Successfully created ${response.length} new QR codes for tables 1 to ${count}`;

      showToast(message, "success");
    } catch (error: any) {
      console.error("Error creating bulk QR codes:", error);

      // Handle specific error messages
      let errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes("Cannot create")) {
        const { requested, available, limit } = error.response?.data || {};
        errorMessage = t("qr.cannotCreateTables")
          .replace("{requested}", requested || count)
          .replace("{available}", available || "0")
          .replace("{limit}", limit || "N/A");
      } else if (errorMessage.includes("No active subscription")) {
        errorMessage = t("qr.noActiveSubscription");
      } else if (errorMessage.includes("Restaurant not found")) {
        errorMessage = t("qr.restaurantNotFound");
      } else {
        errorMessage = isRTL
          ? "حدث خطأ أثناء إنشاء الأكواد"
          : "Error occurred while creating QR codes";
      }

      showToast(errorMessage, "error");
    }
  };

  const handleToggleQRStatus = async (qrId: string) => {
    try {
      await toggleQRStatus(qrId);
    } catch (error) {
      console.error("Error toggling QR status:", error);
    }
  };

  const handleDeleteQR = async (qrId: string) => {
    showConfirm({
      title: isRTL ? "حذف رمز QR" : "Delete QR Code",
      message: isRTL
        ? "هل أنت متأكد من حذف رمز QR هذا؟"
        : "Are you sure you want to delete this QR code?",
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await deleteQRCode(qrId);
          showToast(
            isRTL ? "تم حذف رمز QR بنجاح" : "QR code deleted successfully",
            "success"
          );
        } catch (error: any) {
          console.error("Error deleting QR code:", error);
          showToast(
            error.response?.data?.message ||
              (isRTL ? "حدث خطأ أثناء حذف رمز QR" : "Error deleting QR code"),
            "error"
          );
        }
      },
    });
  };

  const handleSelectQR = (qrId: string) => {
    setSelectedQRCodes((prev) =>
      prev.includes(qrId) ? prev.filter((id) => id !== qrId) : [...prev, qrId]
    );
  };

  const handleSelectAll = () => {
    if (selectedQRCodes.length === qrCodes.length) {
      setSelectedQRCodes([]);
    } else {
      setSelectedQRCodes(qrCodes.map((qr) => qr.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQRCodes.length === 0) {
      showToast(
        isRTL ? "يرجى تحديد رموز QR للحذف" : "Please select QR codes to delete",
        "error"
      );
      return;
    }

    showConfirm({
      title: isRTL ? "حذف رموز QR" : "Delete QR Codes",
      message: isRTL
        ? `هل أنت متأكد من حذف ${selectedQRCodes.length} رموز QR؟`
        : `Are you sure you want to delete ${selectedQRCodes.length} QR codes?`,
      confirmText: isRTL ? "حذف" : "Delete",
      cancelText: isRTL ? "إلغاء" : "Cancel",
      confirmVariant: "danger",
      onConfirm: async () => {
        try {
          await bulkDeleteQRCodes(selectedQRCodes);
          setSelectedQRCodes([]);
          setIsSelectMode(false);
          showToast(
            isRTL
              ? `تم حذف ${selectedQRCodes.length} كود QR بنجاح`
              : `Successfully deleted ${selectedQRCodes.length} QR codes`,
            "success"
          );
        } catch (error) {
          console.error("Error deleting QR codes:", error);
          showToast(
            isRTL
              ? "حدث خطأ أثناء حذف الأكواد"
              : "Error occurred while deleting QR codes",
            "error"
          );
        }
      },
    });
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedQRCodes([]);
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
    <div className="min-h-screen pb-10 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl md:py-10 mx-auto py-2 sm:px-6 lg:px-8 pb-20 sm:pb-6">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {isRTL ? t("qr.title") : t("qr.title")}
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
                {isRTL ? t("qr.subtitle") : t("qr.subtitle")}
              </p>
            </div>
            {activeTab === "tables" && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => setShowBulkModal(true)}
                  variant="outline"
                  size="sm"
                >
                  {t("qr.bulkGenerate")}
                </Button>
                {qrCodes.length > 0 && (
                  <>
                    <Button
                      onClick={() => {
                        // Print all table QR codes
                        const printWindow = window.open("", "_blank");
                        if (printWindow) {
                          const qrCodesPerPage = 6;
                          const totalPages = Math.ceil(
                            qrCodes.length / qrCodesPerPage
                          );

                          let htmlContent = `
                            <html>
                              <head>
                                <title>${isRTL ? "أكواد QR للطاولات" : "Table QR Codes"}</title>
                                <meta charset="UTF-8">
                                <style>
                                  * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                  }
                                  @page {
                                    size: A4;
                                    margin: 15mm;
                                  }
                                  html, body { 
                                    font-family: Arial, sans-serif; 
                                    direction: ${isRTL ? "rtl" : "ltr"};
                                    margin: 0;
                                    padding: 0;
                                    width: 100%;
                                  }
                                  .page {
                                    page-break-after: always;
                                    page-break-inside: avoid;
                                    width: 180mm;
                                    height: 267mm;
                                    margin: 0 auto;
                                    display: grid;
                                    grid-template-columns: repeat(2, 1fr);
                                    grid-template-rows: repeat(3, 1fr);
                                    gap: 10mm;
                                    padding: 0;
                                  }
                                  .page:last-child {
                                    page-break-after: auto;
                                  }
                                  .qr-card {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    border: 1.5px solid #ddd;
                                    padding: 8mm;
                                    border-radius: 6px;
                                    background: white;
                                    text-align: center;
                                    break-inside: avoid;
                                  }
                                  .qr-image {
                                    width: 35mm;
                                    height: 35mm;
                                    margin: 3mm auto;
                                    display: block;
                                  }
                                  .table-number {
                                    font-weight: bold;
                                    font-size: 14pt;
                                    margin: 3mm 0;
                                    color: #333;
                                  }
                                  .instructions {
                                    font-size: 9pt;
                                    color: #666;
                                    margin-top: 2mm;
                                  }
                                  @media print {
                                    html, body {
                                      margin: 0 !important;
                                      padding: 0 !important;
                                    }
                                  }
                                </style>
                              </head>
                              <body>
                          `;

                          for (let page = 0; page < totalPages; page++) {
                            htmlContent += '<div class="page">';
                            const startIndex = page * qrCodesPerPage;
                            const endIndex = Math.min(
                              startIndex + qrCodesPerPage,
                              qrCodes.length
                            );

                            for (let i = startIndex; i < endIndex; i++) {
                              const qr = qrCodes[i];
                              htmlContent += `
                                <div class="qr-card">
                                  <div class="table-number">
                                    ${isRTL ? `طاولة ${qr.tableNumber}` : `Table ${qr.tableNumber}`}
                                  </div>
                                  <img src="${qr.qrCodeImage}" alt="QR Code" class="qr-image" />
                                  <div class="instructions">
                                    ${isRTL ? "امسح لعرض القائمة" : "Scan to view menu"}
                                  </div>
                                </div>
                              `;
                            }
                            htmlContent += "</div>";
                          }

                          htmlContent += `
                              </body>
                            </html>
                          `;

                          printWindow.document.write(htmlContent);
                          printWindow.document.close();
                          setTimeout(() => printWindow.print(), 300);
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      {isRTL ? "طباعة الكل" : "Print All"}
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          showToast(
                            isRTL
                              ? "جاري إنشاء ملف PDF..."
                              : "Generating PDF...",
                            "info"
                          );

                          const pdf = new jsPDF({
                            orientation: "portrait",
                            unit: "mm",
                            format: "a4",
                          });

                          const pageWidth = pdf.internal.pageSize.getWidth();
                          const pageHeight = pdf.internal.pageSize.getHeight();
                          const margin = 15;
                          const qrCodesPerPage = 6; // 2 columns x 3 rows
                          const qrSize = 35;
                          const cardWidth = (pageWidth - 3 * margin) / 2;
                          const cardHeight = (pageHeight - 4 * margin) / 3;

                          for (let i = 0; i < qrCodes.length; i++) {
                            const qr = qrCodes[i];

                            // Skip if no QR code image
                            if (!qr.qrCodeImage) continue;

                            const pageIndex = Math.floor(i / qrCodesPerPage);
                            const indexInPage = i % qrCodesPerPage;

                            // Add new page if needed
                            if (i > 0 && indexInPage === 0) {
                              pdf.addPage();
                            }

                            // Calculate position (2 columns x 3 rows)
                            const col = indexInPage % 2;
                            const row = Math.floor(indexInPage / 2);
                            const x = margin + col * (cardWidth + margin);
                            const y = margin + row * (cardHeight + margin);

                            // Draw card border
                            pdf.setDrawColor(200);
                            pdf.setLineWidth(0.5);
                            pdf.rect(x, y, cardWidth, cardHeight);

                            // Add table number
                            pdf.setFontSize(14);
                            pdf.setFont("helvetica", "bold");
                            pdf.text(
                              `Table ${qr.tableNumber}`,
                              x + cardWidth / 2,
                              y + 12,
                              { align: "center" }
                            );

                            // Add QR code image
                            const qrX = x + (cardWidth - qrSize) / 2;
                            const qrY = y + 18;
                            pdf.addImage(
                              qr.qrCodeImage,
                              "PNG",
                              qrX,
                              qrY,
                              qrSize,
                              qrSize
                            );

                            // Add instructions
                            pdf.setFontSize(9);
                            pdf.setFont("helvetica", "normal");
                            pdf.setTextColor(100);
                            pdf.text(
                              "Scan to view menu",
                              x + cardWidth / 2,
                              qrY + qrSize + 6,
                              { align: "center" }
                            );

                            // Reset text color
                            pdf.setTextColor(0);
                          }

                          // Save PDF
                          pdf.save(
                            isRTL
                              ? "أكواد_QR_للطاولات.pdf"
                              : "table_qr_codes.pdf"
                          );

                          showToast(
                            isRTL
                              ? "تم تحميل ملف PDF بنجاح"
                              : "PDF downloaded successfully",
                            "success"
                          );
                        } catch (error) {
                          console.error("Error generating PDF:", error);
                          showToast(
                            isRTL
                              ? "حدث خطأ أثناء إنشاء PDF"
                              : "Error generating PDF",
                            "error"
                          );
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 text-green-700 hover:bg-green-100"
                    >
                      {isRTL ? "تصدير PDF" : "Export PDF"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex gap-5">
                <button
                  onClick={() => setActiveTab("restaurant")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "restaurant"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {t("qr.restaurantCode")}
                </button>
                <button
                  onClick={() => setActiveTab("tables")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "tables"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {t("qr.tableCodes")}
                </button>
              </nav>
            </div>
          </div>

          {/* Restaurant QR Code Tab */}
          {activeTab === "restaurant" && (
            <div className="space-y-6">
              {restaurantQR ? (
                <Card className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {t("qr.restaurantCode")}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {t("qr.restaurantCodeDesc")}
                    </p>

                    {/* QR Code Image */}
                    <div className="w-64 h-64 mx-auto mb-6 bg-white p-4 rounded-lg shadow-lg">
                      <img
                        src={restaurantQR.qrCodeImage}
                        alt="Restaurant QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-center mb-4">
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          restaurantQR.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {restaurantQR.isActive
                          ? t("qr.active")
                          : t("qr.inactive")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() =>
                          window.open(restaurantQR.qrCodeUrl, "_blank")
                        }
                        className="w-full"
                      >
                        {t("qr.viewMenu")}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>${isRTL ? "رمز QR للمطعم" : "Restaurant QR Code"}</title>
                                  <style>
                                    @page {
                                      size: A4;
                                      margin: 20mm;
                                    }
                                    body { 
                                      font-family: Arial, sans-serif; 
                                      text-align: center; 
                                      padding: 40px;
                                      direction: ${isRTL ? "rtl" : "ltr"};
                                      margin: 0;
                                    }
                                    .qr-container { 
                                      margin: 30px auto;
                                      max-width: 350px;
                                    }
                                    .qr-image { 
                                      width: 300px;
                                      height: 300px;
                                      display: block;
                                      margin: 0 auto;
                                    }
                                    .restaurant-info { 
                                      margin: 30px 0; 
                                      font-size: 24px; 
                                      font-weight: bold;
                                      color: #333;
                                    }
                                    .instructions {
                                      margin: 20px 0;
                                      font-size: 16px;
                                      color: #666;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="restaurant-info">${isRTL ? "رمز QR للمطعم" : "Restaurant QR Code"}</div>
                                  <div class="qr-container">
                                    <img src="${restaurantQR.qrCodeImage}" alt="Restaurant QR Code" class="qr-image" />
                                  </div>
                                  <div class="instructions">
                                    <p>${isRTL ? "امسح هذا الرمز لعرض قائمة المطعم" : "Scan this QR code to view the restaurant menu"}</p>
                                  </div>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            setTimeout(() => printWindow.print(), 300);
                          }
                        }}
                        className="w-full"
                      >
                        {isRTL ? "طباعة" : "Print"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          try {
                            const pdf = new jsPDF({
                              orientation: "portrait",
                              unit: "mm",
                              format: "a4",
                            });

                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight =
                              pdf.internal.pageSize.getHeight();
                            const qrSize = 80;

                            // Add title
                            pdf.setFontSize(20);
                            pdf.setFont("helvetica", "bold");
                            pdf.text(
                              isRTL ? "رمز QR للمطعم" : "Restaurant QR Code",
                              pageWidth / 2,
                              30,
                              { align: "center" }
                            );

                            // Add QR code image
                            const qrX = (pageWidth - qrSize) / 2;
                            const qrY = 50;
                            pdf.addImage(
                              restaurantQR.qrCodeImage,
                              "PNG",
                              qrX,
                              qrY,
                              qrSize,
                              qrSize
                            );

                            // Add instructions
                            pdf.setFontSize(12);
                            pdf.setFont("helvetica", "normal");
                            pdf.setTextColor(100);
                            pdf.text(
                              isRTL
                                ? "امسح هذا الرمز لعرض قائمة المطعم"
                                : "Scan this QR code to view the restaurant menu",
                              pageWidth / 2,
                              qrY + qrSize + 15,
                              { align: "center" }
                            );

                            // Save PDF
                            pdf.save(
                              isRTL
                                ? "رمز_QR_للمطعم.pdf"
                                : "restaurant_qr_code.pdf"
                            );

                            showToast(
                              isRTL
                                ? "تم تحميل ملف PDF بنجاح"
                                : "PDF downloaded successfully",
                              "success"
                            );
                          } catch (error) {
                            console.error("Error generating PDF:", error);
                            showToast(
                              isRTL
                                ? "حدث خطأ أثناء إنشاء PDF"
                                : "Error generating PDF",
                              "error"
                            );
                          }
                        }}
                        className="w-full"
                      >
                        {isRTL ? "تصدير PDF" : "Export PDF"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {t("qr.noRestaurantCode")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t("qr.createRestaurantCodeDesc")}
                  </p>
                  <Button onClick={createRestaurantQR}>
                    {t("qr.createRestaurantCode")}
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* Table QR Codes Tab */}
          {activeTab === "tables" && (
            <div className="space-y-6">
              {/* Create Single QR Form */}

              {/* Selection Controls */}
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Button
                      onClick={toggleSelectMode}
                      variant={isSelectMode ? "primary" : "outline"}
                      size="sm"
                    >
                      {isSelectMode
                        ? t("qr.cancelSelection")
                        : t("qr.selectMultiple")}
                    </Button>

                    {isSelectMode && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            selectedQRCodes.length === qrCodes.length &&
                            qrCodes.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t("qr.selectAll")} ({qrCodes.length})
                        </span>
                      </div>
                    )}
                  </div>

                  {isSelectMode && selectedQRCodes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedQRCodes.length} {t("qr.selected")}
                      </span>
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {t("qr.deleteSelected")} ({selectedQRCodes.length})
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* QR Codes Container */}
              <div className="space-y-4">
                {/* QR Codes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {qrCodes.map((qr) => (
                    <Card
                      key={qr.id}
                      className={`p-6 ${isSelectMode ? "relative" : ""}`}
                    >
                      {isSelectMode && (
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedQRCodes.includes(qr.id)}
                            onChange={() => handleSelectQR(qr.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </div>
                      )}
                      <div className="text-center">
                        {/* QR Code Image */}
                        <div className="w-32 h-32 mx-auto mb-4 bg-white p-2 rounded-lg shadow-sm">
                          {qr.qrCodeImage ? (
                            <img
                              src={qr.qrCodeImage}
                              alt={`Table ${qr.tableNumber} QR Code`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
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
                                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          {isRTL
                            ? `طاولة ${qr.tableNumber}`
                            : `Table ${qr.tableNumber}`}
                        </h3>

                        <div className="flex items-center justify-center mb-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              qr.isActive
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {qr.isActive ? t("qr.active") : t("qr.inactive")}
                          </span>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <p>
                            {t("qr.orders")}: {qr._count?.orders || 0}
                          </p>
                          <p>
                            {t("qr.created")}:{" "}
                            {new Date(qr.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="space-y-2">
                          {/* Toggle Status Switch */}
                          <div
                            className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isRTL ? "الحالة" : "Status"}
                            </span>
                            <button
                              onClick={() => handleToggleQRStatus(qr.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                                qr.isActive
                                  ? "bg-primary-600"
                                  : "bg-gray-200 dark:bg-gray-700"
                              }`}
                              dir="ltr"
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  qr.isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Toggle Occupied Switch */}
                          <div
                            className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {isRTL ? "جلسة نشطة" : "Active Session"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTableOccupied(qr.id);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                (qr as any).isOccupied
                                  ? "bg-green-600"
                                  : "bg-gray-200 dark:bg-gray-600"
                              }`}
                              dir="ltr"
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                                  (qr as any).isOccupied
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Print Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const printWindow = window.open("", "_blank");
                              if (printWindow) {
                                printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${isRTL ? `كود QR - طاولة ${qr.tableNumber}` : `QR Code - Table ${qr.tableNumber}`}</title>
                                    <style>
                                      @page {
                                        size: A4;
                                        margin: 20mm;
                                      }
                                      body { 
                                        font-family: Arial, sans-serif; 
                                        text-align: center; 
                                        padding: 40px;
                                        direction: ${isRTL ? "rtl" : "ltr"};
                                        margin: 0;
                                      }
                                      .qr-container { 
                                        margin: 30px auto;
                                        max-width: 350px;
                                      }
                                      .qr-image { 
                                        width: 300px;
                                        height: 300px;
                                        display: block;
                                        margin: 0 auto;
                                      }
                                      .table-info { 
                                        margin: 30px 0; 
                                        font-size: 24px; 
                                        font-weight: bold;
                                        color: #333;
                                      }
                                      .instructions {
                                        margin: 20px 0;
                                        font-size: 16px;
                                        color: #666;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="table-info">${isRTL ? `طاولة ${qr.tableNumber}` : `Table ${qr.tableNumber}`}</div>
                                    <div class="qr-container">
                                      <img src="${qr.qrCodeImage}" alt="QR Code" class="qr-image" />
                                    </div>
                                    <div class="instructions">
                                      <p>${isRTL ? "امسح لعرض القائمة" : "Scan to view menu"}</p>
                                    </div>
                                  </body>
                                </html>
                              `);
                                printWindow.document.close();
                                setTimeout(() => printWindow.print(), 300);
                              }
                            }}
                            className="w-full"
                          >
                            {isRTL ? "طباعة" : "Print"}
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteQR(qr.id)}
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            {isRTL ? "حذف" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {qrCodes.length === 0 && (
                <Card className="p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t("qr.noQRCodes")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("qr.noQRCodesDesc")}
                  </p>
                </Card>
              )}
            </div>
          )}

          {/* Bulk Generate Modal */}
          {showBulkModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t("qr.bulkCreate")}
                    </h3>
                    <button
                      onClick={() => {
                        setShowBulkModal(false);
                        setTableCount("");
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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

                  <form onSubmit={handleBulkCreate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t("qr.tableCount")}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={tableCount}
                        onChange={(e) => setTableCount(e.target.value)}
                        placeholder={
                          isRTL
                            ? "أدخل عدد الطاولات (مثل 30)"
                            : "Enter number of tables (e.g., 30)"
                        }
                        required
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL
                          ? "سيتم إنشاء أكواد للطاولات من 1 إلى العدد المدخل"
                          : "QR codes will be created for tables 1 to the entered number"}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1">
                        {t("qr.generateAll")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowBulkModal(false);
                          setTableCount("");
                        }}
                        className="flex-1"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QRPage() {
  return <QRPageContent />;
}
