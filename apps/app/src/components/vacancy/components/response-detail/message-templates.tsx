"use client";

import { Badge } from "@qbs-autonaim/ui/badge";
import { Button } from "@qbs-autonaim/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/card";
import { Textarea } from "@qbs-autonaim/ui/textarea";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { VacancyResponse } from "./types";

interface MessageTemplatesProps {
  response: VacancyResponse;
  onSendMessage?: (message: string) => void;
}

interface MessageTemplate {
  id: string;
  category: "initial" | "interview" | "offer" | "rejection" | "followup";
  title: string;
  content: string;
  variables: string[];
  icon: React.ElementType;
  color: string;
}

export function MessageTemplates({
  response,
  onSendMessage,
}: MessageTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  const templates: MessageTemplate[] = [
    {
      id: "welcome",
      category: "initial",
      title: "Приветствие и первичная оценка",
      content: `Здравствуйте, {{candidateName}}!

Спасибо за отклик на вакансию "{{vacancyTitle}}". Мы изучили ваше резюме и заинтересованы в вашем опыте работы.

Расскажите, пожалуйста:
• Почему вас заинтересовала эта вакансия?
• Какой ваш текущий уровень зарплатных ожиданий?
• Когда вы сможете приступить к работе?

Будем рады обсудить детали и ответить на ваши вопросы.`,
      variables: ["candidateName", "vacancyTitle"],
      icon: MessageSquare,
      color: "text-blue-600",
    },
    {
      id: "interview_invitation",
      category: "interview",
      title: "Приглашение на собеседование",
      content: `Здравствуйте, {{candidateName}}!

Мы будем рады пригласить вас на собеседование по вакансии "{{vacancyTitle}}".

Предлагаемое время: {{interviewDate}} в {{interviewTime}}
Формат: {{interviewFormat}} ({{interviewLocation}})

Подготовьтесь рассказать о:
• Вашем опыте работы над подобными проектами
• Технических навыках и инструментах
• Ожиданиях от новой позиции

Если предложенное время не подходит, дайте знать - подберем альтернативу.`,
      variables: [
        "candidateName",
        "vacancyTitle",
        "interviewDate",
        "interviewTime",
        "interviewFormat",
        "interviewLocation",
      ],
      icon: Calendar,
      color: "text-purple-600",
    },
    {
      id: "technical_test",
      category: "interview",
      title: "Техническое задание",
      content: `Здравствуйте, {{candidateName}}!

Для оценки ваших технических навыков подготовили небольшое задание. Оно займет около {{timeEstimate}} и поможет нам лучше понять ваш уровень подготовки.

Задание: {{taskDescription}}

Результаты можно прислать в виде:
• Ссылки на репозиторий
• Архива с кодом
• Документа с описанием решения

Срок выполнения: {{deadline}}

Если есть вопросы - спрашивайте!`,
      variables: [
        "candidateName",
        "timeEstimate",
        "taskDescription",
        "deadline",
      ],
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      id: "offer",
      category: "offer",
      title: "Предложение о работе",
      content: `Здравствуйте, {{candidateName}}!

Поздравляем! Мы будем рады предложить вам позицию "{{vacancyTitle}}".

Условия:
• Заработная плата: {{salary}} ₽
• Формат работы: {{workFormat}}
• Дата начала работы: {{startDate}}

Ваши обязанности будут включать {{responsibilities}}.

Будем рады обсудить детали и ответить на вопросы. Когда сможете дать ответ?`,
      variables: [
        "candidateName",
        "vacancyTitle",
        "salary",
        "workFormat",
        "startDate",
        "responsibilities",
      ],
      icon: Star,
      color: "text-yellow-600",
    },
    {
      id: "rejection",
      category: "rejection",
      title: "Отказ с возможностью повторного рассмотрения",
      content: `Здравствуйте, {{candidateName}}!

Спасибо за участие в отборе на вакансию "{{vacancyTitle}}". К сожалению, на данном этапе мы приняли решение в пользу другого кандидата.

Ваше резюме нас заинтересовало, и мы будем рады рассмотреть вашу кандидатуру на другие подходящие вакансии.

Если у вас есть вопросы или пожелания - пишите.

Удачи в поиске работы!`,
      variables: ["candidateName", "vacancyTitle"],
      icon: Clock,
      color: "text-red-600",
    },
    {
      id: "followup",
      category: "followup",
      title: "Напоминание о вакансии",
      content: `Здравствуйте, {{candidateName}}!

Пишу напомнить о вакансии "{{vacancyTitle}}", на которую вы откликнулись.

Мы все еще ищем подходящего кандидата и будем рады обсудить вашу кандидатуру подробнее.

Расскажите, пожалуйста, о вашем текущем статусе поиска работы и готовности рассмотреть наши условия.

Ждем вашего ответа!`,
      variables: ["candidateName", "vacancyTitle"],
      icon: Mail,
      color: "text-orange-600",
    },
  ];

  const replaceVariables = (template: MessageTemplate): string => {
    let content = template.content;

    // Заменяем переменные на реальные значения
    const variableMap = {
      candidateName: response.candidateName || "Кандидат",
      vacancyTitle: "Вакансия", // В будущем можно передавать название вакансии
      interviewDate: "15 февраля",
      interviewTime: "14:00",
      interviewFormat: "онлайн",
      interviewLocation: "Zoom",
      timeEstimate: "2-3 часа",
      taskDescription: "Создать простое React приложение",
      deadline: "3 дня",
      salary: "200 000",
      workFormat: "гибридный",
      startDate: "1 марта",
      responsibilities: "разработку веб-приложений",
    };

    template.variables.forEach((variable) => {
      const regex = new RegExp(`{{${variable}}}`, "g");
      content = content.replace(
        regex,
        variableMap[variable as keyof typeof variableMap] || `[${variable}]`,
      );
    });

    return content;
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    const message = replaceVariables(template);
    setCustomMessage(message);
    setSelectedTemplate(template.id);
  };

  const handleSendMessage = () => {
    if (customMessage.trim() && onSendMessage) {
      onSendMessage(customMessage);
      setCustomMessage("");
      setSelectedTemplate(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Можно добавить toast уведомление
  };

  const categories = [
    {
      id: "initial",
      label: "Первичный контакт",
      count: templates.filter((t) => t.category === "initial").length,
    },
    {
      id: "interview",
      label: "Собеседование",
      count: templates.filter((t) => t.category === "interview").length,
    },
    {
      id: "offer",
      label: "Предложение",
      count: templates.filter((t) => t.category === "offer").length,
    },
    {
      id: "rejection",
      label: "Отказ",
      count: templates.filter((t) => t.category === "rejection").length,
    },
    {
      id: "followup",
      label: "Повторный контакт",
      count: templates.filter((t) => t.category === "followup").length,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Шаблоны сообщений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Категории шаблонов */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
            >
              {category.label} ({category.count})
            </Badge>
          ))}
        </div>

        {/* Список шаблонов */}
        <div className="grid gap-3">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className={`h-5 w-5 mt-0.5 ${template.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(replaceVariables(template))
                      }
                      className="h-7 w-7 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="h-7 text-xs"
                    >
                      Использовать
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Редактор сообщения */}
        {selectedTemplate && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm">Редактировать сообщение</h4>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={8}
              placeholder="Отредактируйте сообщение перед отправкой..."
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={!customMessage.trim()}
              >
                Отправить сообщение
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setCustomMessage("");
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
