"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
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

export default function SubscriptionPage() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveSubscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const [plansRes, meRes] = await Promise.all([
          api.get("/public/plans"),
          api.get("/auth/me"),
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
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const whatsappHref = useMemo(() => {
    if (!selectedPlan || !user?.email) return "";
    const planName = isRTL
      ? selectedPlan.nameAr || selectedPlan.name
      : selectedPlan.name;
    const price = `${selectedPlan.price} ${selectedPlan.currency}`;
    const msg = isRTL
      ? `المستخدم ${user.firstName} ${user.lastName} صاحب الايميل ${user.email} يريد الاشتراك بالخطة ${planName} بسعر ${price}`
      : `User ${user.firstName} ${user.lastName} with email ${user.email} wants to subscribe to plan ${planName} priced ${price}`;
    const encoded = encodeURIComponent(msg);
    return `https://wa.me/963994488858?text=${encoded}`;
  }, [selectedPlan, user, isRTL]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {plans
            .filter((p) => !(p.isFree === true || p.price === "0"))
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
                <p className="text-tm-blue font-bold">
                  {p.price} {p.currency}
                </p>
                <div className="mt-4">
                  <a
                    href={selectedPlan?.id === p.id ? whatsappHref : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-white ${
                      selectedPlan?.id === p.id
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isRTL ? "الاشتراك" : "Subscribe"}
                  </a>
                </div>
              </Card>
            ))}
        </div>
      </Modal>
    </div>
  );
}
