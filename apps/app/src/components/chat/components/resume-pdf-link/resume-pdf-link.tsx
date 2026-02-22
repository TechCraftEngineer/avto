"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useORPC } from "~/orpc/react";

interface ResumePdfLinkProps {
  fileKey: string;
}

export function ResumePdfLink({ fileKey }: ResumePdfLinkProps) {
  const orpc = useORPC();

  const { data: fileData, isLoading } = useQuery({
    ...orpc.telegram.file.getUrl.queryOptions({ key: fileKey }),
  });

  const handleOpen = () => {
    if (fileData?.url) {
      window.open(fileData.url, "_blank");
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={isLoading || !fileData?.url}
        className="w-full"
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        {isLoading ? "Загрузка..." : "Открыть резюме"}
      </Button>
    </div>
  );
}
