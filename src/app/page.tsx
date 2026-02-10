"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useAuth } from "@/store/hooks/useAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api, publicApi } from "@/lib/api";
import { number } from "zod";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  BarChart3,
  Monitor,
  Search,
  Languages,
  CircleDollarSign,
  LayoutList,
  Star,
  Target,
  Eye,
  Check,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  billingPeriod?: string;
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
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<string>("MONTHLY");
  const [contactSection, setContactSection] = useState<ContactSection | null>(
    null,
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
      { threshold: 0.01, rootMargin: "100px" },
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
                  <div
                    className={`down-buttons flex flex-col sm:flex-row gap-4 sm:justify-center ${isRTL ? "lg:justify-end" : "lg:justify-start"}`}
                  >
                    <div className="main-blue-button-hover">
                      <Link
                        href="/auth/register"
                        className="inline-block bg-tm-blue hover:bg-tm-orange text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
                      >
                        {isRTL ? "ابدأ الآن" : "Get Started Now"}
                      </Link>
                    </div>
                    <Link
                      href="/discover"
                      className="inline-block border-2 border-tm-orange text-tm-orange hover:bg-tm-orange hover:text-white dark:border-tm-orange dark:text-tm-orange dark:hover:bg-tm-orange dark:hover:text-white font-medium py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 text-center"
                    >
                      {isRTL
                        ? "تصفح أطباق المطاعم"
                        : "Explore Restaurant Dishes"}
                    </Link>
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
                      <CheckCircle2
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                      <ClipboardList
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                      <MessageCircle
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                      <BarChart3
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                      <Monitor className="w-8 h-8 text-white" strokeWidth={2} />
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
                      ? "البحث عن المطاعم"
                      : "Restaurant Search"}
                  </h4>
                  <div className="icon mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Search
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {isRTL
                      ? "قائمتك تصبح متاحة للجميع: يمكن للعملاء الوصول إليك عبر البحث باسم مطعمك أو عبر أصناف وأطباق قائمتك."
                      : "Your menu becomes discoverable by everyone: customers can find you by your restaurant name or by browsing your categories and dishes."}
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
                      <Languages
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                      <CircleDollarSign
                        className="w-8 h-8 text-white"
                        strokeWidth={2}
                      />
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
                <div className="text-lg text-center md:text-start text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {isRTL ? (
                    <>
                      <span className="text-primary-600">QMenus</span> تبسّط
                      عملك اليومي: إنشاء القوائم، تلقي الطلبات، متابعة التحضير،
                      وإصدار تقارير واضحة. نوفر حدوداً وخيارات تناسب كل خطة.
                    </>
                  ) : (
                    <>
                      <span className="text-primary-600">QMenus</span>{" "}
                      streamlines your day: build menus, receive orders, track
                      preparation, and get clear reports. Plans include limits
                      and features that fit your stage.
                    </>
                  )}
                </div>
                <div className="row grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-lg-4">
                    <div
                      className="fact-item text-center animate-on-scroll"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <div className="count-area-content">
                        <div className="icon mb-4 flex justify-center">
                          <div className="w-16 h-16 bg-tm-blue rounded-full flex items-center justify-center">
                            <CheckCircle2
                              className="w-8 h-8 text-white"
                              strokeWidth={2}
                            />
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
                            <LayoutList
                              className="w-8 h-8 text-white"
                              strokeWidth={2}
                            />
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
                            <Star
                              className="w-8 h-8 text-white"
                              strokeWidth={2}
                            />
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
                    <Target className="w-8 h-8 text-white" strokeWidth={2} />
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
                    <Eye className="w-8 h-8 text-white" strokeWidth={2} />
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
                        ? "أنشئ حساباً مجانياً في دقائق ."
                        : "Create a free account in minutes."}
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

                {/* Billing Period Tabs */}
                <div className="flex justify-center mt-6 mb-4">
                  <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setSelectedBillingPeriod("MONTHLY")}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        selectedBillingPeriod === "MONTHLY"
                          ? "bg-white dark:bg-gray-600 text-tm-blue dark:text-tm-orange shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {isRTL ? "شهري" : "Monthly"}
                    </button>
                    <button
                      onClick={() => setSelectedBillingPeriod("YEARLY")}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        selectedBillingPeriod === "YEARLY"
                          ? "bg-white dark:bg-gray-600 text-tm-blue dark:text-tm-orange shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      {isRTL ? "سنوي" : "Yearly"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tm-blue"></div>
            </div>
          ) : (
            <div className="row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans
                .filter((plan) => {
                  // Filter by billing period
                  if (selectedBillingPeriod === "MONTHLY") {
                    return (
                      plan.billingPeriod === "MONTHLY" || !plan.billingPeriod
                    );
                  } else if (selectedBillingPeriod === "YEARLY") {
                    return plan.billingPeriod === "YEARLY";
                  }
                  return true;
                })
                .map((plan, index) => (
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
                        <span className="block text-gray-500 dark:text-gray-400 text-sm mt-2">
                          {plan.billingPeriod === "YEARLY"
                            ? isRTL
                              ? "سنوياً"
                              : "per year"
                            : isRTL
                              ? "شهرياً"
                              : "per month"}
                          {plan.duration > 0 && (
                            <span className="ml-1">
                              (
                              {isRTL
                                ? `لمدة ${plan.duration} يوم`
                                : `for ${plan.duration} days`}
                              )
                            </span>
                          )}
                        </span>
                      </div>

                      <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex items-center">
                          <Check
                            className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                            strokeWidth={2.5}
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {isRTL
                              ? `${plan.maxTables} طاولة`
                              : `${plan.maxTables} Tables`}
                          </span>
                        </li>
                        <li className="flex items-center">
                          <Check
                            className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                            strokeWidth={2.5}
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {isRTL
                              ? `${plan.maxCategories} فئة`
                              : `${plan.maxCategories} Categories`}
                          </span>
                        </li>
                        <li className="flex items-center">
                          <Check
                            className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                            strokeWidth={2.5}
                          />
                          <span className="text-gray-700 dark:text-gray-300">
                            {isRTL
                              ? `${plan.maxItems} عنصر لكل فئة`
                              : `${plan.maxItems} Items per Category`}
                          </span>
                        </li>
                        {plan.canCustomizeTheme && (
                          <li className="flex items-center">
                            <Check
                              className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                              strokeWidth={2.5}
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {isRTL ? "تخصيص التصميم" : "Custom Design"}
                            </span>
                          </li>
                        )}
                        {plan.features &&
                          plan.features.length > 0 &&
                          plan.features
                            .filter((feature) => {
                              const featureLower = feature.toLowerCase();

                              // Always show special features
                              if (
                                feature === "KITCHEN_DISPLAY_SYSTEM" ||
                                feature === "External Orders" ||
                                feature === "Priority Support"
                              ) {
                                return true;
                              }

                              // Skip features that are already displayed as static items
                              // Skip if it matches maxTables, maxCategories, or maxItems (already shown above)
                              if (
                                feature.includes(`${plan.maxTables} Tables`) ||
                                feature.includes(
                                  `${plan.maxCategories} Categories`,
                                ) ||
                                feature.includes(
                                  `${plan.maxItems} Items per Category`,
                                ) ||
                                feature.includes(`${plan.maxItems} Items`)
                              ) {
                                return false;
                              }

                              // Skip Custom Theme if canCustomizeTheme is true (already shown above)
                              if (
                                plan.canCustomizeTheme &&
                                (featureLower.includes("custom theme") ||
                                  featureLower.includes("theme") ||
                                  feature === "Custom Theme")
                              ) {
                                return false;
                              }

                              return true;
                            })
                            .map((feature, idx) => {
                              // Translate specific features
                              let displayFeature = feature;

                              if (feature === "KITCHEN_DISPLAY_SYSTEM") {
                                displayFeature = isRTL
                                  ? "لوحة المطبخ"
                                  : "Kitchen Display System";
                              } else if (feature === "External Orders") {
                                displayFeature = isRTL
                                  ? "طلبات خارجية"
                                  : "External Orders";
                              } else if (feature === "Priority Support") {
                                displayFeature = isRTL
                                  ? "دعم ذو أولوية"
                                  : "Priority Support";
                              } else if (feature.includes("Unlimited Tables")) {
                                displayFeature = isRTL
                                  ? "طاولات غير محدودة"
                                  : "Unlimited Tables";
                              } else if (
                                feature.includes("Unlimited Categories")
                              ) {
                                displayFeature = isRTL
                                  ? "فئات غير محدودة"
                                  : "Unlimited Categories";
                              } else if (feature.includes("Unlimited Items")) {
                                displayFeature = isRTL
                                  ? "أصناف غير محدودة"
                                  : "Unlimited Items";
                              } else if (feature.includes("Unlimited")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Unlimited/gi, "غير محدود")
                                  : feature;
                              } else if (feature.includes("1 Month Duration")) {
                                displayFeature = isRTL
                                  ? "مدة شهر واحد"
                                  : "1 Month Duration";
                              } else if (
                                feature.match(/\d+\s+Month\s+Duration/)
                              ) {
                                const months =
                                  feature.match(/(\d+)\s+Month/)?.[1];
                                displayFeature = isRTL
                                  ? `مدة ${months} ${months === "1" ? "شهر" : "أشهر"}`
                                  : feature;
                              } else if (feature.includes("Month Duration")) {
                                displayFeature = isRTL
                                  ? "مدة شهرية"
                                  : "Month Duration";
                              } else if (feature.match(/\d+\s+Month/)) {
                                const months =
                                  feature.match(/(\d+)\s+Month/)?.[1];
                                displayFeature = isRTL
                                  ? `${months} ${months === "1" ? "شهر" : "أشهر"}`
                                  : feature;
                              } else if (feature.includes("Month")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Month/gi, "شهر")
                                  : feature;
                              } else if (feature.includes("Duration")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Duration/gi, "مدة")
                                  : feature;
                              } else if (feature.includes("Tables")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Tables/gi, "طاولة")
                                  : feature;
                              } else if (feature.includes("Categories")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Categories/gi, "فئة")
                                  : feature;
                              } else if (feature.includes("Items")) {
                                displayFeature = isRTL
                                  ? feature.replace(/Items/gi, "صنف")
                                  : feature;
                              }

                              return (
                                <li key={idx} className="flex items-center">
                                  <Check
                                    className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                                    strokeWidth={2.5}
                                  />
                                  <span className="text-gray-700 dark:text-gray-300">
                                    {displayFeature}
                                  </span>
                                </li>
                              );
                            })}
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

      <Footer />
    </div>
  );
}
