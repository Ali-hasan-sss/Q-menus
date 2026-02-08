"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/store/hooks/useLanguage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { publicApi, endpoints } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UtensilsCrossed, MapPin, Phone, ChevronRight, Search } from "lucide-react";

interface RestaurantBasic {
  id: string;
  name: string;
  nameAr: string | null;
  logo: string | null;
  currency?: string;
  description?: string | null;
  descriptionAr?: string | null;
  address?: string | null;
  phone?: string | null;
}

interface RestaurantFromName extends RestaurantBasic {}

interface SampleItem {
  id: string;
  name: string;
  nameAr: string | null;
  price: any;
  image: string | null;
}

interface RestaurantFromItems extends RestaurantBasic {
  matchCount: number;
  sampleItems: SampleItem[];
}

type RestaurantCard = RestaurantFromName | RestaurantFromItems;

function isFromItems(r: RestaurantCard): r is RestaurantFromItems {
  return "matchCount" in r && "sampleItems" in r;
}

export default function DiscoverPage() {
  const { isRTL } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [restaurantsByName, setRestaurantsByName] = useState<RestaurantFromName[]>([]);
  const [restaurantsByItems, setRestaurantsByItems] = useState<RestaurantFromItems[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setRestaurantsByName([]);
      setRestaurantsByItems([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const [nameRes, itemsRes] = await Promise.all([
        publicApi.get(endpoints.public.restaurants(trimmed)),
        publicApi.get(endpoints.public.searchItems(trimmed)),
      ]);

      if (nameRes.data.success && nameRes.data.data.restaurants) {
        setRestaurantsByName(nameRes.data.data.restaurants);
      } else {
        setRestaurantsByName([]);
      }

      if (itemsRes.data.success && itemsRes.data.data.restaurants) {
        setRestaurantsByItems(itemsRes.data.data.restaurants);
      } else {
        setRestaurantsByItems([]);
      }
    } catch (e) {
      console.error("Discover search error:", e);
      setRestaurantsByName([]);
      setRestaurantsByItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      search(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, search]);

  const seenIds = new Set<string>();
  const merged: RestaurantCard[] = [];
  restaurantsByName.forEach((r) => {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id);
      merged.push(r);
    }
  });
  restaurantsByItems.forEach((r) => {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id);
      merged.push(r);
    }
  });

  const displayName = (r: RestaurantBasic) => (isRTL ? r.nameAr || r.name : r.name);
  const menuUrl = (id: string) => `/menu/${id}?tableNumber=DELIVERY`;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-poppins flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {isRTL ? "ابحث عن مطعم أو صنف" : "Find a restaurant or dish"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-center text-sm md:text-base">
            {isRTL
              ? "ابحث بالاسم أو بذكر صنف معين لعرض المطاعم التي تقدمه، ثم اطلب التوصيل."
              : "Search by restaurant name or a dish to see restaurants that serve it, then order delivery."}
          </p>

          <div className="relative mt-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isRTL
                  ? "اسم المطعم أو الصنف (مثلاً: بيتزا، برجر، قهوة)"
                  : "Restaurant or dish (e.g. pizza, burger, coffee)"
              }
              className="w-full px-4 py-3 ltr:pl-12 rtl:pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tm-orange focus:border-transparent"
            />
            <span className="absolute inset-y-0 ltr:left-4 rtl:right-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" strokeWidth={2} />
            </span>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {!loading && hasSearched && merged.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>
              {isRTL
                ? "لا توجد نتائج. جرّب كلمة أخرى أو اسم مطعم مختلف."
                : "No results. Try a different word or restaurant name."}
            </p>
          </div>
        )}

        {!loading && merged.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {isRTL
                ? `عرض ${merged.length} مطعم — اختر مطعم لعرض القائمة وطلب التوصيل`
                : `Showing ${merged.length} restaurant(s) — choose one to view menu and order delivery`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {merged.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-tm-orange/40 transition-all duration-300"
                >
                  {/* صورة/أيقونة المطعم */}
                  <div className="p-5 pb-2">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shadow-inner flex items-center justify-center">
                        {r.logo ? (
                          <img
                            src={r.logo}
                            alt={displayName(r)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UtensilsCrossed
                            className="w-10 h-10 text-gray-500 dark:text-gray-400"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                          {displayName(r)}
                        </h2>
                        {r.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {isRTL ? r.descriptionAr || r.description : r.description}
                          </p>
                        )}
                        {isFromItems(r) && (
                          <p className="text-xs text-tm-orange font-medium mt-1.5">
                            {isRTL ? `${r.matchCount} صنف مطابق` : `${r.matchCount} matching item(s)`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* العنوان والهاتف مع الأيقونات */}
                  <div className="px-5 pb-4 space-y-2">
                    {r.address && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mt-0.5" aria-hidden>
                          <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" strokeWidth={2} />
                        </span>
                        <span className="line-clamp-2">{r.address}</span>
                      </div>
                    )}
                    {r.phone && (
                      <a
                        href={`tel:${r.phone.trim()}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-sm text-tm-orange hover:text-tm-orange/80 hover:underline w-fit"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-tm-orange/10 flex items-center justify-center" aria-hidden>
                          <Phone className="w-3 h-3" strokeWidth={2} />
                        </span>
                        {r.phone}
                      </a>
                    )}
                    {isFromItems(r) && r.sampleItems.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate pt-0.5">
                        {r.sampleItems
                          .slice(0, 3)
                          .map((i) => (isRTL ? i.nameAr || i.name : i.name))
                          .join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* زر عرض قائمة المطعم */}
                  <div className="px-5 pb-5">
                    <Link
                      href={menuUrl(r.id)}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-tm-orange hover:bg-tm-orange/90 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      {isRTL ? "عرض قائمة المطعم" : "View restaurant menu"}
                      <ChevronRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasSearched && !loading && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="mb-2">
              {isRTL ? "ابدأ بكتابة اسم مطعم أو صنف للبحث." : "Start typing a restaurant or dish name to search."}
            </p>
            <p className="text-sm">
              {isRTL ? "بعد اختيار مطعم ستُعرض قائمته ويمكنك طلب التوصيل." : "After choosing a restaurant you'll see its menu and can order delivery."}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
