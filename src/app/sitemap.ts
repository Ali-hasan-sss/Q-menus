import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.qmenussy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Note: Dynamic menu pages (/menu/[restaurantId]) and order pages (/order/[orderId])
  // are excluded from sitemap because they require authentication/authorization
  // and are not meant to be indexed by search engines

  return staticPages;
}
