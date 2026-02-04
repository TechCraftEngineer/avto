"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import { Checkbox } from "@qbs-autonaim/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui/dialog";
import { Label } from "@qbs-autonaim/ui/label";
import {
  Award,
  Briefcase,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface ExportCandidateModalProps {
  response: VacancyResponse;
}

export function ExportCandidateModal({ response }: ExportCandidateModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "personal",
    "contact",
    "experience",
    "skills",
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF профиль",
      description: "Полный профиль кандидата в PDF формате",
      icon: FileText,
      color: "text-red-600",
    },
    {
      id: "excel",
      name: "Excel таблица",
      description: "Структурированные данные для отчетности",
      icon: FileSpreadsheet,
      color: "text-green-600",
    },
    {
      id: "json",
      name: "JSON данные",
      description: "Для интеграции с другими системами",
      icon: FileJson,
      color: "text-blue-600",
    },
  ];

  const availableSections = [
    {
      id: "personal",
      name: "Личные данные",
      description: "Имя, фото, дата отклика",
      icon: Users,
    },
    {
      id: "contact",
      name: "Контакты",
      description: "Email, телефон, социальные сети",
      icon: Phone,
    },
    {
      id: "experience",
      name: "Опыт работы",
      description: "Компании, должности, периоды работы",
      icon: Briefcase,
    },
    {
      id: "skills",
      name: "Навыки",
      description: "Технические и soft skills",
      icon: Award,
    },
    {
      id: "portfolio",
      name: "Портфолио",
      description: "Профиль на платформе, рейтинг",
      icon: MapPin,
    },
    {
      id: "assessment",
      name: "Оценки",
      description: "Результаты скрининга и интервью",
      icon: Award,
    },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) return;

    setIsExporting(true);

    // Имитация экспорта
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Собираем данные для экспорта
    const exportData = {
      candidate: {
        id: response.id,
        name: response.candidateName,
        respondedAt: response.respondedAt,
        status: response.status,
      },
      sections: selectedSections,
      format: selectedFormat,
      exportedAt: new Date().toISOString(),
    };

    console.log("Exporting candidate data:", exportData);

    // Имитация скачивания файла
    const fileName = `${response.candidateName || "candidate"}_profile_${selectedFormat}`;
    alert(`Файл ${fileName} готов к скачиванию!`);

    setIsExporting(false);
  };

  const selectedFormatData = exportFormats.find((f) => f.id === selectedFormat);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Экспорт профиля кандидата
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о кандидате */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">Экспорт данных</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  {response.candidateName || "Кандидат"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Выберите формат и разделы для экспорта
                </p>
              </div>
            </div>
          </div>

          {/* Выбор формата экспорта */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Формат экспорта
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    type="button"
                    key={format.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors text-left ${
                      selectedFormat === format.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-5 w-5 ${format.color}`} />
                      <div>
                        <p className="font-medium">{format.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format.description}
                        </p>
                      </div>
                    </div>
                    {selectedFormat === format.id && (
                      <Badge variant="secondary" className="text-xs">
                        Выбран
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Выбор разделов */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Разделы для экспорта ({selectedSections.length} выбрано)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableSections.map((section) => {
                const Icon = section.icon;
                const isSelected = selectedSections.includes(section.id);
                return (
                  <button
                    type="button"
                    key={section.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSectionToggle(section.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSectionToggle(section.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-sm">{section.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Предварительный просмотр */}
          <div className="p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {selectedFormatData && (
                <selectedFormatData.icon
                  className={`h-4 w-4 ${selectedFormatData.color}`}
                />
              )}
              Предварительный просмотр
            </h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Формат:</strong> {selectedFormatData?.name}
              </p>
              <p>
                <strong>Разделы:</strong> {selectedSections.length} выбрано
              </p>
              <p>
                <strong>Файл:</strong> {response.candidateName || "candidate"}
                _profile.{selectedFormat}
              </p>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleExport}
              disabled={selectedSections.length === 0 || isExporting}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Экспортируется...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Экспортировать
                </>
              )}
            </Button>
            <Button variant="outline" className="flex-1">
              Предварительный просмотр
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
