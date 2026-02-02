import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import Button from "@qbs-autonaim/ui/button"
import {
  Brain,
  ArrowRight,
  Database,
  Users,
  FileText,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Zap,
  Search,
  Clock,
  Target,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout"

export const metadata: Metadata = {
  title: "AI-Аналитик с памятью | QBS Автонайм",
  description:
    "Умный поиск и анализ данных о кандидатах, вакансиях и аналитике. AI отвечает на вопросы на основе реальных данных вашей компании за секунды.",
  keywords: [
    "AI аналитик",
    "умный поиск по кандидатам",
    "анализ данных HR",
    "AI ассистент рекрутера",
    "поиск по базе кандидатов",
  ],
  openGraph: {
    title: "AI-Аналитик с памятью | QBS Автонайм",
    description: "AI отвечает на вопросы о кандидатах и вакансиях, используя данные вашей компании. Мгновенный анализ.",
  },
}

export default function AIAnalystPage() {
  const features = [
    {
      icon: Brain,
      title: "Понимает контекст",
      description: "AI анализирует весь контекст вопроса и учитывает историю предыдущих запросов для точных ответов.",
    },
    {
      icon: Database,
      title: "Работает с вашими данными",
      description: "Использует резюме, вакансии, метрики и внутренние документы компании — не выдуманные ответы.",
    },
    {
      icon: Search,
      title: "Мгновенный поиск",
      description: "Находит нужную информацию среди тысяч кандидатов и документов за секунды.",
    },
    {
      icon: Target,
      title: "Точные рекомендации",
      description: "Предлагает конкретные действия на основе анализа данных: кого пригласить, что улучшить.",
    },
    {
      icon: Sparkles,
      title: "Учится на данных",
      description: "Чем больше данных в системе, тем точнее и полезнее ответы AI-аналитика.",
    },
    {
      icon: Clock,
      title: "Экономит часы работы",
      description: "Вместо ручного поиска в таблицах и отчетах — получайте ответы в диалоге за 5 секунд.",
    },
  ]

  const benefits = [
    { value: "95%", label: "Точность ответов" },
    { value: "5 сек", label: "Среднее время ответа" },
    { value: "10x", label: "Быстрее ручного поиска" },
    { value: "∞", label: "Источников данных" },
  ]

  const useCases = [
    {
      title: "Для рекрутеров",
      description: "Быстро находите нужных кандидатов и их статусы без просмотра десятков резюме",
      icon: Users,
      examples: [
        "Покажи топ-5 Python разработчиков",
        "Кто из кандидатов знает React и готов к релокации?",
        "Найди резюме с опытом в fintech",
      ],
    },
    {
      title: "Для HR-менеджеров",
      description: "Получайте аналитику и insights без построения сложных отчетов",
      icon: TrendingUp,
      examples: [
        "Какая конверсия в офферы за месяц?",
        "Сколько времени в среднем занимает найм?",
        "Какие вакансии получают меньше всего откликов?",
      ],
    },
    {
      title: "Для руководителей",
      description: "Быстрые ответы на вопросы о состоянии найма и эффективности команды",
      icon: FileText,
      examples: [
        "Сколько открытых вакансий в IT?",
        "Какой бюджет затрачен на найм за квартал?",
        "Покажи эффективность источников кандидатов",
      ],
    },
  ]

  const dataSources = [
    {
      icon: Users,
      label: "База кандидатов",
      description: "Резюме, отклики, интервью, оценки",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: FileText,
      label: "Вакансии",
      description: "Описания, требования, статусы, метрики",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: TrendingUp,
      label: "Аналитика",
      description: "Конверсии, воронки, время найма, KPI",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      icon: Database,
      label: "Внутренние документы",
      description: "Политики, процессы, шаблоны, FAQ",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.015_270/0.2),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-sm mb-6">
              <Brain className="h-4 w-4 text-violet-500" />
              <span className="text-violet-500 font-medium">AI-Аналитик с памятью</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Задавайте вопросы —{" "}
              <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                получайте ответы
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              AI помнит всё о ваших кандидатах, вакансиях и процессах. Отвечает на основе реальных данных компании, а не
              шаблонов.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Посмотреть примеры
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {benefits.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-violet-500 mb-1">{stat.value}</div>
                  <div className="text-sm text-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left: Data sources */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Источники данных</h3>
                  <p className="text-sm text-foreground/60 mb-4">AI анализирует в реальном времени</p>
                </div>

                {dataSources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all"
                  >
                    <div className={`h-10 w-10 rounded-lg ${source.bgColor} flex items-center justify-center shrink-0`}>
                      <source.icon className={`h-5 w-5 ${source.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm mb-0.5">{source.label}</div>
                      <div className="text-xs text-foreground/60">{source.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Chat interface */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-muted/50 px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-violet-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">AI-Аналитик</div>
                        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Онлайн
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-6 space-y-4 bg-muted/20 max-h-[500px] overflow-y-auto">
                    {/* User question */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        <p className="text-sm">Сколько кандидатов на позицию Python Developer?</p>
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex justify-start">
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed mb-3">
                          На позицию <span className="font-semibold">Python Developer</span> в данный момент:
                        </p>
                        <div className="space-y-2 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            <span>
                              <span className="font-bold text-blue-500">87 активных кандидатов</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span>
                              <span className="font-bold text-emerald-500">23 прошли AI-скрининг</span> (Top 30%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-amber-500" />
                            <span>
                              <span className="font-bold text-amber-500">12 на этапе интервью</span>
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border text-xs text-foreground/60 flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          Источник: База кандидатов, обновлено 2 мин назад
                        </div>
                      </div>
                    </div>

                    {/* User question 2 */}
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                        <p className="text-sm">Покажи топ-3 из них по рейтингу</p>
                      </div>
                    </div>

                    {/* AI response 2 */}
                    <div className="flex justify-start">
                      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]">
                        <p className="text-sm text-foreground leading-relaxed mb-3">
                          Топ-3 кандидата на <span className="font-semibold">Python Developer</span>:
                        </p>
                        <div className="space-y-2 mb-3">
                          {[
                            { name: "Анна Петрова", score: 96, skills: "Django, FastAPI, PostgreSQL" },
                            { name: "Дмитрий Козлов", score: 94, skills: "Flask, SQLAlchemy, Redis" },
                            { name: "Елена Сидорова", score: 91, skills: "Python, Celery, Docker" },
                          ].map((candidate, i) => (
                            <div key={i} className="bg-muted rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-foreground text-sm">{candidate.name}</span>
                                <span className="text-xs font-bold text-violet-500">{candidate.score}%</span>
                              </div>
                              <div className="text-xs text-foreground/60">{candidate.skills}</div>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-border text-xs text-foreground/60 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Источник: AI-скрининг по вакансии #3421
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-border bg-background">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-muted/30">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Спросите что-угодно о кандидатах, вакансиях, аналитике..."
                        className="flex-1 bg-transparent border-none outline-none text-sm text-foreground/40"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Почему AI-Аналитик уникален</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Не просто chatbot, а умный ассистент с доступом к вашим данным
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-violet-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Для кого подходит</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Каждая роль получает свои insights из данных</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {useCases.map((useCase, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <useCase.icon className="h-7 w-7 text-violet-500" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-foreground/70 mb-4">{useCase.description}</p>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-foreground/60 uppercase tracking-wide mb-2">
                    Примеры вопросов:
                  </div>
                  {useCase.examples.map((example, j) => (
                    <div
                      key={j}
                      className="text-sm text-foreground/80 bg-muted/50 px-3 py-2 rounded-lg flex items-start gap-2"
                    >
                      <Zap className="h-3 w-3 text-violet-500 mt-0.5 shrink-0" />
                      <span className="italic">&quot;{example}&quot;</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-violet-500/10 border border-violet-500/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-violet-500 font-medium">Начните бесплатно</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы задавать вопросы вашим данным?
            </h2>

            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Подключите AI-Аналитика за 2 минуты и получите мгновенные ответы о кандидатах и вакансиях.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Посмотреть тарифы
                </Button>
              </Link>
            </div>

            <p className="text-sm text-foreground/60 mt-6">14 дней бесплатно • Без кредитной карты</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
