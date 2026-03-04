"use client";

import { FileText, Loader2 } from "lucide-react";

interface PdfUploadTabProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPending: boolean;
}

export function PdfUploadTab({
  fileInputRef,
  onFileSelect,
  isPending,
}: PdfUploadTabProps) {
  return (
    <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 py-8 sm:py-12 px-4 sm:px-6 transition-colors hover:border-muted-foreground/40 hover:bg-muted/50 cursor-pointer min-h-[140px] sm:min-h-[180px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={onFileSelect}
        disabled={isPending}
      />
      {isPending ? (
        <>
          <Loader2 className="size-10 animate-spin text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Парсинг резюме…</p>
          <p className="text-xs text-muted-foreground mt-1">
            Docling извлекает текст, LLM структурирует данные
          </p>
        </>
      ) : (
        <>
          <FileText className="size-10 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            Перетащите файл сюда или нажмите для выбора
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX — макс. 10 МБ
          </p>
        </>
      )}
    </label>
  );
}
