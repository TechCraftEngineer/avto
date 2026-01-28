import {
  Badge,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
} from "@qbs-autonaim/ui";
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
      <Card className="border-dashed">
        <CardHeader className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-6">
                <IconTrendingUp className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-xl mb-2">
            Аналитика появится после первых откликов
          </CardTitle>
          <CardDescription className="text-base max-w-md mx-auto">
            Здесь будет отображаться статистика по обработке откликов, скорингу
            кандидатов и средним баллам. Данные обновляются автоматически после
            обработки откликов AI-системой
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Обработано откликов</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {processedResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                isGrowingProcessed
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
              )}
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {highScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                isGrowingHighScore
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
              )}
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {topScoreResponses}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                isGrowingTopScore
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
              )}
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
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {processedResponses > 0 ? avgScore.toFixed(1) : "—"}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className={cn(
                isGoodAvgScore
                  ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400",
              )}
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
      <div className="rounded-xl border border-dashed bg-card/50 backdrop-blur-sm p-6 shadow-md">
        <div className="text-center py-8 space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-6">
                <Badge className="h-12 w-12 flex items-center justify-center text-lg">
                  AI
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Требования не сгенерированы
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              AI-анализ требований к вакансии будет доступен после обработки
              описания вакансии. Система автоматически извлечет ключевые
              требования, технологии и навыки
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-md space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-xl font-bold tracking-tight">
          Сгенерированные требования
        </h2>
        <Badge
          variant="outline"
          className="bg-primary/5 text-primary border-primary/20"
        >
          AI Анализ
        </Badge>
      </div>

      {data.summary && (
        <div className="rounded-lg border bg-muted/30 p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
            Краткое описание
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">
            {data.summary}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {data.job_title && (
          <div className="rounded-lg border bg-background/50 p-4 transition-colors hover:bg-background/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
              Должность
            </h3>
            <p className="text-sm font-semibold">{data.job_title}</p>
          </div>
        )}

        {data.location_type && (
          <div className="rounded-lg border bg-background/50 p-4 transition-colors hover:bg-background/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
              Формат работы
            </h3>
            <p className="text-sm font-semibold">{data.location_type}</p>
          </div>
        )}

        {data.experience_years && (
          <div className="rounded-lg border bg-background/50 p-4 transition-colors hover:bg-background/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 mb-1.5">
              Опыт работы
            </h3>
            <p className="text-sm font-semibold">
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary" />
                Обязательные требования
              </h3>
              <div className="grid gap-2">
                {data.mandatory_requirements.map((req, i) => (
                  <div
                    key={`req-${i}-${req.slice(0, 20)}`}
                    className="flex gap-3 p-3 rounded-md border bg-background/40 text-sm items-start"
                  >
                    <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="text-muted-foreground leading-relaxed italic">
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {data.tech_stack && data.tech_stack.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary" />
              Технологический стек
            </h3>
            <div className="flex flex-wrap gap-2 p-4 rounded-lg border bg-background/40">
              {data.tech_stack.map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="bg-primary/10 text-primary border-primary/10 hover:bg-primary/20"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.nice_to_have_skills && data.nice_to_have_skills.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary" />
              Будет плюсом
            </h3>
            <ul className="grid gap-2">
              {data.nice_to_have_skills.map((skill, i) => (
                <li
                  key={`skill-${i}-${skill.slice(0, 20)}`}
                  className="group flex gap-3 p-3 rounded-md border border-dashed bg-background/20 text-sm items-start hover:border-primary/50 transition-colors"
                >
                  <div className="size-1.5 rounded-full bg-muted-foreground/30 mt-2 group-hover:bg-primary/50" />
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                Языки
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.languages.map((lang, index) => {
                  const label =
                    typeof lang === "string"
                      ? lang
                      : `${lang.language}${lang.level ? ` (${lang.level})` : ""}`;
                  return (
                    <Badge
                      key={`lang-${index}-${label}`}
                      variant="outline"
                      className="bg-background"
                    >
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                  Ключевые слова
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.keywords_for_matching.map((keyword, i) => (
                    <Badge
                      key={`keyword-${i}-${keyword}`}
                      variant="outline"
                      className="bg-background text-[10px]"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
