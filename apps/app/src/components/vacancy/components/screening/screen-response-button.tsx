"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ScreeningDataForRecommendation } from "@qbs-autonaim/shared";
import { triggerScreenResponse } from "~/actions/trigger";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { ScreeningResultModal } from "./screening-result-modal";

interface ScreenResponseButtonProps {
  responseId: string;
  vacancyId?: string;
  candidateName?: string;
}

export function ScreenResponseButton({
  responseId,
  vacancyId,
  candidateName,
}: ScreenResponseButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [screeningResult, setScreeningResult] =
    useState<ScreeningDataForRecommendation | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const mountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleClick = async () => {
    setIsLoading(true);
    setScreeningResult(null);

    try {
      const triggerResult = await triggerScreenResponse(responseId);

      if (!triggerResult.success) {
        console.error("Не удалось запустить оценку:", triggerResult.error);
        setIsLoading(false);
        return;
      }

      console.log("Запущена оценка отклика");

      // Ждем завершения скрининга и получаем результат
      await pollScreeningResult();
    } catch (error) {
      console.error("Ошибка при оценке:", error);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const pollScreeningResult = async (): Promise<void> => {
    if (!workspace?.id) {
      throw new Error("Workspace ID is required");
    }

    const maxAttempts = 30; // 30 попыток = ~30 секунд

    // Очищаем предыдущий таймер если есть
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return new Promise((resolve, reject) => {
      let attempts = 0;
      let timeoutId: NodeJS.Timeout | null = null;

      const poll = async () => {
        // Проверяем, не размонтирован ли компонент
        if (!mountedRef.current) {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reject(new Error("Component unmounted"));
          return;
        }

        try {
          const response = await queryClient.fetchQuery(
            trpc.vacancy.responses.get.queryOptions({
              id: responseId,
              workspaceId: workspace.id,
            }),
          );

          if (response?.screening) {
            // Очищаем таймер при успешном завершении
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            timeoutRef.current = null;

            if (mountedRef.current) {
              setScreeningResult({
                score: response.screening.score,
                detailedScore: response.screening.detailedScore,
                analysis: response.screening.analysis || "",
              });
              setIsLoading(false);
              setShowModal(true);

              // Обновляем кэш только для текущей вакансии
              if (vacancyId) {
                void queryClient.invalidateQueries({
                  queryKey: trpc.vacancy.responses.list.queryKey({
                    vacancyId,
                  }),
                });
              } else {
                void queryClient.invalidateQueries(
                  trpc.vacancy.responses.list.pathFilter(),
                );
              }
            }
            resolve();
            return;
          }

          attempts++;
          if (attempts < maxAttempts) {
            // Проверяем mounted перед установкой нового таймера
            if (mountedRef.current) {
              timeoutId = setTimeout(poll, 1000);
              timeoutRef.current = timeoutId;
            } else {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              reject(new Error("Component unmounted"));
            }
          } else {
            // Очищаем таймер при достижении максимума попыток
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            timeoutRef.current = null;

            const error = new Error(
              "Скрининг не завершился в течение 30 секунд",
            );
            if (mountedRef.current) {
              setIsLoading(false);
            }
            reject(error);
          }
        } catch (error) {
          console.error("Ошибка при получении результата скрининга:", error);
          attempts++;
          if (attempts < maxAttempts) {
            // Проверяем mounted перед установкой нового таймера
            if (mountedRef.current) {
              timeoutId = setTimeout(poll, 1000);
              timeoutRef.current = timeoutId;
            } else {
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              reject(new Error("Component unmounted"));
            }
          } else {
            // Очищаем таймер при достижении максимума попыток
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            timeoutRef.current = null;

            if (mountedRef.current) {
              setIsLoading(false);
            }
            reject(error);
          }
        }
      };

      // Начинаем опрос
      poll();
    });
  };

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      setScreeningResult(null);
      if (vacancyId) {
        void queryClient.invalidateQueries({
          queryKey: trpc.vacancy.responses.list.queryKey({ vacancyId }),
        });
      } else {
        void queryClient.invalidateQueries(
          trpc.vacancy.responses.list.pathFilter(),
        );
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
        className="gap-1.5 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300 dark:hover:bg-purple-950 dark:hover:text-purple-400 dark:hover:border-purple-800"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? "Оценка…" : "Оценить"}
      </Button>

      <ScreeningResultModal
        open={showModal}
        onOpenChange={handleModalClose}
        result={screeningResult}
        candidateName={candidateName}
      />
    </>
  );
}
