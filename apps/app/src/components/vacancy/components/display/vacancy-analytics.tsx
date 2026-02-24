import { Badge } from "@qbs-autonaim/ui/components/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@qbs-autonaim/ui/components/empty";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface VacancyAnalyticsProps {
  totalResponses: number;
  processedResponses: number;
  highScoreResponses: number;
  topScoreResponses: number;
  avgScore: number;
}

interface VacancyRequirementsData {
  summary?: string;
  job_title?: string;
  languages?: Array<string | { language: string; level: string }>;
  tech_stack?: string[];
  location_type?: string;
  experience_years?: {
    min?: number;
    max?: number;
    description?: string;
  };
  nice_to_have_skills?: string[];
  keywords_for_matching?: string[];
  mandatory_requirements?: string[];
}

interface VacancyRequirementsProps {
  requirements: unknown;
}

export function VacancyAnalytics({
  totalResponses,
  processedResponses,
  highScoreResponses,
  topScoreResponses,
  avgScore,
}: VacancyAnalyticsProps) {
  const processedPercentage =
    totalResponses > 0
      ? Math.round((processedResponses / totalResponses) * 100)
      : 0;

  const highScorePercentage =
    processedResponses > 0
      ? Math.round((highScoreResponses / processedResponses) * 100)
      : 0;

  const topScorePercentage =
    processedResponses > 0
      ? Math.round((topScoreResponses / processedResponses) * 100)
      : 0;

  const isGrowingProcessed = processedPercentage >= 50;
  const isGrowingHighScore = highScorePercentage >= 30;
  const isGrowingTopScore = topScorePercentage >= 15;
  const isGoodAvgScore = avgScore >= 3.0;

  // Если нет откликов вообще - показываем красивое пустое состояние
  if (totalResponses === 0) {
    return (
      <Card className="@container/card">
        <CardContent className="py-12">
          <Empty className="border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconTrendingUp className="size-6" />
              </EmptyMedia>
              <EmptyTitle>Аналитика появится после первых откликов</EmptyTitle>
              <EmptyDescription>
                Здесь будет отображаться статистика по обработке откликов,
                скорингу кандидатов и средним баллам. Данные обновляются
                автоматически после обработки откликов AI-системой
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Обработано откликов</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {processedResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant={isGrowingProcessed ? "success" : "warning"}
              className="gap-1"
            >
              {isGrowingProcessed ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {processedPercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingProcessed ? "Хороший прогресс" : "Требует обработки"}
            {isGrowingProcessed ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            из {totalResponses} всего откликов
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Скоринг ≥ 3</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {highScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant={isGrowingHighScore ? "success" : "warning"}
              className="gap-1"
            >
              {isGrowingHighScore ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {highScorePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingHighScore ? "Качественные кандидаты" : "Мало подходящих"}
            {isGrowingHighScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">от обработанных откликов</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Скоринг ≥ 4</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {topScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant={isGrowingTopScore ? "success" : "warning"}
              className="gap-1"
            >
              {isGrowingTopScore ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {topScorePercentage}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGrowingTopScore ? "Отличные результаты" : "Нужно больше"}
            {isGrowingTopScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            топовые кандидаты для интервью
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Средний балл</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {processedResponses > 0 ? avgScore.toFixed(1) : "—"}
          </CardTitle>
          <CardAction>
            <Badge
              variant={isGoodAvgScore ? "success" : "warning"}
              className="gap-1"
            >
              {isGoodAvgScore ? (
                <IconTrendingUp className="size-4" />
              ) : (
                <IconTrendingDown className="size-4" />
              )}
              {processedResponses > 0 ? "из 5.0" : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isGoodAvgScore ? "Качество выше среднего" : "Требует улучшения"}
            {isGoodAvgScore ? (
              <IconTrendingUp className="size-4" />
            ) : (
              <IconTrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">общая оценка кандидатов</div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function VacancyRequirements({
  requirements,
}: VacancyRequirementsProps) {
  if (!requirements) {
    return null;
  }

  const data = requirements as VacancyRequirementsData;

  // Проверяем, есть ли хоть какие-то данные
  const hasAnyData =
    data.summary ||
    data.job_title ||
    (data.languages && data.languages.length > 0) ||
    (data.tech_stack && data.tech_stack.length > 0) ||
    data.location_type ||
    data.experience_years ||
    (data.nice_to_have_skills && data.nice_to_have_skills.length > 0) ||
    (data.keywords_for_matching && data.keywords_for_matching.length > 0) ||
    (data.mandatory_requirements && data.mandatory_requirements.length > 0);

  if (!hasAnyData) {
    return (
      <Card className="@container/card">
        <CardContent className="py-8">
          <Empty className="border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Badge variant="secondary" className="text-sm">
                  AI
                </Badge>
              </EmptyMedia>
              <EmptyTitle>Требования не сгенерированы</EmptyTitle>
              <EmptyDescription>
                AI-анализ требований к вакансии будет доступен после обработки
                описания вакансии. Система автоматически извлечет ключевые
                требования, технологии и навыки
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Сгенерированные требования</CardTitle>
        <Badge variant="secondary">AI Анализ</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.summary && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Краткое описание
            </p>
            <p className="text-sm leading-relaxed">{data.summary}</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {data.job_title && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Должность
              </p>
              <p className="text-sm font-medium">{data.job_title}</p>
            </div>
          )}

          {data.location_type && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Формат работы
              </p>
              <p className="text-sm font-medium">{data.location_type}</p>
            </div>
          )}

          {data.experience_years && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Опыт работы
              </p>
              <p className="text-sm font-medium">
                {data.experience_years.description ||
                  `${data.experience_years.min}${data.experience_years.max ? `-${data.experience_years.max}` : "+"} лет`}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {data.mandatory_requirements &&
            data.mandatory_requirements.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Обязательные требования
                </p>
                <div className="grid gap-2">
                  {data.mandatory_requirements.map((req, i) => (
                    <div
                      key={`req-${i}-${req.slice(0, 20)}`}
                      className="flex gap-3 rounded-lg border p-3 text-sm items-start"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground leading-relaxed">
                        {req}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {data.tech_stack && data.tech_stack.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                Технологический стек
              </p>
              <div className="flex flex-wrap gap-2">
                {data.tech_stack.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.nice_to_have_skills && data.nice_to_have_skills.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                Будет плюсом
              </p>
              <ul className="grid gap-2">
                {data.nice_to_have_skills.map((skill, i) => (
                  <li
                    key={`skill-${i}-${skill.slice(0, 20)}`}
                    className="flex gap-3 rounded-lg border border-dashed p-3 text-sm items-start"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                    <span className="text-muted-foreground leading-relaxed">
                      {skill}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {data.languages && data.languages.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Языки
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.languages.map((lang, index) => {
                    const label =
                      typeof lang === "string"
                        ? lang
                        : `${lang.language}${lang.level ? ` (${lang.level})` : ""}`;
                    return (
                      <Badge key={`lang-${index}-${label}`} variant="outline">
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {data.keywords_for_matching &&
              data.keywords_for_matching.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ключевые слова
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords_for_matching.map((keyword, i) => (
                      <Badge
                        key={`keyword-${i}-${keyword}`}
                        variant="outline"
                        className="text-[10px]"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
