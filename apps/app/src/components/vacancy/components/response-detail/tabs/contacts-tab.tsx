"use client";

import type { VacancyResponseDetail } from "~/components/responses/types";
import { Separator } from "@qbs-autonaim/ui";
import {
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  Phone,
} from "lucide-react";

interface VacancyContactsTabProps {
  response: VacancyResponseDetail;
}

export function VacancyContactsTab({ response }: VacancyContactsTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        {response.email && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/50">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium mb-1">Email</div>
              <a
                href={`mailto:${response.email}`}
                className="text-xs sm:text-sm text-primary hover:underline break-all"
              >
                {response.email}
              </a>
            </div>
          </div>
        )}

        {response.phone && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/50">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium mb-1">Телефон</div>
              <a
                href={`tel:${response.phone}`}
                className="text-xs sm:text-sm text-primary hover:underline"
              >
                {response.phone}
              </a>
            </div>
          </div>
        )}

        {response.telegramUsername && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/50">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium mb-1">
                Telegram
              </div>
              <a
                href={`https://t.me/${response.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-primary hover:underline break-all"
              >
                @{response.telegramUsername}
              </a>
            </div>
          </div>
        )}

        {response.profileUrl && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/50">
            <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium mb-1">Профиль</div>
              <a
                href={response.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm text-primary hover:underline break-all"
              >
                {response.profileUrl}
              </a>
            </div>
          </div>
        )}
      </div>

      {response.resumeId && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">Резюме</h4>
            <div className="flex items-start gap-2 sm:gap-3 p-3 rounded-lg border bg-muted/50">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium mb-1">
                  ID резюме
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground break-all">
                  {response.resumeId}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {response.contacts && typeof response.contacts === "object" && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">
              Дополнительные контакты
            </h4>
            <div className="space-y-2">
              {Object.entries(response.contacts).map(([key, value]) => {
                const displayValue =
                  typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value);

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg border gap-2"
                  >
                    <span className="text-xs sm:text-sm font-medium capitalize wrap-break-word">
                      {key}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground break-all text-right">
                      {displayValue}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!response.email &&
        !response.phone &&
        !response.telegramUsername &&
        !response.profileUrl &&
        !response.resumeId && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <Phone className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">
              Контактная информация не предоставлена
            </p>
          </div>
        )}
    </div>
  );
}
