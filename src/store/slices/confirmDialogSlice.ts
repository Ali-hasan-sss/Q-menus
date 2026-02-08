"use client";

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void | Promise<void>;
}

interface ConfirmDialogState {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
}

const initialState: ConfirmDialogState = {
  isOpen: false,
  options: null,
};

const confirmDialogSlice = createSlice({
  name: "confirmDialog",
  initialState,
  reducers: {
    showConfirm: (state, action: PayloadAction<ConfirmDialogOptions>) => {
      state.isOpen = true;
      state.options = action.payload;
    },
    hideConfirm: (state) => {
      state.isOpen = false;
      state.options = null;
    },
  },
});

export const { showConfirm, hideConfirm } = confirmDialogSlice.actions;
export default confirmDialogSlice.reducer;
