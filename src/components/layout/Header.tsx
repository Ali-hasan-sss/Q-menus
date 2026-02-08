"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useTheme } from "next-themes";
import { useAuth } from "@/store/hooks/useAuth";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Header() {
  const { isRTL } = useLanguage();
  const { theme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const pathname = usePathname();

  const navigation = [
    { name: isRTL ? "الرئيسية" : "Home", href: "#home" },
    { name: isRTL ? "ابحث عن مطعم" : "Find a restaurant", href: "/discover" },
    { name: isRTL ? "الخدمات" : "Services", href: "#services" },
    { name: isRTL ? "المميزات" : "Features", href: "#features" },
    { name: isRTL ? "الخطط" : "Plans", href: "#plans" },
    { name: isRTL ? "اتصل بنا" : "Contact Us", href: "/contact" },
  ];

  // ✅ تحديد القسم النشط أثناء التمرير
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      const sections = ["home", "services", "features", "plans"];
      let current = "home";

      sections.forEach((id) => {
        const section = document.getElementById(id);
        if (section && window.scrollY >= section.offsetTop - 100) {
          current = id;
        }
      });

      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      const id = href.replace("#", "");
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
        setActiveSection(id);
      }
      setIsMobileMenuOpen(false);
    }
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith("/")) {
      window.location.href = href;
    } else if (pathname !== "/") {
      window.location.href = `/${href}`;
    } else {
      scrollToSection(href);
    }
  };

  return (
    <header className="bg-transparent backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 🔹 الشعار */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Logo size="lg" />
            </Link>
          </div>

          {/* 🔹 روابط سطح المكتب */}
          <nav className="hidden md:flex gap-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`relative pb-1 text-sm font-medium transition-colors ${
                  (pathname === "/contact" && item.href === "/contact") ||
                  (pathname === "/discover" && item.href === "/discover")
                    ? "text-tm-orange"
                    : activeSection === item.href.replace("#", "") &&
                        pathname === "/"
                      ? "text-tm-orange"
                      : "text-gray-700 dark:text-gray-300 hover:text-tm-orange"
                }`}
              >
                {item.name}
                {/* 🔸 الخط البرتقالي تحت التب النشط */}
                {(pathname === "/contact" && item.href === "/contact") ||
                (pathname === "/discover" && item.href === "/discover") ||
                (pathname === "/" &&
                  activeSection === item.href.replace("#", "")) ? (
                  <span className="absolute left-0 bottom-0 w-full h-[2px] bg-tm-orange rounded-full"></span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* 🔹 أزرار سطح المكتب */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageToggle />
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href={user?.role === "ADMIN" ? "/admin" : "/dashboard"}>
                <Button size="sm">{isRTL ? "لوحة التحكم" : "Dashboard"}</Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    {isRTL ? "تسجيل الدخول" : "Login"}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    {isRTL ? "إنشاء حساب" : "Get Started"}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* 🔹 زر القائمة للجوال */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-tm-orange p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 🔹 قائمة الجوال */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-2 pb-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    (pathname === "/contact" && item.href === "/contact") ||
                    (pathname === "/discover" && item.href === "/discover")
                      ? "text-tm-orange"
                      : activeSection === item.href.replace("#", "") &&
                          pathname === "/"
                        ? "text-tm-orange"
                        : "text-gray-700 dark:text-gray-300 hover:text-tm-orange"
                  }`}
                >
                  {item.name}
                </button>
              ))}
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <Link
                    href={user?.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className="block"
                  >
                    <Button size="sm" className="w-full">
                      {isRTL ? "لوحة التحكم" : "Dashboard"}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        {isRTL ? "تسجيل الدخول" : "Login"}
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="block">
                      <Button size="sm" className="w-full">
                        {isRTL ? "إنشاء حساب" : "Get Started"}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
