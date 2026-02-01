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
import { Award, Banknote, Briefcase, Clock } from "lucide-react";
import {
  FactorBreakdown,
  OverallAssessment,
  ScoreExplanation,
} from "~/components/candidates/components/candidate";
import {
  ContactsTab,
  DialogTab,
  ExperienceTab,
  InterviewScoringCard,
  PortfolioTab,
  ProposalTab,
} from "~/components/response-detail";
import type { ResponseDetail } from "~/components/response-detail/hooks/use-vacancy-response-flags";

interface GigResponseTabsProps {
  response: ResponseDetail;
  defaultTab: string;
  hasInterviewScoring: boolean;
  hasConversation: boolean;
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

export function GigResponseTabs({
  response,
  defaultTab,
  hasInterviewScoring,
  hasConversation,
  conversation,
}: GigResponseTabsProps) {
  // Проверяем наличие reasoning данных
  const hasReasoning =
    response.priceScoreReasoning ||
    response.deliveryScoreReasoning ||
    response.skillsMatchScoreReasoning ||
    response.experienceScoreReasoning ||
    response.compositeScoreReasoning;

  // Подсчитываем количество видимых вкладок
  const visibleTabsCount =
    (hasInterviewScoring ? 1 : 0) +
    (hasConversation ? 1 : 0) +
    (hasReasoning ? 1 : 0) +
    4; // 4 базовые вкладки

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
            {hasInterviewScoring && (
              <TabsTrigger
                value="analysis"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Анализ
              </TabsTrigger>
            )}
            {hasReasoning && (
              <TabsTrigger
                value="explanation"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Объяснение
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
          {hasInterviewScoring && (
            <TabsContent
              value="analysis"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              {response.interviewScoring && (
                <InterviewScoringCard
                  interviewScoring={response.interviewScoring}
                />
              )}
            </TabsContent>
          )}

          {/* Explanation Tab */}
          {hasReasoning && (
            <TabsContent
              value="explanation"
              className="space-y-4 sm:space-y-6 mt-0"
            >
              {/* Overall Assessment */}
              <OverallAssessment
                compositeScore={response.compositeScore}
                compositeReasoning={response.compositeScoreReasoning}
                recommendation={response.recommendation}
                strengths={response.strengths ?? undefined}
                weaknesses={response.weaknesses ?? undefined}
              />

              {/* Factor Breakdown */}
              <FactorBreakdown
                experienceScore={response.experienceScore}
                experienceReasoning={response.experienceScoreReasoning}
                skillsScore={response.skillsMatchScore}
                skillsReasoning={response.skillsMatchScoreReasoning}
                strengths={response.strengths ?? undefined}
                weaknesses={response.weaknesses ?? undefined}
              />

              {/* Score Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.priceScore !== null && (
                  <ScoreExplanation
                    label="Оценка цены"
                    score={response.priceScore}
                    reasoning={response.priceScoreReasoning}
                    icon={<Banknote className="h-4 w-4" />}
                  />
                )}
                {response.deliveryScore !== null && (
                  <ScoreExplanation
                    label="Оценка сроков"
                    score={response.deliveryScore}
                    reasoning={response.deliveryScoreReasoning}
                    icon={<Clock className="h-4 w-4" />}
                  />
                )}
                {response.skillsMatchScore !== null && (
                  <ScoreExplanation
                    label="Соответствие навыков"
                    score={response.skillsMatchScore}
                    reasoning={response.skillsMatchScoreReasoning}
                    icon={<Award className="h-4 w-4" />}
                  />
                )}
                {response.experienceScore !== null && (
                  <ScoreExplanation
                    label="Оценка опыта"
                    score={response.experienceScore}
                    reasoning={response.experienceScoreReasoning}
                    icon={<Briefcase className="h-4 w-4" />}
                  />
                )}
              </div>
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
