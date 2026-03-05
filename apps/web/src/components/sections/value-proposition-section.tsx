"use client"

import { Zap, TrendingUp, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScreenshotPreview } from "@/components/ui/screenshot-preview"

export function ValuePropositionSection() {
  return (
    <section id="value" className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
              <Zap className="h-4 w-4 text-foreground" />
              <span className="text-muted-foreground">Ценностное предложение</span>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance leading-tight">
              Автоматизация подбора персонала —
              <br className="hidden md:block" />
              <span className="text-muted-foreground">без таблиц и ручного скрининга резюме</span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Скрининг резюме, первичные интервью, учёт кандидатов и аналитика подбора — в единой системе для HR-команд
            </p>
          </div>

          {/* Key metrics - 3 cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                value: "70%",
                label: "сокращение цикла найма",
                icon: Zap,
                description: "От отклика до оффера — за дни, не недели",
              },
              {
                value: "94%",
                label: "точность первичного отбора",
                icon: TrendingUp,
                description: "В список отобранных попадают только подходящие",
              },
              {
                value: "24/7",
                label: "интервью без дедлайнов",
                icon: Users,
                description: "Кандидаты проходят в удобное время",
              },
            ].map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-muted">
                    <stat.icon className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-3 text-foreground">{stat.value}</div>
                <div className="text-base font-semibold text-foreground mb-2 leading-snug">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>

          {/* Value points with live demo */}
          <div className="bg-card border border-border rounded-xl p-8 md:p-10">
            <div className="space-y-8">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-3">Все этапы подбора персонала в одном месте</h3>
                <p className="text-muted-foreground mb-8">Скрининг резюме, интервью, список отобранных — от отклика на hh.ru до оффера</p>
                <ul className="grid sm:grid-cols-2 gap-4 text-left">
                  {[
                    "Скрининг резюме по вашим критериям за секунды",
                    "Интервью в веб-чате в любое время",
                    "Единый список отобранных по всем вакансиям",
                    "hh.ru, SuperJob, Avito — без ручного копирования",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Live demo card */}
              <div className="bg-muted/50 border border-border rounded-xl overflow-hidden">
                <ScreenshotPreview
                  src="/screenshots/app-dashboard-recent-activity-1920x1080.png"
                  alt="Дашборд подбора персонала — кандидаты и вакансии в реальном времени"
                  height="aspect-video"
                />
              </div>
            </div>
          </div>

          {/* Bottom CTA link */}
          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-foreground hover:text-foreground/70 font-medium transition-colors group"
            >
              Подробнее о возможностях
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}