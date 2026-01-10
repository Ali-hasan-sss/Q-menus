const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const inputLogo = path.join(__dirname, "../public/logo.png");
const outputDir = path.join(__dirname, "../public");

// المقاسات المطلوبة
const iconSizes = [
  // Favicons
  { size: 16, name: "favicon-16.png" },
  { size: 32, name: "favicon-32.png" },
  { size: 96, name: "favicon-96.png" },
  { size: 196, name: "favicon-196.png" },
  { size: 192, name: "favicon-192.png" },
  { size: 512, name: "favicon-512.png" },

  // Apple Touch Icons
  { size: 180, name: "apple-icon-180.png" },

  // Manifest Icons (maskable)
  { size: 192, name: "manifest-icon-192.maskable.png" },
  { size: 512, name: "manifest-icon-512.maskable.png" },

  // Microsoft Tiles
  { size: 70, name: "mstile-icon-70.png" },
  { size: 128, name: "mstile-icon-128.png" },
  { size: 150, name: "mstile-icon-150.png" },
  { size: 270, name: "mstile-icon-270.png" },
  { size: 310, name: "mstile-icon-310.png" },
  { size: 558, name: "mstile-icon-558.png" },

  // Microsoft Tiles - Wide
  { size: [310, 150], name: "mstile-icon-310x150.png" },
  { size: [558, 270], name: "mstile-icon-558-270.png" },
];

// إنشاء مجلد favicons إذا لم يكن موجوداً
const faviconsDir = path.join(outputDir, "favicons");
if (!fs.existsSync(faviconsDir)) {
  fs.mkdirSync(faviconsDir, { recursive: true });
}

async function generateIcons() {
  try {
    console.log("🚀 بدء توليد الأيقونات من:", inputLogo);

    // التحقق من وجود ملف اللوجو
    if (!fs.existsSync(inputLogo)) {
      console.error("❌ ملف اللوجو غير موجود:", inputLogo);
      process.exit(1);
    }

    // قراءة الصورة الأصلية
    const image = sharp(inputLogo);
    const metadata = await image.metadata();
    console.log(`📐 حجم الصورة الأصلية: ${metadata.width}x${metadata.height}`);

    // توليد كل مقاس
    for (const icon of iconSizes) {
      try {
        let outputPath;
        let resizeOptions;

        if (Array.isArray(icon.size)) {
          // للمقاسات المستطيلة (wide tiles)
          outputPath = path.join(outputDir, icon.name);
          resizeOptions = {
            width: icon.size[0],
            height: icon.size[1],
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 }, // خلفية شفافة
          };
        } else {
          // للمقاسات المربعة
          outputPath = path.join(outputDir, icon.name);
          resizeOptions = {
            width: icon.size,
            height: icon.size,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 }, // خلفية شفافة
          };
        }

        await image
          .clone()
          .resize(resizeOptions)
          .png({ quality: 100, compressionLevel: 9 })
          .toFile(outputPath);

        const sizeStr = Array.isArray(icon.size)
          ? `${icon.size[0]}x${icon.size[1]}`
          : `${icon.size}x${icon.size}`;
        console.log(`✅ تم إنشاء: ${icon.name} (${sizeStr})`);
      } catch (error) {
        console.error(`❌ خطأ في إنشاء ${icon.name}:`, error.message);
      }
    }

    // إنشاء favicon.ico (16x16 و 32x32)
    console.log("📦 إنشاء favicon.ico...");
    const favicon16 = await image
      .clone()
      .resize(16, 16, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    const favicon32 = await image
      .clone()
      .resize(32, 32, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer();

    // ملاحظة: sharp لا يدعم إنشاء .ico مباشرة، لذا سننشئ favicon.png
    await sharp(favicon32).png().toFile(path.join(outputDir, "favicon.png"));

    console.log("✅ تم إنشاء: favicon.png");

    console.log("\n✨ اكتمل توليد جميع الأيقونات بنجاح!");
    console.log("📝 ملاحظة: تم إنشاء favicon.png بدلاً من favicon.ico");
    console.log(
      "   يمكنك استخدام أداة online لتحويل PNG إلى ICO إذا لزم الأمر."
    );
  } catch (error) {
    console.error("❌ خطأ عام:", error);
    process.exit(1);
  }
}

generateIcons();
