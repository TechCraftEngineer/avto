"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { sanitizeHtmlFunction } from "@qbs-autonaim/shared/client";
import { Badge, Button, Separator } from "@qbs-autonaim/ui";
import { Award, ExternalLink } from "lucide-react";
import { getProfileData } from "../utils/types";

type GigResponseDetail = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

interface ExperienceTabProps {
  response: GigResponseDetail | VacancyResponseDetail;
}

export function ExperienceTab({ response }: ExperienceTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {(() => {
        const experienceData = getProfileData(
          response.profileData,
          response.experience,
        );

        if (experienceData.isJson && experienceData.data) {
          const profile = experienceData.data;
          return (
            <>
              {/* Информация о платформе */}
              <div className="space-y-2">
                <h4 className="text-xs sm:text-sm font-semibold">
                  Профиль фрилансера
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                    <span className="text-xs sm:text-sm font-medium">
                      Платформа
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {profile.platform}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                    <span className="text-xs sm:text-sm font-medium">
                      Имя пользователя
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {profile.username}
                    </span>
                  </div>
                </div>
                {profile.profileUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
                    asChild
                  >
                    <a
                      href={profile.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Открыть профиль
                    </a>
                  </Button>
                )}
              </div>

              {/* О себе */}
              {profile.aboutMe && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-xs sm:text-sm font-semibold">О себе</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed break-words">
                      {profile.aboutMe}
                    </p>
                  </div>
                </>
              )}

              {/* Навыки */}
              {profile.skills && profile.skills.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold">Навыки</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {profile.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs sm:text-sm"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Статистика */}
              {profile.statistics && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold">
                      Статистика
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {profile.statistics.rating !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Рейтинг
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.rating}
                          </span>
                        </div>
                      )}
                      {profile.statistics.ordersCompleted !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Заказов выполнено
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.ordersCompleted}
                          </span>
                        </div>
                      )}
                      {profile.statistics.reviewsReceived !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Отзывов получено
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.reviewsReceived}
                          </span>
                        </div>
                      )}
                      {profile.statistics.successRate !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Успешность
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.successRate}%
                          </span>
                        </div>
                      )}
                      {profile.statistics.onTimeRate !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Вовремя
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.onTimeRate}%
                          </span>
                        </div>
                      )}
                      {profile.statistics.repeatOrdersRate !== undefined && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Повторные заказы
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.repeatOrdersRate}%
                          </span>
                        </div>
                      )}
                      {profile.statistics.buyerLevel && (
                        <div className="flex items-center justify-between p-2 rounded-lg border gap-2">
                          <span className="text-xs sm:text-sm font-medium">
                            Уровень
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {profile.statistics.buyerLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          );
        }

        // Обычный текстовый опыт
        if (experienceData.text) {
          return (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold">Опыт работы</h4>
              <p
                className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed break-words"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtmlFunction(experienceData.text || ""),
                }}
              />
            </div>
          );
        }

        return null;
      })()}
      {response.skills && response.skills.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold">Навыки</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {response.skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-xs sm:text-sm"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
      {!response.experience &&
        (!response.skills || response.skills.length === 0) && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <Award className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">
              Информация об опыте не предоставлена
            </p>
          </div>
        )}
    </div>
  );
}
