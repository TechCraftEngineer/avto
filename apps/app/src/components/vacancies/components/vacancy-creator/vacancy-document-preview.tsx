"use client";

import { Button, Card, ScrollArea } from "@qbs-autonaim/ui";
import { FileText, Loader2 } from "lucide-react";

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
}

interface VacancyDocumentPreviewProps {
  document: VacancyDocument;
  onVacancyCreated?: () => void;
  isCreating?: boolean;
}

export function VacancyDocumentPreview({
  document,
  onVacancyCreated,
  isCreating = false,
}: VacancyDocumentPreviewProps) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions;

  const hasMinimalContent = !!document.title;

  if (isEmpty) {
    return (
      <output
        className="flex h-full items-center justify-center p-8"
        aria-label="Документ пуст"
      >
        <div className="text-center">
          <FileText
            className="mx-auto h-12 w-12 text-muted-foreground/50"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-lg font-medium">Документ пуст</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Начните описывать вакансию в чате,
            <br />и документ будет формироваться автоматически
          </p>
        </div>
      </output>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1">
        <article className="space-y-6 p-6">
          {document.title && (
            <header>
              <h1 className="min-w-0 break-words text-3xl font-bold">
                {document.title}
              </h1>
            </header>
          )}

          {document.description && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                О&nbsp;компании
              </h2>
              <div className="min-w-0 break-words whitespace-pre-wrap text-sm leading-relaxed">
                {document.description}
              </div>
            </Card>
          )}

          {document.responsibilities && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Обязанности
              </h2>
              <div className="min-w-0 break-words whitespace-pre-wrap text-sm leading-relaxed">
                {document.responsibilities}
              </div>
            </Card>
          )}

          {document.requirements && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Требования
              </h2>
              <div className="min-w-0 break-words whitespace-pre-wrap text-sm leading-relaxed">
                {document.requirements}
              </div>
            </Card>
          )}

          {document.conditions && (
            <Card className="p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Условия
              </h2>
              <div className="min-w-0 break-words whitespace-pre-wrap text-sm leading-relaxed">
                {document.conditions}
              </div>
            </Card>
          )}
        </article>
      </ScrollArea>

      {hasMinimalContent && onVacancyCreated && (
        <div className="border-t p-4">
          <Button
            onClick={onVacancyCreated}
            disabled={isCreating}
            className="w-full"
            size="lg"
            style={{ touchAction: "manipulation" }}
            aria-label="Создать вакансию из сгенерированного документа"
          >
            {isCreating ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Создаю вакансию…
              </>
            ) : (
              "Создать вакансию"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
