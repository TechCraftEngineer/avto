"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { InterviewLandingForm } from "~/components/interview-landing-form";
import { useTRPC } from "~/trpc/react";

interface PageProps {
  params: Promise<{ token: string }>;
}

function InterviewLandingClient({ token }: { token: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  const _responseId = searchParams.get("responseId");

  const { data, isLoading, error } = useQuery(
    trpc.freelancePlatforms.getInterviewByToken.queryOptions({ token }),
  );

  const startInterviewMutation = useMutation(
    trpc.freelancePlatforms.startWebInterview.mutationOptions(),
  );

  // Перенаправляем в чат после успешного начала интервью
  React.useEffect(() => {
    if (startInterviewMutation.isSuccess && startInterviewMutation.data) {
      router.push(
        `/interview/${token}/chat?sessionId=${startInterviewMutation.data.sessionId}`,
      );
    }
  }, [
    startInterviewMutation.isSuccess,
    startInterviewMutation.data,
    router,
    token,
  ]);

  // Автоматический переход в чат если есть активная сессия
  React.useEffect(() => {
    if (
      data?.type === "direct_response" &&
      data.hasActiveSession &&
      data.sessionId
    ) {
      router.push(`/interview/${token}/chat?sessionId=${data.sessionId}`);
    }
  }, [data, router, token]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm">Загрузка…</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Ссылка на интервью не найдена
          </h2>
          <p className="mt-2 text-muted-foreground">
            Ссылка недействительна, истекла или вакансия закрыта
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Если вы считаете, что это ошибка, свяжитесь с работодателем
          </p>
        </div>
      </main>
    );
  }

  const subtitle =
    data.type === "vacancy"
      ? "Ответьте на несколько вопросов о себе"
      : data.type === "gig"
        ? "Опишите ваше решение задания"
        : "Продолжите интервью";

  const handleSubmit = async (formData: {
    name: string;
    platformProfileUrl: string;
  }) => {
    const result = await startInterviewMutation.mutateAsync({
      token,
      freelancerInfo: formData,
    });
    return { interviewSessionId: result.sessionId };
  };

  const handleContinueInterview = async () => {
    // Для direct_response без активной сессии - создаем новую сессию
    if (
      data?.type === "direct_response" &&
      !data.hasActiveSession &&
      data.responseId
    ) {
      const result = await startInterviewMutation.mutateAsync({
        token,
        freelancerInfo: {
          name: "Продолжение интервью", // Можно улучшить, взяв из response
          platformProfileUrl: "https://continue.interview", // Заглушка
        },
      });
      return { interviewSessionId: result.sessionId };
    }
  };

  const handleCheckDuplicate = async (
    vacancyId: string,
    platformProfileUrl: string,
  ) => {
    const result = await queryClient.fetchQuery(
      trpc.freelancePlatforms.checkDuplicateResponse.queryOptions({
        vacancyId,
        platformProfileUrl,
      }),
    );
    return { isDuplicate: result.isDuplicate };
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[64px_64px]"
        aria-hidden="true"
      />
      {/* Gradient blobs */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="h-[400px] w-[600px] bg-[radial-gradient(ellipse_at_center,rgba(255,182,193,0.3)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/4 top-20"
        aria-hidden="true"
      >
        <div className="h-[300px] w-[300px] bg-[radial-gradient(ellipse_at_center,rgba(255,218,185,0.3)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute right-1/4 top-32"
        aria-hidden="true"
      >
        <div className="h-[250px] w-[250px] bg-[radial-gradient(ellipse_at_center,rgba(221,160,221,0.25)_0%,transparent_70%)]" />
      </div>
      <div
        className="pointer-events-none absolute left-1/3 top-40"
        aria-hidden="true"
      >
        <div className="h-[200px] w-[200px] bg-[radial-gradient(ellipse_at_center,rgba(173,216,230,0.25)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {data.data.title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {data.type === "direct_response" ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                У вас есть незавершенное интервью. Хотите продолжить?
              </p>
              <button
                onClick={handleContinueInterview}
                disabled={startInterviewMutation.isPending}
                className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {startInterviewMutation.isPending && (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {startInterviewMutation.isPending
                  ? "Загрузка…"
                  : "Продолжить интервью"}
              </button>
            </div>
          ) : (
            <InterviewLandingForm
              token={token}
              entityId={data.data.id}
              entityType={data.type}
              platformSource={data.data.source}
              onSubmit={handleSubmit}
              onCheckDuplicate={
                data.type === "vacancy" ? handleCheckDuplicate : undefined
              }
            />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Нажимая «Начать», вы соглашаетесь на обработку персональных данных
        </p>
      </div>
    </main>
  );
}

export default function InterviewLandingPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  return <InterviewLandingClient token={unwrappedParams.token} />;
}
