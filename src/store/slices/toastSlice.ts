"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (
      state,
      action: PayloadAction<{ message: string; type?: ToastType }>
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      state.toasts.push({
        id,
        message: action.payload.message,
        type: action.payload.type || "info",
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
