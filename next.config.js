/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      "localhost",
      "mymenus-storage.s3.amazonaws.com",
      "mymenus-storage.nyc3.digitaloceanspaces.com",
      "images.unsplash.com",
      "res.cloudinary.com",
      "https://qmenus-backend.onrender.com",
      // Add your S3-compatible storage domains here
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://qmenus-backend.onrender.com",
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      "https://qmenus-backend.onrender.com",
    NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION:
      process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION || "false",
  },
  // Rewrites removed - using Next.js API routes for upload
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: "http://localhost:5000/api/:path*",
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
