"use client";

import { configureStore } from "@reduxjs/toolkit";
import languageReducer from "./slices/languageSlice";
import authReducer from "./slices/authSlice";
import menuReducer from "./slices/menuSlice";
import toastReducer from "./slices/toastSlice";
import confirmDialogReducer from "./slices/confirmDialogSlice";

export const store = configureStore({
  reducer: {
    language: languageReducer,
    auth: authReducer,
    menu: menuReducer,
    toast: toastReducer,
    confirmDialog: confirmDialogReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
