"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Label } from "@qbs-autonaim/ui/components/label";
import { Skeleton } from "@qbs-autonaim/ui/components/skeleton";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import { CustomDomainSelect } from "../custom-domain-select";

const InterviewMediaUpload = dynamic(
  () =>
    import("../interview-media-upload").then((mod) => mod.InterviewMediaUpload),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    ),
  },
);

interface GigInterviewSettingsProps {
  gigId: string;
}

export function GigInterviewSettings({ gigId }: GigInterviewSettingsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [customBotInstructions, setCustomBotInstructions] = useState("");
  const [customScreeningPrompt, setCustomScreeningPrompt] = useState("");
  const [customInterviewQuestions, setCustomInterviewQuestions] = useState("");
  const [customOrganizationalQuestions, setCustomOrganizationalQuestions] =
    useState("");
  const [interviewMediaFileIds, setInterviewMediaFileIds] = useState<string[]>(
    [],
  );
  const [customDomainId, setCustomDomainId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: gig, isLoading } = useQuery({
    ...trpc.gig.get.queryOptions({
      id: gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  const { data: interviewMediaFiles = [] } = useQuery(
    trpc.files.getInterviewMedia.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
  );

  useEffect(() => {
    if (gig) {
      setCustomBotInstructions(gig.customBotInstructions ?? "");
      setCustomScreeningPrompt(gig.customScreeningPrompt ?? "");
      setCustomInterviewQuestions(gig.customInterviewQuestions ?? "");
      setCustomOrganizationalQuestions(gig.customOrganizationalQuestions ?? "");
      setCustomDomainId(gig.customDomainId ?? null);
      setHasChanges(false);
    }
  }, [gig]);

  useEffect(() => {
    if (interviewMediaFiles.length > 0) {
      setInterviewMediaFileIds(interviewMediaFiles.map((f) => f.id));
    }
  }, [interviewMediaFiles]);

  const { mutate: updateSettings, isPending } = useMutation(
    trpc.gig.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.get.queryKey({
            id: gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.files.getInterviewMedia.queryKey({
            gigId,
            workspaceId: workspace?.id ?? "",
          }),
        });
        setHasChanges(false);
        toast.success("Настройки сохранены");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSave = useCallback(() => {
    if (!workspace?.id) return;

    updateSettings({
      gigId,
      workspaceId: workspace.id,
      settings: {
        customBotInstructions: customBotInstructions.trim() || null,
        customScreeningPrompt: customScreeningPrompt.trim() || null,
        customInterviewQuestions: customInterviewQuestions.trim() || null,
        customOrganizationalQuestions:
          customOrganizationalQuestions.trim() || null,
        customDomainId: customDomainId,
        interviewMediaFileIds:
          interviewMediaFileIds.length > 0 ? interviewMediaFileIds : null,
      } as Parameters<typeof updateSettings>[0]["settings"],
    });
  }, [
    updateSettings,
    gigId,
    workspace?.id,
    customBotInstructions,
    customScreeningPrompt,
    customInterviewQuestions,
    customOrganizationalQuestions,
    customDomainId,
    interviewMediaFileIds,
  ]);

  const handleChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
      setter(value);
      setHasChanges(true);
    },
    [],
  );

  // Предупреждение при уходе со страницы с несохранёнными изменениями
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки интервью</CardTitle>
        <CardDescription>
          Кастомные инструкции и правила для проведения интервью по этому
          заданию
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="customBotInstructions">
            Общие инструкции для бота
          </Label>
          <Textarea
            id="customBotInstructions"
            name="customBotInstructions"
            value={customBotInstructions}
            onChange={(e) =>
              handleChange(setCustomBotInstructions, e.target.value)
            }
            placeholder="Опишите общий стиль общения, тон, особые требования к поведению бота…"
            rows={4}
            className="resize-y"
            aria-describedby="customBotInstructions-hint"
          />
          <p
            id="customBotInstructions-hint"
            className="text-xs text-muted-foreground"
          >
            Например: «Общайся на ты, будь дружелюбным, не задавай технических
            вопросов»
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customScreeningPrompt">Промпт для скрининга</Label>
          <Textarea
            id="customScreeningPrompt"
            name="customScreeningPrompt"
            value={customScreeningPrompt}
            onChange={(e) =>
              handleChange(setCustomScreeningPrompt, e.target.value)
            }
            placeholder="Критерии оценки кандидата, на что обращать внимание при скрининге…"
            rows={4}
            className="resize-y"
            aria-describedby="customScreeningPrompt-hint"
          />
          <p
            id="customScreeningPrompt-hint"
            className="text-xs text-muted-foreground"
          >
            Укажите критерии для автоматической оценки откликов
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customOrganizationalQuestions">
            Организационные вопросы
          </Label>
          <Textarea
            id="customOrganizationalQuestions"
            name="customOrganizationalQuestions"
            value={customOrganizationalQuestions}
            onChange={(e) =>
              handleChange(setCustomOrganizationalQuestions, e.target.value)
            }
            placeholder="Вопросы о доступности, сроках, условиях работы…"
            rows={4}
            className="resize-y"
            aria-describedby="customOrganizationalQuestions-hint"
          />
          <p
            id="customOrganizationalQuestions-hint"
            className="text-xs text-muted-foreground"
          >
            Например: «Когда готовы приступить?», «Какой формат работы
            предпочитаете?»
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customInterviewQuestions">Вопросы для интервью</Label>
          <Textarea
            id="customInterviewQuestions"
            name="customInterviewQuestions"
            value={customInterviewQuestions}
            onChange={(e) =>
              handleChange(setCustomInterviewQuestions, e.target.value)
            }
            placeholder="Список вопросов, которые бот должен задать кандидату…"
            rows={6}
            className="resize-y"
            aria-describedby="customInterviewQuestions-hint"
          />
          <p
            id="customInterviewQuestions-hint"
            className="text-xs text-muted-foreground"
          >
            Каждый вопрос с новой строки. Бот задаст их в ходе интервью
          </p>
        </div>

        {workspace?.id && (
          <CustomDomainSelect
            workspaceId={workspace.id}
            value={customDomainId}
            onChange={(value) => {
              setCustomDomainId(value);
              setHasChanges(true);
            }}
          />
        )}

        {workspace?.id && (
          <div className="space-y-2">
            <Label>Медиафайлы для интервью</Label>
            <InterviewMediaUpload
              files={interviewMediaFiles}
              onFilesChange={(fileIds) => {
                setInterviewMediaFileIds(fileIds);
                setHasChanges(true);
              }}
              workspaceId={workspace.id}
              gigId={gigId}
            />
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="w-full min-h-[44px]"
          aria-label="Сохранить настройки интервью"
        >
          {isPending ? (
            <>
              <IconLoader2
                className="size-4 mr-2 animate-spin"
                aria-hidden="true"
              />
              Сохранение…
            </>
          ) : (
            <>
              <IconDeviceFloppy className="size-4 mr-2" aria-hidden="true" />
              Сохранить настройки
            </>
          )}
        </Button>

        {hasChanges && (
          <output
            className="text-sm text-amber-600 dark:text-amber-500 block"
            aria-live="polite"
          >
            Есть несохранённые изменения
          </output>
        )}
      </CardContent>
    </Card>
  );
}
