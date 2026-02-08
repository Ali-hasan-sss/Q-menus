"use client";

import { useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../hooks";
import {
  selectLanguage,
  selectIsRTL,
  setLanguage,
  initLanguage,
} from "../slices/languageSlice";
import { translations } from "@/contexts/LanguageContext";
import type { Language } from "../slices/languageSlice";

export function useLanguage() {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);
  const isRTL = useAppSelector(selectIsRTL);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language;
      if (saved === "AR" || saved === "EN") {
        dispatch(initLanguage(saved));
      } else {
        dispatch(initLanguage("AR"));
        localStorage.setItem("language", "AR");
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.dir = language === "AR" ? "rtl" : "ltr";
      document.documentElement.lang = language === "AR" ? "ar" : "en";
      localStorage.setItem("language", language);
    }
  }, [language]);

  const handleSetLanguage = useCallback(
    (newLanguage: Language) => {
      dispatch(setLanguage(newLanguage));
    },
    [dispatch]
  );

  const t = useCallback(
    (key: string): string => {
      return (translations[language] as Record<string, string>)[key] || key;
    },
    [language]
  );

  return {
    language,
    setLanguage: handleSetLanguage,
    t,
    isRTL,
  };
}
