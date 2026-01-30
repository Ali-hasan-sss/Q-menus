"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (discount: number) => Promise<void>;
  title: string;
  description?: string;
}

export function DiscountModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
}: DiscountModalProps) {
  const { isRTL } = useLanguage();
  const [discount, setDiscount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDiscount("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = parseFloat(discount);
    if (isNaN(value) || value < 0 || value > 100) {
      setError(
        isRTL
          ? "الخصم يجب أن يكون رقماً بين 0 و 100"
          : "Discount must be between 0 and 100",
      );
      return;
    }

    setLoading(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setError(
        isRTL ? "حدث خطأ أثناء تطبيق الخصم" : "Failed to apply discount",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {isRTL ? "نسبة الخصم (%)" : "Discount (%)"}
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            step={1}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder={isRTL ? "مثال: 10" : "e.g. 10"}
            className="w-full"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isRTL
                ? "جاري التطبيق..."
                : "Applying..."
              : isRTL
                ? "تطبيق الخصم"
                : "Apply Discount"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
