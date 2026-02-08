"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/store/hooks/useLanguage";
import { useAuth } from "@/store/hooks/useAuth";
import { api, publicApi, endpoints } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  type?: string;
  billingPeriod?: string;
  price: string;
  currency: string;
  duration: number;
  isFree?: boolean;
}

interface ActiveSubscription {
  planName: string;
  planNameAr?: string;
  price: string;
  currency: string;
  endDate?: string | null;
  status: string;
}

interface UserSubscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  plan: {
    id: string;
    name: string;
    nameAr?: string;
    price: string;
    currency: string;
    duration: number;
  };
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
  attributes: SectionAttribute[] | null;
}

export default function SubscriptionPage() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSubscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<string>("ALL");
  const [restaurant, setRestaurant] = useState<{
    name: string;
    nameAr?: string;
  } | null>(null);
  const [adminPhone, setAdminPhone] = useState<string>(
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "963994488858"
  ); // Fallback

  useEffect(() => {
    const run = async () => {
      try {
        const [plansRes, meRes, contactRes, restaurantRes] = await Promise.all([
          api.get("/public/plans"),
          api.get("/auth/me"),
          publicApi
            .get(endpoints.sections.getByType("CONTACT"))
            .catch(() => null),
          api.get("/restaurant").catch(() => null),
        ]);

        if (plansRes.data?.success) {
          setPlans(plansRes.data.data.plans || []);
        }
        if (meRes.data?.success) {
          const r = meRes.data.data.user?.restaurant;
          const subs: UserSubscription[] = (r?.subscriptions || []).map(
            (s: any) => ({
              id: s.id,
              status: s.status,
              startDate: s.startDate,
              endDate: s.endDate,
              plan: {
                id: s.plan.id,
                name: s.plan.name,
                nameAr: s.plan.nameAr,
                price: String(s.plan.price),
                currency: s.plan.currency,
                duration: s.plan.duration,
              },
            })
          );
          setSubscriptions(subs);
          const activeSub = subs.find((s) => s.status === "ACTIVE");
          if (activeSub) {
            setActive({
              planName: activeSub.plan.name,
              planNameAr: activeSub.plan.nameAr,
              price: activeSub.plan.price,
              currency: activeSub.plan.currency,
              endDate: activeSub.endDate || undefined,
              status: activeSub.status,
            });
          } else if (subs[0]) {
            const s = subs[0];
            setActive({
              planName: s.plan.name,
              planNameAr: s.plan.nameAr,
              price: s.plan.price,
              currency: s.plan.currency,
              endDate: s.endDate || undefined,
              status: s.status,
            });
          }
        }

        // Use environment variable as primary source for admin phone
        // Contact section phone is only used as fallback if env var is not set
        const envPhone =
          process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || "963994488858";
        setAdminPhone(envPhone);

        // Optionally override with contact section phone if env var is not set
        if (
          !process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE &&
          contactRes?.data?.success &&
          contactRes.data.data.sections.length > 0
        ) {
          const contactSection: ContactSection =
            contactRes.data.data.sections[0];
          const attributes = contactSection.attributes || [];
          if (attributes.length > 1) {
            const phoneValue = isRTL
              ? attributes[1].valueAr
              : attributes[1].value;
            const phoneNumber = phoneValue.replace(/\D/g, ""); // Remove non-digits
            if (phoneNumber && phoneNumber.length >= 10) {
              setAdminPhone(phoneNumber);
            }
          }
        }

        // Get restaurant info
        if (restaurantRes?.data?.success) {
          const restaurantData =
            restaurantRes.data.data.restaurant || restaurantRes.data.data;
          setRestaurant({
            name: restaurantData.name || "",
            nameAr: restaurantData.nameAr,
          });
        } else if (meRes.data?.success && meRes.data.data.user?.restaurant) {
          const r = meRes.data.data.user.restaurant;
          setRestaurant({
            name: r.name || "",
            nameAr: r.nameAr,
          });
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isRTL]);

  const whatsappHref = useMemo(() => {
    if (!selectedPlan) return "";
    const planName = isRTL
      ? selectedPlan.nameAr || selectedPlan.name
      : selectedPlan.name;
    const restaurantName = restaurant
      ? isRTL
        ? restaurant.nameAr || restaurant.name
        : restaurant.name
      : "";
    const userEmail = user?.email || "غير محدد";

    // Get plan type
    const planType = selectedPlan.type || "BASIC";
    const planTypeText = isRTL
      ? planType === "BASIC"
        ? "أساسية"
        : planType === "PREMIUM"
          ? "مميزة"
          : planType === "ENTERPRISE"
            ? "مؤسسية"
            : planType === "FREE"
              ? "مجانية"
              : planType
      : planType;

    // Get billing period
    const billingPeriodText = selectedPlan.billingPeriod === "YEARLY"
      ? isRTL ? "سنوية" : "Yearly"
      : isRTL ? "شهرية" : "Monthly";

    // Format price
    const formattedPrice = Number(selectedPlan.price).toLocaleString();
    const priceText = `${formattedPrice} ${selectedPlan.currency === "SYP" ? (isRTL ? "ل.س" : "SYP") : selectedPlan.currency}`;

    // Format duration
    const durationText = selectedPlan.duration > 0
      ? isRTL
        ? `${selectedPlan.duration} ${selectedPlan.duration === 1 ? "يوم" : "يوم"}`
        : `${selectedPlan.duration} ${selectedPlan.duration === 1 ? "day" : "days"}`
      : isRTL ? "غير محدود" : "Unlimited";

    const msg = isRTL
      ? `مرحباً، أريد الاشتراك في الخطة التالية:

📋 اسم الخطة: ${planName}
🏷️ نوع الخطة: ${planTypeText}
💰 السعر: ${priceText}
📅 نوع الفترة: ${billingPeriodText}
⏱️ المدة: ${durationText}
🏪 اسم المطعم: ${restaurantName}
📧 الإيميل: ${userEmail}

يرجى تفعيل الاشتراك. شكراً لكم!`
      : `Hello, I would like to subscribe to the following plan:

📋 Plan Name: ${planName}
🏷️ Plan Type: ${planTypeText}
💰 Price: ${priceText}
📅 Billing Period: ${billingPeriodText}
⏱️ Duration: ${durationText}
🏪 Restaurant Name: ${restaurantName}
📧 Email: ${userEmail}

Please activate the subscription. Thank you!`;
    const encoded = encodeURIComponent(msg);
    return `https://wa.me/${adminPhone}?text=${encoded}`;
  }, [selectedPlan, user, restaurant, adminPhone, isRTL]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isRTL ? "الاشتراك" : "Subscription"}
      </h1>

      <Card className="p-6">
        {loading ? (
          <div className="text-gray-500 dark:text-gray-400">
            {isRTL ? "جارِ التحميل..." : "Loading..."}
          </div>
        ) : active ? (
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              {isRTL ? "الخطة الحالية:" : "Current plan:"}{" "}
              <span className="font-semibold">
                {isRTL ? active.planNameAr || active.planName : active.planName}
              </span>
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {isRTL ? "الحالة:" : "Status:"} {active.status}
            </p>
            {active.endDate && (
              <p className="text-gray-700 dark:text-gray-300">
                {isRTL ? "تاريخ الانتهاء:" : "Ends at:"}{" "}
                {new Date(active.endDate).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            {isRTL ? "لا يوجد اشتراك نشط حالياً." : "No active subscription."}
          </p>
        )}

        <div className="mt-6">
          <Button
            onClick={() => setOpen(true)}
            className="bg-tm-blue hover:bg-tm-orange text-white"
          >
            {isRTL ? "إضافة اشتراك" : "Add Subscription"}
          </Button>
        </div>
      </Card>

      {/* All subscriptions list (show active first) */}
      {!loading && subscriptions.length > 0 && (
        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isRTL ? "جميع الاشتراكات" : "All Subscriptions"}
          </h2>
          <div className="space-y-3">
            {subscriptions
              .slice()
              .sort((a, b) =>
                a.status === "ACTIVE" ? -1 : b.status === "ACTIVE" ? 1 : 0
              )
              .map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-lg border ${
                    s.status === "ACTIVE"
                      ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                      : s.status === "EXPIRED"
                        ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {isRTL ? "الخطة" : "Plan"}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {isRTL && s.plan.nameAr ? s.plan.nameAr : s.plan.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {s.plan.price} {s.plan.currency}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          s.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : s.status === "EXPIRED"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {s.status}
                      </span>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL ? "ينتهي في:" : "Ends at:"}{" "}
                        {s.endDate
                          ? new Date(s.endDate).toLocaleDateString()
                          : isRTL
                            ? "—"
                            : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={isRTL ? "اختر خطة" : "Choose a plan"}
      >
        {/* Billing Period Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "نوع الفترة" : "Billing Period"}
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedBillingPeriod("ALL")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingPeriod === "ALL"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {isRTL ? "الكل" : "All"}
            </button>
            <button
              onClick={() => setSelectedBillingPeriod("MONTHLY")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingPeriod === "MONTHLY"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {isRTL ? "شهرية" : "Monthly"}
            </button>
            <button
              onClick={() => setSelectedBillingPeriod("YEARLY")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedBillingPeriod === "YEARLY"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {isRTL ? "سنوية" : "Yearly"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans
            .filter((p) => {
              // Filter out free plans
              if (p.isFree === true || p.price === "0") return false;
              // Filter by billing period if selected
              if (selectedBillingPeriod !== "ALL") {
                return p.billingPeriod === selectedBillingPeriod;
              }
              return true;
            })
            .map((p) => (
              <Card
                key={p.id}
                className={`p-4 border cursor-pointer ${selectedPlan?.id === p.id ? "ring-2 ring-tm-blue" : "hover:border-tm-blue/40"}`}
                onClick={() => setSelectedPlan(p)}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {isRTL ? p.nameAr || p.name : p.name}
                </h3>
                {p.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {isRTL ? p.descriptionAr || p.description : p.description}
                  </p>
                )}
                <div className="flex items-center justify-between mb-2">
                  <p className="text-tm-blue font-bold">
                    {p.price} {p.currency}
                  </p>
                  {p.billingPeriod && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {p.billingPeriod === "MONTHLY"
                        ? isRTL
                          ? "شهرية"
                          : "Monthly"
                        : isRTL
                          ? "سنوية"
                          : "Yearly"}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  {selectedPlan?.id === p.id ? (
                    <a
                      href={whatsappHref || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-white transition-colors ${
                        whatsappHref
                          ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={(e) => {
                        if (!whatsappHref) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {isRTL ? "الاشتراك" : "Subscribe"}
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md text-white bg-gray-400 cursor-not-allowed"
                    >
                      {isRTL ? "الاشتراك" : "Subscribe"}
                    </button>
                  )}
                </div>
              </Card>
            ))}
        </div>
      </Modal>
    </div>
  );
}
