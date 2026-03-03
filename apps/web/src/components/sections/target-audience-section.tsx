"use client"

import { Briefcase, Building2, Rocket, TrendingUp, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function TargetAudienceSection() {
  const audiences = [
    {
      icon: Briefcase,
      title: "HR-менеджеры",
      description: "Меньше Excel и рассылок — больше живого общения с финальными кандидатами",
      stat: "20+ ч/нед",
      statLabel: "экономия на рутине",
      link: "/audiences/hr-managers",
      color: "text-violet-500",
      bgColor: "bg-violet-500",
    },
    {
      icon: Building2,
      title: "Руководители",
      description: "Закрывайте вакансии без расширения HR-штата",
      stat: "3×",
      statLabel: "объём без роста команды",
      link: "/audiences/company-leaders",
      color: "text-blue-500",
      bgColor: "bg-blue-500",
    },
    {
      icon: Rocket,
      title: "Стартапы",
      description: "Первый найм за пару дней вместо поиска рекрутера на аутсорсе",
      stat: "48 ч",
      statLabel: "от вакансии до интервью",
      link: "/audiences/startups",
      color: "text-amber-500",
      bgColor: "bg-amber-500",
    },
    {
      icon: TrendingUp,
      title: "Агентства",
      description: "Больше размещений при той же команде за счёт автоматизации скрининга",
      stat: "5×",
      statLabel: "обработанных кандидатов",
      link: "/audiences/recruitment-agencies",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500",
    },
  ]

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-muted/30">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,oklch(0.96_0.01_265/0.3),transparent_70%)]" />

      <div className="container relative mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-card text-sm mb-6">
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">Аудитория</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance mb-4">
            Система подбора персонала <span className="text-muted-foreground">для разных команд</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            HR-менеджеры, руководители, стартапы и кадровые агентства — автоматизация подбора под любой объём найма
          </p>
        </motion.div>

        {/* Compact 4-column grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audience.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link
                  href={audience.link}
                  className="group block h-full bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 hover:shadow-lg transition-all"
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${audience.bgColor}/10 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${audience.color}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-foreground mb-2">{audience.title}</h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{audience.description}</p>

                  {/* Stat */}
                  <div className="pt-4 border-t border-border">
                    <div className={`text-2xl font-bold ${audience.color}`}>{audience.stat}</div>
                    <div className="text-xs text-muted-foreground">{audience.statLabel}</div>
                  </div>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                    Подробнее
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}