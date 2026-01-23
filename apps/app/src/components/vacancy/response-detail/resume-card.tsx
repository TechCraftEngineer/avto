"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { Button, Badge } from "@qbs-autonaim/ui";
import {
  FileText,
  Download,
  ExternalLink,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
} from "lucide-react";
import type { VacancyResponse } from "./types";

interface ResumeCardProps {
  response: VacancyResponse;
  onDownload?: () => void;
  onViewExternal?: () => void;
}

export function ResumeCard({
  response,
  onDownload,
  onViewExternal,
}: ResumeCardProps) {
  const hasResume = response.resumeId || response.resumeUrl;
  const hasProfile = response.platformProfileUrl;

  if (!hasResume && !hasProfile) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Резюме кандидата
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resume Download */}
        {hasResume && (
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">
                  Резюме кандидата
                </div>
                <div className="text-sm text-blue-700">
                  {response.resumeUrl ? 'Внешняя ссылка' : 'Загружено в систему'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {response.resumeUrl && onViewExternal && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onViewExternal}
                  className="bg-white hover:bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть
                </Button>
              )}
              {response.resumePdfFileId && onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Platform Profile */}
        {hasProfile && (
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-medium text-purple-900">
                  Профиль на платформе
                </div>
                <div className="text-sm text-purple-700">
                  {response.platformProfileUrl}
                </div>
              </div>
            </div>
            {onViewExternal && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(response.platformProfileUrl!, '_blank')}
                className="bg-white hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Перейти
              </Button>
            )}
          </div>
        )}

        {/* Contact Info */}
        {(response.email || response.phone || response.telegramUsername) && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Контактная информация</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {response.email && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{response.email}</span>
                </div>
              )}
              {response.phone && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{response.phone}</span>
                </div>
              )}
              {response.telegramUsername && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg sm:col-span-2">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">@{response.telegramUsername}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 pt-3 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Обновлено: {new Date(response.updatedAt).toLocaleDateString('ru-RU')}
          </div>
          {response.region && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {response.region}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}