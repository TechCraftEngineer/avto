"use client";

import { formatExperienceText } from "@qbs-autonaim/shared/utils";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Music,
  Video,
} from "lucide-react";
import type { GigResponse } from "./types";

interface PortfolioCardProps {
  response: GigResponse;
  onViewPortfolio?: () => void;
  onDownloadFile?: () => void;
}

export function PortfolioCard({
  response,
  onViewPortfolio,
  onDownloadFile,
}: PortfolioCardProps) {
  const portfolioLinks = response.portfolioLinks || [];
  const hasPortfolioFile = !!response.portfolioFileId;

  if (!portfolioLinks.length && !hasPortfolioFile) {
    return null;
  }

  const normalizeUrl = (url: string): string => {
    try {
      // Try to create URL directly
      const parsedUrl = new URL(url);
      // Only allow http: and https: protocols
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return url;
      }
      // If protocol is not http/https, return empty string (unsafe scheme)
      return "";
    } catch {
      // If it fails, try with https:// prefix
      try {
        const normalized = `https://${url}`;
        const parsedUrl = new URL(normalized);
        // Only allow http: and https: protocols
        if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
          return normalized;
        }
        // If protocol is not http/https, return empty string (unsafe scheme)
        return "";
      } catch {
        // Invalid URL
        return "";
      }
    }
  };

  const getSafeHostname = (link: string): string => {
    try {
      const normalizedUrl = normalizeUrl(link);
      return new URL(normalizedUrl).hostname;
    } catch {
      // Fallback to original link or empty string
      return link || "";
    }
  };

  const getFileIcon = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (["mp4", "avi", "mov"].includes(extension || "")) {
      return <Video className="h-4 w-4" />;
    }
    if (["mp3", "wav", "aac"].includes(extension || "")) {
      return <Music className="h-4 w-4" />;
    }
    if (["pdf", "doc", "docx"].includes(extension || "")) {
      return <FileText className="h-4 w-4" />;
    }

    return <ExternalLink className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Портфолио исполнителя
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Portfolio Links */}
        {portfolioLinks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                Работы ({portfolioLinks.length})
              </h4>
              {onViewPortfolio && (
                <Button variant="outline" size="sm" onClick={onViewPortfolio}>
                  Посмотреть все
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {portfolioLinks.slice(0, 6).map((link, index) => (
                <button
                  key={link}
                  type="button"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer w-full text-left"
                  onClick={() => {
                    const normalizedUrl = normalizeUrl(link);
                    if (normalizedUrl) {
                      window.open(
                        normalizedUrl,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }
                  }}
                >
                  <div className="shrink-0 text-gray-500">
                    {getFileIcon(link)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      Работа #{index + 1}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {getSafeHostname(link)}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                </button>
              ))}

              {portfolioLinks.length > 6 && (
                <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg border border-dashed">
                  <span className="text-sm text-gray-500">
                    +{portfolioLinks.length - 6} работ
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Portfolio File */}
        {hasPortfolioFile && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Прикрепленный файл</h4>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    Портфолио исполнителя
                  </div>
                  <div className="text-sm text-blue-700">
                    PDF или архив с работами
                  </div>
                </div>
              </div>
              {onDownloadFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadFile}
                  className="bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Скачать
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Skills & Experience Summary */}
        {(() => {
          const experienceText = formatExperienceText(response.profileData);
          return response.skills?.length || experienceText ? (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-gray-900">Компетенции</h4>

              {response.skills && response.skills.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Навыки:</div>
                  <div className="flex flex-wrap gap-2">
                    {response.skills.slice(0, 8).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-300 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {response.skills.length > 8 && (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-600 border-gray-300 text-xs"
                      >
                        +{response.skills.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {experienceText && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Опыт работы:</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border">
                    {experienceText}
                  </div>
                </div>
              )}
            </div>
          ) : null;
        })()}

        <div className="text-xs text-muted-foreground text-center pt-2">
          Ознакомьтесь с работами перед принятием решения
        </div>
      </CardContent>
    </Card>
  );
}
