"use client";

import { Button } from "@qbs-autonaim/ui";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { triggerUpdateSingleVacancy } from "~/actions/trigger";

interface UpdateVacancyButtonProps {
  vacancyId: string;
}

export function UpdateVacancyButton({ vacancyId }: UpdateVacancyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      const result = await triggerUpdateSingleVacancy(vacancyId);
      if (result.success) {
        toast.success("Обновление вакансии запущено");
      } else {
        toast.error(result.error || "Ошибка запуска обновления");
      }
    } catch (_error) {
      toast.error("Ошибка запуска обновления");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpdate}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Обновление..." : "Обновить вакансию"}
    </Button>
  );
}
