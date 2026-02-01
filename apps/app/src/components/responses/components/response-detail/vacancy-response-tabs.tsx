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
  ComparisonTab,
  ContactsTab,
  DialogTab,
  ExperienceTab,
  InterviewScoringCard,
  isVacancyResponse,
  NotesTagsTab,
  PortfolioTab,
  ProposalTab,
  ScreeningResultsCard,
  TimelineTab,
} from "~/components/response-detail";
import type { ResponseDetail } from "~/components/response-detail/hooks/use-vacancy-response-flags";

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
  // Проверяем наличие данных в вкладках
  const hasProposalData = !!(
    response.coverLetter ||
    response.salaryExpectationsAmount ||
    response.salaryExpectationsComment
  );
  const hasExperienceData = !!(
    response.experience ||
    (response.skills && response.skills.length > 0) ||
    response.profileData
  );
  const hasPortfolioData = !!(
    response.portfolioLinks?.length || response.portfolioFileId
  );
  const hasContactsData = (() => {
    // Check existing fields
    if (
      response.email ||
      response.phone ||
      response.telegramUsername ||
      response.profileUrl
    ) {
      return true;
    }

    // Check response.contacts JSON field
    if (response.contacts) {
      try {
        const contacts =
          typeof response.contacts === "string"
            ? JSON.parse(response.contacts)
            : response.contacts;

        // Check if contacts object has any non-empty values
        return Object.values(contacts).some(
          (value) => value !== null && value !== undefined && value !== "",
        );
      } catch {
        // If parsing fails, ignore this check
        return false;
      }
    }

    return false;
  })();

  // Подсчитываем количество видимых вкладок
  const hasAnalysis = hasScreening || hasInterviewScoring;
  const isVacancy = isVacancyResponse(response);
  const visibleTabsCount =
    (hasAnalysis ? 1 : 0) +
    (hasConversation ? 1 : 0) +
    (hasProposalData ? 1 : 0) +
    (hasExperienceData ? 1 : 0) +
    (hasPortfolioData ? 1 : 0) +
    (hasContactsData ? 1 : 0) +
    2 + // timeline и notes всегда видны
    (isVacancy ? 1 : 0); // comparison только для vacancy

  // Определяем классы grid-cols на основе количества вкладок
  const gridColsClass =
    visibleTabsCount <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : visibleTabsCount <= 6
        ? "grid-cols-3 sm:grid-cols-6"
        : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9";

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
            {hasProposalData && (
              <TabsTrigger
                value="proposal"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Предложение
              </TabsTrigger>
            )}
            {hasExperienceData && (
              <TabsTrigger
                value="experience"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Опыт
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
            {hasContactsData && (
              <TabsTrigger
                value="contacts"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Контакты
              </TabsTrigger>
            )}
            <TabsTrigger
              value="timeline"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              История
            </TabsTrigger>
            {isVacancyResponse(response) && (
              <TabsTrigger
                value="comparison"
                className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
              >
                Сравнение
              </TabsTrigger>
            )}
            <TabsTrigger
              value="notes"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Заметки
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
          {hasProposalData && (
            <TabsContent
              value="proposal"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ProposalTab response={response} />
            </TabsContent>
          )}

          {/* Experience Tab */}
          {hasExperienceData && (
            <TabsContent
              value="experience"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ExperienceTab response={response} />
            </TabsContent>
          )}

          {/* Portfolio Tab */}
          {hasPortfolioData && (
            <TabsContent
              value="portfolio"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <PortfolioTab response={response} />
            </TabsContent>
          )}

          {/* Contacts Tab */}
          {hasContactsData && (
            <TabsContent
              value="contacts"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ContactsTab response={response} />
            </TabsContent>
          )}

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-3 sm:space-y-4 mt-0">
            <TimelineTab responseId={response.id} />
          </TabsContent>

          {/* Comparison Tab - только для vacancy откликов */}
          {isVacancyResponse(response) && (
            <TabsContent
              value="comparison"
              className="space-y-3 sm:space-y-4 mt-0"
            >
              <ComparisonTab
                responseId={response.id}
                vacancyId={response.entityId}
                currentScore={response.compositeScore}
              />
            </TabsContent>
          )}

          {/* Notes & Tags Tab */}
          <TabsContent value="notes" className="space-y-3 sm:space-y-4 mt-0">
            <NotesTagsTab responseId={response.id} />
          </TabsContent>

          {/* No data message */}
          {!hasProposalData &&
            !hasExperienceData &&
            !hasPortfolioData &&
            !hasContactsData && (
              <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
                <div className="text-sm">
                  Для этого отклика не предоставлена дополнительная информация
                </div>
                <div className="text-xs mt-1 opacity-70">
                  Можно добавить данные через редактирование отклика
                </div>
              </div>
            )}
        </CardContent>
      </Tabs>
    </Card>
  );
}
