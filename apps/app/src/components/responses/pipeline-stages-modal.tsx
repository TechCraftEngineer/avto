"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import { VacancyPipelineStagesSettings } from "~/components/vacancy/components/settings/vacancy-pipeline-stages-settings";

interface PipelineStagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancyId: string;
  workspaceId: string;
}

export function PipelineStagesModal({
  open,
  onOpenChange,
  vacancyId,
  workspaceId,
}: PipelineStagesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Этапы канбан-доски</DialogTitle>
          <DialogDescription>
            Настройте этапы для отображения откликов на канбан-доске. Порядок
            можно менять перетаскиванием.
          </DialogDescription>
        </DialogHeader>
        <VacancyPipelineStagesSettings
          vacancyId={vacancyId}
          workspaceId={workspaceId}
          embedded
        />
      </DialogContent>
    </Dialog>
  );
}
