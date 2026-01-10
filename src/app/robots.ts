import { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.qmenussy.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/_next/",
          "/auth/",
          "/kitchen/",
          "/order/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/menu/", "/contact"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/_next/",
          "/auth/",
          "/kitchen/",
          "/order/",
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
