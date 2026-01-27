import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@qbs-autonaim/ui"
import {
  Building2,
  ArrowRight,
  TrendingUp,
  Users,
  Shield,
  BarChart3,
  Target,
  Clock,
  Bot,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Для руководителей компаний | QBS Автонайм",
  description:
    "Масштабируйте найм без увеличения HR-команды. Рост на 300% без дополнительных затрат. Прозрачная аналитика и контроль процессов.",
}

export default function CompanyLeadersPage() {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Рост на 300% без доп. затрат",
      description:
        "Один AI-рекрутер обрабатывает столько откликов, сколько 5 человек. Масштабируйте найм без расширения HR-отдела.",
      stat: "3x рост",
    },
    {
      icon: TrendingUp,
      title: "ROI 400% за первый год",
      description:
        "Экономия на зарплатах рекрутеров ($60k+ каждый), агентствах ($5-10k per hire) и ускорение найма окупает инвестиции за 3 месяца.",
      stat: "400% ROI",
    },
    {
      icon: Shield,
      title: "Снижение рисков найма",
      description:
        "AI анализирует кандидатов объективно без предвзятости. 95% retention rate благодаря точной оценке культурного соответствия.",
      stat: "95% retention",
    },
    {
      icon: BarChart3,
      title: "Полная прозрачность",
      description:
        "Дашборды в реальном времени показывают воронку найма, конверсию, время закрытия вакансий и стоимость одного найма.",
      stat: "Real-time дашборды",
    },
  ]

  const features = [
    {
      icon: Bot,
      title: "AI-автоматизация",
      description: "85% задач найма выполняются автоматически",
    },
    {
      icon: Users,
      title: "Массовый скейлинг",
      description: "Обрабатывайте 1000+ откликов одновременно",
    },
    {
      icon: Target,
      title: "Predictive hiring",
      description: "AI предсказывает успешность кандидата с точностью 92%",
    },
    {
      icon: Clock,
      title: "Быстрое закрытие вакансий",
      description: "Среднее время найма сокращается с 45 до 12 дней",
    },
    {
      icon: Sparkles,
      title: "Employer branding",
      description: "AI создаёт привлекательные вакансии и карьерные страницы",
    },
    {
      icon: Shield,
      title: "Комплаенс и безопасность",
      description: "Соответствие 152-ФЗ (Персональные данные) и 115-ФЗ (Противодействие отмыванию доходов)",
    },
  ]

  const useCases = [
    {
      title: "Масштабирование без затрат",
      description:
        "Компания выросла с 100 до 400 сотрудников за год. Вместо найма 5 новых рекрутеров ($300k/год), внедрили QBS ($15k/год). AI обрабатывает 2000+ откликов в месяц, HR-команда фокусируется на финальных интервью.",
      challenge: "Нужно увеличить найм в 4 раза без роста HR-бюджета",
      solution: "AI-автоматизация первичного скрининга и оценки",
      result: "Экономия $285k/год при росте эффективности на 300%",
    },
    {
      title: "Снижение cost per hire",
      description:
        "Каждый найм через агентства стоил $8000. QBS анализирует все источники (HH, LinkedIn, Indeed) одновременно и находит кандидатов напрямую. Стоимость найма упала до $500 при росте качества.",
      challenge: "Высокая стоимость найма через агентства и рекрутеров",
      solution: "AI-поиск по всем платформам + автоматический скрининг",
      result: "Cost per hire снизился с $8000 до $500 (16x)",
    },
    {
      title: "Data-driven решения",
      description:
        "Раньше руководитель не видел, где застревают кандидаты и сколько реально стоит закрыть вакансию. QBS показывает воронку найма в реальном времени, best/worst источники, конверсию этапов.",
      challenge: "Нет прозрачности процесса найма и метрик эффективности",
      solution: "Автоматические дашборды и еженедельные отчёты",
      result: "Время принятия решений сократилось на 70%",
    },
  ]

  const testimonial = {
    quote:
      "Как CEO, я отслеживаю метрики всех процессов. QBS дал нам полную прозрачность найма: от стоимости одного hire до conversion rate по каждому источнику. За год мы выросли в 3 раза, но HR-команда осталась той же. ROI платформы — более 500%. Must-have для любой растущей компании.",
    author: "Андрей Морозов",
    role: "CEO",
    company: "TechCorp (400+ сотрудников, серия B)",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.7_0.15_280/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm mb-6">
              <Building2 className="h-4 w-4 text-purple-600" />
              <span className="text-purple-600 font-medium">Для руководителей компаний</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Масштабируйте найм на{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                300% без роста
              </span>{" "}
              HR-команды
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              AI-платформа для руководителей, которые ценят данные и эффективность. Полная прозрачность процессов,
              контроль метрик и ROI 400% за первый год.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Запросить демо
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline">
                Рассчитать ROI
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { value: "300%", label: "рост эффективности" },
                { value: "400%", label: "ROI за год" },
                { value: "12 дней", label: "среднее время найма" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-1">{stat.value}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Бизнес-преимущества QBS</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Измеримые результаты для вашего бизнеса</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <span className="text-sm font-semibold text-purple-600 bg-purple-500/10 px-2 py-1 rounded-full">
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Enterprise-возможности для роста</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Инструменты для масштабирования компании</p>
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
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-cyan-500/10 border border-purple-500/20 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                АМ
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы масштабировать найм эффективно?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Запросите персональную демонстрацию и расчёт ROI для вашей компании
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Запросить демо
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Enterprise-тарифы
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Персональное внедрение • Обучение команды • Поддержка 24/7
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
