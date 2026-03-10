"use client";

import { Card, CardContent } from "@qbs-autonaim/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { RecruiterAgentChat } from "~/components";
import {
  InterviewCandidatePicker,
  InterviewPromptsPanel,
} from "~/components/vacancy/components/interview";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";

export default function VacancyInterviewPage() {
  const params = useParams<{
    orgSlug: string;
    slug: string;
    id: string;
  }>();
  const vacancyId = params.id ?? "";
  const orpc = useORPC();
  const { workspaceId } = useWorkspaceContext();

  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );

  const { data: responsesData, isLoading: responsesLoading } = useQuery({
    ...orpc.vacancy.responses.list.queryOptions({
      input: {
        workspaceId: workspaceId ?? "",
        vacancyId,
        page: 1,
        limit: 100,
        sortField: "priorityScore",
        sortDirection: "desc",
        screeningFilter: "all",
      },
    }),
    enabled: Boolean(workspaceId) && Boolean(vacancyId),
  });

  const responses = responsesData?.responses ?? [];

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
        responseId: selectedResponseId ?? "",
      },
    }),
    enabled:
      Boolean(workspaceId) && Boolean(vacancyId) && Boolean(selectedResponseId),
  });

  const selectedResponse = selectedResponseId
    ? responses.find((r) => r.id === selectedResponseId)
    : null;

  if (!workspaceId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загрузка рабочего пространства…</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-8">
        {/* Левая колонка: выбор кандидата + подсказки */}
        <div className="space-y-6">
          <section aria-label="Подготовка к интервью">
            <h2 className="mb-4 text-xl font-semibold">
              Подготовка к интервью
            </h2>

            <InterviewCandidatePicker
              responses={responses}
              selectedResponseId={selectedResponseId}
              onSelect={setSelectedResponseId}
              isLoading={responsesLoading}
              placeholder="Выберите кандидата для интервью"
            />

            {responses.length === 0 && !responsesLoading && (
              <Card className="mt-4 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="size-12 text-muted-foreground/50" />
                  <h3 className="mt-3 font-medium">
                    Нет откликов для интервью
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Сначала откройте раздел «Отклики» и дождитесь откликов на
                    вакансию
                  </p>
                </CardContent>
              </Card>
            )}

            <InterviewPromptsPanel
              questions={interviewQuestions}
              isLoading={questionsLoading}
              onRefresh={() => refetchQuestions()}
              isRefreshing={questionsFetching}
              candidateName={selectedResponse?.candidateName}
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
              <div className="flex flex-1 flex-col min-h-[400px]">
                <RecruiterAgentChat
                  vacancyId={vacancyId}
                  responseId={selectedResponseId ?? undefined}
                  title=""
                  subtitle={
                    selectedResponse
                      ? `Переделай структуру интервью, добавь вопросы для ${selectedResponse.candidateName ?? "кандидата"}`
                      : "Выберите кандидата для контекстной помощи"
                  }
                  placeholder="Переделай структуру интервью… Добавь вопросы про soft skills…"
                  className="flex-1 min-h-0"
                />
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
