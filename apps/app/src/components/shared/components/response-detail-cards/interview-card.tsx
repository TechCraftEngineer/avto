import { getInitials } from "@qbs-autonaim/shared";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@qbs-autonaim/ui/components/avatar";
import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { Separator } from "@qbs-autonaim/ui/components/separator";
import { MessageSquare } from "lucide-react";
import { SafeHtml } from "~/components";
import { getAvatarUrl } from "~/lib/avatar";
import { getScoreBadgeVariant } from "../../utils";
import { VoicePlayer } from "../response-detail-tabs/actions/voice-player";

interface Message {
  id: string;
  sender: "CANDIDATE" | "BOT" | "ADMIN";
  contentType: "TEXT" | "VOICE";
  content: string;
  voiceUrl?: string;
  voiceDuration?: string;
  voiceTranscription?: string;
  createdAt: Date | string;
}

interface InterviewCardProps {
  conversation: {
    interviewScoring?: {
      score: number;
      detailedScore?: number;
      analysis?: string;
    };
    messages?: Message[];
  } | null;
  candidateName: string | null;
  workspaceName: string | undefined;
}

export function InterviewCard({
  conversation,
  candidateName,
  workspaceName,
}: InterviewCardProps) {
  if (!conversation?.interviewScoring) return null;

  return (
    <Card className="border-2 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <MessageSquare className="h-6 w-6 text-primary" />
              Интервью в Telegram
            </CardTitle>
            <CardDescription className="text-base">
              Оценка: {conversation.interviewScoring.score}
            </CardDescription>
          </div>
          {conversation.interviewScoring.detailedScore !== undefined && (
            <Badge
              variant={getScoreBadgeVariant(
                conversation.interviewScoring.detailedScore,
              )}
              className="text-base px-3 py-1 tabular-nums"
            >
              {Math.round(conversation.interviewScoring.detailedScore)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {conversation.interviewScoring.analysis && (
          <SafeHtml
            html={conversation.interviewScoring.analysis}
            className="prose prose-sm sm:prose-base max-w-none dark:prose-invert mb-6"
          />
        )}

        {conversation.messages && conversation.messages.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <h3 className="text-base font-semibold sm:text-lg">
                История диалога
              </h3>
              <div className="space-y-3">
                {conversation.messages.map((message) => {
                  const senderName =
                    message.sender === "CANDIDATE"
                      ? candidateName
                        ? candidateName.split(" ").slice(0, 2).join(" ")
                        : "Кандидат"
                      : workspaceName || "Бот";

                  const isCandidate = message.sender === "CANDIDATE";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isCandidate ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <Avatar className="h-8 w-8 shrink-0 border sm:h-10 sm:w-10">
                        <AvatarImage
                          src={getAvatarUrl(null, senderName)}
                          alt={senderName}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(senderName)}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex-1 space-y-1 ${
                          isCandidate ? "mr-4 sm:mr-12" : "ml-4 sm:ml-12"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 ${
                            isCandidate ? "flex-row" : "flex-row-reverse"
                          }`}
                        >
                          <span className="text-xs font-semibold sm:text-sm">
                            {senderName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleString(
                              "ru-RU",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl border-2 p-3 sm:p-4 ${
                            isCandidate
                              ? "bg-muted/50 border-muted"
                              : "bg-primary/5 border-primary/20"
                          }`}
                        >
                          {message.contentType === "VOICE" ? (
                            <div className="space-y-2">
                              {"voiceUrl" in message && message.voiceUrl ? (
                                <VoicePlayer
                                  url={message.voiceUrl}
                                  duration={message.voiceDuration || ""}
                                />
                              ) : null}
                              {message.voiceTranscription ? (
                                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                  {message.voiceTranscription}
                                </p>
                              ) : !("voiceUrl" in message) ||
                                !message.voiceUrl ? (
                                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                                  Аудиозапись недоступна
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed sm:text-base">
                              {message.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
