"use client";

import React, { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

export interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
  inputClassName?: string;
}

/**
 * مدخل رمز مكوّن من 6 خانات (أو length).
 * - لصق الرمز في أي خانة يملأ الخانات بالترتيب من اليسار لليمين.
 * - عند إدخال رقم تنتقل التركيز للخانة التالية.
 * - عند مسح خانة فارغة تنتقل التركيز للخانة السابقة وتمسحها.
 * - اتجاه الكتابة دائماً من اليسار لليمين (LTR) في كلا الوضعين.
 */
export function CodeInput({
  value,
  onChange,
  length = LENGTH,
  disabled = false,
  "aria-label": ariaLabel,
  className,
  inputClassName,
}: CodeInputProps) {
  const digits = value.replace(/\D/g, "").slice(0, length).split("");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setValueAt = useCallback(
    (index: number, digit: string) => {
      const arr = [...digits];
      while (arr.length < length) arr.push("");
      arr[index] = digit;
      const next = arr.join("").slice(0, length);
      onChange(next);
    },
    [digits, length, onChange]
  );

  const focusAt = useCallback((index: number) => {
    const i = Math.max(0, Math.min(index, length - 1));
    refs.current[i]?.focus();
  }, [length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > 1) {
      // لصق الرمز كاملاً في الخانات من الأولى (يسار) بغضّ النظر عن الخانة الحالية
      const fullCode = raw.slice(0, length);
      onChange(fullCode);
      focusAt(fullCode.length >= length ? length - 1 : fullCode.length);
      return;
    }
    const digit = raw.slice(-1);
    setValueAt(index, digit);
    if (digit) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      const arr = [...digits];
      while (arr.length < length) arr.push("");
      arr[index - 1] = "";
      onChange(arr.join("").slice(0, length));
      focusAt(index - 1);
    } else if (e.key === "Backspace" && digits[index]) {
      e.preventDefault();
      const arr = [...digits];
      while (arr.length < length) arr.push("");
      arr[index] = "";
      onChange(arr.join("").slice(0, length));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (_index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
    if (!pasted) return;
    // لصق الرمز كاملاً من الخانة الأولى (يسار) بغضّ النظر عن الخانة التي فيها التركيز
    const fullCode = pasted.slice(0, length);
    onChange(fullCode);
    focusAt(fullCode.length >= length ? length - 1 : fullCode.length);
  };

  const boxes = Array.from({ length }, (_, i) => i);

  return (
    <div
      dir="ltr"
      className={cn("flex justify-center gap-2 sm:gap-3", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {boxes.map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          disabled={disabled}
          className={cn(
            "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
            "border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            inputClassName
          )}
          aria-label={ariaLabel ? `${ariaLabel} ${i + 1} ${length}` : undefined}
        />
      ))}
    </div>
  );
}
