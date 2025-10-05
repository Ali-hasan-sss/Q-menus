"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();

  if (!menu) return null;

  return (
    <Card className="p-6 mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {menu.name}
          </h2>
          {menu.nameAr && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {menu.nameAr}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={onEditMenu}>
          {t("menu.editMenu") || "Edit Menu Name"}
        </Button>
      </div>
    </Card>
  );
}
