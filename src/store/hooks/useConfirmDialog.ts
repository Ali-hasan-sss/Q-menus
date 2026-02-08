"use client";

import { useAppDispatch } from "../hooks";
import { showConfirm } from "../slices/confirmDialogSlice";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
  const dispatch = useAppDispatch();
  return {
    showConfirm: (options: ConfirmDialogOptions) => dispatch(showConfirm(options)),
  };
}
