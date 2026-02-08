"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { useLanguage } from "@/store/hooks/useLanguage";
import Image from "next/image";

interface CurrencyExchange {
  id: string;
  currency: string;
  exchangeRate: number;
  isActive: boolean;
}

interface MenuItemProps {
  item: {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    price: number;
    currency?: string; // Made optional since we'll use restaurant currency
    image?: string;
    isAvailable: boolean;
    extras?: any;
    isVegetarian?: boolean;
    discount?: number;
  };
  currency?: string; // Restaurant currency prop
  selectedCurrency?: string | null; // Selected payment currency
  currencyExchanges?: CurrencyExchange[]; // Available currency exchanges
  onAddToOrder: (
    item: any,
    quantity: number,
    notes?: string,
    extras?: any
  ) => void;
  onItemClick?: (item: any) => void; // New prop for item click
  isRTL: boolean;
  theme?: {
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
  };
  colorOpacity?: {
    primary: number;
    secondary: number;
    background: number;
    text: number;
    accent: number;
  };
}

export function MenuItem({
  item,
  currency,
  selectedCurrency,
  currencyExchanges = [],
  onAddToOrder,
  onItemClick,
  isRTL,
  theme,
  colorOpacity,
}: MenuItemProps) {
  const { language } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<any>({});

  // Function to convert hex to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return hex;
  };

  // Default color opacity if not provided
  const defaultColorOpacity = {
    primary: 0.5,
    secondary: 1,
    background: 0.7,
    text: 1,
    accent: 1,
  };

  const opacity = colorOpacity || defaultColorOpacity;

  // Calculate item total with discount and extras
  const calculateItemTotal = (
    item: any,
    quantity: number,
    selectedExtras?: any
  ) => {
    let itemPrice =
      typeof item.price === "string" ? parseFloat(item.price) : item.price;
    if (typeof item.discount === "number" && item.discount > 0) {
      itemPrice = itemPrice * (1 - item.discount / 100);
    }

    // Calculate extras price
    let extrasPrice = 0;
    if (selectedExtras && Object.keys(selectedExtras).length > 0) {
      Object.values(selectedExtras).forEach((extraGroup: any) => {
        if (Array.isArray(extraGroup)) {
          extraGroup.forEach((extraId: string) => {
            // Find the extra option in item.extras
            if (item.extras) {
              Object.values(item.extras).forEach((group: any) => {
                if (group.options) {
                  const option = group.options.find(
                    (opt: any) => opt.id === extraId
                  );
                  if (option && option.price) {
                    extrasPrice += option.price;
                  }
                }
              });
            }
          });
        }
      });
    }

    return (itemPrice + extrasPrice) * quantity;
  };

  // Calculate price in selected currency
  const calculatePriceInCurrency = (
    priceInBaseCurrency: number,
    selectedCurrency: string | null | undefined
  ): { amount: number; currency: string } => {
    const baseCurrency = currency || item.currency || "USD";

    if (!selectedCurrency || selectedCurrency === baseCurrency) {
      return { amount: priceInBaseCurrency, currency: baseCurrency };
    }

    const currencyExchange = currencyExchanges.find(
      (ce) =>
        ce.currency.toUpperCase() === selectedCurrency.toUpperCase() &&
        ce.isActive
    );

    if (!currencyExchange) {
      return { amount: priceInBaseCurrency, currency: baseCurrency };
    }

    // Convert from base currency to selected currency
    // exchangeRate interpretation depends on its value:
    // - If exchangeRate >= 1: represents how many units of base currency equal 1 unit of selected currency
    //   Example: exchangeRate = 12100 means 1 USD = 12100 SYP → use division
    // - If exchangeRate < 1: represents how many units of selected currency equal 1 unit of base currency
    //   Example: exchangeRate = 0.01 means 1 SYP = 0.01 NEW → use multiplication
    const exchangeRate = Number(currencyExchange.exchangeRate);
    const convertedAmount =
      exchangeRate >= 1
        ? priceInBaseCurrency / exchangeRate
        : priceInBaseCurrency * exchangeRate;
    return {
      amount: convertedAmount,
      currency: selectedCurrency,
    };
  };

  // Get display price
  const getDisplayPrice = () => {
    const basePrice =
      typeof item.price === "string" ? parseFloat(item.price) : item.price;
    const priceWithDiscount =
      typeof item.discount === "number" && item.discount > 0
        ? basePrice * (1 - item.discount / 100)
        : basePrice;

    const displayPrice = calculatePriceInCurrency(
      priceWithDiscount,
      selectedCurrency
    );

    return displayPrice;
  };

  const handleAddToOrder = () => {
    onAddToOrder(item, quantity, notes, selectedExtras);
    setQuantity(1);
    setNotes("");
    setSelectedExtras({});
    setShowModal(false);
  };

  const handleItemClick = () => {
    // Open the add to order modal instead of calling onItemClick
    setShowModal(true);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering handleItemClick
    setShowModal(true);
  };

  if (!item.isAvailable) {
    return (
      <Card className="opacity-50 !p-0  relative">
        <div className="relative">
          {/* Image */}
          <div className="w-full h-48 relative overflow-hidden rounded-t-lg">
            {item.image ? (
              <Image
                src={item.image}
                alt={isRTL ? item.nameAr || item.name : item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white line-through">
              {isRTL ? item.nameAr || item.name : item.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRTL ? "غير متوفر حالياً" : "Currently unavailable"}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`relative !p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer ${theme?.borderRadius || "rounded-lg"}`}
      style={{
        backgroundColor: hexToRgba(
          theme?.primaryColor || "#f97316",
          opacity.primary
        ),
        borderColor: hexToRgba(
          theme?.secondaryColor || "#e5e7eb",
          opacity.secondary
        ),
      }}
      onClick={handleItemClick}
    >
      {/* Vegetarian/Non-vegetarian indicator */}
      <div className="absolute top-1 left-1 ">
        <div
          className={`w-3 h-3 rounded-full ${item.isAvailable ? "bg-green-500" : "bg-red-500"}`}
        ></div>
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering handleItemClick
          setIsFavorited(!isFavorited);
        }}
        className="absolute top-1 right-1  p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
      >
        <svg
          className={`w-5 h-5 ${isFavorited ? "text-red-500 fill-current" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Discount badge */}
      {typeof item.discount === "number" && item.discount > 0 && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10 bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap">
          {item.discount}% {isRTL ? "خصم" : "off"}
        </div>
      )}

      {/* Image */}
      <div className="w-full h-32 sm:h-40 relative overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={isRTL ? item.nameAr || item.name : item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg
              className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4
          className="text-sm sm:text-base font-medium mb-1"
          style={{
            color: hexToRgba(theme?.textColor || "#1f2937", opacity.text),
          }}
        >
          {isRTL ? item.nameAr || item.name : item.name}
        </h4>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {(() => {
              const displayPrice = getDisplayPrice();
              const basePrice =
                typeof item.price === "string"
                  ? parseFloat(item.price)
                  : item.price;
              const baseDisplayPrice = calculatePriceInCurrency(
                basePrice,
                null
              );
              return (
                <>
                  <span
                    className="text-sm sm:text-base font-semibold"
                    style={{
                      color: hexToRgba(
                        theme?.textColor || "#1f2937",
                        opacity.text
                      ),
                    }}
                  >
                    {formatCurrencyWithLanguage(
                      displayPrice.amount,
                      displayPrice.currency,
                      language
                    )}
                  </span>
                  {typeof item.discount === "number" && item.discount > 0 && (
                    <span className="text-xs text-gray-500 line-through">
                      {formatCurrencyWithLanguage(
                        calculatePriceInCurrency(basePrice, selectedCurrency)
                          .amount,
                        calculatePriceInCurrency(basePrice, selectedCurrency)
                          .currency,
                        language
                      )}
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          <button
            onClick={handleAddClick}
            className="w-8 h-8 sm:w-10 sm:h-10 text-black  rounded-full flex items-center justify-center transition-colors"
            style={{
              backgroundColor: hexToRgba(
                theme?.accentColor || "#ef4444",
                opacity.accent
              ),
            }}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal for item details */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4 pb-safe">
          <div className="bg-white w-full max-w-md rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {isRTL ? item.nameAr || item.name : item.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Item Image */}
              {item.image && (
                <div className="w-full h-48 relative overflow-hidden rounded-lg">
                  <Image
                    src={item.image}
                    alt={isRTL ? item.nameAr || item.name : item.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Description */}
              {item.description && (
                <div>
                  <h4 className="text-sm font-medium text-black mb-2">
                    {isRTL ? "الوصف:" : "Description:"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isRTL
                      ? item.descriptionAr || item.description
                      : item.description}
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center justify-between">
                {(() => {
                  const basePrice =
                    typeof item.price === "string"
                      ? parseFloat(item.price)
                      : item.price;
                  const priceWithDiscount =
                    typeof item.discount === "number" && item.discount > 0
                      ? basePrice * (1 - item.discount / 100)
                      : basePrice;
                  const displayPrice = calculatePriceInCurrency(
                    priceWithDiscount,
                    selectedCurrency
                  );
                  const originalDisplayPrice = calculatePriceInCurrency(
                    basePrice,
                    selectedCurrency
                  );
                  return (
                    <>
                      <span
                        className="text-lg font-semibold"
                        style={{
                          color: theme?.primaryColor || "var(--theme-primary)",
                        }}
                      >
                        {formatCurrencyWithLanguage(
                          displayPrice.amount,
                          displayPrice.currency,
                          language
                        )}
                      </span>
                      {typeof item.discount === "number" &&
                        item.discount > 0 && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrencyWithLanguage(
                              originalDisplayPrice.amount,
                              originalDisplayPrice.currency,
                              language
                            )}
                          </span>
                        )}
                    </>
                  );
                })()}
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-black">
                  {isRTL ? "الكمية:" : "Quantity:"}
                </label>
                <div className="flex text-black items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(Math.max(1, quantity - 1));
                    }}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuantity(quantity + 1);
                    }}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Extras */}
              {item.extras && Object.keys(item.extras).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {isRTL ? "إضافات:" : "Extras:"}
                  </label>
                  <div className="space-y-2">
                    {Object.entries(item.extras).map(
                      ([key, extra]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {isRTL ? extra.nameAr || extra.name : extra.name}
                          </label>
                          <div className="space-y-1">
                            {extra.options?.map((option: any) => (
                              <label
                                key={option.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedExtras[key]?.includes(option.id) ||
                                    false
                                  }
                                  onChange={(e) => {
                                    const currentExtras =
                                      selectedExtras[key] || [];
                                    if (e.target.checked) {
                                      setSelectedExtras({
                                        ...selectedExtras,
                                        [key]: [...currentExtras, option.id],
                                      });
                                    } else {
                                      setSelectedExtras({
                                        ...selectedExtras,
                                        [key]: currentExtras.filter(
                                          (id: string) => id !== option.id
                                        ),
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {isRTL
                                    ? option.nameAr || option.name
                                    : option.name}
                                  {option.price > 0 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      (+
                                      {formatCurrencyWithLanguage(
                                        calculatePriceInCurrency(
                                          option.price,
                                          selectedCurrency
                                        ).amount,
                                        calculatePriceInCurrency(
                                          option.price,
                                          selectedCurrency
                                        ).currency,
                                        language
                                      )}
                                      )
                                    </span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  {isRTL ? "ملاحظات خاصة:" : "Special Instructions:"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black text-sm"
                  rows={3}
                  placeholder={
                    isRTL ? "أي طلبات خاصة..." : "Any special requests..."
                  }
                />
              </div>

            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-3 p-4 pt-3 border-t border-gray-200 flex-shrink-0 pb-modal-actions">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                className="flex-1"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToOrder();
                }}
                className="flex-1"
                style={{
                  backgroundColor:
                    theme?.primaryColor || "var(--theme-primary)",
                  color: theme?.textColor || "#ffffff",
                  borderColor: theme?.primaryColor || "var(--theme-primary)",
                }}
              >
                {isRTL ? "إضافة" : "Add"} {quantity} -{" "}
                {formatCurrencyWithLanguage(
                  calculateItemTotal(item, quantity, selectedExtras),
                  currency || item.currency || "USD",
                  language
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
