"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@qbs-autonaim/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
import { cn } from "@qbs-autonaim/ui/utils";
import { Award, Banknote, Briefcase, Clock } from "lucide-react";
import {
  FactorBreakdown,
  OverallAssessment,
  ScoreExplanation,
} from "~/components";
import {
  DialogTab,
  GigProposalTab,
  InterviewScoringCard,
} from "~/components/shared/components/response-detail-tabs";
import { PortfolioCard } from "./portfolio-card";
import { PricingCard } from "./pricing-card";
import { GigContactsTab } from "./tabs/contacts-tab";
import { GigExperienceTab } from "./tabs/experience-tab";
import type { GigResponseTabsProps } from "./types";

export function GigResponseTabs({
  response,
  defaultTab,
  hasInterviewScoring,
  hasConversation,
  conversation,
}: GigResponseTabsProps) {
  // Проверяем наличие reasoning данных
  const hasReasoning =
    response.screening?.priceAnalysis ||
    response.screening?.deliveryAnalysis ||
    response.screening?.skillsAnalysis ||
    response.screening?.experienceAnalysis ||
    response.screening?.overallAnalysis;

  // Проверяем специфичные gig данные
  const hasPricingData = !!(
    response.proposedPrice || response.proposedDeliveryDays
  );
  const hasPortfolioData = !!(
    response.portfolioLinks?.length || response.portfolioFileId
  );

  // Подсчитываем количество видимых вкладок
  const visibleTabsCount =
    (hasInterviewScoring ? 1 : 0) +
    (hasConversation ? 1 : 0) +
    (hasReasoning ? 1 : 0) +
    (hasPricingData ? 1 : 0) +
    4; // 4 базовые вкладки: proposal, experience, portfolio, contacts

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
              value="contacts"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Контакты
            </TabsTrigger>
            {hasPricingData && (
              <TabsTrigger
                value="pricing"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Цена
              </TabsTrigger>
            )}
            {hasPortfolioData && (
              <TabsTrigger
                value="portfolio"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Портфолио
              </TabsTrigger>
            )}
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
                compositeScore={response.screening?.overallScore}
                compositeReasoning={response.screening?.overallAnalysis}
                recommendation={response.screening?.recommendation}
                strengths={response.screening?.strengths || undefined}
                weaknesses={response.screening?.weaknesses || undefined}
              />

              {/* Factor Breakdown */}
              <FactorBreakdown
                experienceScore={response.screening?.experienceScore}
                experienceReasoning={response.screening?.experienceAnalysis}
                skillsScore={response.screening?.skillsMatchScore}
                skillsReasoning={response.screening?.skillsAnalysis}
                strengths={response.screening?.strengths || undefined}
                weaknesses={response.screening?.weaknesses || undefined}
              />

              {/* Score Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {response.screening?.priceScore !== null && (
                  <ScoreExplanation
                    label="Оценка цены"
                    score={response.screening?.priceScore}
                    reasoning={response.screening?.priceAnalysis}
                    icon={<Banknote className="h-4 w-4" />}
                  />
                )}
                {response.screening?.deliveryScore !== null && (
                  <ScoreExplanation
                    label="Оценка сроков"
                    score={response.screening?.deliveryScore}
                    reasoning={response.screening?.deliveryAnalysis}
                    icon={<Clock className="h-4 w-4" />}
                  />
                )}
                {response.screening?.skillsMatchScore !== null && (
                  <ScoreExplanation
                    label="Соответствие навыков"
                    score={response.screening?.skillsMatchScore}
                    reasoning={response.screening?.skillsAnalysis}
                    icon={<Award className="h-4 w-4" />}
                  />
                )}
                {response.screening?.experienceScore !== null && (
                  <ScoreExplanation
                    label="Оценка опыта"
                    score={response.screening?.experienceScore}
                    reasoning={response.screening?.experienceAnalysis}
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
            <GigProposalTab response={response} />
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent
            value="experience"
            className="space-y-3 sm:space-y-4 mt-0"
          >
            <GigExperienceTab response={response} />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-3 sm:space-y-4 mt-0">
            <GigContactsTab response={response} />
          </TabsContent>

          {/* Pricing Tab */}
          {hasPricingData && (
            <TabsContent
              value="pricing"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <PricingCard response={response} />
            </TabsContent>
          )}

          {/* Portfolio Tab */}
          {hasPortfolioData && (
            <TabsContent
              value="portfolio"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <PortfolioCard response={response} />
            </TabsContent>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
}
