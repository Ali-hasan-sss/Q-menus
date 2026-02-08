"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { hideConfirm } from "@/store/slices/confirmDialogSlice";
import { useLanguage } from "@/store/hooks/useLanguage";

export function ConfirmDialogModal() {
  const { isOpen, options } = useAppSelector((s) => s.confirmDialog);
  const dispatch = useAppDispatch();
  const { isRTL } = useLanguage();

  const handleConfirm = async () => {
    if (options?.onConfirm) {
      await options.onConfirm();
    }
    dispatch(hideConfirm());
  };

  const handleCancel = () => {
    dispatch(hideConfirm());
  };

  if (!isOpen || !options) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        {options.title && (
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {options.title}
          </h3>
        )}
        <p className="text-gray-600 dark:text-gray-400 mb-6">{options.message}</p>
        <div
          className={`flex ${isRTL ? "flex-row-reverse" : "flex-row"} gap-3 justify-end`}
        >
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {options.cancelText || (isRTL ? "إلغاء" : "Cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              options.confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700"
            }`}
          >
            {options.confirmText || (isRTL ? "تأكيد" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
