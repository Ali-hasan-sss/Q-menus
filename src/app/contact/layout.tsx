import type { Metadata } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.qmenussy.com";

export const metadata: Metadata = {
  title: "اتصل بنا | Contact Us",
  description:
    "تواصل مع فريق QMenus - منصة إدارة المطاعم الذكية. نحن هنا لمساعدتك في تطوير أعمالك الذكية مع قوائم QR وإدارة الطلبات المتطورة. Contact QMenus team - Smart restaurant management platform.",
  keywords: [
    "اتصل بنا",
    "تواصل معنا",
    "QMenus contact",
    "contact QMenus",
    "دعم فني",
    "customer support",
    "Syria restaurant software support",
  ],
  robots: "index, follow",
  openGraph: {
    title: "اتصل بنا | Contact Us - QMenus",
    description:
      "تواصل مع فريق QMenus - منصة إدارة المطاعم الذكية. نحن هنا لمساعدتك في تطوير أعمالك.",
    url: `${baseUrl}/contact`,
    type: "website",
    locale: "ar_SY",
    alternateLocale: ["en_US"],
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1200,
        height: 1200,
        alt: "QMenus Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "اتصل بنا | Contact Us - QMenus",
    description: "تواصل مع فريق QMenus - منصة إدارة المطاعم الذكية.",
    images: [`${baseUrl}/logo.png`],
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
