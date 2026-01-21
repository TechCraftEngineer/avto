"use client";

import { Button } from "@qbs-autonaim/ui";
import {
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import type { RouterOutputs } from "@qbs-autonaim/api";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { skipToken } from "@tanstack/react-query";

type GigResponseDetail = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
type VacancyResponseDetail = NonNullable<
  RouterOutputs["vacancy"]["responses"]["get"]
>;

interface PortfolioTabProps {
  response: GigResponseDetail | VacancyResponseDetail;
}

export function PortfolioTab({ response }: PortfolioTabProps) {
  const { workspace } = useWorkspace();
  const trpc = useTRPC();

  // Получаем URL фото если есть photoFileId
  const { data: photoData } = useQuery({
    ...trpc.files.getImageUrl.queryOptions({
      workspaceId: workspace?.id ?? "",
      fileId: response.photoFileId ?? "",
    }),
    enabled: Boolean(workspace?.id && response.photoFileId),
  });

  // Получаем URL портфолио файла если есть portfolioFileId
  const {
    data: portfolioData,
    isPending: isPortfolioLoading,
    error: portfolioError,
  } = useQuery(
    trpc.files.getFileUrl.queryOptions(
      workspace?.id && response.portfolioFileId
        ? {
            workspaceId: workspace.id,
            fileId: response.portfolioFileId,
          }
        : skipToken,
    ),
  );

  const handleViewPhoto = () => {
    if (photoData?.url) {
      // Открываем изображение в новой вкладке
      window.open(photoData.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownloadPortfolio = () => {
    if (portfolioData?.url) {
      // Создаем временную ссылку для скачивания
      const link = document.createElement("a");
      link.href = portfolioData.url;
      link.download = portfolioData.fileName || "portfolio";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  return (
    <div className="space-y-3 sm:space-y-4 mt-0">
      {response.portfolioLinks && response.portfolioLinks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold">Ссылки на работы</h4>
          <div className="space-y-2">
            {response.portfolioLinks.map((link) => (
              <Button
                key={link}
                variant="outline"
                size="sm"
                className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
                asChild
              >
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="truncate text-xs sm:text-sm">{link}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      )}

      {response.portfolioFileId && (
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold">Файл портфолио</h4>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            onClick={handleDownloadPortfolio}
            disabled={
              isPortfolioLoading ||
              !portfolioData?.url ||
              Boolean(portfolioError)
            }
          >
            {isPortfolioLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Загрузка…
              </>
            ) : portfolioError ? (
              <>
                <FileText className="h-4 w-4" />
                Ошибка загрузки
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Скачать портфолио
              </>
            )}
          </Button>
        </div>
      )}

      {response.photoFileId && (
        <div className="space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold">Фото</h4>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-[36px] touch-manipulation"
            onClick={handleViewPhoto}
            disabled={!photoData?.url}
          >
            <ImageIcon className="h-4 w-4" />
            Посмотреть фото
          </Button>
        </div>
      )}

      {!response.portfolioLinks?.length &&
        !response.portfolioFileId &&
        !response.photoFileId && (
          <div className="rounded-lg border border-dashed bg-muted/20 text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 opacity-50" />
            <p className="text-xs sm:text-sm">Портфолио не предоставлено</p>
          </div>
        )}
    </div>
  );
}
