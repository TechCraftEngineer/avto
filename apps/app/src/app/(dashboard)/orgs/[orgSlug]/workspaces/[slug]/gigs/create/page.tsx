"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

import { GigForm, GigPreview, ProgressCard } from "./components";
import { type FormValues, formSchema, type GigDraft } from "./components/types";
import { WizardChat } from "./components/wizard-chat";
import type { WizardState } from "./components/wizard-types";

interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Schema for validating AI response document
const aiDocumentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.union([z.string(), z.number()]).optional(),
});

// Парсинг budgetRange в budgetMin/budgetMax
function parseBudgetRange(budgetRange?: string): {
  budgetMin?: number;
  budgetMax?: number;
} {
  if (!budgetRange) return {};

  // Ищем паттерн "5000 – 15000" или "5000-15000"
  const match = budgetRange.match(/(\d[\d\s]*?)[\s–-]+(\d[\d\s]*)/);
  if (match?.[1] && match[2]) {
    const min = Number.parseInt(match[1].replace(/\s/g, ""), 10);
    const max = Number.parseInt(match[2].replace(/\s/g, ""), 10);

    // Validate both parsed numbers
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return {};
    }

    // Swap if min > max to ensure sensible range
    if (min > max) {
      return { budgetMin: max, budgetMax: min };
    }

    return { budgetMin: min, budgetMax: max };
  }

  // Если только одно число
  const singleMatch = budgetRange.match(/(\d[\d\s]*)/);
  if (singleMatch?.[1]) {
    const value = Number.parseInt(singleMatch[1].replace(/\s/g, ""), 10);

    // Validate parsed number
    if (!Number.isFinite(value)) {
      return {};
    }

    return { budgetMin: value, budgetMax: value };
  }

  return {};
}

interface PageProps {
  params: Promise<{ orgSlug: string; slug: string }>;
}

export default function CreateGigPage({ params }: PageProps) {
  const router = useRouter();
  const { orgSlug, slug: workspaceSlug } = React.use(params);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();

  const isMountedRef = React.useRef(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<string[]>([]);
  const [wizardState, setWizardState] = React.useState<WizardState | null>(
    null,
  );
  const [pendingAssistantMessage, setPendingAssistantMessage] = React.useState<
    string | null
  >(null);

  const handleAssistantMessageConsumed = React.useCallback(() => {
    setPendingAssistantMessage(null);
  }, []);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [draft, setDraft] = React.useState<GigDraft>({
    title: "",
    description: "",
    type: "OTHER",
    deliverables: "",
    requiredSkills: "",
    budgetMin: undefined,
    budgetMax: undefined,

    estimatedDuration: "",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "OTHER",
      budgetMin: undefined,
      budgetMax: undefined,

      deadline: "",
      estimatedDuration: "",
      deliverables: "",
      requiredSkills: "",

      platformSource: undefined,
      platformUrl: "",
    },
  });

  const { mutate: createGig, isPending: isCreating } = useMutation(
    trpc.gig.create.mutationOptions({
      onSuccess: () => {
        toast.success("Задание создано");
        queryClient.invalidateQueries({ queryKey: trpc.gig.list.queryKey() });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (e) => toast.error(e.message || "Не удалось создать задание"),
    }),
  );

  const { mutateAsync: generateWithAi } = useMutation(
    trpc.gig.chatGenerate.mutationOptions(),
  );

  const handleWizardComplete = async (wizardStateParam: WizardState) => {
    // Проверяем наличие workspace перед генерацией
    if (!workspace?.id) {
      toast.error("Workspace не загружен. Попробуйте обновить страницу.");
      return;
    }

    setIsGenerating(true);
    setWizardState(wizardStateParam);

    // Сразу обновляем draft данными из визарда для отображения прогресса
    setDraft((prev) => ({
      ...prev,
      type: wizardStateParam.category?.id || "OTHER",
      budgetMin: wizardStateParam.budget?.min,
      budgetMax: wizardStateParam.budget?.max,
      estimatedDuration: wizardStateParam.timeline?.days
        ? String(wizardStateParam.timeline.days)
        : "",
    }));

    // Собираем данные из wizard в текстовое описание для AI
    const parts: string[] = [];

    if (wizardStateParam.category) {
      parts.push(`Категория: ${wizardStateParam.category.label}`);
    }
    if (wizardStateParam.subtype) {
      parts.push(`Тип: ${wizardStateParam.subtype.label}`);
    }
    if (wizardStateParam.features.length > 0 && wizardStateParam.subtype) {
      const featureLabels = wizardStateParam.features
        .map(
          (fId) =>
            wizardStateParam.subtype?.features.find((f) => f.id === fId)?.label,
        )
        .filter(Boolean);
      parts.push(`Функции: ${featureLabels.join(", ")}`);
    }
    if (wizardStateParam.budget) {
      parts.push(`Бюджет: ${wizardStateParam.budget.label}`);
    }
    if (wizardStateParam.timeline) {
      parts.push(
        `Сроки: ${wizardStateParam.timeline.label} (${wizardStateParam.timeline.days})`,
      );
    }
    if (wizardStateParam.stack) {
      parts.push(`Стек: ${wizardStateParam.stack.label}`);
    }
    if (wizardStateParam.customDetails) {
      parts.push(`Дополнительно: ${wizardStateParam.customDetails}`);
    }

    const message = parts.join("\n");

    try {
      const result = await generateWithAi({
        workspaceId: workspace.id,
        message,
        currentDocument: {
          budgetRange:
            wizardStateParam.budget?.min && wizardStateParam.budget?.max
              ? `${wizardStateParam.budget.min}-${wizardStateParam.budget.max} ₽`
              : undefined,
          timeline: wizardStateParam.timeline?.days
            ? String(wizardStateParam.timeline.days)
            : undefined,
        },
        conversationHistory: [],
      });

      if (!isMountedRef.current) return;

      const doc = result.document;

      // Сохраняем quick replies
      setQuickReplies(result.quickReplies || []);

      // Validate AI response shape
      const parsed = aiDocumentSchema.safeParse(doc);

      let newDraft: GigDraft;

      if (!parsed.success) {
        console.error(
          "[gig-create] AI response validation failed:",
          parsed.error,
        );
        console.error("[gig-create] Document that failed validation:", doc);

        // Используем fallback с данными wizard, но показываем хоть что-то
        newDraft = {
          title: "Новое задание",
          description: message,
          type: wizardStateParam.category?.id || "OTHER",
          deliverables: "",
          requiredSkills: "",
          budgetMin: wizardStateParam.budget?.min,
          budgetMax: wizardStateParam.budget?.max,
          estimatedDuration: wizardStateParam.timeline?.days
            ? String(wizardStateParam.timeline.days)
            : "",
        };

        toast.warning(
          "AI вернул неполный ответ. Используются данные из визарда.",
        );
      } else {
        const validDoc = parsed.data;
        // Нормализуем estimatedDuration к строке: приоритет AI-ответу, затем wizard
        const rawDuration =
          validDoc.timeline ?? wizardStateParam.timeline?.days;
        const estimatedDuration: string =
          rawDuration != null ? String(rawDuration) : "";

        // Парсим budgetRange из AI или используем данные wizard
        const budgetFromAI = parseBudgetRange(validDoc.budgetRange);
        const budgetMin =
          budgetFromAI.budgetMin ?? wizardStateParam.budget?.min;
        const budgetMax =
          budgetFromAI.budgetMax ?? wizardStateParam.budget?.max;

        newDraft = {
          title: validDoc.title || "Новое задание",
          description: validDoc.description || "",
          type: wizardStateParam.category?.id || "OTHER",
          deliverables: validDoc.deliverables || "",
          requiredSkills: validDoc.requiredSkills || "",
          budgetMin,
          budgetMax,
          estimatedDuration,
        };

        toast.success("ТЗ сгенерировано! Проверьте и создайте задание.");
      }

      // Обновляем draft синхронно
      setDraft(newDraft);

      // Формируем сообщение ассистента для чата
      const assistantMessage = `Готово! Сгенерировал ТЗ${parsed.success && parsed.data.title ? ` "${parsed.data.title}"` : ""}. Можете уточнить детали или попросить изменения.`;
      setPendingAssistantMessage(assistantMessage);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[gig-create] Generation error:", err);
      toast.error(err instanceof Error ? err.message : "Ошибка генерации");

      // Даже при ошибке показываем хоть что-то
      setDraft({
        title: "Новое задание",
        description: message,
        type: wizardStateParam.category?.id || "OTHER",
        deliverables: "",
        requiredSkills: "",
        budgetMin: wizardStateParam.budget?.min,
        budgetMax: wizardStateParam.budget?.max,
        estimatedDuration: wizardStateParam.timeline?.days
          ? String(wizardStateParam.timeline.days)
          : "",
      });
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleChatMessage = async (
    message: string,
    history: ConversationMessage[],
  ) => {
    if (!workspace?.id) {
      console.warn("[gig-create] handleChatMessage called without workspace");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await generateWithAi({
        workspaceId: workspace.id,
        message,
        currentDocument: {
          title: draft.title,
          description: draft.description,
          deliverables: draft.deliverables,
          requiredSkills: draft.requiredSkills,
          budgetRange:
            draft.budgetMin && draft.budgetMax
              ? `${draft.budgetMin}-${draft.budgetMax} ₽`
              : undefined,
          timeline: draft.estimatedDuration,
        },
        conversationHistory: history
          .slice(-10)
          .map(({ role, content }) => ({ role, content })), // Последние 10 сообщений
      });

      if (!isMountedRef.current) return;

      const doc = result.document;
      setQuickReplies(result.quickReplies || []);

      // Обновляем draft
      const parsed = aiDocumentSchema.safeParse(doc);
      if (parsed.success) {
        const validDoc = parsed.data;
        const rawDuration = validDoc.timeline ?? wizardState?.timeline?.days;
        const estimatedDuration: string =
          rawDuration != null ? String(rawDuration) : "";

        let assistantMessage = "Готово! Что-то ещё уточнить?";

        setDraft((prev) => {
          // Парсим budgetRange из AI или оставляем текущие значения
          const budgetFromAI = parseBudgetRange(validDoc.budgetRange);

          const updatedDraft = {
            ...prev,
            title: validDoc.title || prev.title,
            description: validDoc.description || prev.description,
            deliverables: validDoc.deliverables || prev.deliverables,
            requiredSkills: validDoc.requiredSkills || prev.requiredSkills,
            estimatedDuration: estimatedDuration || prev.estimatedDuration,
            budgetMin: budgetFromAI.budgetMin ?? prev.budgetMin,
            budgetMax: budgetFromAI.budgetMax ?? prev.budgetMax,
          };

          // Формируем сообщение ассистента о том, что изменилось
          const changes: string[] = [];
          if (validDoc.title && validDoc.title !== prev.title)
            changes.push("название");
          if (validDoc.description && validDoc.description !== prev.description)
            changes.push("описание");
          if (
            validDoc.deliverables &&
            validDoc.deliverables !== prev.deliverables
          )
            changes.push("результаты");
          if (
            validDoc.requiredSkills &&
            validDoc.requiredSkills !== prev.requiredSkills
          )
            changes.push("навыки");
          if (
            validDoc.budgetRange &&
            (budgetFromAI.budgetMin !== prev.budgetMin ||
              budgetFromAI.budgetMax !== prev.budgetMax)
          )
            changes.push("бюджет");
          if (validDoc.timeline && estimatedDuration !== prev.estimatedDuration)
            changes.push("сроки");

          if (changes.length > 0) {
            assistantMessage = `Обновил ${changes.join(", ")}. Что-то ещё?`;
          }

          return updatedDraft;
        });

        setPendingAssistantMessage(assistantMessage);
      } else {
        console.error(
          "[gig-create] Chat message validation failed:",
          parsed.error,
        );
        console.error("[gig-create] Document that failed:", doc);

        // Показываем сообщение об ошибке пользователю
        toast.warning(
          "AI вернул неполный ответ. Попробуйте переформулировать запрос.",
        );
        setPendingAssistantMessage(
          "Извините, не смог обработать запрос. Попробуйте переформулировать.",
        );
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("[gig-create] Chat message error:", err);
      toast.error(err instanceof Error ? err.message : "Ошибка обновления");
      setPendingAssistantMessage("Произошла ошибка. Попробуйте ещё раз.");
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false);
      }
    }
  };

  const handleCreate = () => {
    if (!workspace?.id) {
      toast.error("Workspace не загружен");
      return;
    }
    if (!draft.title) {
      toast.error("Укажите название задания");
      return;
    }
    createGig({
      workspaceId: workspace.id,
      title: draft.title,
      description: draft.description || undefined,
      type: draft.type,
      budgetMin: draft.budgetMin,
      budgetMax: draft.budgetMax,

      estimatedDuration: draft.estimatedDuration || undefined,
      deliverables: draft.deliverables || undefined,
      requiredSkills: draft.requiredSkills || undefined,
    });
  };

  const onSubmit = (v: FormValues) => {
    if (!workspace?.id) {
      toast.error("Workspace не загружен");
      return;
    }
    createGig({
      workspaceId: workspace.id,
      title: v.title,
      description: v.description || undefined,
      type: v.type,
      budgetMin: v.budgetMin,
      budgetMax: v.budgetMax,

      deadline: v.deadline ? new Date(v.deadline).toISOString() : undefined,
      estimatedDuration: v.estimatedDuration || undefined,
      deliverables: v.deliverables || undefined,
      requiredSkills: v.requiredSkills || undefined,

      platformSource: v.platformSource,
      platformUrl: v.platformUrl || undefined,
    });
  };

  const syncForm = () => {
    form.setValue("title", draft.title);
    form.setValue("description", draft.description);
    form.setValue("type", draft.type);
    form.setValue("deliverables", draft.deliverables);
    form.setValue("requiredSkills", draft.requiredSkills);
    form.setValue("budgetMin", draft.budgetMin);
    form.setValue("budgetMax", draft.budgetMax);
    form.setValue("estimatedDuration", draft.estimatedDuration);
    // TODO: добавить синхронизацию platformSource и platformUrl из draft если нужно
    setShowForm((prev) => !prev);
  };

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <PageHeader
        title="Создание задания"
        description="Создание нового разового задания"
        tooltipContent={`Создайте разовое задание с помощью пошагового мастера. Укажите тип задания, требования и бюджет — AI поможет сформулировать описание.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/candidates/gig)`}
      >
        <Link
          href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] touch-action-manipulation"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад к заданиям
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WizardChat
          onComplete={handleWizardComplete}
          isGenerating={isGenerating || isWorkspaceLoading}
          onChatMessage={handleChatMessage}
          quickReplies={quickReplies}
          pendingAssistantMessage={pendingAssistantMessage}
          onAssistantMessageConsumed={handleAssistantMessageConsumed}
        />

        <div className="space-y-6">
          <GigPreview
            draft={draft}
            showForm={showForm}
            isCreating={isCreating}
            onEdit={syncForm}
            onCreate={handleCreate}
          >
            <GigForm
              form={form}
              onSubmit={onSubmit}
              onCancel={() => setShowForm(false)}
              isCreating={isCreating}
              workspaceId={workspace?.id}
            />
          </GigPreview>

          <ProgressCard draft={draft} />
        </div>
      </div>
    </div>
  );
}
