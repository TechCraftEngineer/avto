"use client";

import { Badge, Card, CardContent } from "@qbs-autonaim/ui";
import { Briefcase, Calendar, Clock } from "lucide-react";

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
  } | null;
  budget?: {
    min: number | null;
    max: number | null;
    currency: string | null;
  } | null;
  deadline?: Date | null;
  estimatedDuration?: string | null;
}

interface InterviewContextCardProps {
  context: InterviewContext;
}

export function InterviewContextCard({ context }: InterviewContextCardProps) {
  const isVacancy = context.type === "vacancy";
  const isGig = context.type === "gig";

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Briefcase className="size-6 text-primary" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {isVacancy ? "Вакансия" : "Разовое задание"}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold leading-tight text-foreground sm:text-xl">
                {context.title}
              </h2>
            </div>

            {context.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {context.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {isGig && context.budget && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <span>
                    {context.budget.min && context.budget.max
                      ? `${context.budget.min}–${context.budget.max}`
                      : context.budget.min || context.budget.max}{" "}
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
                  {context.requirements.tech_stack
                    .slice(0, 6)
                    .map((tech: string) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="font-normal"
                      >
                        {tech}
                      </Badge>
                    ))}
                  {context.requirements.tech_stack.length > 6 && (
                    <Badge variant="outline" className="font-normal">
                      +{context.requirements.tech_stack.length - 6}
                    </Badge>
                  )}
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
