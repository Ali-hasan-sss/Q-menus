"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Logo } from "@/components/ui/Logo";

export default function Footer() {
  const { isRTL } = useLanguage();

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
                ? "منصة رقمية متكاملة لإدارة قوائم الطعام والمطاعم. اجعل مطعمك أكثر ذكاءً وحديثاً مع حلولنا المبتكرة."
                : "A comprehensive digital platform for managing restaurant menus and operations. Make your restaurant smarter and more modern with our innovative solutions."}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">{item.name}</span>
                  {item.icon}
                </a>
              ))}
            </div>
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
