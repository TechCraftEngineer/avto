"use client";

import { Badge } from "@qbs-autonaim/ui";
import { Button } from "@qbs-autonaim/ui";
import { Separator } from "@qbs-autonaim/ui";
import { Award, ExternalLink } from "lucide-react";
import { getProfileData } from "~/components/shared/utils/types";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

import type { GigResponseDetail } from "~/components/responses/types";

interface GigExperienceTabProps {
  response: GigResponseDetail;
}

export function GigExperienceTab({ response }: GigExperienceTabProps) {
  const experienceData = getProfileData(response.profileData, null);

  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {(() => {
        if (experienceData.isJson && experienceData.data) {
          const profile = experienceData.data;

          // Проверяем, это данные фрилансера
          const isFreelancerProfile = !!(
            profile.platform ||
            profile.username ||
            profile.statistics
          );

          if (isFreelancerProfile) {
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
                      <h4 className="text-xs sm:text-sm font-semibold">
                        О себе
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
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
                      <h4 className="text-xs sm:text-sm font-semibold">
                        Навыки
                      </h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {profile.skills.map((skill: string) => (
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

          // Если это резюме (для гигов тоже может быть)
          const isResumeProfile = !!(
            profile.experience ||
            profile.education ||
            profile.summary
          );

          if (isResumeProfile) {
            return (
              <>
                {/* Краткая информация */}
                {profile.summary && (
                  <div className="space-y-2">
                    <h4 className="text-xs sm:text-sm font-semibold">
                      О кандидате
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed wrap-break-word">
                      {profile.summary}
                    </p>
                  </div>
                )}

                {/* Опыт работы */}
                {profile.experience && (
                  <>
                    {profile.summary && <Separator />}
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-semibold">
                        Опыт работы
                      </h4>
                      {Array.isArray(profile.experience) ? (
                        <div className="space-y-3">
                          {profile.experience.map((item, index) => {
                            const exp = item.experience || item;
                            const key =
                              exp.company && exp.position
                                ? `${exp.company}-${exp.position}-${index}`
                                : `exp-${index}`;
                            return (
                              <div
                                key={key}
                                className="p-3 rounded-lg border space-y-1.5"
                              >
                                {exp.position && (
                                  <div className="font-medium text-xs sm:text-sm">
                                    {exp.position}
                                  </div>
                                )}
                                {exp.company && (
                                  <div className="text-xs sm:text-sm text-muted-foreground">
                                    {exp.company}
                                  </div>
                                )}
                                {exp.period && (
                                  <div className="text-xs text-muted-foreground">
                                    {exp.period}
                                  </div>
                                )}
                                {exp.description && (
                                  <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word mt-2">
                                    {exp.description}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtmlFunction(
                              typeof profile.experience === "string"
                                ? profile.experience
                                : String(profile.experience),
                            ),
                          }}
                        />
                      )}
                    </div>
                  </>
                )}

                {/* Навыки из profileData */}
                {profile.skills && profile.skills.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-xs sm:text-sm font-semibold">
                        Навыки
                      </h4>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {profile.skills.map((skill: string) => (
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
              </>
            );
          }
        }

        // Обычный текстовый опыт
        if (experienceData.text) {
          return (
            <div className="space-y-2">
              <h4 className="text-xs sm:text-sm font-semibold">Опыт работы</h4>
              <p
                className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word"
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
              {response.skills.map((skill: string) => (
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
      {!experienceData.isJson &&
        !experienceData.text &&
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
