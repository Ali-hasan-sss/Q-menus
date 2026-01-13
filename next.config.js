let withPWA;
try {
  withPWA = require("next-pwa")({
    dest: "public",
    disable:
      process.env.NODE_ENV === "development" || process.env.VERCEL === "1",

    register: true,
    skipWaiting: true,

    fallbacks: {
      document: "/offline.html",
    },

    runtimeCaching: [
      {
        urlPattern: /^https?:.*\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  });
} catch (_) {
  withPWA = (cfg) => cfg; // Fallback: run without PWA if next-pwa is not installed
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  images: {
    domains: [
      "localhost",
      "mymenus-storage.s3.amazonaws.com",
      "mymenus-storage.nyc3.digitaloceanspaces.com",
      "images.unsplash.com",
      "res.cloudinary.com",
      "qmenus-backend.onrender.com",
      "api.qmenussy.com",
      // Add your S3-compatible storage domains here
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://api.qmenussy.com",
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://socket.qmenussy.com",
    NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION:
      process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION || "false",
    // IMPORTANT: Proxy must be false for cookies to work with cross-origin
    // Next.js rewrites don't properly forward Set-Cookie headers
    NEXT_PUBLIC_PROXY_API: process.env.NEXT_PUBLIC_PROXY_API || "false",
    NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE:
      process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "963994488858",
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const useProxy = process.env.NEXT_PUBLIC_PROXY_API === "true";
    if (!useProxy) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

module.exports = withPWA(baseConfig);
