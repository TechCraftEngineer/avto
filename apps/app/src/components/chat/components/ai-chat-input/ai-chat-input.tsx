"use client";

import { Button, cn } from "@qbs-autonaim/ui";
import {
  ArrowUp,
  FileText,
  Mic,
  Music,
  Paperclip,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { formatDuration, useVoiceRecorder } from "~/hooks/use-voice-recorder";
import type { ChatStatus } from "~/types/ai-chat";

interface AudioAttachment {
  file: File;
  url: string;
  duration?: number;
}

interface AIChatInputProps {
  onSendMessage: (message: string, audio?: File) => void;
  onStop?: () => void;
  status: ChatStatus;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showAttachments?: boolean;
  onAttach?: () => void;
  enableVoice?: boolean;
  acceptedAudioTypes?: string;
}

function PureAIChatInput({
  onSendMessage,
  onStop,
  status,
  disabled = false,
  placeholder = "Напишите сообщение…",
  className,
  showAttachments = false,
  onAttach,
  enableVoice = true,
  acceptedAudioTypes = "audio/*",
}: AIChatInputProps) {
  const [input, setInput] = useState("");
  const [audioAttachment, setAudioAttachment] =
    useState<AudioAttachment | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const {
    status: recordingStatus,
    duration: recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    isSupported: isVoiceSupported,
  } = useVoiceRecorder({
    maxDuration: 300,
    onError: (err) => {
      toast.error("Ошибка записи голоса", {
        description: err.message,
      });
      console.error("Voice recording error:", err.message);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isRecording = recordingStatus === "recording";
  const isProcessingRecording = recordingStatus === "processing";
  const canSubmit =
    (input.trim().length > 0 || audioAttachment) && !disabled && !isRecording;

  // Автофокус на десктопе
  useEffect(() => {
    if (textareaRef.current && window.innerWidth > 768) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Очистка URL при размонтировании
  useEffect(() => {
    return () => {
      if (audioAttachment?.url) {
        URL.revokeObjectURL(audioAttachment.url);
      }
    };
  }, [audioAttachment?.url]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        attachMenuRef.current &&
        !attachMenuRef.current.contains(event.target as Node)
      ) {
        setShowAttachMenu(false);
      }
    };

    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAttachMenu]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const clearAudioAttachment = useCallback(() => {
    if (audioAttachment?.url) {
      URL.revokeObjectURL(audioAttachment.url);
    }
    setAudioAttachment(null);
  }, [audioAttachment?.url]);

  const handleSubmit = useCallback(() => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !audioAttachment) || disabled) return;

    onSendMessage(trimmedInput, audioAttachment?.file);
    setInput("");
    clearAudioAttachment();
    resetHeight();

    if (window.innerWidth > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    audioAttachment,
    disabled,
    onSendMessage,
    clearAudioAttachment,
    resetHeight,
  ]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading && onStop) {
        onStop();
      } else if (!isRecording) {
        handleSubmit();
      }
    }
  };

  const handleVoiceClick = useCallback(async () => {
    if (isRecording) {
      const blob = await stopRecording();
      if (blob && blob.size > 0) {
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type,
        });
        const url = URL.createObjectURL(blob);
        setAudioAttachment({ file, url, duration: recordingDuration });
      }
    } else {
      await startRecording();
    }
  }, [isRecording, stopRecording, startRecording, recordingDuration]);

  const handleCancelRecording = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  const handleFileSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверяем что это аудио
    if (!file.type.startsWith("audio/")) {
      toast.error("Неверный тип файла", {
        description: "Пожалуйста, выберите аудиофайл",
      });
      console.error("Invalid file type:", file.type);
      return;
    }

    // Лимит 25MB
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Файл слишком большой", {
        description: "Максимальный размер файла — 25 МБ",
      });
      console.error("File too large");
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioAttachment({ file, url });

    // Сбрасываем input для повторного выбора того же файла
    e.target.value = "";
  }, []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
    setShowAttachMenu(false);
  }, []);

  const handleAttachButtonClick = useCallback(() => {
    // Если только одна опция доступна, сразу выполняем действие
    if (showAttachments && !enableVoice) {
      onAttach?.();
    } else if (!showAttachments && enableVoice) {
      handleAttachClick();
    } else {
      // Обе опции доступны - показываем меню
      setShowAttachMenu((prev) => !prev);
    }
  }, [showAttachments, enableVoice, onAttach, handleAttachClick]);

  return (
    <form
      className={cn(
        "w-full overflow-hidden rounded-xl border bg-background p-3 shadow-xs transition-all duration-200",
        "focus-within:border-ring hover:border-muted-foreground/50",
        isRecording && "border-red-500/50 bg-red-50/50 dark:bg-red-950/20",
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        if (isLoading && onStop) {
          onStop();
        } else if (!isRecording) {
          handleSubmit();
        }
      }}
    >
      {/* Превью аудио */}
      {audioAttachment && !isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
          {/* biome-ignore lint/a11y/useMediaCaption: голосовое сообщение без субтитров */}
          <audio
            controls
            src={audioAttachment.url}
            className="h-8 max-w-[200px] flex-1"
            aria-label="Прикреплённое аудио"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={clearAudioAttachment}
            aria-label="Удалить аудио"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Индикатор записи */}
      {isRecording && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-medium text-red-700 text-sm dark:text-red-400">
              Запись… {formatDuration(recordingDuration)}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-red-600 hover:bg-red-200 hover:text-red-700 dark:text-red-400"
            onClick={handleCancelRecording}
            aria-label="Отменить запись"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      )}

      <div className="flex flex-row items-start gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Идёт запись…" : placeholder}
          disabled={disabled || isRecording}
          rows={1}
          className={cn(
            "min-h-[44px] max-h-[200px] w-full grow resize-none",
            "border-none bg-transparent p-2 text-base outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-0",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            fontSize: "16px",
          }}
          autoComplete="off"
          name="message"
          aria-label="Сообщение"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="relative flex items-center gap-1">
          {/* Единая кнопка прикрепления */}
          {(showAttachments || enableVoice) && (
            <div className="relative" ref={attachMenuRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                disabled={disabled || isLoading || isRecording}
                onClick={handleAttachButtonClick}
                aria-label="Прикрепить"
              >
                <Paperclip className="size-4" />
              </Button>

              {/* Меню прикрепления */}
              {showAttachMenu && showAttachments && enableVoice && (
                <div className="absolute bottom-full left-0 z-50 mb-2 w-48 overflow-hidden rounded-lg border bg-popover shadow-lg">
                  {showAttachments && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      onClick={() => {
                        onAttach?.();
                        setShowAttachMenu(false);
                      }}
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span>Прикрепить файл</span>
                    </button>
                  )}
                  {enableVoice && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                      onClick={handleAttachClick}
                    >
                      <Music className="size-4 text-muted-foreground" />
                      <span>Прикрепить аудио</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Скрытый input для файлов */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedAudioTypes}
            onChange={handleFileSelect}
            className="hidden"
            tabIndex={-1}
          />

          {/* Кнопка записи голоса */}
          {enableVoice && isVoiceSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 rounded-lg transition-colors",
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              disabled={disabled || isLoading || isProcessingRecording}
              onClick={handleVoiceClick}
              aria-label={
                isRecording
                  ? "Остановить запись"
                  : "Записать голосовое сообщение"
              }
            >
              {isRecording ? (
                <Square className="size-4" />
              ) : (
                <Mic className="size-4" />
              )}
            </Button>
          )}
        </div>

        {isLoading && onStop ? (
          <Button
            type="button"
            size="icon"
            className="size-8 rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
            onClick={onStop}
            aria-label="Остановить генерацию"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            className={cn(
              "size-8 rounded-full transition-colors",
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground",
            )}
            disabled={!canSubmit || isRecording}
            aria-label="Отправить сообщение"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </form>
  );
}

export const AIChatInput = memo(PureAIChatInput);
