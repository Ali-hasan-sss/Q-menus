"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { hexToRgba } from "@/lib/helper";
import { formatCurrencyWithLanguage } from "@/lib/utils";

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
  secondaryColor: "#27ae1e",
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

  return (
    <header
      className="shadow-sm backdrop-blur-xl fixed w-full top-0 right-0"
      style={{
        backgroundColor: hexToRgba(
          activeTheme.primaryColor || defaultTheme.primaryColor,
          colorOpacity?.primary || defaultTheme.primaryColorOpacity
        ),
        zIndex: 10,
      }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Restaurant Logo or Name */}
            {restaurant?.logo && (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                <img
                  src={restaurant.logo}
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
              <h1 className="text-base sm:text-xl font-semibold text-white truncate">
                {isRTL
                  ? restaurant?.nameAr || restaurant?.name
                  : restaurant?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Currency Selector - Always show if onCurrencyChange is provided */}
            {onCurrencyChange && restaurantCurrency && (
              <select
                value={selectedCurrency || restaurantCurrency}
                onChange={(e) =>
                  onCurrencyChange(
                    e.target.value === restaurantCurrency
                      ? null
                      : e.target.value
                  )
                }
                className="px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded-md bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50 hover:bg-white/30 transition-colors"
                style={{
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.2)";
                }}
              >
                <option value={restaurantCurrency} style={{ color: "#000" }}>
                  {getCurrencyDisplayName(restaurantCurrency)}{" "}
                  {isRTL ? "(أساسي)" : "(Base)"}
                </option>
                {currencyExchanges &&
                  currencyExchanges.length > 0 &&
                  currencyExchanges
                    .filter((ce) => ce.isActive)
                    .map((ce) => (
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
