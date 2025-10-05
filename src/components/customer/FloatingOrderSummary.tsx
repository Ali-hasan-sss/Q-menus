"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "./OrderSummary";
import { useLanguage } from "@/contexts/LanguageContext";
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
}: FloatingOrderSummaryProps) {
  const { isRTL, language } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);

  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Floating Bar */}
      <div
        className="fixed bottom-2 left-0 right-0 rounded-b-full rounded-t-[20px] mx-3 px-5 py-3 z-50 shadow-lg"
        style={{
          backgroundColor: menuTheme?.primaryColor || "#f97316",
          color: menuTheme?.textColor || "#ffffff",
        }}
        onClick={() => setShowDetails(!showDetails)}
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
              {formatCurrencyWithLanguage(total, currency, language)}
            </div>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs whitespace-nowrap flex-shrink-0"
              style={{
                backgroundColor:
                  menuTheme?.accentColor || "var(--theme-accent)",
                color: menuTheme?.textColor || "#ffffff",
                borderColor: menuTheme?.accentColor || "var(--theme-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  menuTheme?.secondaryColor || "var(--theme-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  menuTheme?.accentColor || "var(--theme-accent)";
              }}
            >
              {isRTL ? "ارسال" : "Order"}
            </Button>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md max-h-[90vh] rounded-t-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
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
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="p-4">
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
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
