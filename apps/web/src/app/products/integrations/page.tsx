import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Link2, ArrowRight, Zap, Shield, Clock, CheckCircle2, Sparkles, RefreshCw, Globe, Boxes } from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/layout"

export const metadata: Metadata = {
  title: "Интеграции | QBS Автонайм",
  description:
    "Подключите 10+ сервисов найма за минуты: hh.ru, SuperJob, Avito, Telegram и другие. Синхронизация данных в реальном времени.",
  keywords: ["интеграции HR", "подключение hh.ru", "интеграция SuperJob", "API hh.ru", "синхронизация данных"],
  openGraph: {
    title: "Интеграции | QBS Автонайм",
    description: "Подключите 10+ сервисов найма за минуты. Синхронизация в реальном времени.",
  },
}

export default function IntegrationsPage() {
  const integrations = [
    { name: "HeadHunter", short: "hh", color: "bg-red-500", description: "Крупнейший job-портал России" },
    { name: "Telegram", short: "TG", color: "bg-sky-500", description: "Бот для интервью и уведомлений" },
    { name: "SuperJob", short: "SJ", color: "bg-blue-600", description: "Популярная платформа поиска работы" },
    { name: "Avito", short: "AV", color: "bg-green-500", description: "Вакансии на крупнейшей доске объявлений" },
    { name: "WhatsApp", short: "WA", color: "bg-emerald-500", description: "Коммуникация с кандидатами" },
    { name: "1C:ЗУП", short: "1C", color: "bg-yellow-500", description: "Кадровый учёт и зарплата" },
  ]

  const features = [
    {
      icon: Zap,
      title: "Быстрая настройка",
      description: "Подключите любой сервис за 2 минуты. Не нужны технические знания.",
    },
    {
      icon: RefreshCw,
      title: "Автосинхронизация",
      description: "Данные обновляются автоматически каждые 15 секунд без вашего участия.",
    },
    {
      icon: Shield,
      title: "Безопасность данных",
      description: "Все интеграции защищены SSL-шифрованием и соответствуют 152-ФЗ.",
    },
    {
      icon: Clock,
      title: "Работает 24/7",
      description: "Система работает круглосуточно, синхронизируя данные в режиме реального времени.",
    },
    {
      icon: Globe,
      title: "API доступ",
      description: "Разработчики могут подключить свои сервисы через REST API.",
    },
    {
      icon: Boxes,
      title: "Единый интерфейс",
      description: "Управляйте всеми платформами из одного места без переключения.",
    },
  ]

  const benefits = [
    { value: "10+", label: "Готовых интеграций" },
    { value: "2 мин", label: "Время настройки" },
    { value: "15 сек", label: "Период синхронизации" },
    { value: "99.9%", label: "Время работы" },
  ]

  const useCases = [
    {
      title: "Мультипостинг вакансий",
      description: "Публикуйте вакансии одновременно на все платформы одним кликом",
      icon: Globe,
    },
    {
      title: "Единая база кандидатов",
      description: "Все отклики со всех источников собираются в одном месте",
      icon: Boxes,
    },
    {
      title: "Автоматические уведомления",
      description: "Получайте уведомления о новых откликах в Telegram или WhatsApp",
      icon: Zap,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.015_195/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-1.5 text-sm mb-6">
              <Link2 className="h-4 w-4 text-foreground" />
              <span className="text-foreground font-medium">Интеграции</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Работает с{" "}
              <span className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                вашими инструментами
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Подключите hh.ru, SuperJob, Avito, Telegram и 10+ других сервисов за несколько минут. Всё в одном месте.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Посмотреть все интеграции
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

      {/* Integrations Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-semibold text-foreground text-lg">Подключённые сервисы</h4>
                <span className="text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full font-medium">
                  {integrations.length} активных
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {integrations.map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-background hover:border-foreground/30 transition-all duration-300 hover:shadow-md"
                  >
                    <div
                      className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    >
                      {item.short}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground text-sm mb-1">{item.name}</div>
                      <div className="text-xs text-foreground/60">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground mb-0.5">Все системы синхронизированы</div>
                    <div className="text-sm text-foreground/70">Последнее обновление: 15 сек назад</div>
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
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности интеграций</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Мощные инструменты для работы с внешними сервисами
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-foreground/30 hover:shadow-lg transition-all duration-300"
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

      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Сценарии использования</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Как интеграции упрощают работу рекрутера</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="h-7 w-7 text-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-foreground/70">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-foreground/10 via-foreground/5 to-foreground/10 border border-foreground/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-foreground/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-foreground" />
              <span className="text-foreground font-medium">Начните бесплатно</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Готовы подключить все ваши сервисы?</h2>

            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Настройте интеграции за 2 минуты и управляйте всеми платформами из одного места.
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
