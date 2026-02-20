import { useState } from "react";

/**
 * Сериализованная версия токена подписки для передачи через server actions.
 * Server actions сериализуют объекты, поэтому Channel превращается в строку.
 */
export type SerializedSubscriptionToken = {
  channel: string;
  topics: string[];
  key: string;
};

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

  // Active vacancies selection
  const [isSelectingActiveVacancies, setIsSelectingActiveVacancies] =
    useState(false);
  const [activeListRequestId, setActiveListRequestId] = useState<string | null>(
    null,
  );
  const [activeListToken, setActiveListToken] =
    useState<SerializedSubscriptionToken | null>(null);

  // Archived vacancies selection
  const [isSelectingArchivedVacancies, setIsSelectingArchivedVacancies] =
    useState(false);
  const [archivedListRequestId, setArchivedListRequestId] = useState<
    string | null
  >(null);
  const [archivedListToken, setArchivedListToken] =
    useState<SerializedSubscriptionToken | null>(null);

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

    // Active vacancies
    isSelectingActiveVacancies,
    setIsSelectingActiveVacancies,
    activeListRequestId,
    setActiveListRequestId,
    activeListToken,
    setActiveListToken,

    // Archived vacancies
    isSelectingArchivedVacancies,
    setIsSelectingArchivedVacancies,
    archivedListRequestId,
    setArchivedListRequestId,
    archivedListToken,
    setArchivedListToken,

    // URL import
    vacancyUrl,
    setVacancyUrl,
    urlError,
    setUrlError,
    byUrlRequestId,
    setByUrlRequestId,
  };
}
