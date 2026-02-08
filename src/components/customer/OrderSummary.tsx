"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrencyWithLanguage } from "@/lib/utils";
import { useLanguage } from "@/store/hooks/useLanguage";

interface CurrencyExchange {
  id: string;
  currency: string;
  exchangeRate: number;
  isActive: boolean;
}

interface OrderSummaryProps {
  orderItems: Array<{
    menuItemId: string;
    name: string;
    nameAr?: string;
    price: string;
    currency: string;
    quantity: number;
    notes?: string;
    extras?: any;
  }>;
  total: number;
  currency: string;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onPlaceOrder: () => void;
  isOrdering: boolean;
  customerName: string;
  setCustomerName: (name: string) => void;
  onClose: () => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerAddress: string;
  setCustomerAddress: (address: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  isRTL: boolean;
  isDelivery?: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  } | null;
  findMenuItemById?: (id: string) => any; // Function to find original menu item data
  currencyExchanges?: CurrencyExchange[];
  selectedPaymentCurrency?: string | null;
  setSelectedPaymentCurrency?: (currency: string | null) => void;
}

export function OrderSummary({
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
  isRTL,
  isDelivery = false,
  onClose,
  theme,
  findMenuItemById,
  currencyExchanges = [],
  selectedPaymentCurrency,
  setSelectedPaymentCurrency,
}: OrderSummaryProps) {
  const { language } = useLanguage();

  // Get currency display name (translated)
  const getCurrencyDisplayName = (currencyCode: string): string => {
    // Use formatCurrencyWithLanguage to get translated name, then extract just the name
    const formatted = formatCurrencyWithLanguage(0, currencyCode, language);
    // Extract currency name (everything after the number)
    const parts = formatted.split(" ");
    return parts.slice(1).join(" ") || currencyCode;
  };

  // Calculate total in selected currency
  const calculateTotalInCurrency = (
    totalInBaseCurrency: number,
    selectedCurrency: string | null | undefined
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
  if (orderItems.length === 0) {
    return (
      <Card className="sticky top-8">
        <h3 className="text-lg font-semibold text-black mb-4">
          {isRTL ? "طلبك" : "Your Order"}
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            {isRTL ? "طلبك فارغ" : "Your order is empty"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {isRTL
              ? "أضف عناصر من القائمة للبدء"
              : "Add items from the menu to get started"}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-black mb-4">
        {isRTL ? "طلبك" : "Your Order"} ({orderItems.length}{" "}
        {isRTL ? "عنصر" : "item"}
        {orderItems.length !== 1 ? (isRTL ? "ات" : "s") : ""})
      </h3>

      {/* Order Items */}
      <div className="space-y-3 mb-6">
        {orderItems.map((item) => (
          <OrderItem
            key={item.menuItemId}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            isRTL={isRTL}
            originalItem={findMenuItemById?.(item.menuItemId)}
          />
        ))}
      </div>

      {/* Customer Name - Only for delivery */}
      {isDelivery && (
        <div className="mb-4 text-black">
          <Input
            label={isRTL ? "اسم العميل" : "Customer Name"}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
            required
          />
        </div>
      )}

      {/* Phone Number - Only for delivery */}
      {isDelivery && (
        <div className="mb-4 text-black">
          <Input
            label={isRTL ? "رقم الهاتف" : "Phone Number"}
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder={isRTL ? "أدخل رقم هاتفك" : "Enter your phone number"}
            required
          />
        </div>
      )}

      {/* Address - Only for delivery */}
      {isDelivery && (
        <div className="mb-4 text-black">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isRTL ? "العنوان" : "Address"}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            rows={3}
            placeholder={
              isRTL ? "أدخل عنوانك الكامل" : "Enter your full address"
            }
            required
          />
        </div>
      )}

      {/* Order Notes */}
      <div className="mb-4 text-black">
        <label className="block text-sm font-medium text-black mb-1">
          {isRTL ? "ملاحظات الطلب" : "Order Notes"}{" "}
          {!isDelivery && (isRTL ? "(اختياري)" : "(Optional)")}
        </label>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black"
          rows={3}
          placeholder={
            isRTL
              ? "أي تعليمات خاصة لطلبك..."
              : "Any special instructions for your order..."
          }
        />
      </div>

      {/* Currency Selector */}
      {currencyExchanges.length > 0 && setSelectedPaymentCurrency && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-black mb-1">
            {isRTL ? "عملة الدفع:" : "Payment Currency:"}
          </label>
          <select
            value={selectedPaymentCurrency || currency}
            onChange={(e) =>
              setSelectedPaymentCurrency(
                e.target.value === currency ? null : e.target.value
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-black focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          >
            <option value={currency}>
              {getCurrencyDisplayName(currency)} ({isRTL ? "أساسي" : "Base"})
            </option>
            {currencyExchanges.map((ce) => (
              <option key={ce.id} value={ce.currency}>
                {getCurrencyDisplayName(ce.currency)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Total */}
      <div className="border-t border-gray-200 pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-black">
            {isRTL ? "المجموع:" : "Total:"}
          </span>
          <div className="text-right">
            <span
              className="text-xl font-bold block"
              style={{
                color: theme?.primaryColor || "var(--theme-primary)",
              }}
            >
              {formatCurrencyWithLanguage(
                displayTotal.amount,
                displayTotal.currency,
                language
              )}
            </span>
            {selectedPaymentCurrency &&
              selectedPaymentCurrency !== currency && (
                <div className="text-xs text-gray-500 mt-1">
                  {isRTL ? "المجموع الأصلي:" : "Original:"}{" "}
                  {formatCurrencyWithLanguage(total, currency, language)}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="w-full flex items-center gap-2">
        <Button
          variant="outline"
          className="w-full bg-orange-500"
          size="lg"
          onClick={onClose}
          loading={isOrdering}
          disabled={isOrdering}
        >
          {isRTL ? "إلغاء" : "Cancel"}
        </Button>
        <Button
          style={{
            backgroundColor: theme?.primaryColor || "var(--theme-primary)",
            color: theme?.textColor || "#ffffff",
            borderColor: theme?.primaryColor || "var(--theme-primary)",
          }}
          className="w-full"
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
              : "Place Order"}
        </Button>
      </div>

      <p className="text-xs text-gray-500 mt-3 text-center">
        {isRTL
          ? "سيتم إرسال طلبك إلى المطبخ وستتلقى تحديثات في الوقت الفعلي"
          : "Your order will be sent to the kitchen and you'll receive updates in real-time"}
      </p>
    </div>
  );
}

interface OrderItemProps {
  item: {
    menuItemId: string;
    name: string;
    nameAr?: string;
    price: string;
    currency: string;
    quantity: number;
    notes?: string;
    extras?: any;
  };
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  isRTL: boolean;
  originalItem?: any; // Original menu item data to get extras names
}

function OrderItem({
  item,
  onUpdateQuantity,
  onRemoveItem,
  isRTL,
  originalItem,
}: OrderItemProps) {
  // Use the actual item name and price
  const { language } = useLanguage();
  const itemName = isRTL ? item.nameAr || item.name : item.name;
  const itemPrice = parseFloat(item.price);

  // Calculate item total with discount if available
  const calculateItemTotal = (price: number, quantity: number) => {
    // Note: discount calculation should be done at the source when adding to order
    return price * quantity;
  };

  // Helper function to extract extras names
  const getExtrasNames = (extras: any) => {
    if (!extras || typeof extras !== "object" || !originalItem?.extras)
      return [];

    const extrasNames: string[] = [];
    Object.values(extras).forEach((extraGroup: any) => {
      if (Array.isArray(extraGroup)) {
        // This is an array of selected extra IDs
        extraGroup.forEach((extraId: string) => {
          // Find the extra name from the original item data
          Object.values(originalItem.extras).forEach(
            (originalExtraGroup: any) => {
              if (originalExtraGroup.options) {
                const option = originalExtraGroup.options.find(
                  (opt: any) => opt.id === extraId
                );
                if (option) {
                  const extraName = isRTL
                    ? option.nameAr || option.name
                    : option.name;
                  extrasNames.push(extraName);
                }
              }
            }
          );
        });
      }
    });
    return extrasNames;
  };

  const extrasNames = getExtrasNames(item.extras);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-black truncate">{itemName}</p>
        {extrasNames.length > 0 && (
          <div className="text-xs text-blue-600 mt-1">
            {extrasNames.map((extra, index) => (
              <span key={index}>
                {extra}
                {index < extrasNames.length - 1 && ", "}
              </span>
            ))}
          </div>
        )}
        {item.notes && (
          <p className="text-xs text-gray-500 truncate mt-1">
            Note: {item.notes}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
          >
            -
          </Button>
          <span className="w-8 text-center text-black text-sm">
            {item.quantity}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
          >
            +
          </Button>
        </div>
        <span className="text-sm font-semibold text-black min-w-[60px] text-right">
          {formatCurrencyWithLanguage(
            calculateItemTotal(itemPrice, item.quantity),
            item.currency,
            language
          )}
        </span>
        <Button
          size="sm"
          variant="danger"
          onClick={() => onRemoveItem(item.menuItemId)}
        >
          ×
        </Button>
      </div>
    </div>
  );
}
