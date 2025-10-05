"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchPlans();
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="relative md:mx-20 my-10 rounded-3xl bg-gradient-to-br from-orange-200 via-orange-400 to-amber-500 text-white shadow-2xl overflow-hidden">
        {/* Animated background layers */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-orange-300/30 to-transparent rounded-3xl"></div>

        {/* Floating background elements */}
        <div
          className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-bounce"
          style={{ animationDelay: "0s", animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-20 right-20 w-16 h-16 bg-orange-200/20 rounded-full animate-bounce"
          style={{ animationDelay: "1s", animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-12 h-12 bg-amber-200/15 rounded-full animate-bounce"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        ></div>
        <div
          className="absolute bottom-10 right-10 w-24 h-24 bg-white/3 rounded-full animate-bounce"
          style={{ animationDelay: "0.5s", animationDuration: "6s" }}
        ></div>

        {/* Subtle gradient animation */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent drop-shadow-lg p-2 animate-fade-in-up">
              {isRTL
                ? "مستقبل المطاعم يبدأ هنا"
                : "The Future of Restaurants Starts Here"}
            </h1>
            <p
              className="text-xl md:text-2xl mb-8 text-orange-50 max-w-3xl mx-auto drop-shadow-md animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {isRTL
                ? "المنصة الأولى في سوريا لإدارة المطاعم . حوّل مطعمك إلى تجربة ذكية مع قوائم QR تفاعلية وإدارة طلبات متطورة."
                : "Syria's #1 Restaurant Management Platform. Transform your restaurant into a smart experience with interactive QR menus and advanced order management."}
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className=" mt-1 text-orange-500 hover:bg-orange-50 hover:text-orange-300 shadow-lg hover:shadow-xl transition-all duration-500 font-semibold  transform ease-out"
                >
                  {isRTL ? "ابدأ مجاناً" : "Start Free"}
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  size="lg"
                  className="border-2 border-white/80 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white transition-all duration-500 font-semibold shadow-lg  transform ease-out"
                >
                  {isRTL ? "اكتشف المميزات" : "Discover Features"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL
                ? "مميزات رائعة لمطعمك"
                : "Amazing Features for Your Restaurant"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {isRTL
                ? "أدوات متقدمة لإدارة مطعمك بكفاءة وسهولة"
                : "Advanced tools to manage your restaurant efficiently and easily"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg
                  className="h-8 w-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRTL ? "قوائم رقمية تفاعلية" : "Interactive Digital Menus"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "أنشئ قوائم طعام رقمية جذابة وسهلة التحديث"
                  : "Create attractive and easy-to-update digital menus"}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg
                  className="h-8 w-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRTL ? "أكواد QR سريعة" : "Quick QR Codes"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "ولد أكواد QR فورية للطاولات والطلبات"
                  : "Generate instant QR codes for tables and orders"}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg
                  className="h-8 w-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRTL ? "تقارير مفصلة" : "Detailed Reports"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "احصل على تقارير شاملة عن المبيعات والأداء"
                  : "Get comprehensive reports on sales and performance"}
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <svg
                  className="h-8 w-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isRTL ? "دعم فني 24/7" : "24/7 Technical Support"}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {isRTL
                  ? "فريق دعم متاح على مدار الساعة لمساعدتك"
                  : "Support team available around the clock to help you"}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isRTL
                ? "اختر الخطة المناسبة لك"
                : "Choose the Right Plan for You"}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {isRTL
                ? "خطط مرنة تناسب جميع أحجام المطاعم"
                : "Flexible plans that suit all restaurant sizes"}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-8 relative ${plan.price === "50000" ? "ring-2 ring-primary-600" : ""}`}
                >
                  {plan.price === "50000" && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        {isRTL ? "الأكثر شعبية" : "Most Popular"}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {isRTL ? plan.nameAr : plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {isRTL ? plan.descriptionAr : plan.description}
                    </p>
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {formatCurrency(Number(plan.price), plan.currency)}
                    </div>
                    {plan.duration > 0 && (
                      <p className="text-gray-500 text-sm">
                        {isRTL
                          ? `لمدة ${plan.duration} يوم`
                          : `for ${plan.duration} days`}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
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

                  <Link href="/auth/register" className="block">
                    <Button
                      className={`w-full ${plan.isFree ? "bg-primary-600 hover:bg-primary-700" : ""}`}
                      variant={plan.price === "50000" ? "primary" : "outline"}
                    >
                      {isRTL ? "ابدأ الآن" : "Get Started"}
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 my-10 md:mx-20 rounded-3xl bg-gradient-to-br from-orange-300 via-red-500 to-orange-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isRTL
              ? "جاهز لبدء رحلتك الرقمية؟"
              : "Ready to Start Your Digital Journey?"}
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            {isRTL
              ? "انضم إلى آلاف المطاعم التي تثق في QMenus لإدارة عملياتها"
              : "Join thousands of restaurants that trust QMenus to manage their operations"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-200"
              >
                {isRTL ? "ابدأ مجاناً الآن" : "Start Free Now"}
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                {isRTL ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
