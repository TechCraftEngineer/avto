"use client";

import { DeleteVacancyDialog as UIDeleteVacancyDialog } from "@qbs-autonaim/ui/delete-vacancy-dialog";

interface DeleteVacancyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (option: "anonymize" | "delete") => void;
  vacancyTitle: string;
  isLoading?: boolean;
}

export function DeleteVacancyDialog(props: DeleteVacancyDialogProps) {
  return <UIDeleteVacancyDialog {...props} />;
}
