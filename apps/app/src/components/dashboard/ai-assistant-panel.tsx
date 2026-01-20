"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import { Bot, MessageSquare, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { useWorkspace } from "~/hooks/use-workspace";
import { UniversalChatPanel } from "../chat/universal-chat-panel";

interface AIAssistantPanelProps {
  orgSlug: string;
  workspaceSlug: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AIAssistantPanel({
  orgSlug: _orgSlug,
  workspaceSlug: _workspaceSlug,
}: AIAssistantPanelProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { workspace } = useWorkspace();
  const isWorkspaceReady = Boolean(workspace?.id);

  const quickActions = [
    {
      icon: Users,
      label: "Анализ кандидатов",
      description: "Рекомендации по откликам",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: TrendingUp,
      label: "Статистика вакансий",
      description: "Анализ эффективности",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: MessageSquare,
      label: "Вопросы",
      description: "Ответы на любые вопросы",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  return (
    <>
      <Card className="@container/card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI-Ассистент
          </CardTitle>
          <CardDescription>
            Помощник по анализу данных и рекомендациям
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">
              Я могу помочь с анализом откликов, рекомендациями по кандидатам
              или ответами на вопросы о вашем проекте
            </div>

            <div className="grid gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    if (isWorkspaceReady) {
                      setIsChatOpen(true);
                    }
                  }}
                  disabled={!isWorkspaceReady}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isWorkspaceReady
                      ? `hover:bg-muted/50 ${action.bgColor}`
                      : "opacity-50 cursor-not-allowed bg-muted/20"
                  }`}
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => {
                if (isWorkspaceReady) {
                  setIsChatOpen(true);
                }
              }}
              disabled={!isWorkspaceReady}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Задать вопрос
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
          title="AI-Ассистент воркспейса"
          description="Помощник по анализу данных и рекомендациям"
          welcomeMessage="Привет! Я AI-ассистент вашего воркспейса. Я могу помочь с анализом откликов, рекомендациями по кандидатам, статистикой вакансий или ответить на любые вопросы о вашем проекте."
        />
      )}
    </>
  );
}
