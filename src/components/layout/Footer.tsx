"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/store/hooks/useLanguage";
import { Logo } from "@/components/ui/Logo";
import { publicApi, endpoints } from "@/lib/api";

interface SectionAttribute {
  key: string;
  keyAr: string;
  value: string;
  valueAr: string;
  icon?: string;
}

interface ContactSection {
  id: string;
  title: string;
  titleAr: string;
  description: string | null;
  descriptionAr: string | null;
  attributes: SectionAttribute[] | null;
}

export default function Footer() {
  const { isRTL } = useLanguage();
  const [contactSection, setContactSection] = useState<ContactSection | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContactSection();
  }, []);

  const fetchContactSection = async () => {
    try {
      const response = await publicApi.get(
        endpoints.sections.getByType("CONTACT")
      );
      if (response.data.success && response.data.data.sections.length > 0) {
        setContactSection(response.data.data.sections[0]);
      }
    } catch (error) {
      console.error("Error fetching contact section:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get social media icon based on key name
  const getSocialIcon = (key: string, href: string) => {
    const keyLower = key.toLowerCase();

    if (keyLower.includes("facebook") || keyLower.includes("فيسبوك")) {
      return (
        <svg
          className="h-6 w-6 text-blue-600 hover:text-blue-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.333v21.334C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.657-4.788 1.324 0 2.462.099 2.795.143v3.24l-1.918.001c-1.505 0-1.797.716-1.797 1.767v2.318h3.59l-.467 3.622h-3.123V24h6.127C23.403 24 24 23.403 24 22.667V1.333C24 .598 23.403 0 22.675 0z" />
        </svg>
      );
    }

    if (keyLower.includes("instagram") || keyLower.includes("انستغرام")) {
      return (
        <svg
          className="h-6 w-6 text-pink-600 hover:text-pink-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3A5.25 5.25 0 1 1 6.75 12 5.25 5.25 0 0 1 12 6.5zm0 1.5A3.75 3.75 0 1 0 15.75 12 3.75 3.75 0 0 0 12 8zm5.5-.25a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
        </svg>
      );
    }

    if (keyLower.includes("youtube") || keyLower.includes("يوتيوب")) {
      return (
        <svg
          className="h-6 w-6 text-red-600 hover:text-red-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a2.998 2.998 0 0 0-2.114-2.115C19.217 3.5 12 3.5 12 3.5s-7.217 0-9.384.571A2.998 2.998 0 0 0 .502 6.186 31.46 31.46 0 0 0 0 12a31.46 31.46 0 0 0 .502 5.814 2.998 2.998 0 0 0 2.114 2.115C4.783 20.5 12 20.5 12 20.5s7.217 0 9.384-.571a2.998 2.998 0 0 0 2.114-2.115A31.46 31.46 0 0 0 24 12a31.46 31.46 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12l-6.068 3.568z" />
        </svg>
      );
    }

    if (
      keyLower.includes("twitter") ||
      keyLower.includes("تويتر") ||
      keyLower.includes("x")
    ) {
      return (
        <svg
          className="h-6 w-6 text-gray-400 hover:text-white transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    }

    if (keyLower.includes("linkedin") || keyLower.includes("لينكد إن")) {
      return (
        <svg
          className="h-6 w-6 text-blue-500 hover:text-blue-600 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    }

    // Default icon for unknown social media
    return (
      <svg
        className="h-6 w-6 text-gray-400 hover:text-white transition-colors"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  };

  // Extract contact info from attributes
  const attributes = (contactSection?.attributes || []) as SectionAttribute[];
  const address =
    attributes.length > 0
      ? isRTL
        ? attributes[0].valueAr
        : attributes[0].value
      : null;
  const phone =
    attributes.length > 1
      ? isRTL
        ? attributes[1].valueAr
        : attributes[1].value
      : null;
  const socialMediaAttributes = attributes.slice(2); // From third attribute onwards

  const footerLinks = {
    product: [
      { name: isRTL ? "المميزات" : "Features", href: "#features" },
      { name: isRTL ? "الخطط" : "Plans", href: "#plans" },
      { name: isRTL ? "التسعير" : "Pricing", href: "#plans" },
    ],

    support: [
      { name: isRTL ? "مركز المساعدة" : "Help Center", href: "#" },
      { name: isRTL ? "اتصل بنا" : "Contact", href: "#contact" },
    ],
    legal: [
      { name: isRTL ? "سياسة الخصوصية" : "Privacy Policy", href: "#" },
      { name: isRTL ? "شروط الاستخدام" : "Terms of Service", href: "#" },
    ],
  };

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61580815815944&mibextid=ZbWKwL",
      icon: (
        <svg
          className="h-6 w-6 text-blue-600 hover:text-blue-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.333v21.334C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.657-4.788 1.324 0 2.462.099 2.795.143v3.24l-1.918.001c-1.505 0-1.797.716-1.797 1.767v2.318h3.59l-.467 3.622h-3.123V24h6.127C23.403 24 24 23.403 24 22.667V1.333C24 .598 23.403 0 22.675 0z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/qmenus2?igsh=MTUyaGpyc2VpYndyaw==",
      icon: (
        <svg
          className="h-6 w-6 text-pink-600 hover:text-pink-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 3A5.25 5.25 0 1 1 6.75 12 5.25 5.25 0 0 1 12 6.5zm0 1.5A3.75 3.75 0 1 0 15.75 12 3.75 3.75 0 0 0 12 8zm5.5-.25a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://youtube.com/@q-menus?si=YxFpkEbFjzxSpssM",
      icon: (
        <svg
          className="h-6 w-6 text-red-600 hover:text-red-700 transition-colors"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M23.498 6.186a2.998 2.998 0 0 0-2.114-2.115C19.217 3.5 12 3.5 12 3.5s-7.217 0-9.384.571A2.998 2.998 0 0 0 .502 6.186 31.46 31.46 0 0 0 0 12a31.46 31.46 0 0 0 .502 5.814 2.998 2.998 0 0 0 2.114 2.115C4.783 20.5 12 20.5 12 20.5s7.217 0 9.384-.571a2.998 2.998 0 0 0 2.114-2.115A31.46 31.46 0 0 0 24 12a31.46 31.46 0 0 0-.502-5.814zM9.75 15.568V8.432L15.818 12l-6.068 3.568z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex w-20 h-20 items-center justify-center bg-white rounded-lg mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              {isRTL
                ? contactSection?.descriptionAr ||
                  "منصة رقمية متكاملة لإدارة قوائم الطعام والمطاعم. اجعل مطعمك أكثر ذكاءً وحديثاً مع حلولنا المبتكرة."
                : contactSection?.description ||
                  "A comprehensive digital platform for managing restaurant menus and operations. Make your restaurant smarter and more modern with our innovative solutions."}
            </p>

            {/* Contact Info */}
            {(address || phone) && (
              <div className="mb-6 space-y-2">
                {address && (
                  <p className="text-gray-300 text-sm">
                    <span className="font-semibold">
                      {isRTL ? "العنوان:" : "Address:"}
                    </span>{" "}
                    {address}
                  </p>
                )}
                {phone && (
                  <p className="text-gray-300 text-sm">
                    <span className="font-semibold">
                      {isRTL ? "الهاتف:" : "Phone:"}
                    </span>{" "}
                    <a
                      href={`tel:${phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {phone}
                    </a>
                  </p>
                )}
              </div>
            )}

            {/* WhatsApp Support */}
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-2">
                <span className="font-semibold">
                  {isRTL ? "واتساب الدعم:" : "Support WhatsApp:"}
                </span>
              </p>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "963994488858"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span>+{process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "963994488858"}</span>
              </a>
            </div>

            {/* Social Media Icons */}
            {socialMediaAttributes.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-3 font-semibold">
                  {isRTL ? "تابعنا على:" : "Follow us:"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialMediaAttributes.map((attr, index) => {
                    const key = isRTL ? attr.keyAr : attr.key;
                    const href = isRTL ? attr.valueAr : attr.value;
                    return (
                      <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white transition-all duration-300 rounded-full hover:bg-gray-800 hover:scale-110"
                        title={key}
                        aria-label={key}
                      >
                        <span className="sr-only">{key}</span>
                        {getSocialIcon(attr.key, href)}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
            {socialMediaAttributes.length === 0 && (
              // Fallback to default social links if no attributes
              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-3 font-semibold">
                  {isRTL ? "تابعنا على:" : "Follow us:"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      className="inline-flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white transition-all duration-300 rounded-full hover:bg-gray-800 hover:scale-110"
                    >
                      <span className="sr-only">{item.name}</span>
                      {item.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              {isRTL ? "المنتج" : "Product"}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              {isRTL ? "الدعم" : "Support"}
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              {isRTL
                ? "© 2024 QMenus. جميع الحقوق محفوظة."
                : "© 2024 QMenus. All rights reserved."}
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              {footerLinks.legal.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
