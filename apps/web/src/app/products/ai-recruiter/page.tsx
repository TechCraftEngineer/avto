import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import { Button } from "@qbs-autonaim/ui"
import {
  Bot,
  ArrowRight,
  Brain,
  Zap,
  Target,
  Users,
  BarChart3,
  Shield,
  Clock,
  TrendingUp,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout" // Import ProductNavigation component
import { env } from "@/env"

export const metadata: Metadata = {
  title: "AI-Рекрутер | QBS Автонайм",
  description:
    "Автоматический анализ откликов и скоринг кандидатов с помощью AI. Экономьте до 85% времени на первичном отборе резюме.",
  keywords: [
    "AI рекрутер",
    "автоматический скрининг кандидатов",
    "анализ резюме",
    "подбор персонала",
    "HR автоматизация",
  ],
  openGraph: {
    title: "AI-Рекрутер | QBS Автонайм",
    description: "Автоматический скрининг кандидатов с точностью 97%. Экономьте до 85% времени на отборе.",
  },
}

export default function AIRecruiterPage() {
  const features = [
    {
      icon: Brain,
      title: "Умный AI-скрининг",
      description:
        "Анализ резюме по 50+ параметрам с точностью 97%. AI оценивает опыт, навыки и соответствие вакансии.",
    },
    {
      icon: Zap,
      title: "Мгновенная обработка",
      description: "Обработка 1000+ откликов за минуты вместо дней. Автоматическая сортировка по релевантности.",
    },
    {
      icon: Target,
      title: "Точный скоринг",
      description: "Каждый кандидат получает рейтинг от 0 до 100 на основе соответствия требованиям вакансии.",
    },
    {
      icon: Shield,
      title: "Без предвзятости",
      description: "AI оценивает только профессиональные качества, исключая человеческую субъективность.",
    },
    {
      icon: Clock,
      title: "24/7 работа",
      description: "Система работает круглосуточно, обрабатывая отклики даже когда вы спите.",
    },
    {
      icon: TrendingUp,
      title: "Самообучение",
      description: "AI учится на ваших решениях и со временем становится точнее в оценке кандидатов.",
    },
  ]

  const benefits = [
    { value: "85%", label: "Экономия времени на скрининге" },
    { value: "97%", label: "Точность AI-оценки" },
    { value: "10x", label: "Быстрее обработка откликов" },
    { value: "50+", label: "Параметров анализа" },
  ]

  const useCases = [
    {
      title: "Массовый подбор",
      description: "Идеально для компаний, получающих сотни откликов на популярные вакансии.",
      icon: Users,
    },
    {
      title: "Точечный поиск",
      description: "Находите редких специалистов среди большого потока резюме.",
      icon: Target,
    },
    {
      title: "Аналитика найма",
      description: "Получайте insights о качестве откликов и эффективности источников.",
      icon: BarChart3,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.02_265/0.4),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm mb-6">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">AI-Рекрутер</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Автоматический скрининг кандидатов с{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                точностью 97%
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              AI анализирует резюме по 50+ параметрам и выставляет рейтинг соответствия за секунды. Экономьте до 85%
              времени на первичном отборе.
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {benefits.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">QBS Dashboard — AI-скрининг</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Candidate Card */}
                <div className="rounded-xl border border-border bg-background p-5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                      АИ
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">Алексей Иванов</h4>
                      <p className="text-sm text-muted-foreground">Python Developer, 8 лет опыта</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                          Релевантен
                        </span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Top 5%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Соответствие вакансии", value: 95, color: "bg-emerald-500" },
                      { label: "Профессиональные навыки", value: 92, color: "bg-primary" },
                      { label: "Личные качества", value: 88, color: "bg-accent" },
                    ].map((skill, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{skill.label}</span>
                          <span className="font-semibold text-foreground">{skill.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${skill.color} rounded-full`} style={{ width: `${skill.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-background p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">AI-рекомендация</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Отличный кандидат с сильным опытом в бэкенд-разработке на Python. Опыт работы с Django, FastAPI и
                      PostgreSQL соответствует требованиям. Рекомендую пригласить на техническое интервью.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-5">
                    <h4 className="font-medium text-foreground mb-3">Ключевые навыки</h4>
                    <div className="flex flex-wrap gap-2">
                      {["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "AWS"].map((skill) => (
                        <span key={skill} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                          {skill}
                        </span>
                      ))}
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности AI-Рекрутера</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Мощные инструменты для автоматизации первичного отбора кандидатов
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
              >
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Для каких задач подходит</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-Рекрутер эффективен для разных сценариев найма
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Начните бесплатно</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы автоматизировать скрининг кандидатов?
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Подключите AI-Рекрутера за 2 минуты и начните экономить время уже сегодня.
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

            <p className="text-sm text-muted-foreground mt-6">14 дней бесплатно • Без кредитной карты</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
