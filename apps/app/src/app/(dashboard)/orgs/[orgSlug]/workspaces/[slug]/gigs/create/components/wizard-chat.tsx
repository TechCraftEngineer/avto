"use client";

import { Button } from "@qbs-autonaim/ui/components/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Input } from "@qbs-autonaim/ui/components/input"
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area"
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { Bot, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import React from "react";
import {
  BudgetStep,
  CategoryStep,
  DetailsStep,
  FeaturesStep,
  StackStep,
  SubtypeStep,
  TimelineStep,
} from "./wizard-steps";
import {
  BUDGET_OPTIONS,
  type BudgetOption,
  CATEGORIES,
  type CategoryOption,
  initialWizardState,
  type SubtypeOption,
  type TechStackOption,
  TIMELINE_OPTIONS,
  type TimelineOption,
  type WizardState,
  type WizardStep,
} from "./wizard-types";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface WizardChatProps {
  onComplete: (state: WizardState) => void;
  isGenerating: boolean;
  onChatMessage?: (message: string, history: ConversationMessage[]) => void;
  quickReplies?: string[];
  pendingAssistantMessage?: string | null;
  onAssistantMessageConsumed?: () => void;
}

const STEP_MESSAGES: Record<WizardStep, string> = {
  category: "Привет! Давайте создадим задание. Что вам нужно?",
  subtype: "Отлично! Уточните, что именно:",
  stack: "На каких технологиях делать?",
  features: "Супер! Какие функции нужны?",
  budget: "Понял! Какой бюджет планируете?",
  timeline: "Хорошо! Когда нужен результат?",
  details: "Почти готово! Хотите добавить детали?",
  review: "Генерирую ТЗ…",
  chat: "ТЗ готово! Можете уточнить детали или попросить изменения.",
};

function SelectionChip({ label, emoji }: { label: string; emoji?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {emoji && <span aria-hidden="true">{emoji}</span>}
      {label}
    </span>
  );
}

function SelectionHistory({ state }: { state: WizardState }) {
  const chips: { label: string; emoji?: string }[] = [];
  if (state.category)
    chips.push({ label: state.category.label, emoji: state.category.emoji });
  if (state.subtype) chips.push({ label: state.subtype.label });
  if (state.stack) chips.push({ label: state.stack.label });
  if (state.features.length > 0) {
    const count = state.features.length;
    const n = count % 100;
    let suffix: string;
    if (n >= 11 && n <= 14) {
      suffix = "ий";
    } else if (count % 10 === 1) {
      suffix = "ия";
    } else if (count % 10 >= 2 && count % 10 <= 4) {
      suffix = "ии";
    } else {
      suffix = "ий";
    }
    chips.push({ label: `${count} функц${suffix}` });
  }
  if (state.budget) chips.push({ label: state.budget.label });
  if (state.timeline)
    chips.push({ label: state.timeline.label, emoji: state.timeline.emoji });
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {chips.map((chip) => (
        <SelectionChip key={chip.label} label={chip.label} emoji={chip.emoji} />
      ))}
    </div>
  );
}

export function WizardChat({
  onComplete,
  isGenerating,
  onChatMessage,
  quickReplies = [],
  pendingAssistantMessage,
  onAssistantMessageConsumed,
}: WizardChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<WizardState>(initialWizardState);
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [conversationHistory, setConversationHistory] = React.useState<
    ConversationMessage[]
  >([]);

  const scrollToBottom = React.useCallback(() => {
    const el = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (el) {
      // Используем setTimeout для гарантии, что DOM обновился
      setTimeout(() => {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, []);

  // Автоскролл при изменении истории, шага или статуса генерации
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollToBottom должен вызываться при смене шага
  React.useEffect(() => {
    scrollToBottom();
  }, [state.step, conversationHistory.length, isGenerating, scrollToBottom]);

  // Переход в chat после завершения генерации
  React.useEffect(() => {
    if (state.step === "review" && !isGenerating) {
      setState((s) => ({ ...s, step: "chat" }));
    }
  }, [state.step, isGenerating]);

  // Добавляем ответ ассистента когда приходит pendingAssistantMessage
  React.useEffect(() => {
    if (pendingAssistantMessage) {
      // Добавляем сообщение независимо от текущего шага
      setConversationHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: pendingAssistantMessage,
        },
      ]);
      onAssistantMessageConsumed?.();
    }
  }, [pendingAssistantMessage, onAssistantMessageConsumed]);

  // Автофокус на input в режиме чата
  React.useEffect(() => {
    if (state.step === "chat" && !isGenerating) {
      inputRef.current?.focus();
    }
  }, [state.step, isGenerating]);

  const goToStep = (step: WizardStep) => setState((s) => ({ ...s, step }));
  const handleReset = () => {
    setState(initialWizardState);
    setShowCustomInput(false);
    setConversationHistory([]);
    setChatInput("");
  };

  const handleCategorySelect = (category: CategoryOption) => {
    setState((s) => ({
      ...s,
      category,
      subtype: null,
      stack: null,
      features: [],
    }));
    if (category.subtypes.length === 0) {
      setShowCustomInput(true);
      goToStep("details");
    } else goToStep("subtype");
  };

  const handleSubtypeSelect = (subtype: SubtypeOption) => {
    setState((s) => ({ ...s, subtype, stack: null, features: [] }));
    if (subtype.stacks && subtype.stacks.length > 0) {
      goToStep("stack");
    } else {
      goToStep("features");
    }
  };

  const handleStackSelect = (stack: TechStackOption) => {
    setState((s) => ({ ...s, stack }));
    goToStep("features");
  };

  const handleFeatureToggle = (featureId: string) => {
    setState((s) => ({
      ...s,
      features: s.features.includes(featureId)
        ? s.features.filter((f) => f !== featureId)
        : [...s.features, featureId],
    }));
  };

  const handleBudgetSelect = (budget: BudgetOption) => {
    setState((s) => ({ ...s, budget }));
    goToStep("timeline");
  };

  const handleTimelineSelect = (timeline: TimelineOption) => {
    setState((s) => ({ ...s, timeline }));
    goToStep("details");
  };

  const handleDetailsSubmit = (details: string) => {
    const finalState = {
      ...state,
      customDetails: details,
      step: "review" as const,
    };
    setState(finalState);
    // Добавляем начальное сообщение в историю только если история пустая
    if (details && conversationHistory.length === 0) {
      setConversationHistory([
        {
          id: crypto.randomUUID(),
          role: "user",
          content: details,
        },
      ]);
    }
    onComplete(finalState);
  };

  const handleChatSubmit = (message: string) => {
    if (!message.trim() || isGenerating) return;

    const newHistory: ConversationMessage[] = [
      ...conversationHistory,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message.trim(),
      },
    ];
    setConversationHistory(newHistory);
    setChatInput("");
    onChatMessage?.(message.trim(), newHistory);
  };

  const handleQuickReply = (reply: string) => {
    handleChatSubmit(reply);
  };

  const handleCustom = () => {
    setShowCustomInput(true);
    goToStep("details");
  };

  const renderStep = () => {
    switch (state.step) {
      case "category":
        return (
          <CategoryStep
            categories={CATEGORIES}
            onSelect={handleCategorySelect}
          />
        );
      case "subtype":
        return state.category ? (
          <SubtypeStep
            category={state.category}
            onSelect={handleSubtypeSelect}
            onBack={() => goToStep("category")}
            onCustom={handleCustom}
          />
        ) : null;
      case "stack":
        return state.subtype ? (
          <StackStep
            subtype={state.subtype}
            selected={state.stack}
            onSelect={handleStackSelect}
            onBack={() => goToStep("subtype")}
          />
        ) : null;
      case "features":
        return state.subtype ? (
          <FeaturesStep
            subtype={state.subtype}
            selected={state.features}
            onToggle={handleFeatureToggle}
            onNext={() => goToStep("budget")}
            onBack={() =>
              state.subtype?.stacks?.length
                ? goToStep("stack")
                : goToStep("subtype")
            }
          />
        ) : null;
      case "budget":
        return (
          <BudgetStep
            options={BUDGET_OPTIONS}
            selected={state.budget}
            onSelect={handleBudgetSelect}
            onBack={() => goToStep("features")}
          />
        );
      case "timeline":
        return (
          <TimelineStep
            options={TIMELINE_OPTIONS}
            selected={state.timeline}
            onSelect={handleTimelineSelect}
            onBack={() => goToStep("budget")}
          />
        );
      case "details":
        return (
          <DetailsStep
            onSubmit={handleDetailsSubmit}
            onSkip={() => handleDetailsSubmit("")}
            onBack={() => goToStep(showCustomInput ? "category" : "timeline")}
          />
        );
      case "review":
        return (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Генерирую ТЗ…</span>
          </div>
        );
      case "chat":
        return (
          <div className="space-y-3">
            {/* История сообщений */}
            {conversationHistory.length > 0 && (
              <div className="space-y-3">
                {conversationHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm max-w-[75%] ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick replies */}
            {quickReplies.length > 0 && !isGenerating && (
              <div className="flex flex-wrap gap-2 mt-3">
                {quickReplies.map((reply) => (
                  <Button
                    key={reply}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    className="h-8 text-xs"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}

            {/* Индикатор генерации */}
            {isGenerating && (
              <div className="flex gap-2 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Обновляю ТЗ…</span>
                </div>
              </div>
            )}

            {/* Якорь для автоскролла */}
            <div aria-hidden="true" />
          </div>
        );
      default:
        return null;
    }
  };

  const getProgressPercent = () => {
    const steps: WizardStep[] = [
      "category",
      "subtype",
      "stack",
      "features",
      "budget",
      "timeline",
      "details",
      "review",
      "chat",
    ];
    return Math.round(((steps.indexOf(state.step) + 1) / steps.length) * 100);
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">AI Помощник</CardTitle>
            <CardDescription>Создание задания</CardDescription>
          </div>
          {state.step !== "category" && state.step !== "review" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-muted-foreground"
              aria-label={
                state.step === "chat"
                  ? "Очистить чат и начать заново"
                  : "Начать заново"
              }
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {state.step === "chat" ? "Очистить" : "Заново"}
            </Button>
          )}
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
      </CardHeader>
      <Separator className="shrink-0" />
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0">
        <div className="space-y-4 p-4">
          <SelectionHistory state={state} />
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <Bot className="h-4 w-4" />
            </div>
            <div className="space-y-3 flex-1">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm max-w-[85%]">
                {STEP_MESSAGES[state.step]}
              </div>
              {!isGenerating && renderStep()}
              {isGenerating && state.step !== "chat" && renderStep()}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Поле ввода для чата */}
      {state.step === "chat" && (
        <>
          <Separator className="shrink-0" />
          <div className="p-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleChatSubmit(chatInput);
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Уточните детали или попросите изменения…"
                disabled={isGenerating}
                className="flex-1"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!chatInput.trim() || isGenerating}
                aria-label="Отправить сообщение"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
  );
}
