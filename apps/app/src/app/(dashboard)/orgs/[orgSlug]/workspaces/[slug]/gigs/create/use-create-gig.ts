"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { type GigDocument, useGigChat } from "~/hooks/use-gig-chat";
import { useWorkspace } from "~/hooks/use-workspace";
import { useORPC } from "~/orpc/react";

import { type FormValues, formSchema, type GigDraft } from "./components/types";
import {
  aiDocumentSchema,
  computeAssistantMessageFromChanges,
  mergeDocToDraft,
} from "./utils";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
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

  const [draft, setDraft] = React.useState<GigDraft>(initialDraft);
  const [showForm, setShowForm] = React.useState(false);
  const [conversationMessages, setConversationMessages] = React.useState<
    ConversationMessage[]
  >([]);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
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
    setDraft((prev) => mergeDocToDraft(doc, prev, null));
  }, []);

  const {
    status: gigChatStatus,
    error: gigChatError,
    sendMessage,
  } = useGigChat({
    workspaceId: workspace?.id ?? "",
    onDocumentUpdate,
  });

  const isGenerating =
    gigChatStatus === "loading" ||
    gigChatStatus === "streaming" ||
    isWorkspaceLoading;

  const handleSendMessage = React.useCallback(
    async (message: string) => {
      if (!workspace?.id) {
        toast.error("Workspace не загружен. Попробуйте обновить страницу.");
        return;
      }

      const userMsg: ConversationMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      };
      setConversationMessages((prev) => [...prev, userMsg]);

      const history = [...conversationMessages, userMsg].slice(-10);
      const historyForApi = history.map(({ role, content }) => ({
        role,
        content,
      }));

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
          historyForApi,
        );

        if (!isMountedRef.current) return;

        if (!result) {
          setConversationMessages((prev) => prev.slice(0, -1));
          return;
        }

        const parsed = aiDocumentSchema.safeParse(result.document);
        const assistantContent =
          result.message ||
          (parsed.success
            ? computeAssistantMessageFromChanges(parsed.data, draft)
            : "Готово. Можете уточнить детали.");

        const assistantMsg: ConversationMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantContent,
          quickReplies: result.quickReplies,
        };
        setConversationMessages((prev) => [...prev, assistantMsg]);

        if (!parsed.success) {
          console.warn("[gig-create] AI document validation:", parsed.error);
          toast.warning(
            "AI вернул неполный ответ. Попробуйте уточнить запрос.",
          );
        } else if (result.document?.title) {
          toast.success("ТЗ обновлено. Можно создавать задание.");
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        setConversationMessages((prev) => prev.slice(0, -1));
        console.error("[gig-create] Send message error:", err);
        toast.error(err instanceof Error ? err.message : "Ошибка обновления");
        if (gigChatError) toast.error(gigChatError);
      }
    },
    [workspace?.id, draft, sendMessage, conversationMessages, gigChatError],
  );

  const handleReset = React.useCallback(() => {
    setConversationMessages([]);
    setDraft(initialDraft);
  }, []);

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

  const chatMessages = React.useMemo(() => {
    return conversationMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      quickReplies: m.quickReplies,
    }));
  }, [conversationMessages]);

  return {
    draft,
    form,
    chatMessages,
    isGenerating: isGenerating || isWorkspaceLoading,
    isCreating,
    showForm,
    setShowForm,
    workspace,
    handleSendMessage,
    handleReset,
    handleCreate,
    onSubmit,
    syncForm,
  };
}
