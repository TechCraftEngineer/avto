"use client";

import { UniversalChatPanel } from "~/components/chat";

interface VacancyAIChatPanelProps {
  vacancyId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * VacancyAIChatPanel - AI chat panel for vacancy candidate analysis
 * Обертка над универсальным компонентом UniversalChatPanel
 */
export function VacancyAIChatPanel({
  vacancyId,
  isOpen,
  onClose,
}: VacancyAIChatPanelProps) {
  return (
    <UniversalChatPanel
      entityType="vacancy"
      entityId={vacancyId}
      isOpen={isOpen}
      onClose={onClose}
      title="AI Помощник по кандидатам"
      description="Задавайте вопросы о кандидатах и получайте аналитику"
      welcomeMessage="Я помогу вам проанализировать кандидатов на эту вакансию. Задавайте вопросы о кандидатах, их опыте, навыках и ожиданиях."
    />
  );
}
