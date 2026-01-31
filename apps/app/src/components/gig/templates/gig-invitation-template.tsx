"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface GigInvitationTemplateProps {
  gigId: string;
  gigTitle: string;
}

function normalizeInterviewUrl(url: string | undefined): string {
  if (!url) return "[ссылка на чат]";

  let normalizedUrl = url;

  // Ensure the URL has https protocol
  if (normalizedUrl.startsWith("http://")) {
    normalizedUrl = normalizedUrl.replace("http://", "https://");
  } else if (!normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  return normalizedUrl;
}

export function GigInvitationTemplate({
  gigId,
  gigTitle,
}: GigInvitationTemplateProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const { data: interviewLink, isLoading: isLoadingLink } = useQuery({
    ...trpc.gig.getInterviewLink.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id,
  });

  // Загружаем AI-шаблон только если есть ссылка
  const { data: aiTemplate, isLoading: isLoadingTemplate } = useQuery({
    ...trpc.gig.generateInvitationTemplate.queryOptions({
      gigId,
      workspaceId: workspace?.id ?? "",
    }),
    enabled: !!workspace?.id && !!interviewLink,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
  });

  const { mutate: generateLink, isPending: isGenerating } = useMutation(
    trpc.gig.generateInterviewLink.mutationOptions({
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.gig.getInterviewLink.queryKey({
            gigId,
            workspaceId: variables.workspaceId,
          }),
        });
        toast.success("Ссылка на чат создана");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleGenerateLink = useCallback(() => {
    if (!workspace?.id) return;
    generateLink({ gigId, workspaceId: workspace.id });
  }, [generateLink, gigId, workspace?.id]);

  const template = useMemo(() => {
    const interviewUrl = normalizeInterviewUrl(interviewLink?.url);

    if (aiTemplate?.text) {
      // Replace the placeholder URL in AI-generated text with actual URL
      return aiTemplate.text.replace(/\[ссылка на чат\]/g, interviewUrl);
    }

    // Fallback template if AI generation is not available
    const lines = [
      "Здравствуйте!",
      "",
      `Спасибо за отклик на задание "${gigTitle}".`,
      "",
      "Для продолжения, пожалуйста, пройдите короткое интервью с нашим AI-ассистентом (5-10 минут):",
      interviewUrl,
      "",
      "После чата мы свяжемся с вами для обсуждения деталей.",
    ];

    return lines.join("\n");
  }, [gigTitle, interviewLink?.url, aiTemplate?.text]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  }, [template]);

  const handleCopyLink = useCallback(async () => {
    if (!interviewLink?.url) return;

    try {
      const normalizedUrl = normalizeInterviewUrl(interviewLink.url);
      await navigator.clipboard.writeText(normalizedUrl);
      setLinkCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  }, [interviewLink?.url]);

  const handleRefreshTemplate = useCallback(() => {
    if (!workspace?.id) return;

    // Invalidate both queries to refresh the template
    queryClient.invalidateQueries({
      queryKey: trpc.gig.getInterviewLink.queryKey({
        gigId,
        workspaceId: workspace.id,
      }),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.gig.generateInvitationTemplate.queryKey({
        gigId,
        workspaceId: workspace.id,
      }),
    });

    toast.success("Шаблон обновлен");
  }, [
    queryClient,
    trpc.gig.getInterviewLink,
    trpc.gig.generateInvitationTemplate,
    gigId,
    workspace?.id,
  ]);

  // Показываем скелетон только при первой загрузке ссылки
  if (isLoadingLink) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Шаблон приглашения</CardTitle>
            <CardDescription>
              Скопируйте и отправьте кандидатам для прохождения чата
            </CardDescription>
          </div>
          {interviewLink && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleRefreshTemplate}
                  variant="ghost"
                  size="sm"
                  className="min-h-[36px]"
                  aria-label="Обновить шаблон приглашения"
                >
                  <IconRefresh className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Обновить шаблон</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!interviewLink && (
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="mb-3">
              Создайте ссылку на чат, чтобы использовать шаблон приглашения
            </p>
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="min-h-[36px]"
              aria-label="Создать ссылку на чат"
            >
              {isGenerating ? (
                <>
                  <IconLoader2
                    className="size-4 mr-2 animate-spin"
                    aria-hidden="true"
                  />
                  Создание…
                </>
              ) : (
                <>
                  <IconLink className="size-4 mr-2" aria-hidden="true" />
                  Создать ссылку на чат
                </>
              )}
            </Button>
          </div>
        )}

        <div className="relative">
          <Textarea
            value={template}
            readOnly
            rows={10}
            className="resize-none font-mono text-sm"
            aria-label="Текст шаблона приглашения"
          />
          {isLoadingTemplate && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
                <span>Генерация шаблона…</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 min-h-[44px]"
            aria-label="Скопировать шаблон приглашения"
          >
            {copied ? (
              <>
                <IconCheck className="size-4 mr-2" aria-hidden="true" />
                Скопировано
              </>
            ) : (
              <>
                <IconCopy className="size-4 mr-2" aria-hidden="true" />
                Копировать шаблон
              </>
            )}
          </Button>

          {interviewLink && (
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1 min-h-[44px]"
              aria-label="Скопировать ссылку на чат"
            >
              {linkCopied ? (
                <>
                  <IconCheck className="size-4 mr-2" aria-hidden="true" />
                  Ссылка скопирована
                </>
              ) : (
                <>
                  <IconLink className="size-4 mr-2" aria-hidden="true" />
                  Копировать ссылку
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
