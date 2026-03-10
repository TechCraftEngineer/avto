"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Card } from "@qbs-autonaim/ui/components/card";
import { skipToken, useQuery } from "@tanstack/react-query";
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

  const responseCanFetch = Boolean(workspaceId) && Boolean(responseId);
  const questionsCanFetch =
    Boolean(workspaceId) && Boolean(vacancyId) && Boolean(responseId);

  const {
    data: responseData,
    isError: responseError,
    error: responseErrorObj,
    refetch: refetchResponse,
    isFetching: responseFetching,
  } = useQuery(
    responseCanFetch && workspaceId
      ? orpc.vacancy.responses.get.queryOptions({
          input: { id: responseId, workspaceId },
        })
      : skipToken,
  );

  const {
    data: interviewQuestions,
    isLoading: questionsLoading,
    isFetching: questionsFetching,
    isError: questionsError,
    error: questionsErrorObj,
    refetch: refetchQuestions,
  } = useQuery(
    questionsCanFetch && workspaceId
      ? orpc.recruiterAgent.getInterviewQuestions.queryOptions({
          input: {
            workspaceId,
            vacancyId,
            responseId,
          },
        })
      : skipToken,
  );

  const candidateName = responseData?.candidateName;

  const isInitialLoading =
    (responseCanFetch && !responseError && !responseData) ||
    (questionsCanFetch && !questionsError && !interviewQuestions);
  const isFetching = responseFetching || questionsLoading || questionsFetching;
  const isLoading = isInitialLoading && isFetching;

  if (!workspaceId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загрузка рабочего пространства…</p>
      </div>
    );
  }

  if (responseError || questionsError) {
    const msg =
      responseError && questionsError
        ? "Ошибка загрузки данных"
        : responseError
          ? (responseErrorObj?.message ?? "Ошибка загрузки отклика")
          : (questionsErrorObj?.message ?? "Ошибка загрузки вопросов");
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">{msg}</p>
        <div className="flex gap-2">
          {responseError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchResponse()}
              disabled={responseFetching}
            >
              {responseFetching ? "Повтор…" : "Повторить (отклик)"}
            </Button>
          )}
          {questionsError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchQuestions()}
              disabled={questionsFetching}
            >
              {questionsFetching ? "Повтор…" : "Повторить (вопросы)"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading && !responseData && !interviewQuestions) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground">Загрузка…</p>
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

      {/* Основной контент: чат — главное, подсказки — sidebar */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(320px,380px)] lg:gap-8">
        {/* Главная колонка: чат */}
        <section
          aria-label="Помощник по интервью"
          className="order-1 flex min-h-[420px] flex-col"
        >
          <h2 className="mb-4 text-xl font-semibold tracking-tight">
            Помощник по интервью
          </h2>
          <Card className="flex flex-1 flex-col overflow-hidden border shadow-sm">
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
              suggestionChips={[
                "Переделай структуру интервью",
                "Добавь вопросы про soft skills",
                candidateName
                  ? `Сгенерируй вопросы специально для ${candidateName}`
                  : "Какие вопросы задать на интервью?",
              ]}
              className="min-h-[380px] flex-1 border-0 shadow-none"
            />
          </Card>
        </section>

        {/* Боковая колонка: подсказки */}
        <aside
          aria-label="Подсказки для интервью"
          className="order-2 lg:sticky lg:top-6 lg:self-start"
        >
          <InterviewPromptsPanel
            questions={interviewQuestions}
            isLoading={questionsLoading}
            onRefresh={() => refetchQuestions()}
            isRefreshing={questionsFetching}
            candidateName={candidateName ?? undefined}
          />
        </aside>
      </div>
    </div>
  );
}
