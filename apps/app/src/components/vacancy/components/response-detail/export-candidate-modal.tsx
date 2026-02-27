"use client";

import { Badge } from "@qbs-autonaim/ui/components/badge";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui/components/dialog";
import { Label } from "@qbs-autonaim/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useORPC } from "~/orpc/react";
import type { VacancyResponse } from "./types";

interface ExportCandidateModalProps {
  response: VacancyResponse;
}

export function ExportCandidateModal({ response }: ExportCandidateModalProps) {
  const orpc = useORPC();
  const [open, setOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("pdf");
  const [selectedSections, setSelectedSections] = useState<string[]>([
    "personal",
    "contact",
    "experience",
    "skills",
  ]);

  const { mutate: exportPdf, isPending: isExporting } = useMutation(
    orpc.vacancy.responses.exportPdf.mutationOptions({
      onSuccess: (data) => {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Профиль экспортирован");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Не удалось экспортировать профиль");
      },
    }),
  );

  const exportFormats = [
    {
      id: "pdf",
      name: "PDF профиль",
      description: "Полный профиль кандидата в PDF формате",
      icon: FileText,
      color: "text-red-600",
      disabled: false,
    },
    {
      id: "excel",
      name: "Excel таблица",
      description: "Структурированные данные для отчетности (в разработке)",
      icon: FileSpreadsheet,
      color: "text-green-600",
      disabled: true,
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

  const handleExport = () => {
    if (selectedSections.length === 0) return;

    if (selectedFormat === "pdf") {
      if (!response.workspaceId) {
        toast.error("Рабочее пространство не найдено");
        return;
      }
      exportPdf({
        responseId: response.id,
        workspaceId: response.workspaceId,
        sections: selectedSections,
      });
    } else {
      toast.info("Экспорт в Excel будет доступен позже");
    }
  };

  const selectedFormatData = exportFormats.find((f) => f.id === selectedFormat);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto overscroll-contain min-w-fit">
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
                const disabled = "disabled" in format && format.disabled;
                return (
                  <button
                    type="button"
                    key={format.id}
                    disabled={disabled}
                    className={`p-4 border rounded-lg transition-colors text-left outline-none ${
                      disabled
                        ? "opacity-50 cursor-not-allowed border-gray-200"
                        : `${selectedFormat === format.id ? "border-blue-500 bg-blue-50 dark:bg-blue-950 cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"} focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white`
                    }`}
                    onClick={() => !disabled && setSelectedFormat(format.id)}
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
                    {selectedFormat === format.id && !disabled && (
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
                    className={`p-3 border rounded-lg cursor-pointer transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleSectionToggle(section.id)}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-input bg-background"
                        aria-hidden
                      >
                        {isSelected ? (
                          <svg
                            className="h-3.5 w-3.5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <title>Выбрано</title>
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : null}
                      </span>
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
                  Экспорт…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Экспортировать
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
