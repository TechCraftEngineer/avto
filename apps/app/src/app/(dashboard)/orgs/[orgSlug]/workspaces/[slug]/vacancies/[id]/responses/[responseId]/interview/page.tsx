"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Card } from "@qbs-autonaim/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RecruiterAgentChat } from "~/components";
import { InterviewPromptsPanel } from "~/components/vacancy/components/interview";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

export default function ResponseInterviewPage() {
  const params = useParams<{
    orgSlug: string;
    slug: string;
    id: string;
    responseId: string;
  }>();
  const vacancyId = params.id ?? "";
  const responseId = params.responseId ?? "";
  const orpc = useORPC();
  const { workspaceId } = useWorkspaceContext();

  const { data: responseData } = useQuery({
    ...orpc.vacancy.responses.get.queryOptions({
      input: { id: responseId, workspaceId: workspaceId ?? "" },
    }),
    enabled: Boolean(workspaceId) && Boolean(responseId),
  });

  const {
    data: interviewQuestions,
    isLoading: questionsLoading,
    isFetching: questionsFetching,
    refetch: refetchQuestions,
  } = useQuery({
    ...orpc.recruiterAgent.getInterviewQuestions.queryOptions({
      input: {
        workspaceId: workspaceId ?? "",
        vacancyId,
        responseId,
      },
    }),
    enabled: Boolean(workspaceId) && Boolean(vacancyId) && Boolean(responseId),
  });

  const candidateName = responseData?.candidateName;

  if (!workspaceId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загрузка рабочего пространства…</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link
            href={paths.workspace.vacancyResponse(
              params.orgSlug ?? "",
              params.slug ?? "",
              vacancyId,
              responseId,
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к отклику
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">
        {/* Левая колонка: подсказки для интервью */}
        <div className="space-y-6">
          <section aria-label="Подготовка к интервью">
            <h2 className="mb-4 text-xl font-semibold">
              Подготовка к интервью
            </h2>

            <InterviewPromptsPanel
              questions={interviewQuestions}
              isLoading={questionsLoading}
              onRefresh={() => refetchQuestions()}
              isRefreshing={questionsFetching}
              candidateName={candidateName ?? undefined}
              className="mt-4"
            />
          </section>
        </div>

        {/* Правая колонка: чат */}
        <div className="flex flex-col lg:min-h-[500px]">
          <section
            aria-label="Чат с AI-ассистентом"
            className="flex flex-1 flex-col"
          >
            <h2 className="mb-4 text-xl font-semibold">Помощник по интервью</h2>
            <Card className="flex flex-1 flex-col overflow-hidden border">
              <div className="flex min-h-[400px] flex-1 flex-col">
                <RecruiterAgentChat
                  vacancyId={vacancyId}
                  responseId={responseId}
                  title=""
                  subtitle={
                    candidateName
                      ? `Переделай структуру интервью, добавь вопросы для ${candidateName}`
                      : "Контекстная помощь по интервью"
                  }
                  placeholder="Переделай структуру интервью… Добавь вопросы про soft skills…"
                  className="min-h-0 flex-1"
                />
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
