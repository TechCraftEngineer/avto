"use client";

import {
  Card,
  CardContent,
  CardHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui";
import {
  DialogTab,
  InterviewScoringCard,
  ScreeningResultsCard,
  VacancyProposalTab,
} from "~/components/shared/components/response-detail-tabs";
import { MessageTemplates } from "./message-templates";
import { VacancyContactsTab } from "./tabs/contacts-tab";
import { VacancyExperienceTab } from "./tabs/experience-tab/index";
import type { VacancyResponseTabsProps } from "./types";

export function VacancyResponseTabs({
  response,
  vacancy,
  defaultTab,
  hasScreening,
  hasInterviewScoring,
  hasConversation,
  screening,
  conversation,
}: VacancyResponseTabsProps) {
  return (
    <Card>
      <Tabs defaultValue={defaultTab} className="w-full">
        <CardHeader className="pb-3">
          <TabsList className="grid w-full h-auto gap-1 p-1 grid-cols-3 sm:grid-cols-6">
            <TabsTrigger
              value="analysis"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Анализ
            </TabsTrigger>
            <TabsTrigger
              value="dialog"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Диалог
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="min-h-11 sm:min-h-9 text-xs sm:text-sm touch-manipulation"
            >
              Шаблоны
            </TabsTrigger>
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
          </TabsList>
        </CardHeader>

        <CardContent>
          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-3 sm:space-y-4 mt-0">
            {hasScreening && screening ? (
              <ScreeningResultsCard screening={screening} />
            ) : null}
            {hasInterviewScoring && response.interviewScoring ? (
              <InterviewScoringCard
                interviewScoring={response.interviewScoring}
              />
            ) : null}
            {!hasScreening && !hasInterviewScoring && (
              <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
                <div className="text-sm">Анализ отклика не проводился</div>
              </div>
            )}
          </TabsContent>

          {/* Dialog Tab */}
          <TabsContent value="dialog" className="space-y-3 sm:space-y-4 mt-0">
            {hasConversation && conversation ? (
              <DialogTab conversation={conversation} />
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/20 text-center py-12 text-muted-foreground">
                <div className="text-sm">Диалог с кандидатом не велся</div>
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent
            value="templates"
            className="space-y-3 sm:space-y-4 mt-0"
          >
            <MessageTemplates response={response} />
          </TabsContent>

          {/* Proposal Tab */}
          <TabsContent value="proposal" className="space-y-3 sm:space-y-4 mt-0">
            <VacancyProposalTab response={response} />
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent
            value="experience"
            className="space-y-3 sm:space-y-4 mt-0"
          >
            <VacancyExperienceTab
              response={response}
              vacancyRequirements={vacancy?.requirements || undefined}
            />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-3 sm:space-y-4 mt-0">
            <VacancyContactsTab response={response} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
