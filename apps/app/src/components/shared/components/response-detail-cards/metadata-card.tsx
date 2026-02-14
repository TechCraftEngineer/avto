"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { formatDate } from "../../utils/constants";

type GigResponseDetail = RouterOutputs["gig"]["responses"]["get"];

interface MetadataCardProps {
  response: GigResponseDetail;
}

export function MetadataCard({ response }: MetadataCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base">Метаданные</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">ID отклика</span>
            <code className="text-xs bg-muted px-2 py-1 rounded break-all text-right">
              {response.id}
            </code>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Создан</span>
            <span className="text-right">{formatDate(response.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Обновлен</span>
            <span className="text-right">{formatDate(response.updatedAt)}</span>
          </div>
          {response.welcomeSentAt && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                Приветствие отправлено
              </span>
              <span className="text-right">
                {formatDate(response.welcomeSentAt)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
