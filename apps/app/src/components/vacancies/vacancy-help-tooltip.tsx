"use client";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@qbs-autonaim/ui";
import { IconHelp } from "@tabler/icons-react";

interface MetricExplanation {
  title: string;
  description: string;
  goodValue: string;
  badValue: string;
}

const METRICS_HELP: Record<string, MetricExplanation> = {
  responses: {
    title: "Всего откликов",
    description:
      "Общее количество кандидатов, откликнувшихся на вакансию с момента публикации.",
    goodValue: "10+ откликов — вакансия привлекает внимание",
    badValue: "Менее 2 откликов — стоит улучшить описание или условия",
  },
  newResponses: {
    title: "Новые отклики",
    description:
      "Отклики, которые ещё не были просмотрены. Требуют вашего внимания в первую очередь.",
    goodValue: "Обрабатывайте в течение 24 часов для лучшей конверсии",
    badValue: "Задержка более 48 часов снижает шансы на найм на 30%",
  },
  inProgress: {
    title: "В обработке",
    description:
      "Кандидаты, с которыми ведётся активная работа: собеседования, тестовые задания, проверка.",
    goodValue: "30-50% от всех откликов — здоровая воронка",
    badValue: "Менее 20% — возможно, слишком строгий отбор",
  },
  conversion: {
    title: "Конверсия",
    description:
      "Процент просмотров вакансии, которые превратились в отклики. Показывает привлекательность вакансии.",
    goodValue: "5%+ — отличная конверсия, вакансия интересна",
    badValue: "Менее 2% — нужно улучшить заголовок и описание",
  },
  views: {
    title: "Просмотры",
    description:
      "Сколько раз вакансию открыли на площадке. Показывает видимость и интерес.",
    goodValue: "Растут каждый день — хорошая видимость",
    badValue: "Не растут — проверьте ключевые слова и категорию",
  },
};

interface VacancyHelpTooltipProps {
  metric: keyof typeof METRICS_HELP;
}

/**
 * Компонент с подсказками для рекрутеров
 * Объясняет значение метрик простым языком
 */
export function VacancyHelpTooltip({ metric }: VacancyHelpTooltipProps) {
  const help = METRICS_HELP[metric];

  if (!help) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-5 text-muted-foreground hover:text-foreground"
          aria-label="Справка"
        >
          <IconHelp className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">{help.title}</h4>
            <p className="text-sm text-muted-foreground">{help.description}</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2 rounded-md bg-green-50 dark:bg-green-950/20">
              <div className="size-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <p className="text-green-700 dark:text-green-400">
                {help.goodValue}
              </p>
            </div>
            <div className="flex items-start gap-2 p-2 rounded-md bg-orange-50 dark:bg-orange-950/20">
              <div className="size-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
              <p className="text-orange-700 dark:text-orange-400">
                {help.badValue}
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
