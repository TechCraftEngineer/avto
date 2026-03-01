import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { ScrollArea } from "@qbs-autonaim/ui/components/scroll-area";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { CandidateInfo } from "./candidate-info";
import { ResumePdfLink } from "./resume-pdf-link";
import { ScreeningInfo } from "./screening-info";
import { StatusInfo } from "./status-info";
import { TelegramInterviewScoring } from "./telegram-interview-scoring";
import { VacancyInfo } from "./vacancy-info";

interface ChatSidebarProps {
  candidateName: string | null;
  chatId: string;
  responseData?: {
    status?: string | null;
    createdAt?: Date | null;
    resumePdfFile?: {
      key: string;
      fileName: string;
    } | null;
    screening?: {
      score: number | null;
      detailedScore?: number | null;
      analysis?: string | null;
    } | null;
    interviewScoring?: {
      score: number | null;
      detailedScore?: number | null;
      analysis?: string | null;
    } | null;
    vacancy?: {
      title: string;
      description?: string | null;
    } | null;
  } | null;
}

export function ChatSidebar({
  candidateName,
  chatId,
  responseData,
}: ChatSidebarProps) {
  return (
    <div className="w-full lg:w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 lg:p-6 space-y-6">
          <CandidateInfo candidateName={candidateName} chatId={chatId} />
          <Separator />

          {responseData?.resumePdfFile && (
            <Card size="sm">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base">Резюме</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ResumePdfLink fileKey={responseData.resumePdfFile.key} />
              </CardContent>
            </Card>
          )}

          {responseData?.screening && (
            <ScreeningInfo
              score={responseData.screening.score}
              detailedScore={responseData.screening.detailedScore}
              analysis={responseData.screening.analysis}
            />
          )}

          {responseData?.interviewScoring && (
            <TelegramInterviewScoring
              score={responseData.interviewScoring.score}
              detailedScore={responseData.interviewScoring.detailedScore}
              analysis={responseData.interviewScoring.analysis}
            />
          )}

          {responseData?.vacancy && (
            <VacancyInfo title={responseData.vacancy.title} />
          )}

          <StatusInfo
            status={responseData?.status}
            createdAt={responseData?.createdAt}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
