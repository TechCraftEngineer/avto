import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import { Button } from "@qbs-autonaim/ui/button"
import {
  BarChart3,
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  Target,
  Brain,
  Sparkles,
  LineChart,
  PieChart,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Аналитика найма | QBS Автонайм",
  description:
    "Полный контроль воронки найма с AI-рекомендациями. Отслеживайте конверсию, оптимизируйте процессы и сокращайте время до найма.",
  keywords: ["аналитика найма", "воронка найма", "HR метрики", "конверсия найма", "статистика рекрутинга"],
  openGraph: {
    title: "Аналитика найма | QBS Автонайм",
    description: "Полный контроль воронки найма с AI-рекомендациями. Сокращайте время найма до 3 дней.",
  },
}

export default function AnalyticsPage() {
  const features = [
    {
      icon: LineChart,
      title: "Воронка найма",
      description: "Визуализация каждого этапа найма от отклика до оффера. Видите конверсию на каждом шаге.",
    },
    {
      icon: Brain,
      title: "AI-рекомендации",
      description: "Система анализирует данные и предлагает конкретные улучшения для ускорения найма.",
    },
    {
      icon: Target,
      title: "Отслеживание KPI",
      description: "Время до найма, стоимость найма, качество откликов — все метрики в одном месте.",
    },
    {
      icon: PieChart,
      title: "Источники кандидатов",
      description: "Узнайте, какие источники дают лучших кандидатов и оптимизируйте бюджет.",
    },
    {
      icon: Activity,
      title: "Реалтайм дашборды",
      description: "Данные обновляются в режиме реального времени. Всегда актуальная информация.",
    },
    {
      icon: Users,
      title: "Аналитика команды",
      description: "Статистика работы рекрутеров: скорость обработки, качество отбора, эффективность.",
    },
  ]

  const benefits = [
    { value: "85%", label: "Экономия времени HR" },
    { value: "3 дня", label: "Среднее время до найма" },
    { value: "94%", label: "Точность AI-рекомендаций" },
    { value: "40%", label: "Рост конверсии" },
  ]

  const metrics = [
    {
      title: "Конверсия воронки",
      description: "Отслеживайте, на каком этапе теряются кандидаты",
      icon: TrendingUp,
    },
    {
      title: "Время найма",
      description: "Контролируйте скорость прохождения этапов",
      icon: Clock,
    },
    {
      title: "Качество откликов",
      description: "Оценивайте релевантность кандидатов по источникам",
      icon: Target,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.015_150/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm mb-6">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Аналитика найма</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Воронка найма{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                под полным контролем
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Отслеживайте конверсию на каждом этапе, получайте AI-рекомендации и сокращайте время найма до 3 дней.
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
                  <div className="text-3xl md:text-4xl font-bold text-emerald-500 mb-1">{stat.value}</div>
                  <div className="text-sm text-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Dashboard */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-semibold text-foreground text-lg">Воронка найма</h4>
                <span className="text-sm text-foreground/60">Последние 30 дней</span>
              </div>

              {/* Funnel visualization */}
              <div className="space-y-4 mb-8">
                {[
                  { label: "Отклики", value: 1234, percent: 100, color: "bg-blue-500" },
                  { label: "AI-скрининг", value: 847, percent: 68, color: "bg-violet-500" },
                  { label: "Интервью", value: 234, percent: 19, color: "bg-emerald-500" },
                  { label: "Офферы", value: 45, percent: 4, color: "bg-foreground" },
                ].map((stage, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-foreground/70 font-medium">{stage.label}</div>
                    <div className="flex-1 h-12 bg-muted rounded-xl overflow-hidden">
                      <div
                        className={`h-full ${stage.color} flex items-center justify-between px-4`}
                        style={{ width: `${stage.percent}%` }}
                      >
                        <span className="text-sm font-bold text-white">{stage.value}</span>
                        <span className="text-sm font-medium text-white/80">{stage.percent}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">3.6%</div>
                  <div className="text-sm text-foreground/60">Конверсия в оффер</div>
                </div>
                <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-500">-40%</div>
                  <div className="text-sm text-foreground/60">Сокращение времени</div>
                </div>
                <div className="bg-muted rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">14 дн</div>
                  <div className="text-sm text-foreground/60">Среднее время найма</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности аналитики</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Полный контроль над процессом найма с понятными метриками
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-emerald-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ключевые метрики</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Отслеживайте показатели, которые действительно важны
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {metrics.map((metric, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <metric.icon className="h-7 w-7 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{metric.title}</h3>
                <p className="text-sm text-foreground/70">{metric.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Начните бесплатно</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы контролировать воронку найма?
            </h2>

            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Подключите аналитику за 2 минуты и получите полную прозрачность процесса найма.
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
