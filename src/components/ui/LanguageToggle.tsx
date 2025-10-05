"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "./Button";
import { GlobeIcon } from "lucide-react";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "AR" ? "EN" : "AR");
  };

  return (
    <button onClick={toggleLanguage} className="flex items-center space-x-2">
      <span className="text-sm font-medium">{language}</span>
      <GlobeIcon />
    </button>
  );
}
