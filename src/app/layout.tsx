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

const baseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "https://www.qmenussy.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
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
  authors: [{ name: "فريق QMenus", url: "https://www.qmenussy.com" }],
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
      { url: "/favicon.png", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
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
    alternateLocale: ["en_US"],
    url: baseUrl,
    siteName: "QMenus",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        width: 1200,
        height: 1200,
        alt: "QMenus Logo - منصة إدارة المطاعم الذكية",
        type: "image/png",
      },
      {
        url: `${baseUrl}/images/logo.png`,
        width: 1200,
        height: 1200,
        alt: "QMenus - منصة إدارة المطاعم الذكية",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QMenus - منصة إدارة المطاعم الذكية",
    description:
      "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
    images: [
      {
        url: `${baseUrl}/logo.png`,
        alt: "QMenus Logo",
      },
      {
        url: `${baseUrl}/images/logo.png`,
        alt: "QMenus - منصة إدارة المطاعم الذكية",
      },
    ],
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
        {/* Structured Data (Schema.org) for Logo and Brand */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "QMenus",
              alternateName: "QMenus - منصة إدارة المطاعم الذكية",
              url: "https://www.qmenussy.com",
              logo: "https://www.qmenussy.com/logo.png",
              image: "https://www.qmenussy.com/images/logo.png",
              description:
                "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
              address: {
                "@type": "PostalAddress",
                addressCountry: "SY",
              },
              sameAs: [],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["Arabic", "English"],
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "QMenus",
              url: "https://www.qmenussy.com",
              logo: "https://www.qmenussy.com/logo.png",
              description:
                "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://www.qmenussy.com/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "QMenus",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://www.qmenussy.com",
              logo: "https://www.qmenussy.com/logo.png",
              image: "https://www.qmenussy.com/images/logo.png",
              description:
                "منصة QMenus الأولى في سوريا لإدارة المطاعم. قوائم QR تفاعلية، إدارة طلبات متطورة، وتجربة عملاء ذكية.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "SYP",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                reviewCount: "100",
              },
              publisher: {
                "@type": "Organization",
                name: "QMenus",
                logo: {
                  "@type": "ImageObject",
                  url: "https://www.qmenussy.com/logo.png",
                },
              },
            }),
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
