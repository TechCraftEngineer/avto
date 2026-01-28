import { ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

const integrations = [
  {
    name: "HeadHunter",
    description: "Автоматический импорт откликов и синхронизация статусов",
    icon: "hh",
    color: "bg-red-500",
    featured: true,
  },
  {
    name: "Telegram",
    description: "MTProto интеграция для прямой связи с кандидатами",
    icon: "tg",
    color: "bg-sky-500",
    featured: true,
  },
  {
    name: "SuperJob",
    description: "Импорт резюме и публикация вакансий",
    icon: "sj",
    color: "bg-blue-600",
    featured: true,
  },
  {
    name: "Avito",
    description: "Работа с откликами на Авито Работа",
    icon: "av",
    color: "bg-green-500",
    featured: true,
  },
  {
    name: "WhatsApp",
    description: "Автоматические сообщения кандидатам",
    icon: "wa",
    color: "bg-emerald-500",
  },
  {
    name: "1C:ЗУП",
    description: "Выгрузка данных о сотрудниках",
    icon: "1c",
    color: "bg-yellow-500",
  },
  {
    name: "Google Calendar",
    description: "Автопланирование собеседований",
    icon: "gc",
    color: "bg-blue-500",
  },
  {
    name: "Битрикс24",
    description: "Синхронизация с CRM системой",
    icon: "b24",
    color: "bg-cyan-500",
  },
  {
    name: "AmoCRM",
    description: "Ведение кандидатов в воронке",
    icon: "amo",
    color: "bg-indigo-500",
  },
  {
    name: "Slack",
    description: "Уведомления о новых кандидатах",
    icon: "sl",
    color: "bg-purple-600",
  },
]

function IntegrationIcon({ icon, color }: { icon: string; color: string }) {
  const iconMap: Record<string, string> = {
    hh: "hh",
    tg: "TG",
    sj: "SJ",
    av: "AV",
    wa: "WA",
    "1c": "1C",
    gc: "GC",
    b24: "Б24",
    amo: "AMO",
    sl: "SL",
  }

  return (
    <div
      className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg`}
    >
      {iconMap[icon]}
    </div>
  )
}

export function IntegrationsSection() {
  const featuredIntegrations = integrations.filter((i) => i.featured)
  const otherIntegrations = integrations.filter((i) => !i.featured)

  return (
    <section className="relative bg-background py-20 md:py-32 overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span>Интеграции</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
            Работает с вашими <span className="text-primary">инструментами</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Подключите QBS Автонайм к сервисам, которые вы уже используете. Настройка занимает несколько минут.
          </p>
        </div>

        {/* Featured Integrations */}
        <div className="mb-12">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 text-center">
            Популярные интеграции
          </h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {featuredIntegrations.map((integration) => (
              <Link
                key={integration.name}
                href="#"
                className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-start gap-4">
                  <IntegrationIcon icon={integration.icon} color={integration.color} />
                  <div>
                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {integration.name}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{integration.description}</p>
                  </div>
                </div>
                <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* All Integrations */}
        <div className="max-w-5xl mx-auto">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-6 text-center">
            Все интеграции
          </h3>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {otherIntegrations.map((integration) => (
              <Link
                key={integration.name}
                href="#"
                className="group flex flex-col items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-md transition-all duration-300"
              >
                <IntegrationIcon icon={integration.icon} color={integration.color} />
                <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                  {integration.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Не нашли нужную интеграцию?</p>
          <Link href="#" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            Запросить интеграцию
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}