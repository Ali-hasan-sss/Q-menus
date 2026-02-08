"use client";

import { useAppDispatch } from "../hooks";
import { showToast } from "../slices/toastSlice";

export function useToast() {
  const dispatch = useAppDispatch();
  return {
    showToast: (message: string, type?: "success" | "error" | "info") =>
      dispatch(showToast({ message, type })),
  };
}
