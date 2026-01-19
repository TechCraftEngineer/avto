"use client";

import {
  Card,
  CardContent,
  CardHeader,
  cn,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  ContactsTab,
  DialogTab,
  ExperienceTab,
  InterviewScoringCard,
  PortfolioTab,
  ProposalTab,
  ScreeningResultsCard,
} from "~/components/response-detail";
import type { ResponseDetail } from "./hooks/use-vacancy-response-flags";

interface VacancyResponseTabsProps {
  response: ResponseDetail;
  defaultTab: string;
  hasScreening: boolean;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
  screening: {
    score: number;
    detailedScore: number;
    analysis: string | null;
    priceAnalysis?: string | null;
    deliveryAnalysis?: string | null;
  } | null;
  conversation: {
    id: string;
    status: string;
    messages: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string | null;
      type: "text" | "voice" | "file" | "event";
      voiceTranscription: string | null;
      createdAt: Date;
    }>;
  } | null;
}

export function VacancyResponseTabs({
  response,
  defaultTab,
  hasScreening,
  hasInterviewScoring,
  hasConversation,
  screening,
  conversation,
}: VacancyResponseTabsProps) {
  // Подсчитываем количество видимых вкладок
  const hasAnalysis = hasScreening || hasInterviewScoring;
  const visibleTabsCount =
    (hasAnalysis ? 1 : 0) + (hasConversation ? 1 : 0) + 4; // 4 базовые вкладки: Предложение, Опыт, Портфолио, Контакты

  // Определяем классы grid-cols на основе количества вкладок
  const gridColsClass =
    {
      4: "grid-cols-2 sm:grid-cols-4",
      5: "grid-cols-3 sm:grid-cols-5",
      6: "grid-cols-3 sm:grid-cols-6",
    }[visibleTabsCount] ?? "grid-cols-3 sm:grid-cols-6";

  return (
    <Card>
      <Tabs defaultValue={defaultTab} className="w-full">
        <CardHeader className="pb-3">
          <TabsList
            className={cn("grid w-full h-auto gap-1 p-1", gridColsClass)}
          >
            {(hasScreening || hasInterviewScoring) && (
              <TabsTrigger
                value="analysis"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Анализ
              </TabsTrigger>
            )}
            {hasConversation && (
              <TabsTrigger
                value="dialog"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Диалог
              </TabsTrigger>
            )}
            <TabsTrigger
              value="proposal"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Предложение
            </TabsTrigger>
            <TabsTrigger
              value="experience"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Опыт
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Портфолио
            </TabsTrigger>
            <TabsTrigger
              value="contacts"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Контакты
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent>
          {/* Analysis Tab */}
          {(hasScreening || hasInterviewScoring) && (
            <TabsContent
              value="analysis"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              {hasScreening && screening && (
                <ScreeningResultsCard screening={screening} />
              )}
              {hasInterviewScoring && response.interviewScoring && (
                <InterviewScoringCard
                  interviewScoring={response.interviewScoring}
                />
              )}
            </TabsContent>
          )}

          {/* Dialog Tab */}
          {hasConversation && conversation && (
            <TabsContent value="dialog" className="space-y-3 sm:space-y-4 mt-0">
              <DialogTab conversation={conversation} />
            </TabsContent>
          )}

          {/* Proposal Tab */}
          <TabsContent value="proposal" className="space-y-3 sm:space-y-4 mt-0">
            <ProposalTab response={response} />
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent
            value="experience"
            className="space-y-3 sm:space-y-4 mt-0"
          >
            <ExperienceTab response={response} />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent
            value="portfolio"
            className="space-y-3 sm:space-y-4 mt-0"
          >
            <PortfolioTab response={response} />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-3 sm:space-y-4 mt-0">
            <ContactsTab response={response} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
