import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import Button from "@qbs-autonaim/ui/button"
import {
  Sparkles,
  ArrowRight,
  FileText,
  Wand2,
  Languages,
  Target,
  Lightbulb,
  CheckCircle2,
  MessageSquare,
  PenTool,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout"

export const metadata: Metadata = {
  title: "AI-Создание вакансий | QBS Автонайм",
  description:
    "Генерируйте профессиональные описания вакансий за секунды с помощью AI. Оптимизация для поисковых систем и привлечение лучших кандидатов.",
  keywords: ["генератор вакансий", "AI создание вакансий", "описание вакансии", "текст вакансии"],
  openGraph: {
    title: "AI-Создание вакансий | QBS Автонайм",
    description: "Профессиональные вакансии за 30 секунд с помощью AI. SEO-оптимизация включена.",
  },
}

export default function AIJobCreationPage() {
  const features = [
    {
      icon: Wand2,
      title: "Генерация за секунды",
      description: "Опишите роль в нескольких словах — AI создаст полное описание вакансии с требованиями и условиями.",
    },
    {
      icon: Target,
      title: "SEO-оптимизация",
      description: "Вакансии оптимизированы для поисковых систем и job-порталов для максимального охвата кандидатов.",
    },
    {
      icon: Languages,
      title: "Мультиязычность",
      description: "Создавайте вакансии на русском, английском и других языках одним кликом.",
    },
    {
      icon: Lightbulb,
      title: "Умные рекомендации",
      description: "AI предлагает улучшения текста на основе анализа успешных вакансий в вашей отрасли.",
    },
    {
      icon: FileText,
      title: "Шаблоны по отраслям",
      description: "Готовые шаблоны для IT, маркетинга, продаж, финансов и других сфер.",
    },
    {
      icon: PenTool,
      title: "Редактирование в реальном времени",
      description: "Вносите правки и мгновенно видите результат. AI адаптирует текст под ваш стиль.",
    },
  ]

  const benefits = [
    { value: "30 сек", label: "Среднее время создания" },
    { value: "3x", label: "Больше откликов" },
    { value: "15+", label: "Шаблонов отраслей" },
    { value: "5", label: "Языков поддержки" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.015_195/0.15),transparent_70%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-foreground" />
              <span className="text-foreground font-medium">AI-Создание вакансий</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Профессиональные вакансии за{" "}
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent">
                30 секунд
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Просто опишите роль — AI создаст привлекательное описание вакансии, оптимизированное для поиска лучших
              кандидатов.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Создать вакансию
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
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
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
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-foreground/60">QBS — Генератор вакансий</span>
              </div>

              <div className="grid md:grid-cols-2">
                {/* Input */}
                <div className="p-6 border-r border-border">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-foreground" />
                    Опишите вакансию
                  </h3>

                  <div className="rounded-xl border border-border bg-background p-4 mb-4">
                    <p className="text-sm text-foreground">
                      Нужен middle Python разработчик в финтех стартап, удаленка, опыт Django и PostgreSQL
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Button size="sm">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Сгенерировать
                    </Button>
                    <span className="text-xs text-foreground/50">или нажмите Enter</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-foreground/60 font-medium">Быстрые опции:</p>
                    <div className="flex flex-wrap gap-2">
                      {["Добавить зарплату", "Английский язык", "Офис в Москве", "Релокация"].map((option) => (
                        <button
                          key={option}
                          className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-foreground/30 hover:bg-foreground/5 transition-colors text-foreground/70"
                        >
                          + {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output */}
                <div className="p-6 bg-background">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-foreground" />
                    Результат
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-foreground mb-1">Middle Python Developer</h4>
                      <p className="text-sm text-foreground/70">Финтех стартап • Удаленная работа</p>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">Требования</h5>
                      <ul className="space-y-1">
                        {["Python 3+ лет опыта", "Django / FastAPI", "PostgreSQL", "REST API", "Git"].map((req, i) => (
                          <li key={i} className="text-sm text-foreground/70 flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-foreground shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-foreground mb-2">Условия</h5>
                      <ul className="space-y-1">
                        {["Полностью удаленная работа", "Гибкий график", "Конкурентная зарплата", "Опционы"].map(
                          (cond, i) => (
                            <li key={i} className="text-sm text-foreground/70 flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              {cond}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Редактировать
                    </Button>
                    <Button size="sm">Опубликовать</Button>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности генератора</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Создавайте вакансии, которые привлекают лучших кандидатов
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-foreground/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Как это работает</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Три простых шага до идеальной вакансии</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Опишите роль",
                description: "Введите название позиции и основные требования в свободной форме.",
                icon: MessageSquare,
              },
              {
                step: "02",
                title: "AI создаст текст",
                description: "За секунды получите профессиональное описание с требованиями и условиями.",
                icon: Sparkles,
              },
              {
                step: "03",
                title: "Опубликуйте",
                description: "Отредактируйте при необходимости и опубликуйте на job-порталах.",
                icon: Zap,
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto">
                    <item.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-5xl font-bold text-foreground/10">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-foreground/5 via-foreground/[0.02] to-foreground/5 border border-foreground/10 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-foreground" />
              <span className="text-foreground font-medium">Бесплатный доступ</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Создайте свою первую вакансию с AI</h2>

            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Попробуйте генератор вакансий бесплатно и убедитесь в качестве результата.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Создать вакансию
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Посмотреть тарифы
                </Button>
              </Link>
            </div>

            <p className="text-sm text-foreground/60 mt-6">Без регистрации • Результат за 30 секунд</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
