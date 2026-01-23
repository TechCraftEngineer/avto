"use client";

import { Button } from "@qbs-autonaim/ui";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerScreenResponse } from "~/actions/trigger";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { ScreeningResultModal } from "./screening-result-modal";

interface ScreeningResult {
  score: number;
  detailedScore: number;
  analysis: string;
}

interface ScreenResponseButtonProps {
  responseId: string;
  accessToken: string | undefined;
  candidateName?: string;
}

export function ScreenResponseButton({
  responseId,
  candidateName,
}: ScreenResponseButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [screeningResult, setScreeningResult] =
    useState<ScreeningResult | null>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

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
      setIsLoading(false);
    }
  };

  const pollScreeningResult = async () => {
    const maxAttempts = 30; // 30 попыток = ~30 секунд
    let attempts = 0;

    const poll = async () => {
      try {
        const response = (await queryClient.fetchQuery(
          trpc.vacancy.responses.get.queryOptions({
            id: responseId,
            workspaceId: workspace?.id ?? "",
          }),
        )) as any; // TODO: Fix typing

        if (response?.screening) {
          setScreeningResult({
            score: response.screening.score,
            detailedScore: response.screening.detailedScore,
            analysis: response.screening.analysis || "",
          });
          setIsLoading(false);
          setShowModal(true);

          // Обновляем кэш списка откликов
          void queryClient.invalidateQueries(
            trpc.vacancy.responses.list.pathFilter(),
          );
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Проверяем каждую секунду
        } else {
          console.error("Скрининг не завершился в течение 30 секунд");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Ошибка при получении результата скрининга:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000);
        } else {
          setIsLoading(false);
        }
      }
    };

    poll();
  };

  const handleModalClose = (open: boolean) => {
    setShowModal(open);
    if (!open) {
      setScreeningResult(null);
      void queryClient.invalidateQueries(
        trpc.vacancy.responses.list.pathFilter(),
      );
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-1" />
        )}
        {isLoading ? "Оценка..." : "Оценить"}
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
