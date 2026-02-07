"use client";

import { Button } from "@qbs-autonaim/ui/button";
import { Textarea } from "@qbs-autonaim/ui/textarea";
import { IconEdit } from "@tabler/icons-react";
import { FileText, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { DocumentSection } from "./document-section";
import { formatVacancyToHtml } from "./format-vacancy-html";
import type { VacancyDocument } from "./types";

interface DocumentPreviewProps {
  document: VacancyDocument;
  hasMinimalContent: boolean;
  onSave: () => void;
  isSaving: boolean;
  isGenerating: boolean;
  editingSection: string | null;
  onEditSection: (section: string | null) => void;
  onUpdateSection: (section: keyof VacancyDocument, content: string) => void;
}

export function DocumentPreview({
  document,
  hasMinimalContent,
  onSave,
  isSaving,
  isGenerating,
  editingSection,
  onEditSection,
  onUpdateSection,
}: DocumentPreviewProps) {
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions &&
    !document.bonuses;

  // Генерируем HTML только когда есть контент
  const htmlPreview = useMemo(() => {
    if (isEmpty) return null;
    return formatVacancyToHtml(document);
  }, [document, isEmpty]);

  if (isEmpty) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 md:h-12 md:w-12" />
          <h3 className="mt-3 text-base font-medium md:mt-4 md:text-lg">
            Документ пуст
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
            Начните диалог с ассистентом,
            <br />и документ появится здесь
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* HTML предпросмотр */}
      {htmlPreview ? (
        <div
          className="flex-1 overflow-auto p-4 md:p-6"
          style={{ overscrollBehavior: "contain" }}
        >
          <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
        </div>
      ) : (
        <div
          className="flex-1 overflow-auto"
          style={{ overscrollBehavior: "contain" }}
        >
          <article className="space-y-4 p-4 md:space-y-6 md:p-6">
            {document.title && (
              <header className="group relative">
                <h1 className="text-xl font-bold md:text-2xl pr-8">
                  {editingSection === "title" ? (
                    <Textarea
                      value={document.title}
                      onChange={(e) => onUpdateSection("title", e.target.value)}
                      onBlur={() => onEditSection(null)}
                      className="w-full text-xl font-bold md:text-2xl resize-none border-none p-0 focus:ring-0 bg-transparent"
                      autoFocus
                      rows={1}
                    />
                  ) : (
                    document.title
                  )}
                </h1>
                {editingSection !== "title" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSection("title")}
                    className="absolute top-0 right-0 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Редактировать название"
                  >
                    <IconEdit className="h-3 w-3" />
                  </Button>
                )}
              </header>
            )}

            {/* Структурированный документ вакансии */}
            <div className="space-y-6">
              {document.description && (
                <>
                  <DocumentSection
                    title="Описание вакансии"
                    content={document.description}
                    sectionKey="description"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                  <div className="text-center text-muted-foreground text-lg font-light">
                    —
                  </div>
                </>
              )}

              {document.requirements && (
                <>
                  <DocumentSection
                    title="Требования"
                    content={document.requirements}
                    sectionKey="requirements"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                  <div className="text-center text-muted-foreground text-lg font-light">
                    —
                  </div>
                </>
              )}

              {document.responsibilities && (
                <>
                  <DocumentSection
                    title="Обязанности"
                    content={document.responsibilities}
                    sectionKey="responsibilities"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                  <div className="text-center text-muted-foreground text-lg font-light">
                    —
                  </div>
                </>
              )}

              {(document.conditions || document.bonuses) && (
                <>
                  {document.conditions && (
                    <>
                      <DocumentSection
                        title="Условия"
                        content={document.conditions}
                        sectionKey="conditions"
                        editingSection={editingSection}
                        onEditSection={onEditSection}
                        onUpdateSection={onUpdateSection}
                      />
                      <div className="text-center text-muted-foreground text-lg font-light">
                        —
                      </div>
                    </>
                  )}
                  <DocumentSection
                    title="Премии и другие мотивационные выплаты"
                    content={
                      document.bonuses ||
                      (document.conditions
                        ? "Информация о премиях и мотивационных выплатах будет указана в условиях работы выше."
                        : "Премии и мотивационные выплаты не указаны.")
                    }
                    sectionKey="bonuses"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                </>
              )}
            </div>

            {/* Дополнительные секции для внутренних нужд */}
            {(document.customBotInstructions ||
              document.customInterviewQuestions) && (
              <div className="mt-8 pt-6 border-t border-muted">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">
                  Дополнительные настройки
                </h3>

                {document.customBotInstructions && (
                  <DocumentSection
                    title="Инструкции для бота"
                    content={document.customBotInstructions}
                    sectionKey="customBotInstructions"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                )}

                {document.customInterviewQuestions && (
                  <DocumentSection
                    title="Вопросы для интервью"
                    content={document.customInterviewQuestions}
                    sectionKey="customInterviewQuestions"
                    editingSection={editingSection}
                    onEditSection={onEditSection}
                    onUpdateSection={onUpdateSection}
                  />
                )}
              </div>
            )}
          </article>
        </div>
      )}

      {hasMinimalContent && (
        <div className="sticky bottom-0 border-t bg-background p-3 md:p-4">
          <Button
            onClick={onSave}
            disabled={isSaving || isGenerating}
            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
            style={{ touchAction: "manipulation" }}
            aria-live="polite"
            aria-busy={isSaving || isGenerating}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создаю…
              </>
            ) : isGenerating ? (
              "Дождитесь завершения генерации"
            ) : (
              "Создать вакансию"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
