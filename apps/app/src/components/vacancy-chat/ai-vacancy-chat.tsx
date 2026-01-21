"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  ScrollArea,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Bot,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { ChatMessage } from "./chat-message";
import { DocumentPreview } from "./document-preview";
import { TypingIndicator } from "./typing-indicator";
import { useAIVacancyChat } from "./use-ai-vacancy-chat";

interface AIVacancyChatProps {
  workspaceId: string;
  orgSlug: string;
  workspaceSlug: string;
}

export function AIVacancyChat({
  workspaceId,
  orgSlug,
  workspaceSlug,
}: AIVacancyChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSettingsEdit, setShowSettingsEdit] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Получаем настройки компании
  const { data: botSettings } = useQuery(
    trpc.workspace.getBotSettings.queryOptions({
      workspaceId,
    }),
  );

  const {
    document,
    messages,
    status,
    error,
    sendMessage,
    selectQuickReply,
    selectMultipleReplies,
    clearChat,
    retry,
    updateDocumentSection,
  } = useAIVacancyChat({
    workspaceId,
    botSettings: botSettings
      ? {
          ...botSettings,
          companyDescription: botSettings.companyDescription || undefined,
          companyWebsite: botSettings.companyWebsite || undefined,
        }
      : null,
  });

  // Когда настройки компании созданы, автоматически переходим к следующему шагу
  // biome-ignore lint/correctness/useExhaustiveDependencies: clearChat is stable and should not trigger this effect
  React.useEffect(() => {
    if (botSettings?.companyName && messages.length === 1) {
      // Если есть настройки и только приветственное сообщение - перезагружаем чат
      clearChat();
    }
  }, [botSettings?.companyName, messages.length]);

  // Mutation для сохранения вакансии
  const createVacancyMutation = useMutation(
    trpc.vacancy.createFromChat.mutationOptions({
      onSuccess: (vacancy) => {
        toast.success("Вакансия создана", {
          description: "Вакансия успешно сохранена",
        });
        router.push(
          `/orgs/${orgSlug}/workspaces/${workspaceSlug}/vacancies/${vacancy.id}`,
        );
      },
      onError: (err) => {
        toast.error("Ошибка сохранения", {
          description: err.message,
        });
      },
    }),
  );

  // Mutation для обновления настроек компании
  const updateSettingsMutation = useMutation(
    trpc.workspace.updateBotSettings.mutationOptions({
      onSuccess: () => {
        toast.success("Настройки обновлены");
        setShowSettingsEdit(false);
        // Инвалидируем кэш для обновления настроек
        queryClient.invalidateQueries({
          queryKey: trpc.workspace.getBotSettings.queryKey({ workspaceId }),
        });
        // Перезагружаем чат с новыми настройками
        clearChat();
      },
      onError: (err) => {
        toast.error("Ошибка обновления настроек", {
          description: err.message,
        });
      },
    }),
  );

  // Автоскролл к новым сообщениям внутри ScrollArea
  useEffect(() => {
    // Trigger scroll when messages array changes
    void messages.length;
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const viewport = scrollArea.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages.length]);

  // Автофокус на десктопе
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  }, []);

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || status === "streaming" || status === "loading") return;

    setInputValue("");
    await sendMessage(message);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setInputValue("");
      textareaRef.current?.blur();
    }
  };

  const handleSave = () => {
    if (!document.title) return;

    createVacancyMutation.mutate({
      workspaceId,
      title: document.title,
      description: document.description ?? "",
      requirements: document.requirements ?? "",
      responsibilities: document.responsibilities ?? "",
      conditions: document.conditions ?? "",
      bonuses: document.bonuses ?? "",
      customBotInstructions: document.customBotInstructions ?? "",
      customScreeningPrompt: document.customScreeningPrompt ?? "",
      customInterviewQuestions: document.customInterviewQuestions ?? "",
      customOrganizationalQuestions:
        document.customOrganizationalQuestions ?? "",
    });
  };

  const isGenerating = status === "loading" || status === "streaming";
  const isSaving = createVacancyMutation.isPending;
  const hasMinimalContent = !!document.title;
  const lastMessage = messages[messages.length - 1];

  return (
    <main className="flex h-full flex-col gap-0 md:flex-row">
      {/* Chat Section */}
      <section
        className="flex h-[50vh] w-full flex-col border-b md:h-full md:w-1/2 md:border-b-0 md:border-r lg:w-2/5"
        aria-label="Чат с AI-ассистентом"
      >
        {/* Company Settings Preview */}
        {botSettings && (
          <div className="border-b bg-muted/30 px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">
                    {botSettings.botName} • {botSettings.companyName}
                  </span>
                  {botSettings.companyWebsite && (
                    <span className="text-xs text-muted-foreground">
                      {botSettings.companyWebsite}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Показываем диалог редактирования настроек
                  setShowSettingsEdit(true);
                }}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                title="Редактировать настройки компании"
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        <header className="flex items-center justify-between border-b p-3 md:p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold md:text-lg">
                AI-ассистент
              </h2>
              <p className="text-xs text-muted-foreground">Создание вакансии</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            disabled={isGenerating}
            className="h-8 w-8"
            aria-label="Начать заново"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea
          className="min-h-0 flex-1"
          ref={scrollAreaRef}
          style={{ overscrollBehavior: "contain" }}
        >
          <div
            className="space-y-3 p-3 md:space-y-4 md:p-4"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                onQuickReplySelect={selectQuickReply}
                onMultiSelectSubmit={selectMultipleReplies}
                isLatest={msg.id === lastMessage?.id}
                disabled={isGenerating}
              />
            ))}

            {isGenerating && !lastMessage?.isStreaming && <TypingIndicator />}
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="border-t bg-destructive/10 p-3" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <div className="flex-1 space-y-2">
                <p className="text-xs font-medium text-destructive">
                  {error.message}
                </p>
                {error.retryable && (
                  <Button onClick={retry} size="sm" variant="outline">
                    Повторить
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-background p-3 md:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Опишите вакансию или выберите вариант выше…"
                disabled={isGenerating}
                className="min-h-[60px] resize-none pr-12 text-base md:min-h-[80px]"
                style={{ fontSize: "16px", touchAction: "manipulation" }}
                autoComplete="off"
                name="vacancy-message"
                aria-label="Сообщение"
              />
              <Button
                type="submit"
                disabled={isGenerating || !inputValue.trim()}
                size="icon"
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full transition-all hover:scale-105 active:scale-95 md:h-9 md:w-9"
                style={{ touchAction: "manipulation" }}
                aria-label={isGenerating ? "Генерация…" : "Отправить"}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Enter — отправить, Shift&nbsp;+&nbsp;Enter — новая строка
            </p>
          </form>
        </div>
      </section>

      {/* Document Preview */}
      <section
        className="flex h-[50vh] w-full flex-col md:h-full md:w-1/2 lg:w-3/5"
        aria-label="Документ вакансии"
      >
        <header className="border-b p-3 md:p-4">
          <h2 className="text-base font-semibold md:text-lg">
            Документ вакансии
          </h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            Обновляется в&nbsp;реальном времени
          </p>
        </header>

        <DocumentPreview
          document={document}
          hasMinimalContent={hasMinimalContent}
          onSave={handleSave}
          isSaving={isSaving}
          isGenerating={isGenerating}
          editingSection={editingSection}
          onEditSection={setEditingSection}
          onUpdateSection={updateDocumentSection}
        />
      </section>

      {/* Company Settings Edit Dialog */}
      <Dialog open={showSettingsEdit} onOpenChange={setShowSettingsEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Настройки компании</DialogTitle>
            <DialogDescription>
              Настройте параметры бота-рекрутера для вашей компании
            </DialogDescription>
          </DialogHeader>

          {botSettings && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = {
                  companyName: formData.get("companyName") as string,
                  companyDescription:
                    (formData.get("companyDescription") as string) || undefined,
                  companyWebsite:
                    (formData.get("companyWebsite") as string) || undefined,
                  botName: formData.get("botName") as string,
                  botRole: formData.get("botRole") as string,
                };

                updateSettingsMutation.mutate({
                  workspaceId,
                  data,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Название компании</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={botSettings.companyName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botName">Имя бота</Label>
                  <Input
                    id="botName"
                    name="botName"
                    defaultValue={botSettings.botName}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyDescription">Описание компании</Label>
                <Textarea
                  id="companyDescription"
                  name="companyDescription"
                  defaultValue={botSettings.companyDescription || ""}
                  placeholder="Расскажите о деятельности компании..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Сайт компании</Label>
                  <Input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    defaultValue={botSettings.companyWebsite || ""}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="botRole">Роль бота</Label>
                  <Input
                    id="botRole"
                    name="botRole"
                    defaultValue={botSettings.botRole}
                    placeholder="HR-менеджер"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSettingsEdit(false)}
                  disabled={updateSettingsMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending
                    ? "Сохранение..."
                    : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
