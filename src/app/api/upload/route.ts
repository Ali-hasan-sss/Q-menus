import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";
import sharp from "sharp";

// Set maximum duration for this route (5 minutes)
export const maxDuration = 300;

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Check if Cloudinary is properly configured
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "⚠️  Cloudinary credentials not configured. Upload functionality will not work."
  );
  console.warn(
    "Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env.local file"
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Image upload service not configured. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No image file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Only image files are allowed",
        },
        { status: 400 }
      );
    }

    // Check allowed file types from environment
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    // Compress and optimize image before uploading
    let processedBuffer: Buffer | null = null;
    let compressionSuccess = false;
    const fileType = file.type.toLowerCase();
    const maxSizeAfterCompression = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB after compression
    
    try {
      // Create sharp instance
      let sharpInstance = sharp(originalBuffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();
      const originalWidth = metadata.width || 1920;
      const originalHeight = metadata.height || 1080;

      // Resize if image is too large (max width: 1920px, maintaining aspect ratio)
      const maxWidth = 1920;
      const maxHeight = 1920;
      
      if (originalWidth > maxWidth || originalHeight > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      // Compress based on file type
      if (fileType === "image/jpeg" || fileType === "image/jpg") {
        processedBuffer = await sharpInstance
          .jpeg({
            quality: 85, // Good balance between quality and file size
            progressive: true, // Progressive JPEG for better loading
            mozjpeg: true, // Use mozjpeg for better compression
          })
          .toBuffer();
        compressionSuccess = true;
      } else if (fileType === "image/png") {
        processedBuffer = await sharpInstance
          .png({
            quality: 85,
            compressionLevel: 9, // Maximum compression
            adaptiveFiltering: true,
          })
          .toBuffer();
        compressionSuccess = true;
      } else if (fileType === "image/webp") {
        processedBuffer = await sharpInstance
          .webp({
            quality: 85,
            effort: 6, // Higher effort = better compression (0-6)
          })
          .toBuffer();
        compressionSuccess = true;
      } else if (fileType === "image/gif") {
        // GIF files - just resize if needed, don't compress much
        processedBuffer = await sharpInstance.gif().toBuffer();
        compressionSuccess = true;
      } else {
        // Fallback: convert to JPEG with compression
        processedBuffer = await sharpInstance
          .jpeg({
            quality: 85,
            progressive: true,
          })
          .toBuffer();
        compressionSuccess = true;
      }

      // Verify compression success by checking if buffer is valid
      if (!processedBuffer || processedBuffer.length === 0) {
        throw new Error("Compression produced empty buffer");
      }

      // Log compression stats
      const originalSizeKB = (originalBuffer.length / 1024).toFixed(2);
      const compressedSizeKB = (processedBuffer.length / 1024).toFixed(2);
      const compressionRatio = (
        ((originalBuffer.length - processedBuffer.length) / originalBuffer.length) *
        100
      ).toFixed(1);

      console.log(
        `📸 Image compression: ${originalSizeKB}KB → ${compressedSizeKB}KB (${compressionRatio}% reduction)`
      );
    } catch (compressionError) {
      console.warn(
        "⚠️ Failed to compress image, will use original:",
        compressionError
      );
      compressionSuccess = false;
      // Will use original buffer after size check
    }

    // Check file size AFTER compression (or use original if compression failed)
    const finalBuffer = compressionSuccess && processedBuffer ? processedBuffer : originalBuffer;
    const finalSize = finalBuffer.length;
    
    if (finalSize > maxSizeAfterCompression) {
      const maxSizeMB = Math.round(maxSizeAfterCompression / (1024 * 1024));
      const actualSizeMB = (finalSize / (1024 * 1024)).toFixed(2);
      
      return NextResponse.json(
        {
          success: false,
          message: `File size after compression is ${actualSizeMB}MB, which exceeds the maximum allowed size of ${maxSizeMB}MB`,
        },
        { status: 400 }
      );
    }

    // If compression failed, use original buffer
    if (!compressionSuccess || !processedBuffer) {
      console.log("📸 Using original image (compression failed)");
      processedBuffer = originalBuffer;
    }

    // Upload compressed image to Cloudinary with timeout
    const uploadTimeout = 120000; // 2 minutes timeout
    const uploadStartTime = Date.now();
    
    const result = await Promise.race([
      new Promise((resolve, reject) => {
        cloudinary.v2.uploader
          .upload_stream(
            {
              folder: "mymenus-images",
              resource_type: "auto",
              transformation: [{ width: 1000, height: 1000, crop: "limit" }],
              // Additional quality optimization
              quality: "auto:good", // Cloudinary's auto quality
              fetch_format: "auto", // Auto format (webp if supported)
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                const uploadTime = Date.now() - uploadStartTime;
                console.log(`✅ Image uploaded to Cloudinary in ${uploadTime}ms`);
                resolve(result);
              }
            }
          )
          .end(processedBuffer);
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Upload timeout after ${uploadTimeout / 1000} seconds`));
        }, uploadTimeout);
      }),
    ]);

    if (!result || typeof result !== "object" || !("secure_url" in result)) {
      console.error("Cloudinary upload failed - no URL returned");
      return NextResponse.json(
        {
          success: false,
          message: "Failed to upload image to cloud storage",
        },
        { status: 500 }
      );
    }

    const cloudinaryResult = result as any;

    // Calculate sizes in bytes and readable format
    const originalSizeBytes = originalBuffer.length;
    const compressedSizeBytes = processedBuffer ? processedBuffer.length : originalSizeBytes;
    const uploadedSizeBytes = cloudinaryResult.bytes || compressedSizeBytes;

    // Format sizes for display
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        sizes: {
          original: {
            bytes: originalSizeBytes,
            formatted: formatSize(originalSizeBytes),
          },
          compressed: {
            bytes: compressedSizeBytes,
            formatted: formatSize(compressedSizeBytes),
          },
          uploaded: {
            bytes: uploadedSizeBytes,
            formatted: formatSize(uploadedSizeBytes),
          },
          compressionSuccess: compressionSuccess,
        },
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    
    // Handle specific error types
    let errorMessage = "Failed to upload image";
    let statusCode = 500;
    
    if (error?.error?.message === "Request Timeout" || error?.message?.includes("timeout")) {
      errorMessage = "Upload timeout - The image is too large or network connection is slow. Please try with a smaller image.";
      statusCode = 408; // Request Timeout
    } else if (error?.http_code === 400) {
      errorMessage = error?.message || "Invalid image file";
      statusCode = 400;
    } else if (error?.http_code === 413) {
      errorMessage = "Image file is too large";
      statusCode = 413;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { publicId } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        {
          success: false,
          message: "Public ID is required",
        },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.v2.uploader.destroy(publicId);

    if (result.result === "ok") {
      return NextResponse.json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Image not found or already deleted",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete image",
      },
      { status: 500 }
    );
  }
}
