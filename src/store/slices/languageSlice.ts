"use client";

import { createSlice } from "@reduxjs/toolkit";
import { translations } from "@/contexts/LanguageContext";

export type Language = "AR" | "EN";

interface LanguageState {
  language: Language;
}

const initialState: LanguageState = {
  language: "AR",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: { payload: Language }) => {
      state.language = action.payload;
    },
    initLanguage: (state, action: { payload?: Language }) => {
      state.language = action.payload || "AR";
    },
  },
});

export const { setLanguage, initLanguage } = languageSlice.actions;

export const selectLanguage = (state: { language: LanguageState }) =>
  state.language.language;

export const selectIsRTL = (state: { language: LanguageState }) =>
  state.language.language === "AR";

export const selectTranslation = (state: { language: LanguageState }) => {
  const lang = state.language.language;
  return (key: string) =>
    (translations[lang] as Record<string, string>)[key] || key;
};

export default languageSlice.reducer;
