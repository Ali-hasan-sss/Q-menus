"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "./OrderSummary";
import { useLanguage } from "@/store/hooks/useLanguage";
import { formatCurrencyWithLanguage } from "@/lib/utils";

interface OrderItem {
  menuItemId: string;
  name: string;
  nameAr?: string;
  price: string;
  currency: string;
  quantity: number;
  notes?: string;
  extras?: any;
}

interface CurrencyExchange {
  id: string;
  currency: string;
  exchangeRate: number;
  isActive: boolean;
}

interface FloatingOrderSummaryProps {
  orderItems: OrderItem[];
  total: number;
  currency: string;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onPlaceOrder: () => void;
  isOrdering: boolean;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerAddress: string;
  setCustomerAddress: (address: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  isDelivery: boolean;
  onHide: () => void;
  isAddingToExisting?: boolean;
  menuTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  } | null;
  findMenuItemById?: (id: string) => any;
  currencyExchanges?: CurrencyExchange[];
  selectedPaymentCurrency?: string | null;
  setSelectedPaymentCurrency?: (currency: string | null) => void;
}

export function FloatingOrderSummary({
  orderItems,
  total,
  currency,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  isOrdering,
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerAddress,
  setCustomerAddress,
  orderNotes,
  setOrderNotes,
  isDelivery,
  onHide,
  isAddingToExisting = false,
  menuTheme,
  findMenuItemById,
  currencyExchanges = [],
  selectedPaymentCurrency: externalSelectedCurrency,
  setSelectedPaymentCurrency: externalSetSelectedCurrency,
}: FloatingOrderSummaryProps) {
  const { isRTL, language } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  // Use external currency if provided, otherwise use internal state
  const [internalSelectedCurrency, setInternalSelectedCurrency] = useState<
    string | null
  >(null);
  const selectedPaymentCurrency =
    externalSelectedCurrency !== undefined
      ? externalSelectedCurrency
      : internalSelectedCurrency;
  const setSelectedPaymentCurrency =
    externalSetSelectedCurrency || setInternalSelectedCurrency;

  // Calculate total in selected currency
  const calculateTotalInCurrency = (
    totalInBaseCurrency: number,
    selectedCurrency: string | null
  ): { amount: number; currency: string } => {
    if (!selectedCurrency || selectedCurrency === currency) {
      return { amount: totalInBaseCurrency, currency };
    }

    const currencyExchange = currencyExchanges.find(
      (ce) =>
        ce.currency.toUpperCase() === selectedCurrency.toUpperCase() &&
        ce.isActive
    );

    if (!currencyExchange) {
      return { amount: totalInBaseCurrency, currency };
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
        ? totalInBaseCurrency / exchangeRate
        : totalInBaseCurrency * exchangeRate;
    return {
      amount: convertedAmount,
      currency: selectedCurrency,
    };
  };

  const displayTotal = calculateTotalInCurrency(total, selectedPaymentCurrency);

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Floating Bar - click opens order modal */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowDetails(true);
          }
        }}
        className="fixed bottom-2 left-0 right-0 rounded-b-full rounded-t-[20px] mx-3 px-5 py-3 z-50 shadow-lg cursor-pointer"
        style={{
          backgroundColor: menuTheme?.primaryColor || "#f97316",
          color: menuTheme?.textColor || "#ffffff",
          border: `2px solid ${menuTheme?.secondaryColor || "#27ae1e"}`,
        }}
        onClick={() => setShowDetails(true)}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <div
              className="text-sm font-medium whitespace-nowrap"
              style={{
                color: menuTheme?.textColor || "#ffffff",
              }}
            >
              {totalItems} {isRTL ? "عنصر" : "items"}
            </div>
          </div>
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className="text-base font-semibold whitespace-nowrap"
              style={{
                color: menuTheme?.textColor || "#ffffff",
              }}
            >
              {formatCurrencyWithLanguage(
                displayTotal.amount,
                displayTotal.currency,
                language
              )}
            </div>
            <span
              className="px-3 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 rounded"
              style={{
                backgroundColor:
                  menuTheme?.accentColor || "var(--theme-accent)",
                color: menuTheme?.textColor || "#ffffff",
                border: `1px solid ${menuTheme?.textColor || "#ffffff"}`,
              }}
            >
              {isRTL ? "إرسال الطلب" : "Send Order"}
            </span>
          </div>
        </div>
      </div>

      {/* Order Details Modal - scrollable content + sticky footer with Send Order */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-t-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {isRTL ? "تفاصيل الطلب" : "Order Details"}
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-4 pb-2">
                <OrderSummary
                  orderItems={orderItems}
                  total={total}
                  currency={currency}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  onPlaceOrder={onPlaceOrder}
                  isOrdering={isOrdering}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                  customerAddress={customerAddress}
                  setCustomerAddress={setCustomerAddress}
                  orderNotes={orderNotes}
                  setOrderNotes={setOrderNotes}
                  isRTL={isRTL}
                  isDelivery={isDelivery}
                  onClose={() => setShowDetails(false)}
                  theme={menuTheme}
                  findMenuItemById={findMenuItemById}
                  currencyExchanges={currencyExchanges}
                  selectedPaymentCurrency={selectedPaymentCurrency}
                  setSelectedPaymentCurrency={setSelectedPaymentCurrency}
                  hideActionButtons
                />
              </div>
            </div>
            {/* Sticky footer: always visible at bottom of modal */}
            <div className="p-4 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
              <p className="text-xs text-gray-500 text-center mb-3">
                {isRTL
                  ? "سيتم إرسال طلبك إلى المطبخ وستتلقى تحديثات في الوقت الفعلي"
                  : "Your order will be sent to the kitchen and you'll receive updates in real-time"}
              </p>
              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => setShowDetails(false)}
                  disabled={isOrdering}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  style={{
                    backgroundColor: menuTheme?.primaryColor || "var(--theme-primary)",
                    color: menuTheme?.textColor || "#ffffff",
                    borderColor: menuTheme?.primaryColor || "var(--theme-primary)",
                  }}
                  className="flex-1"
                  size="lg"
                  onClick={onPlaceOrder}
                  disabled={isOrdering}
                >
                  {isOrdering
                    ? isRTL
                      ? "جاري إرسال الطلب..."
                      : "Placing Order..."
                    : isRTL
                      ? "إرسال الطلب"
                      : "Send Order"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
