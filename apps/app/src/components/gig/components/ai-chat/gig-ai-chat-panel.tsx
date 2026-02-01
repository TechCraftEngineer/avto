"use client";

import { UniversalChatPanel } from "~/components/chat";

interface GigAIChatPanelProps {
  gigId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * GigAIChatPanel - AI chat panel for gig candidate analysis
 * Обертка над универсальным компонентом UniversalChatPanel
 */
export function GigAIChatPanel({
  gigId,
  isOpen,
  onClose,
}: GigAIChatPanelProps) {
  return (
    <UniversalChatPanel
      entityType="gig"
      entityId={gigId}
      isOpen={isOpen}
      onClose={onClose}
      title="AI Помощник по кандидатам"
      description="Задавайте вопросы о кандидатах и получайте аналитику"
      welcomeMessage="Я помогу вам проанализировать кандидатов на это задание. Задавайте вопросы о кандидатах, их навыках, опыте и ценах."
    />
  );
}
