"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card";
import { CheckCircle2 } from "lucide-react";
import type { ProfileData } from "~/components/shared/utils/types";

interface ParsedProfileCardProps {
  profileData: ProfileData;
}

export function ParsedProfileCard({ profileData }: ParsedProfileCardProps) {
  if (profileData.error) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
          Портфолио
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <span className="text-xs sm:text-sm font-medium">Платформа</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {(profileData.platform || profileData.username) !== undefined
                ? [profileData.platform, profileData.username]
                    .filter((value): value is string => Boolean(value))
                    .join(" • ") || "—"
                : "—"}
            </span>
          </div>
          {profileData.statistics?.rating !== undefined && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
              <span className="text-xs sm:text-sm font-medium">Рейтинг</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {profileData.statistics.rating}
              </span>
            </div>
          )}
          {profileData.statistics?.ordersCompleted !== undefined && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
              <span className="text-xs sm:text-sm font-medium">
                Заказов выполнено
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {profileData.statistics.ordersCompleted}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
