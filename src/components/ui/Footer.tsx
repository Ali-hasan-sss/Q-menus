"use client";

import { useLanguage } from "@/contexts/LanguageContext";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  const { isRTL, language } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <span>
                {isRTL
                  ? `© ${currentYear} QMenus. جميع الحقوق محفوظة.`
                  : `© ${currentYear} QMenus. All rights reserved.`}
              </span>
            </div>

            <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-gray-600 dark:text-gray-400">
              <span>
                {isRTL
                  ? "منصة إدارة المطاعم الذكية"
                  : "Smart Restaurant Management Platform"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
