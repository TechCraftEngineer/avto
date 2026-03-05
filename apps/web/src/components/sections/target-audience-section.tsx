"use client"

import { Briefcase, Building2, Rocket, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

export function TargetAudienceSection() {
  const audiences = [
    {
      icon: Briefcase,
      title: "HR-менеджеры",
      description: "Меньше Excel и рассылок — больше живого общения с финальными кандидатами",
      stat: "20+ ч/нед",
      statLabel: "экономия на рутине",
      link: "/audiences/hr-managers",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Building2,
      title: "Руководители",
      description: "Закрывайте вакансии без расширения HR-штата",
      stat: "3×",
      statLabel: "объём без роста команды",
      link: "/audiences/company-leaders",
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      icon: Rocket,
      title: "Стартапы",
      description: "Первый найм за пару дней вместо поиска рекрутера на аутсорсе",
      stat: "48 ч",
      statLabel: "от вакансии до интервью",
      link: "/audiences/startups",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      icon: TrendingUp,
      title: "Агентства",
      description: "Больше размещений при той же команде за счёт автоматизации скрининга",
      stat: "5×",
      statLabel: "обработанных кандидатов",
      link: "/audiences/recruitment-agencies",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ]

  return (
    <section className="relative pt-8 md:pt-12 pb-24 md:pb-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Для разных команд
          </h2>
          <p className="text-lg text-muted-foreground">
            HR-менеджеры, руководители, стартапы и кадровые агентства
          </p>
        </div>

        {/* Grid - first card has subtle accent */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon
            const isFeatured = index === 0

            return (
              <Link
                key={index}
                href={audience.link}
                className={`group block h-full rounded-xl p-6 transition-all ${
                  isFeatured
                    ? "bg-card border-2 border-blue-500/30 shadow-md hover:shadow-lg hover:border-blue-500/50"
                    : "bg-card border border-border/60 hover:border-border hover:shadow-sm"
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg ${audience.bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${audience.color}`} />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-foreground mb-2">{audience.title}</h3>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{audience.description}</p>

                {/* Stat */}
                <div className="pt-4 border-t border-border/40">
                  <div className={`text-2xl font-bold ${audience.color}`}>{audience.stat}</div>
                  <div className="text-xs text-muted-foreground mt-1">{audience.statLabel}</div>
                </div>

                {/* Arrow */}
                <div className="mt-4 flex items-center gap-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Подробнее
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}