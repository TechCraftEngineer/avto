import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import { Button } from "@qbs-autonaim/ui/button"
import { Kanban, ArrowRight, Globe, Bell, Filter, Calendar, BarChart3, Link2, Users, Sparkles } from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout" // Added import for ProductNavigation
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Управление задачами | QBS Автонайм",
  description:
    "Управляйте фриланс-задачами с разных платформ в одном месте. Единый дашборд для Kwork, FL.ru, Freelance.ru и других российских бирж.",
  keywords: ["управление фриланс проектами", "дашборд фрилансера", "агрегатор фриланс бирж", "Kwork FL.ru Freelance.ru"],
  openGraph: {
    title: "Управление задачами | QBS Автонайм",
    description: "Все фриланс-проекты в одном месте. Единый дашборд для управления задачами.",
  },
}

export default function TaskManagementPage() {
  const features = [
    {
      icon: Globe,
      title: "Все платформы в одном месте",
      description: "Собирайте задачи с Kwork, FL.ru, Freelance.ru и других российских бирж в единый дашборд.",
    },
    {
      icon: Bell,
      title: "Умные уведомления",
      description: "Получайте алерты о новых подходящих проектах по вашим критериям в Telegram.",
    },
    {
      icon: Filter,
      title: "Автофильтрация",
      description: "AI фильтрует проекты по бюджету, срокам, рейтингу заказчика и ключевым словам.",
    },
    {
      icon: Calendar,
      title: "Планирование дедлайнов",
      description: "Визуальный календарь всех активных проектов с напоминаниями о сроках.",
    },
    {
      icon: BarChart3,
      title: "Аналитика заработка",
      description: "Отслеживайте доходы, среднюю ставку и статистику по платформам.",
    },
    {
      icon: Users,
      title: "Командная работа",
      description: "Распределяйте проекты между членами команды и контролируйте выполнение.",
    },
  ]

  const platforms = [
    { name: "Kwork", color: "bg-orange-500", projects: "450K+" },
    { name: "FL.ru", color: "bg-blue-500", projects: "380K+" },
    { name: "Freelance.ru", color: "bg-green-500", projects: "250K+" },
    { name: "FL.ru", color: "bg-purple-500", projects: "380K+" },
    { name: "Fiverr", color: "bg-emerald-500", projects: "1.2M+" },
    { name: "Хабр Фриланс", color: "bg-cyan-500", projects: "120K+" },
  ]

  const benefits = [
    { value: "6+", label: "Платформ подключено" },
    { value: "2x", label: "Больше релевантных заказов" },
    { value: "40%", label: "Экономия времени" },
    { value: "24/7", label: "Мониторинг проектов" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.012_145/0.4),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-chart-3/20 bg-chart-3/5 px-4 py-1.5 text-sm mb-6">
              <Kanban className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">Управление задачами</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Все фриланс-проекты{" "}
              <span className="bg-gradient-to-r from-chart-3 to-emerald-500 bg-clip-text text-transparent">
                в одном месте
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Единый дашборд для управления задачами с Kwork, FL.ru, Freelance.ru и других российских платформ. Находите лучшие
              проекты быстрее.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Подключить платформы
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
                  <div className="text-3xl md:text-4xl font-bold text-chart-3 mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-4 text-sm text-muted-foreground">QBS — Управление задачами</span>
              </div>

              <div className="p-6">
                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    {
                      title: "Новые",
                      count: 12,
                      color: "bg-blue-500",
                      tasks: [
                        { name: "Landing Page Design", platform: "Kwork", budget: "$500" },
                        { name: "React Dashboard", platform: "FL.ru", budget: "$1200" },
                      ],
                    },
                    {
                      title: "В работе",
                      count: 5,
                      color: "bg-amber-500",
                      tasks: [
                        { name: "E-commerce API", platform: "Kwork", budget: "$800" },
                        { name: "Mobile App UI", platform: "FL.ru", budget: "$650" },
                      ],
                    },
                    {
                      title: "На проверке",
                      count: 3,
                      color: "bg-purple-500",
                      tasks: [{ name: "Logo Redesign", platform: "Fiverr", budget: "$150" }],
                    },
                    {
                      title: "Завершено",
                      count: 24,
                      color: "bg-emerald-500",
                      tasks: [{ name: "WordPress Site", platform: "Freelance.ru", budget: "$400" }],
                    },
                  ].map((column, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${column.color}`} />
                          <span className="font-medium text-foreground text-sm">{column.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {column.count}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {column.tasks.map((task, j) => (
                          <div
                            key={j}
                            className="rounded-lg border border-border bg-card p-3 hover:shadow-sm transition-shadow"
                          >
                            <h4 className="text-sm font-medium text-foreground mb-2">{task.name}</h4>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{task.platform}</span>
                              <span className="text-xs font-medium text-chart-3">{task.budget}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Поддерживаемые платформы</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Подключите любимые биржи фриланса и управляйте всеми проектами централизованно
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mb-12">
            {platforms.map((platform, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 text-center hover:border-chart-3/30 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white font-bold text-sm">{platform.name.charAt(0)}</span>
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">{platform.name}</h3>
                <p className="text-xs text-muted-foreground">{platform.projects} проектов</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">И другие платформы по запросу</p>
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4 mr-2" />
              Запросить интеграцию
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Всё необходимое для эффективного управления фриланс-проектами
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-chart-3/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Как начать</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Подключитесь за несколько минут и начните экономить время
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Подключите платформы",
                description: "Авторизуйтесь через API на нужных биржах фриланса.",
                icon: Link2,
              },
              {
                step: "02",
                title: "Настройте фильтры",
                description: "Укажите критерии для автоматического отбора проектов.",
                icon: Filter,
              },
              {
                step: "03",
                title: "Управляйте задачами",
                description: "Получайте уведомления и ведите все проекты в одном месте.",
                icon: Kanban,
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-chart-3/10 flex items-center justify-center mx-auto">
                    <item.icon className="h-8 w-8 text-chart-3" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-5xl font-bold text-chart-3/10">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-chart-3/10 via-emerald-500/5 to-chart-3/10 border border-chart-3/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-chart-3/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-chart-3" />
              <span className="text-chart-3 font-medium">Бесплатный старт</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы управлять проектами эффективнее?
            </h2>

            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Подключите платформы за 5 минут и начните находить лучшие проекты быстрее.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Посмотреть тарифы
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-6">14 дней бесплатно • Отмена в любой момент</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
