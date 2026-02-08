"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { removeToast } from "@/store/slices/toastSlice";
import { Toast } from "./Toast";

export function ToastContainer() {
  const toasts = useAppSelector((s) => s.toast.toasts);
  const dispatch = useAppDispatch();

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => dispatch(removeToast(toast.id))}
        />
      ))}
    </>
  );
}
