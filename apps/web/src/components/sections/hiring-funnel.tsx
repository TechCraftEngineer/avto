"use client"

import { Users, Brain, MessageCircle, CheckCircle, ArrowRight, Zap, BarChart3, Target } from "lucide-react"

export function HiringFunnel() {
  return (
    <section className="relative bg-background py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Subtle radial gradient in center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.05),transparent)]" />

      {/* Soft gradient orbs - more subtle */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-500/[0.03] rounded-full blur-[100px]" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1] mb-6">
            Воронка найма. <br className="hidden md:block" />
            Под полным{" "}
            <span className="inline-flex items-center">
              <span className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-violet-500 text-white mx-2">
                <Brain className="w-6 h-6 md:w-7 md:h-7" />
              </span>
            </span>{" "}
            контролем AI.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Визуализируйте каждый этап. Автоматизируйте рутину. Нанимайте лучших в 3 раза быстрее.
          </p>
        </div>

        <div className="relative mx-auto max-w-6xl">
          {/* Floating stat cards */}
          <div className="absolute -left-4 md:left-0 top-8 z-10 animate-in slide-in-from-left duration-700">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Всего кандидатов</div>
                  <div className="text-xl font-bold">1,234</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 md:right-0 top-1/4 z-10 animate-in slide-in-from-right duration-700 delay-150">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">AI-рекомендаций</div>
                  <div className="text-xl font-bold text-violet-500">94%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 md:left-8 bottom-1/4 z-10 animate-in slide-in-from-left duration-700 delay-300">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Активных вакансий</div>
                  <div className="text-xl font-bold text-emerald-500">45</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 md:right-8 bottom-16 z-10 animate-in slide-in-from-right duration-700 delay-500">
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Среднее время найма</div>
                  <div className="text-xl font-bold text-amber-500">14 дней</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Мгновенный скрининг</h3>
            <p className="text-sm text-muted-foreground mb-3">
              AI обрабатывает 500+ резюме за минуты, выделяя лучших кандидатов.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="group p-6 rounded-2xl border border-border bg-card hover:border-violet-500/50 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Аналитика воронки</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Отслеживайте конверсию на каждом этапе и оптимизируйте процесс.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-medium text-violet-500 hover:gap-2 transition-all"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="group p-6 rounded-2xl border border-border bg-card hover:border-emerald-500/50 hover:shadow-lg transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Точный отбор</h3>
            <p className="text-sm text-muted-foreground mb-3">
              97% точность AI при оценке соответствия кандидата позиции.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm font-medium text-emerald-500 hover:gap-2 transition-all"
            >
              Подробнее <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}