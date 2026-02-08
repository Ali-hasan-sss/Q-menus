"use client";

import { useLanguage } from "@/store/hooks/useLanguage";

interface MenuTabsProps {
  activeTab: "categories" | "theme";
  onTabChange: (tab: "categories" | "theme") => void;
  categoriesCount: number;
}

export function MenuTabs({
  activeTab,
  onTabChange,
  categoriesCount,
}: MenuTabsProps) {
  const { t } = useLanguage();

  const tabs = [
    {
      id: "categories" as const,
      label: t("menu.categories") || "Categories",
      count: categoriesCount,
    },
    {
      id: "theme" as const,
      label: t("menu.theme") || "Theme",
    },
  ];

  return (
    <div className="mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
