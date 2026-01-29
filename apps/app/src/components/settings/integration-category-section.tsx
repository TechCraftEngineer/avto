"use client";

import { Alert, AlertDescription, Badge } from "@qbs-autonaim/ui";
import { Briefcase, Info, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

interface IntegrationCategorySectionProps {
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  children: ReactNode;
  showTelegramInfo?: boolean;
}

const CATEGORY_ICONS = {
  briefcase: Briefcase,
  "message-circle": MessageCircle,
};

export function IntegrationCategorySection({
  categoryId,
  name,
  description,
  icon,
  children,
  showTelegramInfo,
}: IntegrationCategorySectionProps) {
  const IconComponent = CATEGORY_ICONS[icon as keyof typeof CATEGORY_ICONS];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 mt-1">
          {IconComponent && <IconComponent className="h-5 w-5 text-primary" />}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{name}</h3>
            <Badge variant="outline" className="text-xs">
              {categoryId}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {showTelegramInfo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Требуется Telegram:</strong> Для работы интеграций из этой
            категории необходимо подключить Telegram аккаунт. Он используется
            для получения уведомлений и взаимодействия с системой.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 pl-11">{children}</div>
    </div>
  );
}
