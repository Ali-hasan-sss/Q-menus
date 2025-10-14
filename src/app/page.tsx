"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { number } from "zod";

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

export default function HomePage() {
  const { isRTL } = useLanguage();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

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

  const formatCurrency = (price: number, currency: string) => {
    if (price === 0) return isRTL ? "مجاني" : "Free";
    return `${price} ${currency === "SYP" ? (isRTL ? "ل.س" : "SYP") : currency}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-poppins">
      <Header />

      {/* Hero Section - TemplateMo Style */}
      <div className="main-banner bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen flex items-center -mt-24 md:-mt-28 pt-24 md:pt-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="row flex flex-col lg:flex-row lg:justify-between gap-10 items-center">
            <div className="col-lg-6 lg:w-1/2">
              <div className="owl-carousel owl-banner">
                <div className="item header-text text-center lg:text-left">
                  <h6 className="text-lg font-medium text-tm-blue dark:text-tm-orange mb-4">
                    {isRTL
                      ? "QMenus — منصة إدارة المطاعم والكافيهات الذكية"
                      : "QMenus — Smart Management for Restaurants & Cafes"}
                  </h6>
                  <h2
                    className={`${isRTL ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"} font-bold text-gray-900 dark:text-white mb-6 leading-tight`}
                  >
                    {isRTL ? (
                      <>
                        <em className="text-tm-blue not-italic">أدر مطعمك</em>{" "}
                        بذكاء مع{" "}
                        <span className="text-tm-orange">قوائم QR</span>
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
                      الخدمات مع <span className="text-tm-orange">أدواتنا</span>
                    </>
                  ) : (
                    <>
                      We <em className="text-tm-blue not-italic">Provide</em>{" "}
                      The Best Service With{" "}
                      <span className="text-tm-orange">Our Tools</span>
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
                      ? "صمّم قوائم جميلة متعددة اللغات مع صور وأسعار وعناصر إضافية وتحديث فوري."
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
                    {isRTL
                      ? "عرض المطبخ وواتساب المطبخ"
                      : "Kitchen Display & WhatsApp"}
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
                      ? "لوحة عرض المطبخ KDS وتكامل واتساب للمطبخ لتسريع التحضير وتقليل الأخطاء."
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section - TemplateMo Style */}
      <div
        id="about"
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
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                  {isRTL ? (
                    <>
                      نمّي مطعمك مع{" "}
                      <em className="text-tm-blue not-italic">
                        أدواتنا الذكية
                      </em>{" "}
                      و <span className="text-tm-orange">إدارة المشاريع</span>
                    </>
                  ) : (
                    <>
                      Grow your restaurant with our{" "}
                      <em className="text-tm-blue not-italic">Smart Tools</em> &{" "}
                      <span className="text-tm-orange">Project Management</span>
                    </>
                  )}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
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
                          {isRTL ? "لماذا QMenus؟" : "Why QMenus?"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {isRTL
                            ? "منصة مُصمّمة لقوائم QR وتدفق الطلبات من المسح حتى التقديم."
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
                          {isRTL ? "منصة ناشئة" : "Early‑stage Platform"}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {isRTL
                            ? "نستقبل المطاعم الأوائل للتجربة وإبداء الملاحظات."
                            : "Onboarding early restaurants for pilot and feedback."}
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

      {/* Pricing Section - TemplateMo Style */}
      <div
        id="pricing"
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
      <div
        id="subscribe"
        className="subscribe py-20 bg-gradient-to-br from-blue-500 to-orange-500 text-white"
      >
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

      <Footer />
    </div>
  );
}
