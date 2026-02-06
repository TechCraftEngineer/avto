"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { InterviewChat } from "~/components/interview-chat";

interface PageProps {
  params: Promise<{ token: string }>;
}

function InterviewChatClient({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-foreground">⚠️</h1>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Сессия не найдена
          </h2>
          <p className="mt-2 text-muted-foreground">
            Не указан идентификатор сессии интервью
          </p>
          <button
            type="button"
            onClick={() => router.push(`/${token}`)}
            className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Вернуться к началу
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <InterviewChat
        interviewSessionId={sessionId}
        interviewToken={token}
        className="flex-1"
      />
    </main>
  );
}

export default function InterviewChatPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  return <InterviewChatClient token={unwrappedParams.token} />;
}
