"use client"

import { Link2, Brain, MessageCircle, CheckCircle, ArrowRight, Clock, Shield, Zap } from "lucide-react"
import { env } from "@/env"
import { motion } from "framer-motion"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Подключение HeadHunter и SuperJob",
      description: "Интеграция с hh.ru, SuperJob, Avito — авторизация один раз, отклики синхронизируются автоматически",
      features: ["hh.ru", "SuperJob", "Avito"],
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      number: "02",
      icon: Brain,
      title: "Скрининг резюме по вашим критериям",
      description: "Автоматический отбор резюме: система оценивает кандидатов по настраиваемым параметрам и выставляет рейтинг соответствия",
      features: ["Ваши критерии", "Рейтинг", "Профиль кандидата"],
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      number: "03",
      icon: MessageCircle,
      title: "Интервью в веб-чате",
      description: "Кандидат получает приглашение и проходит интервью в веб-чате в удобное время",
      features: ["Веб-чат", "Голос или текст", "24/7"],
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Список отобранных готов",
      description: "Отсортированный список с транскрипциями, оценками и рекомендациями — остаётся провести финальные интервью",
      features: ["Топ кандидаты", "Транскрипции", "Рекомендации"],
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ]

  return (
    <section id="how-it-works" className="pt-24 md:pt-32 pb-12 md:pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            Подбор персонала: <span className="whitespace-nowrap">4 шага</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            От HeadHunter до оффера без ручного копирования откликов
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.4 }}
              className="group relative bg-card border border-border/60 rounded-xl p-6 hover:border-border hover:shadow-sm transition-all"
            >
              {/* Connection line - more visible */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-border via-border/80 to-transparent z-0" />
              )}

              {/* Step number - larger, more prominent */}
              <div className={`absolute -top-3 -right-3 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step.bgColor} ${step.color} border border-border/60`}>
                {step.number}
              </div>

              {/* Icon */}
              <div className={`h-10 w-10 rounded-lg ${step.bgColor} flex items-center justify-center mb-4`}>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>

              {/* Content */}
              <h3 className="font-semibold text-foreground mb-2 text-sm">{step.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{step.description}</p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-1.5">
                {step.features.map((feature, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/40">
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom feature cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            {
              icon: Clock,
              title: "Меньше рутины",
              desc: "Первичный отбор за 15 минут вместо 5 часов в день",
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              icon: Shield,
              title: "Настраиваемая оценка",
              desc: "Параметры и веса под специфику ваших вакансий",
              color: "text-violet-600",
              bgColor: "bg-violet-50",
            },
            {
              icon: Zap,
              title: "Быстрое подключение",
              desc: "hh.ru за 2 минуты — первый отклик уже в платформе",
              color: "text-emerald-600",
              bgColor: "bg-emerald-50",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all text-center"
            >
              <div className={`h-10 w-10 rounded-lg ${item.bgColor} flex items-center justify-center mb-4 mx-auto`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href={`${env.NEXT_PUBLIC_APP_URL}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors group"
          >
            Начать бесплатно
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  )
}