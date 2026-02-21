"use client";

import type { RouterOutputs } from "@qbs-autonaim/api";
import { paths } from "@qbs-autonaim/config";
import {
  HR_SELECTION_STATUS_LABELS,
  RESPONSE_STATUS_LABELS,
} from "@qbs-autonaim/db/schema";
import { Badge } from "@qbs-autonaim/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/components/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@qbs-autonaim/ui/components/tooltip";
import { Send, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { z } from "zod";
import { ResponseActions } from "~/components";

import { ContactInfo } from "../../integrations/contact-info";
import { ChatIndicator } from "../../ui/chat-indicator";

const vacancyIdSchema = z
  .string()
  .min(1, "vacancyId must be a non-empty string");

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
  const params = useParams<{ id?: string | string[] }>();
  const parseResult = vacancyIdSchema.safeParse(params.id);

  if (!parseResult.success) {
    return null;
  }

  const vacancyId = parseResult.data;

  return (
    <div className="grid gap-4 md:hidden">
      {responses.map((response) => {
        const responseUrl = paths.workspace.vacancyResponse(
          orgSlug,
          workspaceSlug,
          vacancyId,
          response.id,
        );
        return (
          <Card
            key={response.id}
            className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={responseUrl}
                  className="flex-1 min-w-0 -m-6 p-6 block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
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
                            messageCount={
                              response.interviewSession.messageCount
                            }
                            conversationId={response.interviewSession.id}
                            orgSlug={orgSlug}
                            workspaceSlug={workspaceSlug}
                          />
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(response.createdAt).toLocaleDateString(
                          "ru-RU",
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={responseUrl}
                className="block -mx-6 -mb-6 -mt-4 px-6 pb-6 pt-0 rounded-b-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
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
              </Link>
              <div className="pt-2 border-t">
                <ResponseActions
                  responseId={response.id}
                  workspaceId={workspaceId}
                  vacancyId={vacancyId}
                  resumeUrl={response.profileUrl}
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
