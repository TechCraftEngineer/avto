import { Brain, MessageSquare, Sparkles } from "lucide-react";
import { sanitizeHtmlFunction } from "~/lib/sanitize-html";

const features = [
  {
    icon: MessageSquare,
    title: "Умные интервью",
    description:
      "Проводите интеллектуальные интервью с&nbsp;ИИ, который адаптируется к&nbsp;ответам и&nbsp;задаёт релевантные уточняющие вопросы.",
  },
  {
    icon: Sparkles,
    title: "Мгновенная аналитика",
    description:
      "Получайте детальные инсайты и&nbsp;анализ ответов с&nbsp;помощью мощной аналитики на&nbsp;основе ИИ.",
  },
  {
    icon: Brain,
    title: "Адаптивный подход",
    description:
      "ИИ автоматически подстраивается под контекст беседы, обеспечивая естественный и&nbsp;продуктивный диалог.",
  },
];

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Всё необходимое для интервью
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Мощные инструменты для проведения, анализа и&nbsp;работы
          с&nbsp;интервью
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group relative rounded-lg border bg-card p-8 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <feature.icon className="size-6" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-card-foreground">
              {feature.title}
            </h3>
            <p
              className="mt-2 text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtmlFunction(feature.description),
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
