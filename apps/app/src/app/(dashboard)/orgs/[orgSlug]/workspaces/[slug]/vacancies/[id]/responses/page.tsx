"use client";

import { Card } from "@qbs-autonaim/ui/card";
import { useParams } from "next/navigation";
import { useState } from "react";
import { RecruiterAgentChat } from "~/components";
import { ResponseTable } from "~/components/vacancy/components";
import { VacancyResponsesProvider } from "~/components/vacancy/components/responses/context/vacancy-responses-context";
import { StatusIndicators } from "~/components/vacancy/components/responses/status-indicators";

export default function VacancyResponsesPage() {
  const { slug: workspaceSlug, id } = useParams<{
    slug: string;
    id: string;
  }>();
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <VacancyResponsesProvider vacancyId={id}>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-1">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Отклики
            </h1>
            <p className="text-muted-foreground mt-1">
              Управление и интеллектуальный анализ кандидатов для вашей вакансии
            </p>
          </div>
        </div>

        {/* Индикаторы статуса обновления откликов */}
        <StatusIndicators />

        <Card className="border-none shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="p-1 sm:p-6 relative">
            <ResponseTable vacancyId={id} workspaceSlug={workspaceSlug} />
          </div>
        </Card>

        {/* Floating Chat */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          {isChatOpen ? (
            <Card className="border-none shadow-2xl bg-card/95 backdrop-blur-xl overflow-hidden w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-1rem)] sm:h-176 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b shrink-0">
                <div>
                  <h3 className="font-semibold text-sm">AI-ассистент</h3>
                  <p className="text-xs text-muted-foreground">
                    Помогает с приоритетами и вопросами
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-muted rounded-md transition-colors"
                  aria-label="Свернуть чат"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Свернуть чат</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <RecruiterAgentChat
                  vacancyId={id}
                  title=""
                  subtitle=""
                  placeholder="Кого посмотреть первым? Какие вопросы задать?"
                  className="h-full"
                />
              </div>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setIsChatOpen(true)}
              className="group relative p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
              aria-label="Открыть AI-ассистент"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Открыть AI-ассистент</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-300" />
            </button>
          )}
        </div>
      </div>
    </VacancyResponsesProvider>
  );
}
