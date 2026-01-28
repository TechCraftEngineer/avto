"use client"

import { Link2, Brain, MessageCircle, CheckCircle, ArrowRight, Sparkles, Clock, Shield, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { env } from "@/env"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Подключите источники",
      description:
        "Интеграция с hh.ru, SuperJob и другими площадками за 2 минуты. Все отклики автоматически синхронизируются.",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      features: ["hh.ru", "SuperJob", "Avito"],
    },
    {
      number: "02",
      icon: Brain,
      title: "AI анализирует резюме",
      description:
        "Искусственный интеллект оценивает каждого кандидата по 50+ параметрам и выставляет рейтинг соответствия.",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      features: ["50+ параметров", "Рейтинг", "Проф. + личные навыки"],
    },
    {
      number: "03",
      icon: MessageCircle,
      title: "Автоматическое интервью",
      description: "AI-бот проводит голосовые интервью в Telegram 24/7. Кандидаты отвечают когда им удобно.",
      color: "text-[#0088cc]",
      bgColor: "bg-[#0088cc]/10",
      features: ["Telegram", "Голос + Текст", "24/7"],
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Финальный список",
      description: "Получите отсортированный список лучших кандидатов с полной аналитикой и рекомендациями.",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      features: ["Топ кандидаты", "Аналитика", "Рекомендации"],
    },
  ]

  return (
    <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden bg-muted/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,oklch(0.96_0.01_265/0.2),transparent_70%)]" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Как это работает</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance"
          >
            От отклика до найма
            <br />
            <span className="text-muted-foreground">за 4 простых шага</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Автоматизируйте рутину найма и сфокусируйтесь на лучших кандидатах
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* Connection line (hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}

              <div className="relative bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`h-12 w-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-4`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>

                {/* Content */}
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.description}</p>

                {/* Feature tags */}
                <div className="flex flex-wrap gap-2">
                  {step.features.map((feature, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom feature cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="group p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/10 transition-colors">
              <Clock className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Экономия времени</h3>
            <p className="text-sm text-muted-foreground">С 5 часов до 15 минут в день на первичный отбор</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="group p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/10 transition-colors">
              <Shield className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Точность оценки</h3>
            <p className="text-sm text-muted-foreground">AI анализирует по 50+ параметрам соответствия</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="group p-6 rounded-2xl border border-border bg-card/50 hover:bg-card hover:shadow-lg transition-all text-center"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/10 transition-colors">
              <Zap className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Мгновенный старт</h3>
            <p className="text-sm text-muted-foreground">Подключите HH.ru за 2 минуты и начните</p>
          </motion.div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href={`${env.NEXT_PUBLIC_APP_URL}`}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            Начать бесплатно
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  )
}