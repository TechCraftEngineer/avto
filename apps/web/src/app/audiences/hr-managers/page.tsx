import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import Button from "@qbs-autonaim/ui/button"
import {
  Clock,
  ArrowRight,
  Target,
  TrendingDown,
  Users,
  CheckCircle2,
  BarChart3,
  Calendar,
  FileCheck,
  Sparkles,
  Bot,
} from "lucide-react"
import Link from "next/link"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Для HR-менеджеров | QBS Автонайм",
  description:
    "Автоматизируйте рутинные задачи найма и сфокусируйтесь на стратегических решениях. Экономьте 20+ часов в неделю на первичном отборе.",
}

export default function HRManagersPage() {
  const benefits = [
    {
      icon: Clock,
      title: "Экономия 20+ часов в неделю",
      description:
        "AI берёт на себя первичный скрининг резюме, оценку откликов и составление вакансий. Вы фокусируетесь на собеседованиях.",
      stat: "20+ часов",
    },
    {
      icon: Target,
      title: "Повышение качества найма",
      description:
        "AI оценивает кандидатов по 50+ параметрам без предвзятости, выявляя талантливых специалистов, которых можно упустить.",
      stat: "97% точность",
    },
    {
      icon: TrendingDown,
      title: "Снижение стресса",
      description:
        "Забудьте о тысячах нерелевантных откликов. Система фильтрует и приоритизирует кандидатов автоматически.",
      stat: "85% меньше рутины",
    },
    {
      icon: BarChart3,
      title: "Прозрачная аналитика",
      description: "Следите за воронкой найма в реальном времени. Принимайте решения на основе данных, а не интуиции.",
      stat: "Реал-тайм данные",
    },
  ]

  const features = [
    {
      icon: Bot,
      title: "AI-скрининг резюме",
      description: "Автоматическая оценка и ранжирование кандидатов по релевантности",
    },
    {
      icon: Sparkles,
      title: "Генерация вакансий",
      description: "AI создаёт привлекательные описания должностей за минуты",
    },
    {
      icon: Users,
      title: "Воронка кандидатов",
      description: "Визуализация этапов найма и статусов каждого кандидата",
    },
    {
      icon: Calendar,
      title: "Автопланирование интервью",
      description: "Синхронизация с календарём и автоматическая отправка приглашений",
    },
    {
      icon: FileCheck,
      title: "Шаблоны коммуникаций",
      description: "Готовые письма для отказов, приглашений и follow-up",
    },
    {
      icon: CheckCircle2,
      title: "Интеграции с ATS",
      description: "Подключение к HH.ru, LinkedIn, Indeed и другим платформам",
    },
  ]

  const useCases = [
    {
      title: "Массовый набор",
      description:
        "Вы открыли 10 вакансий и получаете 500+ откликов в неделю. AI обрабатывает все резюме за минуты и предлагает топ-20 кандидатов для каждой позиции.",
      challenge: "Физически невозможно просмотреть все отклики",
      solution: "AI обрабатывает 1000+ резюме за час",
      result: "Сокращение времени найма с 45 до 12 дней",
    },
    {
      title: "Поиск редких специалистов",
      description:
        "Нужен senior DevOps с опытом Kubernetes и AWS. AI анализирует сотни профилей на разных платформах и находит идеальных кандидатов, даже если они не подали отклик.",
      challenge: "Сложно найти специалистов с уникальным набором навыков",
      solution: "AI сканирует все источники и оценивает по 50+ критериям",
      result: "Расширение воронки кандидатов на 300%",
    },
    {
      title: "Оптимизация процессов",
      description:
        "Руководство просит отчёты по найму, но вы тратите время на таблицы вместо работы с кандидатами. QBS автоматически собирает аналитику и генерирует отчёты.",
      challenge: "Много времени на админ-работу и отчётность",
      solution: "Автоматические дашборды и еженедельные отчёты",
      result: "Освобождение 15 часов в неделю для стратегических задач",
    },
  ]

  const testimonial = {
    quote:
      "QBS изменил мой подход к найму. Раньше я тратила целые дни на просмотр резюме. Теперь AI делает это за минуты, а я фокусируюсь на собеседованиях и выборе лучших кандидатов. Время закрытия вакансий сократилось вдвое!",
    author: "Екатерина Смирнова",
    role: "HR-менеджер",
    company: "TechCorp (150+ сотрудников)",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.7_0.15_240/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm mb-6">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 font-medium">Для HR-менеджеров</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Автоматизируйте найм и{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                освободите 20+ часов
              </span>{" "}
              в неделю
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Перестаньте тратить время на рутинный скрининг резюме. AI обработает отклики, оценит кандидатов и
              предложит топ-20 для собеседований. Вы фокусируетесь на стратегических решениях.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Попробовать бесплатно
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
                { value: "20+", label: "часов экономии в неделю" },
                { value: "85%", label: "меньше рутинной работы" },
                { value: "2x", label: "быстрее закрытие вакансий" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">{stat.value}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ваши преимущества с QBS</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Меньше рутины, больше времени на важные задачи
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-blue-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <span className="text-sm font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-full">
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Инструменты для вашей работы</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Всё необходимое для эффективного найма в одной платформе
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Типичные задачи HR-менеджеров</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Как QBS помогает решать реальные проблемы найма
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {useCases.map((useCase, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 md:p-8">
                <h3 className="text-xl font-semibold text-foreground mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{useCase.description}</p>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <div className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">Проблема</div>
                    <p className="text-sm text-foreground">{useCase.challenge}</p>
                  </div>
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-4">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Решение</div>
                    <p className="text-sm text-foreground">{useCase.solution}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-4">
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-2">
                      Результат
                    </div>
                    <p className="text-sm text-foreground">{useCase.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10 border border-blue-500/20 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-semibold text-xl">
                ЕС
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Начните экономить время уже сегодня</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Подключите QBS за 2 минуты и получите первых оценённых кандидатов через 5 минут
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Попробовать 14 дней бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Посмотреть тарифы
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">Без кредитной карты • Отмена в любое время</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
