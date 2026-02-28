"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type GigDocument, useGigChat } from "~/hooks/use-gig-chat";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

import { type FormValues, formSchema, type GigDraft } from "./components/types";
import type { WizardState } from "./components/wizard-types";
import {
  aiDocumentSchema,
  buildWizardMessage,
  computeAssistantMessageFromChanges,
  mergeDocToDraft,
} from "./utils";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface UseCreateGigOptions {
  orgSlug: string;
  workspaceSlug: string;
}

const initialDraft: GigDraft = {
  title: "",
  description: "",
  type: "OTHER",
  deliverables: "",
  requiredSkills: "",
  budgetMin: undefined,
  budgetMax: undefined,
  estimatedDuration: "",
};

export function useCreateGig({ orgSlug, workspaceSlug }: UseCreateGigOptions) {
  const router = useRouter();
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspace, isLoading: isWorkspaceLoading } = useWorkspace();

  const isMountedRef = React.useRef(true);
  const wizardStateRef = React.useRef<WizardState | null>(null);

  const [draft, setDraft] = React.useState<GigDraft>(initialDraft);
  const [showForm, setShowForm] = React.useState(false);
  const [pendingAssistantMessage, setPendingAssistantMessage] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
    orpc.gig.create.mutationOptions({
      onSuccess: () => {
        toast.success("Задание создано");
        queryClient.invalidateQueries({
          queryKey: orpc.gig.list.queryKey({
            input: { workspaceId: workspace?.id ?? "" },
          }),
        });
        router.push(`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`);
      },
      onError: (e) => toast.error(e.message || "Не удалось создать задание"),
    }),
  );

  const onDocumentUpdate = React.useCallback((doc: GigDocument) => {
    setDraft((prev) => mergeDocToDraft(doc, prev, wizardStateRef.current));
  }, []);

  const {
    quickReplies,
    status: gigChatStatus,
    error: gigChatError,
    sendMessage,
  } = useGigChat({
    workspaceId: workspace?.id ?? "",
    onDocumentUpdate,
  });

  const isGenerating =
    gigChatStatus === "loading" || gigChatStatus === "streaming";

  const handleWizardComplete = React.useCallback(
    async (wizardStateParam: WizardState) => {
      if (!workspace?.id) {
        toast.error("Workspace не загружен. Попробуйте обновить страницу.");
        return;
      }

      wizardStateRef.current = wizardStateParam;

      setDraft((prev) => ({
        ...prev,
        type: wizardStateParam.category?.id || "OTHER",
        budgetMin: wizardStateParam.budget?.min,
        budgetMax: wizardStateParam.budget?.max,
        estimatedDuration: wizardStateParam.timeline?.days
          ? String(wizardStateParam.timeline.days)
          : "",
      }));

      const message = buildWizardMessage(wizardStateParam);

      try {
        const result = await sendMessage(message, {
          budgetRange:
            wizardStateParam.budget?.min && wizardStateParam.budget?.max
              ? `${wizardStateParam.budget.min}-${wizardStateParam.budget.max} ₽`
              : undefined,
          timeline: wizardStateParam.timeline?.days
            ? String(wizardStateParam.timeline.days)
            : undefined,
        });

        if (!isMountedRef.current) return;

        const doc = result ?? {};
        const parsed = aiDocumentSchema.safeParse(doc);

        if (!parsed.success) {
          console.error(
            "[gig-create] AI response validation failed:",
            parsed.error,
          );
          toast.warning(
            "AI вернул неполный ответ. Используются данные из визарда.",
          );
        } else {
          toast.success("ТЗ сгенерировано! Проверьте и создайте задание.");
        }

        const assistantMessage = `Готово! Сгенерировал ТЗ${parsed.success && parsed.data.title ? ` "${parsed.data.title}"` : ""}. Можете уточнить детали или попросить изменения.`;
        setPendingAssistantMessage(assistantMessage);
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error("[gig-create] Generation error:", err);
        toast.error(err instanceof Error ? err.message : "Ошибка генерации");
        if (gigChatError) toast.error(gigChatError);

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
      }
    },
    [workspace?.id, sendMessage, gigChatError],
  );

  const handleChatMessage = React.useCallback(
    async (message: string, history: ConversationMessage[]) => {
      if (!workspace?.id) {
        console.warn("[gig-create] handleChatMessage called without workspace");
        return;
      }

      const beforeDraft = draft;

      try {
        const result = await sendMessage(
          message,
          {
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
          history.slice(-10).map(({ role, content }) => ({ role, content })),
        );

        if (!isMountedRef.current) return;

        const doc = result ?? {};
        const parsed = aiDocumentSchema.safeParse(doc);

        if (parsed.success) {
          const assistantMessage = computeAssistantMessageFromChanges(
            parsed.data,
            beforeDraft,
          );
          setPendingAssistantMessage(assistantMessage);
        } else {
          console.error(
            "[gig-create] Chat message validation failed:",
            parsed.error,
          );
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
      }
    },
    [workspace?.id, draft, sendMessage],
  );

  const handleCreate = React.useCallback(() => {
    if (!workspace?.id) {
      toast.error("Workspace не загружен");
      return;
    }
    const trimmedTitle = draft.title?.trim();
    if (!trimmedTitle) {
      toast.error("Укажите название задания");
      return;
    }
    createGig({
      workspaceId: workspace.id,
      title: trimmedTitle,
      description: draft.description?.trim() || undefined,
      type: draft.type,
      budgetMin: draft.budgetMin,
      budgetMax: draft.budgetMax,
      estimatedDuration: draft.estimatedDuration?.trim() || undefined,
      deliverables: draft.deliverables?.trim() || undefined,
      requiredSkills: draft.requiredSkills?.trim() || undefined,
    });
  }, [workspace?.id, draft, createGig]);

  const onSubmit = React.useCallback(
    (v: FormValues) => {
      if (!workspace?.id) {
        toast.error("Workspace не загружен");
        return;
      }
      createGig({
        workspaceId: workspace.id,
        title: v.title.trim(),
        description: v.description?.trim() || undefined,
        type: v.type,
        budgetMin: v.budgetMin,
        budgetMax: v.budgetMax,
        deadline: v.deadline ? new Date(v.deadline).toISOString() : undefined,
        estimatedDuration: v.estimatedDuration?.trim() || undefined,
        deliverables: v.deliverables?.trim() || undefined,
        requiredSkills: v.requiredSkills?.trim() || undefined,
        platformSource: v.platformSource,
        platformUrl: v.platformUrl?.trim() || undefined,
      });
    },
    [workspace?.id, createGig],
  );

  const syncForm = React.useCallback(() => {
    form.setValue("title", draft.title);
    form.setValue("description", draft.description);
    form.setValue("type", draft.type);
    form.setValue("deliverables", draft.deliverables);
    form.setValue("requiredSkills", draft.requiredSkills);
    form.setValue("budgetMin", draft.budgetMin);
    form.setValue("budgetMax", draft.budgetMax);
    form.setValue("estimatedDuration", draft.estimatedDuration);
    setShowForm((prev) => !prev);
  }, [form, draft]);

  const handleAssistantMessageConsumed = React.useCallback(() => {
    setPendingAssistantMessage(null);
  }, []);

  return {
    draft,
    form,
    quickReplies,
    pendingAssistantMessage,
    handleAssistantMessageConsumed,
    isGenerating: isGenerating || isWorkspaceLoading,
    isCreating,
    showForm,
    setShowForm,
    workspace,
    handleWizardComplete,
    handleChatMessage,
    handleCreate,
    onSubmit,
    syncForm,
  };
}
