"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/store/hooks/useAuth";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useMenu } from "@/store/hooks/useMenu";
import { useConfirmDialog } from "@/store/hooks/useConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/store/hooks/useToast";
import jsPDF from "jspdf";
import { getImageUrl } from "@/lib/api";

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
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showSinglePrintOptions, setShowSinglePrintOptions] = useState(false);
  const [selectedQRForPrint, setSelectedQRForPrint] = useState<any>(null);
  const [printType, setPrintType] = useState<"standard" | "label">("standard");

  // Custom design for table QR codes
  const [showCustomDesign, setShowCustomDesign] = useState(false);
  const [designBackground, setDesignBackground] = useState<string | null>(null);
  const [designWidth, setDesignWidth] = useState(80); // mm
  const [designHeight, setDesignHeight] = useState(40); // mm
  const [qrPosX, setQrPosX] = useState(5); // mm from left
  const [qrPosY, setQrPosY] = useState(5); // mm from top
  const [qrSize, setQrSize] = useState(30); // mm
  const [tableNumPosX, setTableNumPosX] = useState(40); // mm - center X (default middle)
  const [tableNumPosY, setTableNumPosY] = useState(8); // mm - center Y (default near top)
  const [tableNumSize, setTableNumSize] = useState(12); // mm diameter
  const [tableNumBgColor, setTableNumBgColor] = useState("#ffffff");
  const [tableNumBgTransparent, setTableNumBgTransparent] = useState(false);
  const [tableNumTextColor, setTableNumTextColor] = useState("#000000");
  const [tableNumFontScale, setTableNumFontScale] = useState(0.75); // 0.5-1.0, font size relative to circle
  const [paperSize, setPaperSize] = useState<"a4" | "a3" | "letter" | "a5">("a4");
  const [paperMargin, setPaperMargin] = useState(5); // mm

  // Drag/resize refs for interactive preview
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    type:
      | "design"
      | "qrMove"
      | "qrResize"
      | "tableNumMove"
      | "tableNumResize"
      | "tableNumFontResize";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX: number;
    startPosY: number;
    startQrSize: number;
    startTableNumPosX: number;
    startTableNumPosY: number;
    startTableNumSize: number;
    startTableNumFontScale: number;
  } | null>(null);

  const PX_PER_MM = 4;
  const MIN_DESIGN_MM = 20;
  const MAX_DESIGN_MM = 200;

  const [previewScale, setPreviewScale] = useState(1);
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 2;
  const ZOOM_STEP = 0.25;

  const getMaxFitScale = useCallback(() => {
    const designW = designWidth * PX_PER_MM;
    const designH = designHeight * PX_PER_MM;
    const maxW = typeof window !== "undefined" ? window.innerWidth * 0.5 : 400;
    const maxH = typeof window !== "undefined" ? window.innerHeight * 0.5 : 400;
    return Math.min(
      1,
      maxW / Math.max(designW, 1),
      maxH / Math.max(designH, 1)
    );
  }, [designWidth, designHeight]);

  const handleZoomIn = useCallback(() => {
    setPreviewScale((s) => Math.min(MAX_ZOOM, s + ZOOM_STEP));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPreviewScale((s) => Math.max(MIN_ZOOM, s - ZOOM_STEP));
  }, []);

  const handleZoomFit = useCallback(() => {
    setPreviewScale(getMaxFitScale());
  }, [getMaxFitScale]);

  useEffect(() => {
    setPreviewScale((s) => Math.min(s, getMaxFitScale()));
  }, [designWidth, designHeight, getMaxFitScale]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // Clamp QR and table number position/size when design is resized
  useEffect(() => {
    const maxSize = Math.min(designWidth, designHeight) - 2;
    const maxX = Math.max(0, designWidth - qrSize - 2);
    const maxY = Math.max(0, designHeight - qrSize - 2);
    if (qrSize > maxSize) setQrSize(Math.max(5, maxSize));
    if (qrPosX > maxX) setQrPosX(maxX);
    if (qrPosY > maxY) setQrPosY(maxY);
    const r = tableNumSize / 2;
    if (tableNumPosX - r < 0) setTableNumPosX(r);
    if (tableNumPosX + r > designWidth) setTableNumPosX(designWidth - r);
    if (tableNumPosY - r < 0) setTableNumPosY(r);
    if (tableNumPosY + r > designHeight) setTableNumPosY(designHeight - r);
    if (tableNumSize > Math.min(designWidth, designHeight) - 2)
      setTableNumSize(Math.max(6, Math.min(designWidth, designHeight) - 2));
  }, [designWidth, designHeight]);

  // Convert image URL to base64 for jsPDF (handles CORS via proxy/same-origin)
  const imageUrlToBase64 = useCallback(
    async (url: string): Promise<string> => {
      try {
        const fullUrl = url.startsWith("http") ? url : getImageUrl(url);
        const res = await fetch(fullUrl, { mode: "cors" });
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Could not fetch image as base64:", e);
        return "";
      }
    },
    []
  );

  // Export custom design PDF
  const exportCustomDesignPDF = useCallback(async () => {
    if (qrCodes.length === 0) {
      showToast(
        isRTL ? "لا توجد أكواد للتصدير" : "No QR codes to export",
        "error"
      );
      return;
    }
    if (!designBackground) {
      showToast(
        isRTL ? "يرجى رفع صورة خلفية للتصميم" : "Please upload a background image",
        "error"
      );
      return;
    }
    try {
      showToast(
        isRTL ? "جاري إنشاء ملف PDF..." : "Generating PDF...",
        "info"
      );
      const bgBase64 = designBackground.startsWith("data:")
        ? designBackground
        : await imageUrlToBase64(designBackground);

      const PAPER_SIZES: Record<string, [number, number]> = {
        a4: [210, 297],
        a3: [297, 420],
        a5: [148, 210],
        letter: [216, 279],
      };
      const [paperWidth, paperHeight] = PAPER_SIZES[paperSize] || PAPER_SIZES.a4;
      const margin = paperMargin;
      const gap = 3;
      const cols = Math.floor((paperWidth - 2 * margin + gap) / (designWidth + gap)) || 1;
      const rows = Math.floor((paperHeight - 2 * margin + gap) / (designHeight + gap)) || 1;
      const perPage = cols * rows;

      const pdf = new jsPDF({
        unit: "mm",
        format: [paperWidth, paperHeight],
      });

      let pageAdded = false;
      for (let i = 0; i < qrCodes.length; i++) {
        const qr = qrCodes[i];
        if (!qr.qrCodeImage) continue;
        const idx = i % perPage;
        if (i > 0 && idx === 0) {
          pdf.addPage([paperWidth, paperHeight]);
        }
        pageAdded = true;

        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const baseX = margin + col * (designWidth + gap);
        const baseY = margin + row * (designHeight + gap);

        // Draw background
        if (bgBase64) {
          const fmt = bgBase64.includes("image/png")
            ? "PNG"
            : bgBase64.includes("image/webp")
              ? "WEBP"
              : "JPEG";
          pdf.addImage(
            bgBase64,
            fmt,
            baseX,
            baseY,
            designWidth,
            designHeight
          );
        } else {
          pdf.setDrawColor(200);
          pdf.setFillColor(255, 255, 255);
          pdf.rect(baseX, baseY, designWidth, designHeight, "FD");
        }

        // Draw table number circle
        const cx = baseX + tableNumPosX;
        const cy = baseY + tableNumPosY;
        const radius = tableNumSize / 2;
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return [r, g, b];
        };
        const [br, bg, bb] = hexToRgb(tableNumBgColor || "#ffffff");
        const [tr, tg, tb] = hexToRgb(tableNumTextColor);
        // No border for the circle – fill only when not transparent
        if (!tableNumBgTransparent) {
          pdf.setFillColor(br, bg, bb);
          pdf.circle(cx, cy, radius, "F");
        }
        pdf.setTextColor(tr, tg, tb);
        // Approximate preview size: cap-height(mm) ≈ 0.7 * fontSize(pt) * 0.3528
        // We want cap-height ≈ tableNumSize * tableNumFontScale * 0.75
        // => fontSize ≈ tableNumSize * tableNumFontScale * (0.75 / (0.7 * 0.3528)) ≈ * 3.0
        const fontSize = Math.max(4, Math.min(40, tableNumSize * tableNumFontScale * 3));
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "bold");
        // Vertical center: baseline = cy + half cap-height
        const capHeightMm = fontSize * 0.3528 * 0.7;
        const textY = cy + capHeightMm / 2;
        pdf.text(String(qr.tableNumber), cx, textY, { align: "center" });

        // Draw QR code
        const qrX = baseX + qrPosX;
        const qrY = baseY + qrPosY;
        pdf.addImage(
          qr.qrCodeImage,
          "PNG",
          qrX,
          qrY,
          qrSize,
          qrSize
        );
      }

      pdf.save(
        isRTL ? "أكواد_QR_التصميم_المخصص.pdf" : "table_qr_codes_custom.pdf"
      );
      showToast(
        isRTL ? "تم تحميل ملف PDF بنجاح" : "PDF downloaded successfully",
        "success"
      );
      setShowCustomDesign(false);
    } catch (err) {
      console.error("Error generating custom PDF:", err);
      showToast(
        isRTL ? "حدث خطأ أثناء إنشاء PDF" : "Error generating PDF",
        "error"
      );
    }
  }, [
    qrCodes,
    designBackground,
    designWidth,
    designHeight,
    qrPosX,
    qrPosY,
    qrSize,
    tableNumPosX,
    tableNumPosY,
    tableNumSize,
    tableNumFontScale,
    tableNumBgColor,
    tableNumBgTransparent,
    tableNumTextColor,
    paperSize,
    paperMargin,
    imageUrlToBase64,
    isRTL,
    showToast,
  ]);

  // Mouse handlers for drag/resize
  const handleDesignCornerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      type: "design",
      startX: e.clientX,
      startY: e.clientY,
      startW: designWidth,
      startH: designHeight,
      startPosX: 0,
      startPosY: 0,
      startQrSize: 0,
      startTableNumPosX: 0,
      startTableNumPosY: 0,
      startTableNumSize: 0,
      startTableNumFontScale: tableNumFontScale,
    };
  }, [designWidth, designHeight, tableNumFontScale]);

  const handleQrMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".qr-resize-handle")) return;
    e.preventDefault();
    dragRef.current = {
      type: "qrMove",
      startX: e.clientX,
      startY: e.clientY,
      startW: designWidth,
      startH: designHeight,
      startPosX: qrPosX,
      startPosY: qrPosY,
      startQrSize: qrSize,
      startTableNumPosX: 0,
      startTableNumPosY: 0,
      startTableNumSize: 0,
      startTableNumFontScale: tableNumFontScale,
    };
  }, [designWidth, designHeight, qrPosX, qrPosY, qrSize, tableNumFontScale]);

  const handleQrResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: "qrResize",
      startX: e.clientX,
      startY: e.clientY,
      startW: designWidth,
      startH: designHeight,
      startPosX: qrPosX,
      startPosY: qrPosY,
      startQrSize: qrSize,
      startTableNumPosX: 0,
      startTableNumPosY: 0,
      startTableNumSize: 0,
      startTableNumFontScale: tableNumFontScale,
    };
  }, [designWidth, designHeight, qrPosX, qrPosY, qrSize, tableNumFontScale]);

  const handleTableNumMouseDown = useCallback((e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest(".table-num-resize-handle") ||
      (e.target as HTMLElement).closest(".table-num-font-resize-handle")
    )
      return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: "tableNumMove",
      startX: e.clientX,
      startY: e.clientY,
      startW: designWidth,
      startH: designHeight,
      startPosX: 0,
      startPosY: 0,
      startQrSize: 0,
      startTableNumPosX: tableNumPosX,
      startTableNumPosY: tableNumPosY,
      startTableNumSize: tableNumSize,
      startTableNumFontScale: tableNumFontScale,
    };
  }, [designWidth, designHeight, tableNumPosX, tableNumPosY, tableNumSize, tableNumFontScale]);

  const handleTableNumResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      type: "tableNumResize",
      startX: e.clientX,
      startY: e.clientY,
      startW: designWidth,
      startH: designHeight,
      startPosX: 0,
      startPosY: 0,
      startQrSize: 0,
      startTableNumPosX: tableNumPosX,
      startTableNumPosY: tableNumPosY,
      startTableNumSize: tableNumSize,
      startTableNumFontScale: tableNumFontScale,
    };
  }, [designWidth, designHeight, tableNumPosX, tableNumPosY, tableNumSize, tableNumFontScale]);

  const handleTableNumFontResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        type: "tableNumFontResize",
        startX: e.clientX,
        startY: e.clientY,
        startW: designWidth,
        startH: designHeight,
        startPosX: 0,
        startPosY: 0,
        startQrSize: 0,
      startTableNumPosX: tableNumPosX,
      startTableNumPosY: tableNumPosY,
      startTableNumSize: tableNumSize,
      startTableNumFontScale: tableNumFontScale,
      };
    },
    [designWidth, designHeight, tableNumPosX, tableNumPosY, tableNumSize, tableNumFontScale],
  );

  const effectivePxPerMm = Math.max(0.1, PX_PER_MM * previewScale);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const d = dragRef.current;
      const dx = (e.clientX - d.startX) / effectivePxPerMm;
      const dy = (e.clientY - d.startY) / effectivePxPerMm;
      if (d.type === "design") {
        const newW = Math.max(MIN_DESIGN_MM, Math.min(MAX_DESIGN_MM, d.startW + dx));
        const newH = Math.max(MIN_DESIGN_MM, Math.min(MAX_DESIGN_MM, d.startH + dy));
        setDesignWidth(Math.round(newW));
        setDesignHeight(Math.round(newH));
      } else if (d.type === "qrMove") {
        const maxX = Math.max(0, d.startW - d.startQrSize - 2);
        const maxY = Math.max(0, d.startH - d.startQrSize - 2);
        setQrPosX(Math.round(Math.max(0, Math.min(maxX, d.startPosX + dx))));
        setQrPosY(Math.round(Math.max(0, Math.min(maxY, d.startPosY + dy))));
      } else if (d.type === "qrResize") {
        const minSize = 5;
        const maxSize = Math.min(d.startW - d.startPosX, d.startH - d.startPosY) - 2;
        const delta = Math.min(dx, dy);
        const newSize = Math.max(minSize, Math.min(maxSize, d.startQrSize + delta));
        setQrSize(Math.round(newSize));
      } else if (d.type === "tableNumMove") {
        const r = d.startTableNumSize / 2;
        const maxX = d.startW - r - 2;
        const maxY = d.startH - r - 2;
        setTableNumPosX(Math.round(Math.max(r, Math.min(maxX, d.startTableNumPosX + dx))));
        setTableNumPosY(Math.round(Math.max(r, Math.min(maxY, d.startTableNumPosY + dy))));
      } else if (d.type === "tableNumResize") {
        const minSize = 6;
        const maxSize = Math.min(d.startW, d.startH) - 4;
        const delta = Math.min(dx, dy);
        const newSize = Math.max(minSize, Math.min(maxSize, d.startTableNumSize + delta));
        setTableNumSize(Math.round(newSize));
      } else if (d.type === "tableNumFontResize") {
        // Vertical drag to increase/decrease font scale
        const deltaScale = -dy / 50; // drag up to increase, down to decrease
        const newScale = Math.max(0.4, Math.min(1.2, d.startTableNumFontScale + deltaScale));
        setTableNumFontScale(parseFloat(newScale.toFixed(2)));
      }
    };
    const onMouseUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [effectivePxPerMm]);

  // Print functions
  const printStandard = (codes: any[]) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const qrCodesPerPage = 6;
      const totalPages = Math.ceil(codes.length / qrCodesPerPage);

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
        const endIndex = Math.min(startIndex + qrCodesPerPage, codes.length);

        for (let i = startIndex; i < endIndex; i++) {
          const qr = codes[i];
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
  };

  const printLabel = (codes: any[]) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // 4cm x 4cm per QR code, 8cm paper width
      // Convert to mm: 40mm x 40mm per code, 80mm paper width
      let htmlContent = `
        <html>
          <head>
            <title>${isRTL ? "أكواد QR للطاولات - طابعة الملصقات" : "Table QR Codes - Label Printer"}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              @page {
                size: 80mm auto;
                margin: 0;
              }
              html, body { 
                font-family: Arial, sans-serif; 
                direction: ${isRTL ? "rtl" : "ltr"};
                margin: 0;
                padding: 0;
                width: 80mm;
              }
              .qr-label {
                width: 80mm;
                height: 40mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                border-bottom: 1px solid #ddd;
                padding: 2mm;
                page-break-inside: avoid;
                break-inside: avoid;
              }
              .qr-label:last-child {
                border-bottom: none;
              }
              .qr-image {
                width: 30mm;
                height: 30mm;
                display: block;
                margin: 0 auto 1mm;
              }
              .table-number {
                font-weight: bold;
                font-size: 10pt;
                margin: 0;
                color: #333;
                text-align: center;
              }
              .instructions {
                font-size: 7pt;
                color: #666;
                margin-top: 1mm;
                text-align: center;
              }
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 80mm !important;
                }
                .qr-label {
                  page-break-after: auto;
                }
              }
            </style>
          </head>
          <body>
      `;

      codes.forEach((qr) => {
        htmlContent += `
          <div class="qr-label">
            <div class="table-number">
              ${isRTL ? `طاولة ${qr.tableNumber}` : `Table ${qr.tableNumber}`}
            </div>
            <img src="${qr.qrCodeImage}" alt="QR Code" class="qr-image" />
            <div class="instructions">
              ${isRTL ? "امسح لعرض القائمة" : "Scan to view menu"}
            </div>
          </div>
        `;
      });

      htmlContent += `
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  // Print single QR code functions
  const printSingleStandard = (qr: any) => {
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
              <p>${isRTL ? "امسح هذا الرمز لعرض قائمة المطعم" : "Scan this QR code to view the restaurant menu"}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

  const printSingleLabel = (qr: any) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // 4cm x 4cm QR code, 8cm paper width
      printWindow.document.write(`
        <html>
          <head>
            <title>${isRTL ? `كود QR - طاولة ${qr.tableNumber} - طابعة الملصقات` : `QR Code - Table ${qr.tableNumber} - Label Printer`}</title>
            <style>
              @page {
                size: 80mm 40mm;
                margin: 0;
              }
              html, body { 
                font-family: Arial, sans-serif; 
                direction: ${isRTL ? "rtl" : "ltr"};
                margin: 0;
                padding: 0;
                width: 80mm;
                height: 40mm;
              }
              .qr-label {
                width: 80mm;
                height: 40mm;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2mm;
              }
              .qr-image {
                width: 30mm;
                height: 30mm;
                display: block;
                margin: 0 auto 1mm;
              }
              .table-number {
                font-weight: bold;
                font-size: 10pt;
                margin: 0;
                color: #333;
                text-align: center;
              }
              .instructions {
                font-size: 7pt;
                color: #666;
                margin-top: 1mm;
                text-align: center;
              }
              @media print {
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 80mm !important;
                  height: 40mm !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-label">
              <div class="table-number">
                ${isRTL ? `طاولة ${qr.tableNumber}` : `Table ${qr.tableNumber}`}
              </div>
              <img src="${qr.qrCodeImage}" alt="QR Code" class="qr-image" />
              <div class="instructions">
                ${isRTL ? "امسح لعرض القائمة" : "Scan to view menu"}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
  };

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
                      onClick={() => setShowPrintOptions(true)}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                      {isRTL ? "طباعة الكل" : "Print All"}
                    </Button>

                    <Button
                      onClick={() => setShowCustomDesign(true)}
                      variant="outline"
                      size="sm"
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                    >
                      {isRTL ? "تصميم مخصص للطباعة" : "Custom Print Design"}
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
                              setSelectedQRForPrint(qr);
                              setShowSinglePrintOptions(true);
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

          {/* Single QR Print Options Modal */}
          {showSinglePrintOptions && selectedQRForPrint && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isRTL ? "اختر نوع الطباعة" : "Select Print Type"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowSinglePrintOptions(false);
                      setSelectedQRForPrint(null);
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

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      printSingleStandard(selectedQRForPrint);
                      setShowSinglePrintOptions(false);
                      setSelectedQRForPrint(null);
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "الطباعة القياسية" : "Standard Print"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {isRTL
                            ? "طباعة على صفحة A4 - مناسب للطابعات العادية"
                            : "Print on A4 page - Suitable for standard printers"}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      printSingleLabel(selectedQRForPrint);
                      setShowSinglePrintOptions(false);
                      setSelectedQRForPrint(null);
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "طابعة الملصقات" : "Label Printer"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {isRTL
                            ? "طباعة على عمود واحد - كل كود 4×4 سم، عرض الورقة 8 سم"
                            : "Print in single column - Each code 4×4 cm, paper width 8 cm"}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSinglePrintOptions(false);
                      setSelectedQRForPrint(null);
                    }}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Design Modal */}
          {showCustomDesign && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-8">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {isRTL ? "تصميم مخصص للطباعة" : "Custom Print Design"}
                    </h3>
                    <button
                      onClick={() => setShowCustomDesign(false)}
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

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {isRTL
                      ? "ارفع صورة خلفية، اسحب زوايا التصميم والكود ودائرة رقم الطاولة لضبط الموضع والحجم، ثم صدّر PDF."
                      : "Upload a background image, drag corners to resize design, QR, and table number circle, then export PDF."}
                  </p>

                  <div className="space-y-6">
                    {/* Background image - local only, no server upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? "صورة الخلفية" : "Background Image"}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {isRTL
                          ? "محلي فقط - لا يتم رفع الصورة للسيرفر (للت export فقط)"
                          : "Local only - image is not uploaded to server (for export only)"}
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              setDesignBackground(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                          className="hidden"
                          id="design-bg-local"
                        />
                        <label
                          htmlFor="design-bg-local"
                          className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-center text-sm text-gray-600 dark:text-gray-400"
                        >
                          {designBackground
                            ? isRTL ? "تغيير الصورة" : "Change image"
                            : isRTL ? "اختر صورة التصميم (محلي)" : "Choose design image (local)"}
                        </label>
                        {designBackground && (
                          <button
                            type="button"
                            onClick={() => setDesignBackground(null)}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            {isRTL ? "إزالة" : "Remove"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Table number circle colors and font */}
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "لون خلفية الدائرة" : "Circle background"}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tableNumBgColor}
                            onChange={(e) => setTableNumBgColor(e.target.value)}
                            disabled={tableNumBgTransparent}
                            className="w-10 h-10 rounded cursor-pointer border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-gray-500">{tableNumBgColor}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            id="tableNumBgTransparent"
                            type="checkbox"
                            checked={tableNumBgTransparent}
                            onChange={(e) => setTableNumBgTransparent(e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label
                            htmlFor="tableNumBgTransparent"
                            className="text-xs text-gray-600 dark:text-gray-400"
                          >
                            {isRTL ? "خلفية شفافة" : "Transparent background"}
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {isRTL ? "لون النص" : "Text color"}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tableNumTextColor}
                            onChange={(e) => setTableNumTextColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                          />
                          <span className="text-sm text-gray-500">{tableNumTextColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Font size control */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {isRTL ? "حجم خط رقم الطاولة" : "Table number font size"}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0.5"
                          max="1"
                          step="0.05"
                          value={tableNumFontScale}
                          onChange={(e) => setTableNumFontScale(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem]">
                          {Math.round(tableNumFontScale * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL ? "حجم الخط نسبةً لقطر الدائرة" : "Font size relative to circle diameter"}
                      </p>
                    </div>
                    </div>

                    {/* Interactive Preview with drag & resize */}
                    {qrCodes[0] && (
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {isRTL ? "اسحب الزوايا لضبط الأبعاد" : "Drag corners to adjust dimensions"}
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={handleZoomOut}
                                disabled={previewScale <= MIN_ZOOM}
                                className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isRTL ? "تصغير" : "Zoom out"}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="text-xs font-mono w-12 text-center">{Math.round(previewScale * 100)}%</span>
                              <button
                                type="button"
                                onClick={handleZoomIn}
                                disabled={previewScale >= MAX_ZOOM}
                                className="w-8 h-8 rounded flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isRTL ? "تكبير" : "Zoom in"}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={handleZoomFit}
                                className="px-2 py-1 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                                title={isRTL ? "ملاءمة" : "Fit"}
                              >
                                {isRTL ? "ملاءمة" : "Fit"}
                              </button>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              {isRTL ? "التصميم:" : "Design:"}{" "}
                              <input
                                type="number"
                                min={2}
                                max={20}
                                step={0.1}
                                defaultValue={designWidth / 10}
                                key={`design-w-${designWidth}`}
                                onBlur={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v) && v >= 2 && v <= 20) setDesignWidth(Math.round(v * 10));
                                }}
                                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                className="w-14 px-1.5 py-0.5 text-center font-mono font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400"
                              />
                              <span>×</span>
                              <input
                                type="number"
                                min={2}
                                max={42}
                                step={0.1}
                                defaultValue={designHeight / 10}
                                key={`design-h-${designHeight}`}
                                onBlur={(e) => {
                                  const v = parseFloat(e.target.value);
                                  if (!isNaN(v) && v >= 2 && v <= 42) setDesignHeight(Math.round(v * 10));
                                }}
                                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                                className="w-14 px-1.5 py-0.5 text-center font-mono font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 hover:border-primary-400"
                              />
                              <span>سم</span>
                            </div>
                          </div>
                        </div>
                        <div
                          ref={previewRef}
                          className="border-2 border-gray-300 dark:border-gray-500 rounded-lg bg-gray-100 dark:bg-gray-700 p-2 select-none overflow-auto"
                          style={{
                            cursor: "default",
                            maxWidth: "50vw",
                            maxHeight: "50vh",
                          }}
                        >
                          <div
                            className="overflow-visible inline-block"
                            style={{
                              width: designWidth * PX_PER_MM * previewScale,
                              height: designHeight * PX_PER_MM * previewScale,
                              minWidth: 80,
                              minHeight: 80,
                            }}
                          >
                            <div
                              className="relative bg-white dark:bg-gray-800 shadow-md overflow-visible origin-top-left"
                              style={{
                                width: designWidth * PX_PER_MM,
                                height: designHeight * PX_PER_MM,
                                minWidth: 80,
                                minHeight: 80,
                                transform: `scale(${previewScale})`,
                              }}
                            >
                            {/* Design background - contain to show full image, pointer-events: none */}
                            <div
                              className="absolute inset-0 bg-no-repeat bg-contain bg-center pointer-events-none"
                              style={{
                                backgroundImage: designBackground
                                  ? `url(${designBackground.startsWith("data:") ? designBackground : getImageUrl(designBackground)})`
                                  : undefined,
                                backgroundColor: designBackground
                                  ? "transparent"
                                  : "#f3f4f6",
                              }}
                            />
                            {/* Table number circle - draggable and resizable */}
                            <div
                              onMouseDown={handleTableNumMouseDown}
                              className="absolute rounded-full shadow-md cursor-move flex items-center justify-center font-bold select-none z-10"
                              style={{
                                left: (tableNumPosX - tableNumSize / 2) * PX_PER_MM,
                                top: (tableNumPosY - tableNumSize / 2) * PX_PER_MM,
                                width: tableNumSize * PX_PER_MM,
                                height: tableNumSize * PX_PER_MM,
                                fontSize: Math.max(8, tableNumSize * PX_PER_MM * tableNumFontScale),
                                backgroundColor: tableNumBgTransparent ? "transparent" : tableNumBgColor,
                                color: tableNumTextColor,
                              }}
                            >
                              {qrCodes[0].tableNumber}
                              {/* Resize circle handle */}
                              <div
                                className="table-num-resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow cursor-se-resize hover:bg-orange-600 z-20"
                                onMouseDown={handleTableNumResizeMouseDown}
                              />
                              {/* Resize font handle */}
                              <div
                                className="table-num-font-resize-handle absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white shadow cursor-ns-resize hover:bg-purple-600 z-20"
                                onMouseDown={handleTableNumFontResizeMouseDown}
                              />
                            </div>
                            {/* QR code - draggable */}
                            <div
                              onMouseDown={handleQrMouseDown}
                              className="absolute bg-white p-0.5 shadow-md cursor-move border border-gray-300 z-10"
                              style={{
                                left: qrPosX * PX_PER_MM,
                                top: qrPosY * PX_PER_MM,
                                width: qrSize * PX_PER_MM,
                                height: qrSize * PX_PER_MM,
                              }}
                            >
                              <img
                                src={qrCodes[0].qrCodeImage}
                                alt="QR Preview"
                                className="w-full h-full object-contain pointer-events-none"
                              />
                              {/* Resize handle */}
                              <div
                                className="qr-resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white shadow cursor-se-resize hover:bg-primary-600"
                                onMouseDown={handleQrResizeMouseDown}
                              />
                            </div>
                            {/* Design resize handle - bottom-right corner */}
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-sm border-2 border-white shadow cursor-se-resize hover:bg-blue-600 flex items-center justify-center"
                              onMouseDown={handleDesignCornerMouseDown}
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 15l5 5m0-5l-5 5" />
                              </svg>
                            </div>
                          </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Paper size for export */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {isRTL ? "مقاس الورق للطباعة" : "Paper size for printing"}
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {isRTL ? "المقاس" : "Size"}
                          </label>
                          <select
                            value={paperSize}
                            onChange={(e) => setPaperSize(e.target.value as "a4" | "a3" | "letter" | "a5")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="a4">A4 (210×297 مم)</option>
                            <option value="a3">A3 (297×420 مم)</option>
                            <option value="a5">A5 (148×210 مم)</option>
                            <option value="letter">{isRTL ? "Letter" : "Letter (216×279 mm)"}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {isRTL ? "الهوامش (مم)" : "Margin (mm)"}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={20}
                            value={paperMargin}
                            onChange={(e) => setPaperMargin(Math.max(0, Math.min(20, Number(e.target.value) || 5)))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {(() => {
                          const [pw, ph] = paperSize === "a4" ? [210, 297] : paperSize === "a3" ? [297, 420] : paperSize === "a5" ? [148, 210] : [216, 279];
                          const c = Math.floor((pw - 2 * paperMargin + 3) / (designWidth + 3)) || 1;
                          const r = Math.floor((ph - 2 * paperMargin + 3) / (designHeight + 3)) || 1;
                          const perPage = c * r;
                          return isRTL
                            ? `~${perPage} تصميم/صفحة - توفير الورق`
                            : `~${perPage} designs/page - saves paper`;
                        })()}
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={exportCustomDesignPDF}
                        className="flex-1"
                        disabled={!designBackground || qrCodes.length === 0}
                      >
                        {isRTL ? "تصدير PDF" : "Export PDF"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCustomDesign(false)}
                      >
                        {isRTL ? "إلغاء" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Print Options Modal */}
          {showPrintOptions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {isRTL ? "اختر نوع الطباعة" : "Select Print Type"}
                  </h3>
                  <button
                    onClick={() => setShowPrintOptions(false)}
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

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      printStandard(qrCodes);
                      setShowPrintOptions(false);
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-blue-600 dark:text-blue-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "الطباعة القياسية" : "Standard Print"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {isRTL
                            ? "طباعة على صفين (2×3) - مناسب للطابعات العادية"
                            : "Print in 2 columns (2×3) - Suitable for standard printers"}
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      printLabel(qrCodes);
                      setShowPrintOptions(false);
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {isRTL ? "طابعة الملصقات" : "Label Printer"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {isRTL
                            ? "طباعة على عمود واحد - كل كود 4×4 سم، عرض الورقة 8 سم"
                            : "Print in single column - Each code 4×4 cm, paper width 8 cm"}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPrintOptions(false)}
                  >
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Button>
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
