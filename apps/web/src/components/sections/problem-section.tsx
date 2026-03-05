"use client"

import { ArrowRight, Clock, Users, Zap, TrendingUp, CheckCircle2 } from "lucide-react"

export function ProblemSection() {
  return (
    <section className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Main headline */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance leading-tight">
              Найм — это не только отклики. <br className="hidden md:block" />
              <span className="text-muted-foreground">Это результаты.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              QBS Автонайм — современная платформа, которая объединяет автоматизацию, аналитику и AI-интервью — всё в одном месте.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { value: "10x", label: "быстрее обработка откликов" },
              { value: "85%", label: "экономия времени рекрутера" },
              { value: "3 дня", label: "среднее время до найма" },
            ].map((stat, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 text-center hover:border-foreground/20 transition-colors">
                <div className="text-4xl md:text-5xl font-bold mb-2 text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Value points with checkmarks */}
          <div className="bg-card border border-border rounded-xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Быстро. Надёжно. Красиво.
                  <br />
                  <span className="text-muted-foreground font-normal">И масштабируется вместе с вами.</span>
                </h3>
                <ul className="space-y-4">
                  {[
                    "Автоматический скрининг резюме за секунды",
                    "AI-интервью в веб-чате 24/7",
                    "Единый дашборд для всех вакансий",
                    "Интеграция с hh.ru, SuperJob и другими",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mini demo card */}
              <div className="bg-muted/50 border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                    <span className="text-xs text-muted-foreground">Обработка в реальном времени</span>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>

                {[
                  { name: "Иван Петров", status: "Приглашён на интервью", time: "2 мин назад" },
                  { name: "Анна Сидорова", status: "Проходит AI-скрининг", time: "только что" },
                  { name: "Михаил Козлов", status: "Интервью завершено", time: "5 мин назад" },
                ].map((candidate, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-medium border border-border">
                        {candidate.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">{candidate.status}</div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{candidate.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA link */}
          <div className="text-center mt-10">
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-foreground hover:text-foreground/70 font-medium transition-colors group"
            >
              Узнать больше о возможностях
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}