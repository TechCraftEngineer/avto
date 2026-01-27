import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@qbs-autonaim/ui"
import {
  TrendingUp,
  ArrowRight,
  Users,
  Zap,
  Target,
  BarChart3,
  Clock,
  Bot,
  Sparkles,
  Award,
} from "lucide-react"
import Link from "next/link"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Для рекрутинговых агентств | QBS Автонайм",
  description:
    "Увеличьте количество успешных размещений до 5x. Обрабатывайте больше клиентов одновременно без роста команды. Прозрачная аналитика для клиентов.",
}

export default function RecruitmentAgenciesPage() {
  const benefits = [
    {
      icon: Users,
      title: "До 5x больше кандидатов",
      description:
        "AI сканирует все платформы 24/7 и находит пассивных кандидатов, которые не откликаются на вакансии. Расширьте свою базу талантов в разы.",
      stat: "5x база",
    },
    {
      icon: Zap,
      title: "10x быстрее обработка",
      description:
        "Вместо дней на скрининг резюме — минуты. AI оценивает 1000+ кандидатов одновременно и выдаёт топ-50 для каждого клиента.",
      stat: "10x скорость",
    },
    {
      icon: TrendingUp,
      title: "Больше клиентов, тот же штат",
      description:
        "Один рекрутер с QBS закрывает столько вакансий, сколько раньше закрывали 3-4 человека. Масштабируйте бизнес без найма.",
      stat: "+200% выручка",
    },
    {
      icon: Target,
      title: "Повышение точности матчинга",
      description:
        "AI оценивает не только hard skills, но и культурное соответствие. 95% ваших кандидатов проходят пробный период у клиентов.",
      stat: "95% success rate",
    },
  ]

  const features = [
    {
      icon: Bot,
      title: "Multi-client management",
      description: "Управляйте 50+ клиентами одновременно в одной системе",
    },
    {
      icon: Users,
      title: "Sourcing automation",
      description: "AI находит кандидатов на LinkedIn, HH, Indeed автоматически",
    },
    {
      icon: Sparkles,
      title: "Персонализированный outreach",
      description: "AI создаёт уникальные письма для каждого кандидата",
    },
    {
      icon: BarChart3,
      title: "Клиентские отчёты",
      description: "Автоматические дашборды для прозрачности перед клиентами",
    },
    {
      icon: Clock,
      title: "Pipeline tracking",
      description: "Следите за всеми кандидатами по всем вакансиям в одном месте",
    },
    {
      icon: Award,
      title: "Quality scoring",
      description: "AI предсказывает вероятность успешного найма для каждого кандидата",
    },
  ]

  const useCases = [
    {
      title: "Масштабирование бизнеса",
      description:
        "Агентство с 5 рекрутерами обрабатывало 20 вакансий/месяц. После внедрения QBS тот же штат закрывает 80+ вакансий. AI берёт на себя sourcing и первичный скрининг, рекрутеры фокусируются на работе с клиентами и финальными собеседованиями.",
      challenge: "Ограниченная пропускная способность команды",
      solution: "AI-автоматизация sourcing, скрининга и коммуникаций",
      result: "Рост с 20 до 80 размещений/месяц без найма новых людей",
    },
    {
      title: "Поиск редких специалистов",
      description:
        "Клиент ищет senior DevOps с опытом Kubernetes + AWS + финтех. Таких специалистов мало и они не откликаются сами. AI сканирует тысячи профилей на всех платформах, находит 200 подходящих и автоматически отправляет персонализированные письма. Конверсия 15%.",
      challenge: "Сложно находить пассивных кандидатов с уникальными скиллами",
      solution: "AI-поиск по всем платформам + автоматический outreach",
      result: "30 заинтересованных кандидатов за 1 неделю вместо 1 месяца",
    },
    {
      title: "Прозрачность для клиентов",
      description:
        "Клиенты постоянно спрашивают про статус поиска. Раньше рекрутеры тратили время на отчёты и звонки. QBS автоматически генерирует дашборды для каждого клиента с метриками: сколько кандидатов найдено, скринировано, на собеседованиях. Клиенты видят прогресс в реальном времени.",
      challenge: "Много времени на коммуникацию со статусами для клиентов",
      solution: "Автоматические клиентские дашборды и еженедельные отчёты",
      result: "90% снижение вопросов про статус, выше доверие клиентов",
    },
  ]

  const testimonial = {
    quote:
      "За 12 лет работы агентства я не видел инструмента, который так сильно изменил бы нашу эффективность. QBS позволил нам в 3 раза увеличить количество клиентов без расширения команды. AI находит кандидатов, которых мы раньше упускали. Наш success rate вырос с 70% до 95%. Лучшая инвестиция в бизнес за последние годы.",
    author: "Игорь Волков",
    role: "Основатель и CEO",
    company: "ProRecruit Agency (12 лет на рынке)",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.7_0.15_310/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm mb-6">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <span className="text-violet-600 font-medium">Для рекрутинговых агентств</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Увеличьте размещения до{" "}
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                5x без найма
              </span>{" "}
              новых рекрутеров
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              AI-платформа для агентств, которые хотят масштабироваться. Автоматизируйте sourcing, скрининг и outreach.
              Ваши рекрутеры фокусируются на работе с клиентами и финальных интервью.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Запросить демо
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline">
                Посмотреть кейсы
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { value: "5x", label: "больше кандидатов" },
                { value: "95%", label: "success rate" },
                { value: "3x", label: "рост выручки" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-violet-600 mb-1">{stat.value}</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Преимущества для агентств</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Больше размещений, выше качество, довольнее клиенты
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-violet-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{benefit.title}</h3>
                      <span className="text-sm font-semibold text-violet-600 bg-violet-500/10 px-2 py-1 rounded-full">
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Инструменты для агентств</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Всё необходимое для управления множеством клиентов
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Реальные кейсы агентств</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Как QBS помогает агентствам расти</p>
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
                  <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-4">
                    <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Решение</div>
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
          <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-blue-500/10 border border-violet-500/20 p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                ИВ
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Готовы масштабировать агентство?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Запросите демонстрацию и узнайте, как увеличить размещения в 5 раз
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Запросить демо для агентств
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Тарифы для агентств
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Специальные условия для агентств • Volume discounts • White-label опции
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
