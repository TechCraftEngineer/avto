import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import Button from "@qbs-autonaim/ui/button"
import {
  Rocket,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Bot,
  BarChart3,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Для стартапов | QBS Автонайм",
  description:
    "Быстро находите таланты для роста бизнеса без больших затрат. Первый найм за 48 часов. Идеально для команд до 50 человек.",
}

export default function StartupsPage() {
  const benefits = [
    {
      icon: Zap,
      title: "Первый найм за 48 часов",
      description:
        "AI обрабатывает сотни откликов за минуты и предлагает топ-кандидатов. Не ждите недели — начните собеседования сразу.",
      stat: "48 часов",
    },
    {
      icon: TrendingUp,
      title: "До 10x дешевле рекрутера",
      description:
        "Вместо найма HR или оплаты агентства за $5000+, платите от $99/месяц и нанимайте неограниченное количество людей.",
      stat: "От $99/мес",
    },
    {
      icon: Target,
      title: "Точный поиск под культуру",
      description:
        "AI оценивает не только skills, но и соответствие вашей культуре и ценностям. Никаких случайных людей в команде.",
      stat: "95% retention",
    },
    {
      icon: TrendingUp,
      title: "Масштабируйтесь без боли",
      description:
        "Нужно нанять 5 человек за месяц? Или 50? Система справится с любым объёмом без увеличения вашей HR-команды.",
      stat: "∞ вакансий",
    },
  ]

  const features = [
    {
      icon: Bot,
      title: "AI-скрининг 24/7",
      description: "Обработка откликов даже когда вы спите или работаете над продуктом",
    },
    {
      icon: Sparkles,
      title: "Генератор вакансий",
      description: "Создавайте привлекательные job posts за 2 минуты",
    },
    {
      icon: Users,
      title: "Multi-platform поиск",
      description: "LinkedIn, HH.ru, Indeed, AngelList — всё в одном месте",
    },
    {
      icon: Clock,
      title: "Быстрые интервью",
      description: "Автопланирование встреч с топ-кандидатами",
    },
    {
      icon: BarChart3,
      title: "Аналитика найма",
      description: "Следите за воронкой и конверсией источников",
    },
    {
      icon: CheckCircle2,
      title: "Простая интеграция",
      description: "Подключение за 2 минуты без технических навыков",
    },
  ]

  const useCases = [
    {
      title: "Первые найма (0→10 человек)",
      description:
        "Вы только запустились и нужно быстро собрать команду. Нет времени на HR-процессы и бюджета на агентства. QBS помогает найти первых инженеров, маркетологов и сейлзов за дни, а не месяцы.",
      challenge: "Нет опыта найма и бюджета на HR",
      solution: "AI берёт на себя скрининг и оценку кандидатов",
      result: "Команда из 8 человек собрана за 1 месяц",
    },
    {
      title: "Быстрое масштабирование (10→50)",
      description:
        "Получили раунд финансирования и нужно расти. QBS обрабатывает сотни откликов одновременно и помогает закрыть 10+ вакансий параллельно без найма целого HR-отдела.",
      challenge: "Нужно нанять много людей очень быстро",
      solution: "Массовый AI-скрининг и приоритизация",
      result: "30 новых сотрудников за 2 месяца",
    },
    {
      title: "Поиск уникальных талантов",
      description:
        "Нужен full-stack с опытом AI или дизайнер со знанием code. Редкие специалисты сложно найти. AI сканирует тысячи профилей на разных платформах и находит идеальных кандидатов.",
      challenge: "Редкие специалисты не откликаются на обычные вакансии",
      solution: "AI-поиск по всем платформам + персонализированные оффера",
      result: "Нашли senior AI engineer за 1 неделю",
    },
  ]

  const testimonial = {
    quote:
      "Мы запустили стартап втроём и за 2 месяца выросли до 15 человек благодаря QBS. Раньше на просмотр резюме уходили вечера — теперь AI делает это за нас. Фокусируемся на продукте, а не на рекрутинге. Лучшее решение для ранних стартапов!",
    author: "Дмитрий Ковалёв",
    role: "CEO & Co-founder",
    company: "TechStartup (серия A, $2M)",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.7_0.15_190/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-sm mb-6">
              <Rocket className="h-4 w-4 text-cyan-600" />
              <span className="text-cyan-600 font-medium">Для стартапов</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Соберите команду мечты за{" "}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">48 часов</span>
              , а не месяцев
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Стартапам нужна скорость. QBS использует AI для мгновенного скрининга кандидатов, чтобы вы могли расти
              быстрее конкурентов. От $99/месяц — дешевле одного кофе в день.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Посмотреть демо
                </a>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { value: "48 ч", label: "до первого найма" },
                { value: "10x", label: "дешевле рекрутера" },
                { value: "$99", label: "стартовый тариф" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-600 mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Почему стартапы выбирают QBS</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Быстрый рост без больших затрат на HR</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-cyan-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <span className="text-sm font-semibold text-cyan-600 bg-cyan-500/10 px-2 py-1 rounded-full">
                        {benefit.stat}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Всё необходимое для быстрого найма</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Инструменты enterprise-уровня по цене для стартапов
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 border border-cyan-500/20 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                ДК
              </div>
              <div>
                <div className="font-semibold text-foreground">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.role}, {testimonial.company}
                </div>
              </div>
            </div>
            <p className="text-lg text-foreground leading-relaxed italic">&ldquo;{testimonial.quote}&rdquo;</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Готовы собрать команду мечты?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Подключите QBS за 2 минуты и сделайте первый найм за 48 часов
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Начать бесплатно (14 дней)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Тарифы для стартапов
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Бесплатно для команд до 10 человек • Без кредитной карты
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
