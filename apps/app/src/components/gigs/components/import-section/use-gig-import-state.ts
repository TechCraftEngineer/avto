import { useState } from "react";

export function useGigImportState() {
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [isConfirmNewDialogOpen, setIsConfirmNewDialogOpen] = useState(false);
  const [isImportingNew, setIsImportingNew] = useState(false);
  const [isImportingByUrl, setIsImportingByUrl] = useState(false);
  const [gigUrl, setGigUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [byUrlRequestId, setByUrlRequestId] = useState<string | null>(null);

  return {
    isUrlDialogOpen,
    setIsUrlDialogOpen,
    isConfirmNewDialogOpen,
    setIsConfirmNewDialogOpen,
    isImportingNew,
    setIsImportingNew,
    isImportingByUrl,
    setIsImportingByUrl,
    gigUrl,
    setGigUrl,
    urlError,
    setUrlError,
    byUrlRequestId,
    setByUrlRequestId,
  };
}
