"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api, publicApi } from "@/lib/api";
import { number } from "zod";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  currency: string;
  duration: number;
  maxTables: number;
  maxMenus: number;
  maxCategories: number;
  maxItems: number;
  canCustomizeTheme: boolean;
  features: string[];
  isFree: boolean;
}

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
  images: string[] | null;
}

export default function HomePage() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactSection, setContactSection] = useState<ContactSection | null>(
    null
  );
  const [contactLoading, setContactLoading] = useState(true);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.restaurant) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    fetchPlans();
    fetchContactSection();
  }, []);

  useEffect(() => {
    // Elements are visible by default, animation is just for visual effect
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "100px" }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => {
      // Mark as visible immediately (elements are visible by default)
      el.classList.add("visible");
      // Observe for re-animation on scroll if needed
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/public/plans");
      if (response.data.success) {
        setPlans(response.data.data.plans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactSection = async () => {
    try {
      const response = await publicApi.get("/section/type/CONTACT");
      if (response.data.success && response.data.data.sections.length > 0) {
        setContactSection(response.data.data.sections[0]);
      }
    } catch (error) {
      console.error("Error fetching contact section:", error);
    } finally {
      setContactLoading(false);
    }
  };

  const formatCurrency = (price: number, currency: string) => {
    if (price === 0) return isRTL ? "مجاني" : "Free";
    return `${price} ${currency === "SYP" ? (isRTL ? "ل.س" : "SYP") : currency}`;
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render the page if user is authenticated (will be redirected)
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-poppins">
      <Header />

      {/* Hero Section - TemplateMo Style */}
      <div
        id="home"
        className="main-banner bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center -mt-24 md:-mt-28 pt-24 md:pt-28"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex flex-col lg:flex-row lg:justify-between gap-10 items-center">
            <div className="col-lg-6 lg:w-1/2">
              <div className="owl-carousel owl-banner">
                <div className="item header-text text-center lg:text-left">
                  <h6 className="text-lg font-medium text-tm-blue dark:text-tm-orange mb-4">
                    {isRTL
                      ? "Q-Menus — منصة إدارة المطاعم والكافيهات الذكية"
                      : "Q-Menus — Smart Management for Restaurants & Cafes"}
                  </h6>
                  <h2
                    className={`${isRTL ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"} font-bold text-gray-900 dark:text-white mb-6 leading-tight`}
                  >
                    {isRTL ? (
                      <>
                        <em className="text-tm-blue not-italic">ادارة مطعمك</em>{" "}
                        بذكاء مع{" "}
                        <span className="text-tm-orange">Q-Menu's</span>
                      </>
                    ) : (
                      <>
                        Smarter ops with {""}
                        <em className="text-tm-blue not-italic">QR menus</em>
                      </>
                    )}
                  </h2>
                  <p
                    className={`text-lg ${isRTL ? "" : "md:text-base"} text-gray-600 dark:text-gray-300 mb-8 leading-relaxed`}
                  >
                    {isRTL
                      ? "منصة متكاملة لإنشاء قوائم QR تفاعلية، استقبال الطلبات وإدارتها لحظياً، عرض المطبخ، تقارير المبيعات، وحدود الخطط بحسب حجم عملك."
                      : "All‑in‑one: QR menus, real‑time orders, kitchen display, analytics."}
                  </p>
                  <div className="down-buttons flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                    <div className="main-blue-button-hover">
                      <Link
                        href="/auth/register"
                        className="inline-block bg-tm-blue hover:bg-tm-orange text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
                      >
                        {isRTL ? "ابدأ الآن" : "Get Started Now"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 lg:w-1/2 mt-12 lg:mt-0">
              <div className="right-image">
                <img
                  src="/images/hero.jpg"
                  alt="Restaurant Management"
                  className="w-full h-auto blob-mask blob-border shadow-2xl dark:shadow-none"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f3f4f6'/%3E%3Ctext x='300' y='200' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='18'%3ERestaurant Hero Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Services Section - TemplateMo Style */}
      <div
        id="services"
        className="our-services section py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="services-right-dec absolute top-0 right-0 w-32 h-32 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="services-left-dec absolute bottom-0 left-0 w-24 h-24 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex justify-center mb-16">
            <div className="col-lg-6 lg:w-1/2 text-center">
              <div className="section-heading animate-on-scroll">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {isRTL ? (
                    <>
                      نحن <em className="text-tm-blue not-italic">نقدم</em> أفضل
                      الخدمات مع{" "}
                      <span className="text-tm-orange">أدواتنا الذكية</span>
                    </>
                  ) : (
                    <>
                      We <em className="text-tm-blue not-italic">Provide</em>{" "}
                      The Best Service With{" "}
                      <span className="text-tm-orange">Our Smart Tools</span>
                    </>
                  )}
                </h2>
                <span className="text-4xl font-bold text-tm-blue mt-5  uppercase">
                  {isRTL ? "(خدماتنا)" : "(Our Services)"}
                </span>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-12">
              <div className="owl-carousel owl-services grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.1s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "قوائم رقمية QR" : "QR Digital Menus"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-tm-blue rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? " اطبع أكواد للطاولات و صمّم قوائم جميلة متعددة اللغات مع صور وأسعار وعناصر إضافية وتحديث فوري."
                      : "Design beautiful multi‑language menus with photos, prices, add‑ons, and instant updates."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.2s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL
                      ? "إدارة الطلبات لحظياً"
                      : "Real‑time Order Management"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-tm-orange rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M3 3a2 2 0 012-2h2l1 2h6a2 2 0 012 2v2H5a2 2 0 00-2 2v8H2V5a2 2 0 011-1.732V3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "إدارة الطلبات من الطاولات أو QR مع تنبيهات فورية وحالة الطلب حتى التسليم."
                      : "Manage dine‑in and QR orders with instant notifications and statuses until served."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.3s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "واتساب المطبخ" : "WhatsApp to Kitchen"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M4 3h12a1 1 0 011 1v7H3V4a1 1 0 011-1zm-1 9h14v3a1 1 0 01-1 1H8l-3 2v-2H4a1 1 0 01-1-1v-3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? " تكامل واتساب للمطبخ لتسريع التحضير وتقليل الأخطاء."
                      : "KDS kitchen screen and WhatsApp‑to‑kitchen integration to speed preparation and reduce errors."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.4s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "تحليلات وتقارير" : "Analytics & Reports"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M3 3h2v14H3V3zm4 6h2v8H7V9zm4-4h2v12h-2V5zm4 2h2v10h-2V7z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "لوحات مؤشرات وتقارير مبيعات وتتبّع الأداء لاتخاذ قرارات أسرع."
                      : "Dashboards, sales reports, and performance tracking for faster decisions."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.5s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "لوحة المطبخ" : "Kitchen Display Screen"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "شاشة عرض احترافية للمطبخ لعرض الطلبات الجديدة وتتبع حالة التحضير بشكل منظم وسهل."
                      : "Professional kitchen display screen to view new orders and track preparation status in an organized and easy way."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.6s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL
                      ? "الفواتير والاشتراكات"
                      : "Invoices & Subscriptions"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "إدارة الفواتير والاشتراكات بسهولة ومتابعة مدفوعاتك."
                      : "Manage invoices and subscriptions easily and track your payments."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.7s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "دعم متعدد اللغات" : "Multi-language Support"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-cyan-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "دعم كامل للغة العربية والإنجليزية في جميع أجزاء المنصة."
                      : "Full support for Arabic and English across all platform sections."}
                  </p>
                </div>

                <div
                  className="item text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 hover:transform hover:scale-105 animate-on-scroll"
                  style={{ animationDelay: "0.8s" }}
                >
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {isRTL ? "عملات متعددة" : "Multiple Currencies"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "إضافة عملات متعددة وتحويل الأسعار تلقائياً لأي عملة تريدها لعملائك."
                      : "Add multiple currencies and automatically convert prices to any currency you want for your customers."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section - TemplateMo Style */}
      <div
        id="features"
        className="about-us section py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="about-right-dec absolute top-0 right-0 w-32 h-32 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="about-left-dec absolute bottom-0 left-0 w-24 h-24 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex flex-col lg:flex-row items-center lg:justify-between gap-10">
            <div className="col-lg-6 lg:w-1/2 mb-12 lg:mb-0">
              <div className="left-image animate-on-scroll">
                <img
                  src="/images/ourservises.jpg"
                  alt="Restaurant Management Team"
                  className="w-full h-auto about-mask shadow-lg dark:shadow-gray-900/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f3f4f6'/%3E%3Ctext x='300' y='200' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='18'%3EAbout Restaurant Team%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
            <div className="col-lg-6 lg:w-1/2 mt-6 lg:mt-0">
              <div className="section-heading animate-on-scroll">
                <h2 className="text-3xl text-center md:text-start md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {isRTL ? (
                    <>
                      نمّي مطعمك مع{" "}
                      <em className="text-tm-blue not-italic">
                        أدواتنا الذكية
                      </em>{" "}
                      و <span className="text-tm-orange">إدارة المطعم</span>
                    </>
                  ) : (
                    <>
                      Grow your restaurant with our{" "}
                      <em className="text-tm-blue not-italic">Smart Tools</em> &{" "}
                      <span className="text-tm-orange">
                        Restaurant Management
                      </span>
                    </>
                  )}
                </h2>
                <p className="text-lg text-center md:text-start text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {isRTL
                    ? "QMenus تبسّط عملك اليومي: إنشاء القوائم، تلقي الطلبات، متابعة التحضير، وإصدار تقارير واضحة. نوفر حدوداً وخيارات تناسب كل خطة."
                    : "QMenus streamlines your day: build menus, receive orders, track preparation, and get clear reports. Plans include limits and features that fit your stage."}
                </p>
                <div className="row grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-lg-4">
                    <div
                      className="fact-item text-center animate-on-scroll"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <div className="count-area-content">
                        <div className="icon mb-4 flex justify-center">
                          <div className="w-16 h-16 bg-tm-blue rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="count-digit text-2xl font-bold text-tm-blue mb-2">
                          {isRTL ? "بيتا" : "Beta"}
                        </div>
                        <div className="count-title text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {isRTL ? "لماذا Q-Menus؟" : "Why Q-Menus?"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {isRTL
                            ? "منصة مُصمّمة لقوائم QR وتدفق الطلبات من المسح حتى التقديم ."
                            : "Purpose‑built for QR menus and order flow from scan to serve."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div
                      className="fact-item text-center animate-on-scroll"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <div className="count-area-content">
                        <div className="icon mb-4 flex justify-center">
                          <div className="w-16 h-16 bg-tm-orange rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                            </svg>
                          </div>
                        </div>
                        <div className="count-digit text-2xl font-bold text-tm-orange mb-2">
                          {isRTL ? "جاهزة" : "Ready"}
                        </div>
                        <div className="count-title text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {isRTL ? "تخصيص القائمة" : "Menu Customization"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {isRTL
                            ? "اضف شعار مطعمك وهويته البصرية وخصص تصميم قائمة الطعام الخاصة بك بسهولة."
                            : "Add your restaurant logo and visual identity, and customize your menu design easily."}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div
                      className="fact-item text-center animate-on-scroll"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <div className="count-area-content">
                        <div className="icon mb-4 flex justify-center">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                        </div>
                        <div className="count-digit text-2xl font-bold text-green-500 mb-2">
                          {isRTL ? "ديمو" : "Demo"}
                        </div>
                        <div className="count-title text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {isRTL
                            ? "جرّب قبل الاشتراك"
                            : "Try before subscribing"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {isRTL
                            ? "اطلب عرضاً تجريبياً مجانياً وتأكد من الملاءمة لعملك."
                            : "Request a free demo and confirm the fit for your business."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div
        id="mission"
        className="mission-vision section py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex justify-center mb-16">
            <div className="col-lg-8 lg:w-2/3 text-center">
              <div className="section-heading animate-on-scroll">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {isRTL ? (
                    <>
                      <em className="text-tm-blue not-italic">رسالتنا</em> و{" "}
                      <span className="text-tm-orange">مهمتنا</span>
                    </>
                  ) : (
                    <>
                      Our <em className="text-tm-blue not-italic">Message</em> &{" "}
                      <span className="text-tm-orange">Mission</span>
                    </>
                  )}
                </h2>
              </div>
            </div>
          </div>

          <div className="row grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Mission */}
            <div
              className="col-lg-6 animate-on-scroll"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="bg-gradient-to-br from-tm-blue/10 to-tm-blue/5 dark:from-tm-blue/20 dark:to-tm-blue/10 p-8 rounded-lg h-full border border-tm-blue/20 dark:border-tm-blue/30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-tm-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? "مهمتنا" : "Our Mission"}
                  </h3>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isRTL
                    ? "نهدف إلى تمكين المطاعم والكافيهات من تحويل تجربة عملائها من خلال حلول تقنية مبتكرة وسهلة الاستخدام. نسعى لجعل إدارة المطاعم أكثر كفاءة وأقل تعقيداً، مما يسمح لأصحاب الأعمال بالتركيز على ما يهم حقاً: تقديم تجربة استثنائية لعملائهم."
                    : "We aim to empower restaurants and cafes to transform their customers' experience through innovative and user-friendly technological solutions. We strive to make restaurant management more efficient and less complex, allowing business owners to focus on what truly matters: delivering an exceptional experience to their customers."}
                </p>
              </div>
            </div>

            {/* Vision */}
            <div
              className="col-lg-6 animate-on-scroll"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-tm-orange/10 to-tm-orange/5 dark:from-tm-orange/20 dark:to-tm-orange/10 p-8 rounded-lg h-full border border-tm-orange/20 dark:border-tm-orange/30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-tm-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? "رؤيتنا" : "Our Vision"}
                  </h3>
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isRTL
                    ? "نطمح لأن نكون الخيار الأول للمطاعم والكافيهات في المنطقة، من خلال تقديم منصة شاملة تجمع بين البساطة والقوة. نؤمن بأن التكنولوجيا يجب أن تعزز التجربة البشرية، وليس أن تحل محلها. نسعى لبناء مجتمع من أصحاب المطاعم الناجحين الذين يستفيدون من أدواتنا لتحقيق نمو مستدام ورضا عملاء استثنائي."
                    : "We aspire to be the first choice for restaurants and cafes in the region by offering a comprehensive platform that combines simplicity and power. We believe technology should enhance the human experience, not replace it. We strive to build a community of successful restaurant owners who leverage our tools to achieve sustainable growth and exceptional customer satisfaction."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div
        id="how-it-works"
        className="how-it-works section py-20 bg-gray-50 dark:bg-gray-800 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex justify-center mb-16">
            <div className="col-lg-8 lg:w-2/3 text-center">
              <div className="section-heading animate-on-scroll">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {isRTL ? (
                    <>
                      <em className="text-tm-blue not-italic">كيف</em> نعمل
                    </>
                  ) : (
                    <>
                      <em className="text-tm-blue not-italic">How</em> It Works
                    </>
                  )}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
                  {isRTL
                    ? "ابدأ رحلتك معنا في 4 خطوات بسيطة"
                    : "Start your journey with us in 4 simple steps"}
                </p>
              </div>
            </div>
          </div>

          <div className="row relative">
            {/* Connecting Line - Desktop Horizontal, Mobile Vertical */}
            <div
              className={`hidden lg:block absolute top-8 ${isRTL ? "right-0 left-20" : "left-0 right-20"} h-1 bg-gradient-to-r ${isRTL ? "from-purple-600 via-green-500 via-tm-orange to-tm-blue" : "from-tm-blue via-tm-orange via-green-500 to-purple-600"} opacity-30 rounded-full z-0`}
              style={{ width: "calc(100% - 5rem)" }}
            ></div>
            <div
              className={`lg:hidden absolute ${isRTL ? "right-10" : "left-10"} top-0 bottom-0 w-1 bg-gradient-to-b from-tm-blue via-tm-orange via-green-500 to-purple-600 opacity-30 rounded-full z-0`}
            ></div>

            {/* Steps Grid */}
            <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6 z-10">
              {/* Step 1 */}
              <div
                className="relative animate-on-scroll"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-tm-blue to-tm-blue/80 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                      <span className="text-xl font-bold text-white">1</span>
                    </div>
                  </div>
                  <div className="pt-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {isRTL ? "سجل حسابك" : "Sign Up"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "أنشئ حساباً مجانياً في دقائق. لا حاجة لبطاقة ائتمان للبدء."
                        : "Create a free account in minutes. No credit card required to get started."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className="relative animate-on-scroll"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-tm-orange to-tm-orange/80 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                      <span className="text-xl font-bold text-white">2</span>
                    </div>
                  </div>
                  <div className="pt-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {isRTL ? "أضف معلومات مطعمك" : "Add Your Restaurant Info"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "أدخل تفاصيل مطعمك، أضف شعارك وخصص هويتك البصرية بسهولة."
                        : "Enter your restaurant details, add your logo and customize your visual identity easily."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className="relative animate-on-scroll"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                      <span className="text-xl font-bold text-white">3</span>
                    </div>
                  </div>
                  <div className="pt-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {isRTL ? "صمم قائمتك" : "Design Your Menu"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "أنشئ قائمة رقمية جميلة، أضف العناصر والصور واطبع أكواد QR للطاولات."
                        : "Create a beautiful digital menu, add items and photos, and print QR codes for tables."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className="relative animate-on-scroll"
                style={{ animationDelay: "0.4s" }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 dark:border-gray-700 h-full">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-gray-800">
                      <span className="text-xl font-bold text-white">4</span>
                    </div>
                  </div>
                  <div className="pt-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                      {isRTL ? "ابدأ العمل" : "Start Operating"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isRTL
                        ? "ابدأ استقبال الطلبات، إدارة المطبخ، ومتابعة المبيعات بكل سهولة."
                        : "Start receiving orders, managing your kitchen, and tracking sales with ease."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row flex justify-center mt-12">
            <div className="col-lg-8 text-center">
              <Link
                href="/auth/register"
                className="inline-block bg-gradient-to-r from-tm-blue to-tm-orange hover:from-tm-blue/90 hover:to-tm-orange/90 text-white font-medium py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {isRTL ? "ابدأ الآن مجاناً" : "Start Free Now"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section - TemplateMo Style */}
      <div
        id="plans"
        className="pricing-tables py-20 bg-white dark:bg-gray-900 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="tables-left-dec absolute top-0 left-0 w-32 h-32 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-orange-500 rounded-full"></div>
        </div>
        <div className="tables-right-dec absolute bottom-0 right-0 w-24 h-24 opacity-10 dark:opacity-5">
          <div className="w-full h-full bg-gradient-to-tr from-orange-500 to-blue-500 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex justify-center mb-16">
            <div className="col-lg-6 lg:w-1/2 text-center">
              <div className="section-heading animate-on-scroll">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  {isRTL ? (
                    <>
                      اختر <em className="text-tm-blue not-italic">خطة</em>{" "}
                      مناسبة لمشروعك{" "}
                      <span className="text-tm-orange">التالي</span>
                    </>
                  ) : (
                    <>
                      Select a suitable{" "}
                      <em className="text-tm-blue not-italic">plan</em> for your
                      next <span className="text-tm-orange">projects</span>
                    </>
                  )}
                </h2>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tm-blue"></div>
            </div>
          ) : (
            <div className="row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`col-lg-3 ${index === 1 ? "lg:transform lg:scale-105" : ""} h-full`}
                >
                  <div
                    className={`item ${index === 0 ? "first-item" : index === 1 ? "second-item" : "third-item"} p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 relative ${index === 1 ? "ring-2 ring-tm-orange" : ""} h-full flex flex-col`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-tm-orange text-white px-4 py-1 rounded-full text-sm font-medium">
                          {isRTL ? "الأكثر شعبية" : "Most Popular"}
                        </span>
                      </div>
                    )}

                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                      {isRTL ? plan.nameAr : plan.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                      {isRTL ? plan.descriptionAr : plan.description}
                    </p>
                    <div className="text-center mb-6">
                      <em className="text-3xl font-bold text-tm-blue">
                        {formatCurrency(Number(plan.price), plan.currency)}
                      </em>
                      {plan.duration > 0 && (
                        <span className="block text-gray-500 dark:text-gray-400 text-sm mt-2">
                          {isRTL
                            ? `لمدة ${plan.duration} يوم`
                            : `for ${plan.duration} days`}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {isRTL
                            ? `${plan.maxTables} طاولة`
                            : `${plan.maxTables} Tables`}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {isRTL
                            ? `${plan.maxCategories} فئة`
                            : `${plan.maxCategories} Categories`}
                        </span>
                      </li>
                      <li className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500 mr-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">
                          {isRTL
                            ? `${plan.maxItems} عنصر لكل فئة`
                            : `${plan.maxItems} Items per Category`}
                        </span>
                      </li>
                      {plan.canCustomizeTheme && (
                        <li className="flex items-center">
                          <svg
                            className="h-5 w-5 text-green-500 mr-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-700 dark:text-gray-300">
                            {isRTL ? "تخصيص التصميم" : "Custom Design"}
                          </span>
                        </li>
                      )}
                    </ul>

                    <div className="main-blue-button-hover text-center mt-auto">
                      <Link
                        href="/auth/register"
                        className="inline-block bg-tm-blue hover:bg-tm-orange text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
                      >
                        {isRTL ? "ابدأ الآن" : "Get Started"}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section - Sign up encouragement */}
      <div className="subscribe py-20 bg-gradient-to-br from-blue-500 to-orange-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row">
            <div className="col-lg-12">
              <div className="inner-content text-center">
                <div className="row flex justify-center">
                  <div className="col-lg-10 lg:w-4/5">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                      {isRTL
                        ? "ابدأ رحلتك مع QMenus — أنشئ حساب مطعمك الآن"
                        : "Start your QMenus journey — create your restaurant account now"}
                    </h2>
                    <p className="max-w-2xl mx-auto text-white/90 mb-8">
                      {isRTL
                        ? "قوائم QR تفاعلية، إدارة طلبات لحظية، ولوحة مطبخ — كل ما تحتاجه في منصة واحدة."
                        : "Interactive QR menus, real‑time orders, and a kitchen screen — everything in one platform."}
                    </p>
                    <div className="flex justify-center">
                      <Link
                        href="/auth/register"
                        className="inline-block bg-white text-tm-blue hover:bg-gray-100 font-medium py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105"
                      >
                        {isRTL ? "ابدأ مجاناً الآن" : "Start free now"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      {contactSection && (
        <div
          id="contact"
          className="contact-section py-20 bg-gray-50 dark:bg-gray-800"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {isRTL ? contactSection.titleAr : contactSection.title}
              </h2>
              {(contactSection.description || contactSection.descriptionAr) && (
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {isRTL
                    ? contactSection.descriptionAr
                    : contactSection.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Contact Info */}
              {contactSection.attributes &&
                contactSection.attributes.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                      {isRTL ? "معلومات التواصل" : "Contact Information"}
                    </h3>
                    <div className="space-y-4">
                      {contactSection.attributes.map((attr, index) => {
                        const key = isRTL ? attr.keyAr : attr.key;
                        const value = isRTL ? attr.valueAr : attr.value;

                        if (index === 0) {
                          // Address
                          return (
                            <div key={index} className="flex items-start">
                              <svg
                                className="h-6 w-6 text-tm-blue mr-3 mt-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {key}
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                  {value}
                                </p>
                              </div>
                            </div>
                          );
                        } else if (index === 1) {
                          // Phone
                          return (
                            <div key={index} className="flex items-start">
                              <svg
                                className="h-6 w-6 text-tm-blue mr-3 mt-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {key}
                                </p>
                                <a
                                  href={`tel:${value}`}
                                  className="text-tm-blue hover:text-tm-orange transition-colors"
                                >
                                  {value}
                                </a>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

              {/* Images */}
              {contactSection.images && contactSection.images.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                  {contactSection.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${isRTL ? contactSection.titleAr : contactSection.title} ${index + 1}`}
                      className="w-full h-auto rounded-lg shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='18'%3EContact Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
