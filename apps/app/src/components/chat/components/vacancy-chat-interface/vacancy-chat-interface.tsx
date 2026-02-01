"use client";

import { Button, Card, cn, ScrollArea, Textarea } from "@qbs-autonaim/ui";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Bot, FileText, Loader2, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useVacancyChat, type VacancyDocument } from "~/hooks/use-vacancy-chat";
import { useTRPC } from "~/trpc/react";

interface VacancyChatInterfaceProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
  initialDocument?: VacancyDocument;
  onSave?: (document: VacancyDocument) => Promise<void>;
}

/**
 * VacancyChatInterface - Main component for vacancy creation through AI chat
 * Requirements: 11.1, 11.2, 11.5
 *
 * Subtask 3.1: Basic chat UI structure
 * Subtask 3.2: Document preview panel
 * Subtask 3.3: Loading indicator
 * Subtask 3.5: Error display
 * Subtask 5.1: Create Vacancy button
 * Subtask 5.2: Vacancy save mutation
 * Subtask 5.3: Post-save navigation
 * Subtask 5.4: Save error handling
 */
export function VacancyChatInterface({
  workspaceId,
  orgSlug,
  workspaceSlug,
  initialDocument,
  onSave,
}: VacancyChatInterfaceProps) {
  const { document, messages, status, error, sendMessage } = useVacancyChat({
    workspaceId,
    initialDocument,
  });

  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const trpc = useTRPC();

  // Subtask 5.2: Implement vacancy save mutation
  const createVacancyMutation = useMutation(
    trpc.vacancy.createFromChat.mutationOptions({
      onSuccess: (vacancy) => {
        // Subtask 5.3: Post-save navigation
        toast.success("Вакансия создана", {
          description: "Вакансия успешно сохранена",
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancy.id}`,
        );
      },
      onError: (error) => {
        // Subtask 5.4: Handle save errors
        toast.error("Ошибка сохранения", {
          description: error.message,
        });
        console.error("Failed to save vacancy:", error);
      },
    }),
  );

  // Autofocus on desktop (Requirement 11.2)
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  }, []);

  // Auto-scroll to new messages (Requirement 11.4)
  useEffect(() => {
    if (messages.length > 0 || status === "streaming") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, status]);

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || status === "streaming" || status === "loading") return;

    // Clear input immediately (Requirement 11.2)
    setInputValue("");

    // Send message
    await sendMessage(message);

    // Return focus to input
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter submits (Requirement 11.2)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Escape clears input (Requirement 11.2)
    if (e.key === "Escape") {
      e.preventDefault();
      setInputValue("");
      textareaRef.current?.blur();
    }
  };

  const handleRetry = () => {
    if (error && messages.length > 0) {
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    }
  };

  const handleSave = async () => {
    if (!document.title) return;

    // Use custom onSave if provided, otherwise use tRPC mutation
    if (onSave) {
      try {
        await onSave(document);
      } catch (err) {
        console.error("Failed to save vacancy:", err);
      }
    } else {
      // Subtask 5.2: Call tRPC mutation with all fields including bot configuration
      createVacancyMutation.mutate({
        workspaceId,
        title: document.title,
        description: document.description,
        requirements: document.requirements,
        responsibilities: document.responsibilities,
        conditions: document.conditions,
        customBotInstructions: document.customBotInstructions,
        customScreeningPrompt: document.customScreeningPrompt,
        customInterviewQuestions: document.customInterviewQuestions,
        customOrganizationalQuestions: document.customOrganizationalQuestions,
      });
    }
  };

  const isGenerating = status === "loading" || status === "streaming";
  const isSaving = createVacancyMutation.isPending;
  const hasMinimalContent = !!document.title;
  const isEmpty =
    !document.title &&
    !document.description &&
    !document.requirements &&
    !document.responsibilities &&
    !document.conditions &&
    !document.customBotInstructions &&
    !document.customScreeningPrompt &&
    !document.customInterviewQuestions &&
    !document.customOrganizationalQuestions;

  return (
    <main className="flex h-full flex-col gap-0 md:flex-row md:gap-0">
      {/* Chat Section - Subtask 3.1 */}
      <section
        className="flex h-[50vh] w-full flex-col border-b md:h-full md:w-1/2 md:border-b-0 md:border-r lg:w-2/5"
        aria-label="Чат с AI-ассистентом"
      >
        <header className="border-b p-3 md:p-4">
          <h2 className="text-base font-semibold md:text-lg">
            Чат с&nbsp;ассистентом
          </h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            Опишите требования к&nbsp;вакансии
          </p>
        </header>

        {/* Messages Container */}
        <ScrollArea className="flex-1 overscroll-contain">
          <div
            className="space-y-3 p-3 md:space-y-4 md:p-4"
            role="log"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions"
          >
            {messages.length === 0 ? (
              <output
                className="flex h-full min-h-[200px] items-center justify-center md:min-h-[300px]"
                aria-label="Пустое состояние чата"
              >
                <div className="px-4 text-center text-muted-foreground">
                  <p className="text-sm">Начните диалог</p>
                  <p className="mt-1 text-xs">
                    Например: "Нужен React разработчик с опытом 3+&nbsp;года"
                  </p>
                </div>
              </output>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={`${msg.role}-${index}`}
                    role={msg.role}
                    content={msg.content}
                  />
                ))}
                {/* Subtask 3.3: Loading indicator */}
                {isGenerating && <TypingIndicator />}
                <div ref={messagesEndRef} aria-hidden="true" />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Subtask 3.5: Error display */}
        {error && (
          <div
            className="border-t bg-destructive/10 p-3 md:p-4"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-2 md:gap-3">
              <AlertCircle
                className="h-4 w-4 shrink-0 text-destructive md:h-5 md:w-5"
                aria-hidden="true"
              />
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium text-destructive md:text-sm">
                  Произошла ошибка
                </p>
                <p className="text-xs text-muted-foreground md:text-sm">
                  {error.message}
                </p>
                {/* Retry button for network errors (Requirement 8.2) */}
                {error.message.includes("подключиться") ||
                error.message.includes("network") ? (
                  <Button
                    onClick={handleRetry}
                    size="sm"
                    variant="outline"
                    className="mt-2 transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label="Повторить попытку отправки сообщения"
                  >
                    Повторить попытку
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Chat Input - Subtask 3.1 */}
        <div className="border-t bg-background p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            aria-label="Форма отправки сообщения ассистенту"
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите требования к вакансии…"
                disabled={isGenerating}
                className="min-h-[60px] resize-none pr-12 text-base transition-all duration-200 focus-within:ring-2 md:min-h-[80px]"
                style={{
                  fontSize: "16px",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                autoComplete="off"
                spellCheck
                name="vacancy-message"
                aria-label="Сообщение для ассистента"
                aria-describedby="input-help-text"
                aria-invalid={!!error}
              />
              <Button
                type="submit"
                disabled={isGenerating || !inputValue.trim()}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100 md:h-9 md:w-9"
                style={{ touchAction: "manipulation" }}
                aria-label={isGenerating ? "Отправка…" : "Отправить сообщение"}
              >
                {isGenerating ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
            <p
              id="input-help-text"
              className="mt-1.5 text-xs text-muted-foreground md:mt-2"
            >
              Enter для отправки, Shift&nbsp;+&nbsp;Enter для новой строки,
              Escape для очистки
            </p>
          </form>
        </div>
      </section>

      {/* Document Preview Panel - Subtask 3.2 */}
      <section
        className="flex h-[50vh] w-full flex-col md:h-full md:w-1/2 lg:w-3/5"
        aria-label="Предварительный просмотр документа вакансии"
      >
        <header className="flex items-center justify-between border-b p-3 md:p-4">
          <div>
            <h2 className="text-base font-semibold md:text-lg">
              Документ вакансии
            </h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              Автоматически формируется на&nbsp;основе диалога
            </p>
          </div>
        </header>

        <div className="flex-1">
          <DocumentPreview
            document={document}
            isEmpty={isEmpty}
            hasMinimalContent={hasMinimalContent}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </section>
    </main>
  );
}

/**
 * ChatMessage - Individual message component
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * Subtask 11.1: Visual feedback with smooth transitions
 */
function ChatMessage({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";

  return (
    <article
      className={cn(
        "flex gap-2 rounded-lg p-3 transition-all duration-200 ease-out md:gap-3 md:p-4",
        "animate-in fade-in slide-in-from-bottom-2",
        isUser ? "bg-primary/5" : "bg-muted/50",
      )}
      aria-label={`Сообщение от ${isUser ? "вас" : "ассистента"}`}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 md:h-8 md:w-8",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
        aria-hidden="true"
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 md:h-4 md:w-4" />
        ) : (
          <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5 md:space-y-1">
        <span className="text-xs font-medium md:text-sm">
          {isUser ? "Вы" : "Ассистент"}
        </span>
        <p className="min-w-0 break-words whitespace-pre-wrap text-xs leading-relaxed md:text-sm">
          {content}
        </p>
      </div>
    </article>
  );
}

/**
 * TypingIndicator - Shows when AI is generating
 * Subtask 3.3: Loading indicator
 * Requirement 11.1
 */
function TypingIndicator() {
  return (
    <output
      className="flex gap-2 rounded-lg bg-muted/50 p-3 md:gap-3 md:p-4"
      aria-label="Ассистент печатает"
      aria-live="polite"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted md:h-8 md:w-8">
        <div
          className="h-3.5 w-3.5 animate-pulse md:h-4 md:w-4"
          aria-hidden="true"
        >
          ⋯
        </div>
      </div>
      <div className="flex-1 space-y-0.5 md:space-y-1">
        <span className="text-xs font-medium md:text-sm">Ассистент</span>
        <p className="text-xs text-muted-foreground md:text-sm">
          Генерирую документ…
        </p>
      </div>
    </output>
  );
}

/**
 * DocumentPreview - Shows the generated vacancy document
 * Subtask 3.2: Document preview panel
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * Subtask 11.3: Accessibility attributes
 */
function DocumentPreview({
  document,
  isEmpty,
  hasMinimalContent,
  onSave,
  isSaving,
}: {
  document: VacancyDocument;
  isEmpty: boolean;
  hasMinimalContent: boolean;
  onSave?: () => void;
  isSaving: boolean;
}) {
  if (isEmpty) {
    return (
      <output className="flex h-full items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <FileText
            className="mx-auto h-10 w-10 text-muted-foreground/50 md:h-12 md:w-12"
            aria-hidden="true"
          />
          <h3 className="mt-3 text-base font-medium md:mt-4 md:text-lg">
            Документ пуст
          </h3>
          <p className="mt-1.5 text-xs text-muted-foreground md:mt-2 md:text-sm">
            Начните описывать вакансию в чате,
            <br />и документ будет формироваться автоматически
          </p>
        </div>
      </output>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 overscroll-contain">
        <article
          className="space-y-4 p-4 md:space-y-6 md:p-6"
          aria-label="Сгенерированный документ вакансии"
        >
          {/* Title */}
          {document.title && (
            <header>
              <h1 className="min-w-0 break-words text-2xl font-bold md:text-3xl">
                {document.title}
              </h1>
            </header>
          )}

          {/* Description */}
          {document.description && (
            <DocumentSection title="Описание" content={document.description} />
          )}

          {/* Responsibilities */}
          {document.responsibilities && (
            <DocumentSection
              title="Обязанности"
              content={document.responsibilities}
            />
          )}

          {/* Requirements */}
          {document.requirements && (
            <DocumentSection
              title="Требования"
              content={document.requirements}
            />
          )}

          {/* Conditions */}
          {document.conditions && (
            <DocumentSection title="Условия" content={document.conditions} />
          )}

          {/* Bot Configuration Fields - Subtask 3.2 */}
          {document.customBotInstructions && (
            <DocumentSection
              title="Инструкции для бота"
              content={document.customBotInstructions}
            />
          )}

          {document.customScreeningPrompt && (
            <DocumentSection
              title="Промпт для скрининга"
              content={document.customScreeningPrompt}
            />
          )}

          {document.customInterviewQuestions && (
            <DocumentSection
              title="Вопросы для интервью"
              content={document.customInterviewQuestions}
            />
          )}

          {document.customOrganizationalQuestions && (
            <DocumentSection
              title="Организационные вопросы"
              content={document.customOrganizationalQuestions}
            />
          )}
        </article>
      </ScrollArea>

      {/* Save Button - Requirement 6.1, 6.5 */}
      {hasMinimalContent && onSave && (
        <aside className="border-t p-3 md:p-4">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
            size="lg"
            style={{ touchAction: "manipulation" }}
            aria-label="Создать вакансию из сгенерированного документа"
            aria-busy={isSaving}
          >
            {isSaving ? (
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
        </aside>
      )}
    </div>
  );
}

/**
 * DocumentSection - Reusable section for document fields
 * Subtask 11.1: Smooth transitions for document updates
 * Subtask 11.3: Semantic HTML with proper heading hierarchy
 */
function DocumentSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-1 p-3 transition-all duration-300 ease-out md:p-4"
      role="region"
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:mb-2 md:text-sm"
      >
        {title}
      </h2>
      <div className="min-w-0 break-words whitespace-pre-wrap text-xs leading-relaxed transition-all duration-200 md:text-sm">
        {content}
      </div>
    </Card>
  );
}
