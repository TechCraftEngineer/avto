"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@qbs-autonaim/ui/components/tooltip";
import { Briefcase, MessageSquare, Plus, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UniversalChatPanel } from "~/components/chat/components";
import { useWorkspace } from "~/hooks/use-workspace";

interface QuickActionsProps {
  orgSlug: string;
  workspaceSlug: string;
}

export function QuickActions({ orgSlug, workspaceSlug }: QuickActionsProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { workspace } = useWorkspace();
  const isWorkspaceReady = Boolean(workspace?.id);

  const actions = [
    {
      icon: Plus,
      label: "Создать вакансию",
      href: paths.workspace.createVacancy(orgSlug, workspaceSlug),
      variant: "default" as const,
    },
    {
      icon: Users,
      label: "Все отклики",
      href: paths.workspace.responses(orgSlug, workspaceSlug),
      variant: "outline" as const,
    },
    {
      icon: Briefcase,
      label: "Вакансии",
      href: paths.workspace.vacancies(orgSlug, workspaceSlug),
      variant: "outline" as const,
    },
  ];

  return (
    <>
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            Быстрые действия
          </CardTitle>
          <CardDescription>
            Создание вакансий, просмотр откликов и AI-ассистент
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="size-4" />
                  {action.label}
                </Link>
              </Button>
            ))}
            {isWorkspaceReady ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageSquare className="size-4" />
                AI-Ассистент
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <Button variant="outline" size="sm" disabled>
                      <MessageSquare className="size-4" />
                      AI-Ассистент
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Дождитесь загрузки пространства</TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardContent>
      </Card>

      {isWorkspaceReady && workspace?.id && (
        <UniversalChatPanel
          entityType="project"
          entityId={workspace.id}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          title="AI-Ассистент пространства"
          description="Помощник по анализу данных и рекомендациям"
          welcomeMessage="Привет! Я AI-ассистент вашего пространства. Я могу помочь с анализом откликов, рекомендациями по кандидатам, статистикой вакансий или ответить на любые вопросы о вашем проекте."
        />
      )}
    </>
  );
}
