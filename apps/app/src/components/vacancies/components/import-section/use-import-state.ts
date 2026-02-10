import { useState } from "react";

export function useImportState() {
  // Dialog states
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isConfirmNewDialogOpen, setIsConfirmNewDialogOpen] = useState(false);
  const [isConfirmArchivedDialogOpen, setIsConfirmArchivedDialogOpen] =
    useState(false);

  // Import states
  const [isImportingNew, setIsImportingNew] = useState(false);
  const [isImportingArchived, setIsImportingArchived] = useState(false);
  const [isImportingByUrl, setIsImportingByUrl] = useState(false);

  // Archived vacancies selection
  const [isSelectingArchivedVacancies, setIsSelectingArchivedVacancies] =
    useState(false);
  const [archivedListRequestId, setArchivedListRequestId] = useState<
    string | null
  >(null);

  // URL import
  const [vacancyUrl, setVacancyUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [byUrlRequestId, setByUrlRequestId] = useState<string | null>(null);

  return {
    // Dialog states
    isUrlDialogOpen,
    setIsUrlDialogOpen,
    isConfirmNewDialogOpen,
    setIsConfirmNewDialogOpen,
    isConfirmArchivedDialogOpen,
    setIsConfirmArchivedDialogOpen,

    // Import states
    isImportingNew,
    setIsImportingNew,
    isImportingArchived,
    setIsImportingArchived,
    isImportingByUrl,
    setIsImportingByUrl,

    // Archived vacancies
    isSelectingArchivedVacancies,
    setIsSelectingArchivedVacancies,
    archivedListRequestId,
    setArchivedListRequestId,

    // URL import
    vacancyUrl,
    setVacancyUrl,
    urlError,
    setUrlError,
    byUrlRequestId,
    setByUrlRequestId,
  };
}
