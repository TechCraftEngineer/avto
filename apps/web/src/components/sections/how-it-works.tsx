"use client"

import { Link2, Brain, MessageCircle, CheckCircle, ArrowRight, Clock, Shield, Zap } from "lucide-react"
import { env } from "@/env"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Link2,
      title: "Подключение HeadHunter и SuperJob",
      description: "Интеграция с hh.ru, SuperJob, Avito — авторизация один раз, отклики синхронизируются автоматически",
      features: ["hh.ru", "SuperJob", "Avito"],
    },
    {
      number: "02",
      icon: Brain,
      title: "Скрининг резюме по вашим критериям",
      description: "Автоматический отбор резюме: система оценивает кандидатов по настраиваемым параметрам и выставляет рейтинг соответствия",
      features: ["Ваши критерии", "Рейтинг", "Профиль кандидата"],
    },
    {
      number: "03",
      icon: MessageCircle,
      title: "Интервью в веб-чате",
      description: "Кандидат получает приглашение и проходит интервью в веб-чате в удобное время",
      features: ["Веб-чат", "Голос или текст", "24/7"],
    },
    {
      number: "04",
      icon: CheckCircle,
      title: "Список отобранных готов",
      description: "Отсортированный список с транскрипциями, оценками и рекомендациями — остаётся провести финальные интервью",
      features: ["Топ кандидаты", "Транскрипции", "Рекомендации"],
    },
  ]

  return (
    <section id="how-it-works" className="py-24 md:py-32 border-b border-border/40">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Подбор персонала: 4 шага
          </h2>
          <p className="text-lg text-muted-foreground">
            От HeadHunter до оффера без ручного копирования откликов
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto mb-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-card border border-border/60 rounded-xl p-6 hover:border-border hover:shadow-sm transition-all"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-border/40 z-0" />
              )}

              {/* Step number */}
              <div className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-muted border border-border/60 flex items-center justify-center text-xs font-bold text-muted-foreground">
                {step.number}
              </div>

              {/* Icon */}
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                <step.icon className="h-5 w-5 text-foreground" />
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
            </div>
          ))}
        </div>

        {/* Bottom feature cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {[
            {
              icon: Clock,
              title: "Меньше рутины",
              desc: "Первичный отбор за 15 минут вместо 5 часов в день",
            },
            {
              icon: Shield,
              title: "Настраиваемая оценка",
              desc: "Параметры и веса под специфику ваших вакансий",
            },
            {
              icon: Zap,
              title: "Быстрое подключение",
              desc: "hh.ru за 2 минуты — первый отклик уже в платформе",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all text-center"
            >
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4 mx-auto">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
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