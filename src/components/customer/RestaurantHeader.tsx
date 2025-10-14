"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { hexToRgba } from "@/lib/helper";

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
}: RestaurantHeaderProps) {
  const { isRTL } = useLanguage();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {/* Restaurant Logo or Name */}
            {restaurant?.logo && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
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

            <div>
              <h1 className="text-xl font-semibold text-white">
                {isRTL
                  ? restaurant?.nameAr || restaurant?.name
                  : restaurant?.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {tableNumber && (
              <p className="text-sm font-medium text-white">
                Table {tableNumber}
              </p>
            )}
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
