"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/store/hooks/useLanguage";
import { getLocalizedName } from "@/lib/utils";

interface Menu {
  id: string;
  name: string;
  nameAr?: string;
}

interface MenuHeaderProps {
  menu: Menu | null;
  onEditMenu: () => void;
}

export function MenuHeader({ menu, onEditMenu }: MenuHeaderProps) {
  const { t, language } = useLanguage();
  const lang = language === "AR" ? "AR" : "EN";

  if (!menu) return null;

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getLocalizedName(menu.name, menu.nameAr, lang)}
          </h2>
        </div>
        <Button variant="outline" onClick={onEditMenu}>
          {t("menu.editMenu") || "Edit Menu Name"}
        </Button>
      </div>
    </Card>
  );
}
