"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import { Card, CardContent } from "@qbs-autonaim/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@qbs-autonaim/ui/collapsible";
import { Briefcase, Calendar, ChevronDown, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import type { SupportedEntityType } from "~/app/api/interview/chat/stream/strategies/types";

interface InterviewContext {
  type: "vacancy" | "gig";
  title: string;
  description: string | null;
  requirements?: {
    tech_stack?: string[];
    experience_years?: {
      min: number | null;
      description: string;
    };
    skills?: string[];
    responsibilities?: string[];
  } | null;
  budget?: {
    min: number | null;
    max: number | null;
    currency: string | null;
  } | null;
  deadline?: Date | null;
  estimatedDuration?: string | null;
  region?: string | null;
  workLocation?: string | null;
}

interface InterviewContextCardProps {
  context: InterviewContext;
  entityType?: SupportedEntityType;
}

export function InterviewContextCard({ context, entityType }: InterviewContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Определяем тип из context или из prop
  const entityTypeValue = entityType || context.type;
  const isVacancy = entityTypeValue === "vacancy";
  const isGig = entityTypeValue === "gig";

  const hasDetailedInfo =
    (context.description && context.description.length > 150) ||
    (context.requirements?.skills && context.requirements.skills.length > 0) ||
    (context.requirements?.responsibilities &&
      context.requirements.responsibilities.length > 0);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Briefcase className="size-6 text-primary" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {isGig ? "Разовое задание" : "Вакансия"}
                </Badge>
              </div>

              {context.description && (
                <div className="space-y-2">
                  <div
                    className={
                      isExpanded
                        ? "prose prose-sm max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                        : "line-clamp-2 text-sm text-muted-foreground"
                    }
                    dangerouslySetInnerHTML={{ __html: context.description }}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Поля для gig */}
                {isGig && context.budget && (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <span className="tabular-nums">
                      {context.budget.min && context.budget.max
                        ? `${context.budget.min.toLocaleString("ru-RU")}–${context.budget.max.toLocaleString("ru-RU")}`
                        : (
                            context.budget.min || context.budget.max
                          )?.toLocaleString("ru-RU")}{" "}
                      {context.budget.currency}
                    </span>
                  </div>
                )}

                {isGig && context.deadline && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="size-4" aria-hidden="true" />
                    <span>
                      До{" "}
                      {new Date(context.deadline).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                )}

                {isGig && context.estimatedDuration && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" aria-hidden="true" />
                    <span>{context.estimatedDuration}</span>
                  </div>
                )}

                {/* Поля для vacancy */}
                {isVacancy && context.region && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" aria-hidden="true" />
                    <span>{context.region}</span>
                  </div>
                )}

                {isVacancy && context.workLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span>{context.workLocation}</span>
                  </div>
                )}

                {isVacancy && context.requirements?.experience_years && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" aria-hidden="true" />
                    <span>
                      {context.requirements.experience_years.min
                        ? `От ${context.requirements.experience_years.min} лет`
                        : context.requirements.experience_years.description}
                    </span>
                  </div>
                )}
              </div>

              {context.requirements?.tech_stack &&
                context.requirements.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(isExpanded
                      ? context.requirements.tech_stack
                      : context.requirements.tech_stack.slice(0, 6)
                    ).map((tech: string) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="font-normal"
                      >
                        {tech}
                      </Badge>
                    ))}
                    {!isExpanded &&
                      context.requirements.tech_stack.length > 6 && (
                        <Badge variant="outline" className="font-normal">
                          +{context.requirements.tech_stack.length - 6}
                        </Badge>
                      )}
                  </div>
                )}

              <CollapsibleContent className="space-y-3">
                {context.requirements?.skills &&
                  context.requirements.skills.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Требуемые навыки</h3>
                      <ul className="space-y-1 text-muted-foreground text-sm">
                        {context.requirements.skills.map(
                          (skill: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                              <span>{skill}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {context.requirements?.responsibilities &&
                  context.requirements.responsibilities.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm">Обязанности</h3>
                      <ul className="space-y-1 text-muted-foreground text-sm">
                        {context.requirements.responsibilities.map(
                          (resp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                              <span>{resp}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
              </CollapsibleContent>

              {hasDetailedInfo && (
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
                    aria-label={isExpanded ? "Свернуть подробности" : "Показать подробности"}
                  >
                    <span className="text-xs">
                      {isExpanded ? "Свернуть" : "Показать подробности"}
                    </span>
                    <ChevronDown
                      className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
