"use client";

import { useLanguage } from "@/store/hooks/useLanguage";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { hexToRgba } from "@/lib/helper";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { getImageUrl } from "@/lib/api";

interface Restaurant {
  id: string;
  name: string;
  nameAr?: string;
  logo?: string;
}

interface MenuTheme {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: string;
  cardPadding?: string;
  backgroundImage?: string;
  backgroundOverlay?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
}

interface CurrencyExchange {
  id: string;
  currency: string;
  exchangeRate: number;
  isActive: boolean;
}

interface RestaurantHeaderProps {
  restaurant: Restaurant | null;
  menuTheme: MenuTheme | null;
  tableNumber?: string;
  colorOpacity?: {
    primary: number;
    secondary: number;
    background: number;
    text: number;
    accent: number;
  };
  restaurantCurrency?: string;
  currencyExchanges?: CurrencyExchange[];
  selectedCurrency?: string | null;
  onCurrencyChange?: (currency: string | null) => void;
}

// Default theme for all restaurants
const defaultTheme = {
  primaryColor: "#f6b23c",
  secondaryColor: "#9d622a",
  primaryColorOpacity: 0.8,
  secondaryColorOpacity: 0.9,
};

export function RestaurantHeader({
  restaurant,
  menuTheme,
  tableNumber,
  colorOpacity,
  restaurantCurrency = "USD",
  currencyExchanges = [],
  selectedCurrency,
  onCurrencyChange,
}: RestaurantHeaderProps) {
  const { isRTL, language } = useLanguage();

  // Get currency display name
  const getCurrencyDisplayName = (currencyCode: string): string => {
    // Use formatCurrencyWithLanguage to get translated name, then extract just the name
    const formatted = formatCurrencyWithLanguage(0, currencyCode, language);
    // Extract currency name (everything after the number)
    const parts = formatted.split(" ");
    return parts.slice(1).join(" ") || currencyCode;
  };

  // Use default theme if no custom theme exists
  const activeTheme = menuTheme || defaultTheme;

  const activeCurrencyExchanges =
    currencyExchanges?.filter(
      (ce) => ce.isActive && ce.currency !== restaurantCurrency,
    ) || [];

  return (
    <header
      className="fixed top-0 right-0 w-full shadow-md backdrop-blur-xl"
      style={{
        backgroundColor: hexToRgba(
          activeTheme.primaryColor || defaultTheme.primaryColor,
          colorOpacity?.primary || defaultTheme.primaryColorOpacity,
        ),
        zIndex: 20,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-24 gap-4 sm:gap-8">
          <div className="flex items-center gap-5 sm:gap-6 min-w-0 flex-1">
            {/* Restaurant Logo or Name */}
            {restaurant?.logo && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 ring-2 ring-white/70 shadow-md">
                <img
                  src={getImageUrl(restaurant.logo)}
                  alt={
                    isRTL
                      ? restaurant?.nameAr || restaurant?.name
                      : restaurant?.name
                  }
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white whitespace-normal break-words">
                {isRTL
                  ? restaurant?.nameAr || restaurant?.name
                  : restaurant?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
            {/* Currency Selector - show فقط عند توفر أكثر من عملة */}
            {onCurrencyChange &&
              restaurantCurrency &&
              activeCurrencyExchanges.length > 0 && (
              <select
                value={selectedCurrency || restaurantCurrency}
                onChange={(e) =>
                  onCurrencyChange(
                    e.target.value === restaurantCurrency
                      ? null
                      : e.target.value,
                  )
                }
                className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md bg-white/15 backdrop-blur-sm border border-white/40 text-white focus:outline-none focus:ring-2 focus:ring-white/60 hover:bg-white/30 transition-colors"
                style={{
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                }}
              >
                <option value={restaurantCurrency} style={{ color: "#000" }}>
                  {getCurrencyDisplayName(restaurantCurrency)}{" "}
                  {isRTL ? "(أساسي)" : "(Base)"}
                </option>
                {activeCurrencyExchanges.map((ce) => (
                      <option
                        key={ce.id}
                        value={ce.currency}
                        style={{ color: "#000" }}
                      >
                        {getCurrencyDisplayName(ce.currency)}
                      </option>
                    ))}
              </select>
            )}
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
