"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { paths } from "@qbs-autonaim/config";
import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { Send, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ResponseActions } from "~/components";
import { ContactInfo } from "../../integrations/contact-info";
import { ChatIndicator } from "../../ui/chat-indicator";

interface ResponseCardsProps {
  responses: RouterOutputs["vacancy"]["responses"]["list"]["responses"];
  orgSlug: string;
  workspaceSlug: string;
  workspaceId: string;
}

export function ResponseCards({
  responses,
  orgSlug,
  workspaceSlug,
  workspaceId,
}: ResponseCardsProps) {
  const { id: vacancyId } = useParams<{ id: string }>();

  return (
    <div className="grid gap-4 md:hidden">
      {responses.map((response) => (
        <Link
          key={response.id}
          href={paths.workspace.vacancies(
            orgSlug,
            workspaceSlug,
            vacancyId,
            "responses",
            response.id,
          )}
          className="block transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {response.candidateName || "Без имени"}
                      {response.welcomeSentAt && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="rounded-full bg-green-100 p-1">
                                <Send className="h-3 w-3 text-green-600" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Приветствие отправлено</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  response.welcomeSentAt,
                                ).toLocaleString("ru-RU")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {response.interviewSession && (
                        <ChatIndicator
                          messageCount={response.interviewSession.messageCount}
                          conversationId={response.interviewSession.id}
                          orgSlug={orgSlug}
                          workspaceSlug={workspaceSlug}
                        />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(response.createdAt).toLocaleDateString("ru-RU")}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {RESPONSE_STATUS_LABELS[response.status]}
                </Badge>
                {response.hrSelectionStatus && (
                  <Badge variant="secondary">
                    {HR_SELECTION_STATUS_LABELS[response.hrSelectionStatus]}
                  </Badge>
                )}
              </div>
              {/* Опыт работы временно скрыт, так как profileData не включен в список откликов */}
              {response.contacts && typeof response.contacts === "object" ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Контакты</h4>
                  <ContactInfo contacts={response.contacts} size="md" />
                </div>
              ) : null}
              <fieldset
                className="pt-2 border-t border-0 p-0 m-0 min-w-0"
                onClick={(e) => e.preventDefault()}
                onKeyDown={(e) => e.preventDefault()}
              >
                <ResponseActions
                  responseId={response.id}
                  workspaceId={workspaceId}
                  resumeUrl={response.resumeUrl}
                  telegramUsername={response.telegramUsername}
                  phone={response.phone}
                  email={response.email}
                  welcomeSentAt={response.welcomeSentAt}
                  importSource={response.importSource}
                  status={response.status}
                  hrSelectionStatus={response.hrSelectionStatus}
                  hasScreening={!!response.screening}
                  candidateName={response.candidateName}
                />
              </fieldset>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
