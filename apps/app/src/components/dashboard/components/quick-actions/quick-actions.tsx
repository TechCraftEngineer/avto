"use client";

import { paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { Card, CardContent } from "@qbs-autonaim/ui/components/card";
import { Briefcase, MessageSquare, Plus, Users } from "lucide-react";
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                asChild
              >
                <Link href={action.href}>
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Link>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isWorkspaceReady) {
                  setIsChatOpen(true);
                }
              }}
              disabled={!isWorkspaceReady}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              AI-Ассистент
            </Button>
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
