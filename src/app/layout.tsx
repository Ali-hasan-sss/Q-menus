import type { Metadata, Viewport } from "next";
import { Inter, Cairo, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
  ),
  title: {
    default: "QMenus - منصة إدارة المطاعم الذكية",
    template: "%s | QMenus",
  },
  description:
    "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية. حوّل مطعمك إلى تجربة رقمية متكاملة.",
  keywords: [
    "مطاعم سوريا",
    "قوائم QR",
    "إدارة المطاعم",
    "طلبات الطعام",
    "منصة مطاعم",
    "قوائم رقمية",
    "QMenus",
    "restaurant management",
    "QR menu",
    "food ordering",
    "Syria restaurants",
  ],
  authors: [{ name: "فريق QMenus", url: "https://qmenus.com" }],
  creator: "QMenus Team",
  publisher: "QMenus",
  robots: "index, follow",
  alternates: {
    canonical: "/",
    languages: {
      ar: "/ar",
      en: "/en",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#f58114",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "QMenus - منصة إدارة المطاعم الذكية",
    description:
      "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
    type: "website",
    locale: "ar_SY",
    url: process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
    siteName: "QMenus",
    images: [
      {
        url: "/og-image-ar.png",
        width: 1200,
        height: 630,
        alt: "QMenus - منصة إدارة المطاعم الذكية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QMenus - منصة إدارة المطاعم الذكية",
    description:
      "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
    images: ["/twitter-image-ar.png"],
    creator: "@qmenus",
    site: "@qmenus",
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "Technology",
  classification: "Restaurant Management Platform",
  other: {
    "application-name": "QMenus",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "QMenus",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#f58114",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#f58114",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Set theme
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
                
                // Set language
                const savedLanguage = localStorage.getItem('language');
                if (savedLanguage === 'EN') {
                  document.documentElement.dir = 'ltr';
                  document.documentElement.lang = 'en';
                } else {
                  // Default to Arabic
                  document.documentElement.dir = 'rtl';
                  document.documentElement.lang = 'ar';
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${cairo.variable} ${poppins.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--toast-bg)",
                color: "var(--toast-color)",
                border: "1px solid var(--toast-border)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
