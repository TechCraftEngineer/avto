"use client"

import { useState, useMemo } from "react"
import { Calculator, TrendingUp, Clock, Users, Sparkles, ArrowRight } from "lucide-react"
import Button from "@qbs-autonaim/ui/button"
import { Slider } from "@qbs-autonaim/ui/slider"
import { env } from "@/env"

export function ROICalculator() {
  const [vacancies, setVacancies] = useState(10)
  const [hireTimeManual, setHireTimeManual] = useState(21)
  const [hrSalary, setHrSalary] = useState(80000)

  const calculations = useMemo(() => {
    // С QBS время найма сокращается в 3 раза
    const hireTimeWithQBS = Math.round(hireTimeManual / 3)
    const savedDays = hireTimeManual - hireTimeWithQBS

    // Экономия на зарплате HR (дней в месяц * часов в день * стоимость часа)
    const hourlyRate = hrSalary / 160 // 160 рабочих часов в месяц
    const hoursPerVacancy = 20 // часов на одну вакансию вручную
    const hoursWithQBS = 5 // часов с QBS
    const savedHoursPerVacancy = hoursPerVacancy - hoursWithQBS
    const totalSavedHours = savedHoursPerVacancy * vacancies
    const moneySaved = Math.round(totalSavedHours * hourlyRate)

    // Количество обработанных кандидатов
    const candidatesManual = vacancies * 50
    const candidatesWithQBS = vacancies * 200

    return {
      hireTimeWithQBS,
      savedDays,
      moneySaved,
      totalSavedHours,
      candidatesManual,
      candidatesWithQBS,
      efficiency: Math.round((candidatesWithQBS / candidatesManual) * 100),
    }
  }, [vacancies, hireTimeManual, hrSalary])

  return (
    <section className="relative bg-muted/30 py-20 md:py-32 overflow-hidden">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Soft gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,oklch(0.96_0.01_265/0.2),transparent_70%)]" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <Calculator className="h-4 w-4 text-primary" />
            <span>Калькулятор ROI</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
            Рассчитайте вашу <span className="text-primary">экономию</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Узнайте, сколько времени и денег вы сэкономите с QBS Автонайм. Настройте параметры под ваши процессы.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Input Panel */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-semibold mb-8 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ваши параметры
              </h3>

              <div className="space-y-8">
                {/* Vacancies slider */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Вакансий в месяц</label>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {vacancies}
                    </span>
                  </div>
                  <Slider
                    value={[vacancies]}
                    onValueChange={(value) => setVacancies(value[0]!)}
                    min={1}
                    max={50}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Hire time slider */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Текущее время найма (дней)</label>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {hireTimeManual}
                    </span>
                  </div>
                  <Slider
                    value={[hireTimeManual]}
                    onValueChange={(value) => setHireTimeManual(value[0]!)}
                    min={7}
                    max={45}
                    step={1}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>7 дней</span>
                    <span>45 дней</span>
                  </div>
                </div>

                {/* HR Salary slider */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Зарплата HR-менеджера (₽/мес)</label>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {hrSalary.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <Slider
                    value={[hrSalary]}
                    onValueChange={(value) => setHrSalary(value[0]!)}
                    min={40000}
                    max={200000}
                    step={5000}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>40 000 ₽</span>
                    <span>200 000 ₽</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {/* Main result card */}
              <div className="bg-gradient-to-br from-primary/10 via-violet-500/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
                <div className="text-sm text-muted-foreground mb-2">Ваша экономия в месяц</div>
                <div className="text-5xl font-bold text-foreground mb-2">
                  {calculations.moneySaved.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-sm text-muted-foreground">или {calculations.totalSavedHours} часов работы HR</div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Clock className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">Время найма</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.hireTimeWithQBS}</span>
                    <span className="text-sm text-muted-foreground">дней</span>
                  </div>
                  <div className="text-xs text-emerald-600 mt-1">вместо {hireTimeManual} дней</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">Эффективность</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">+{calculations.efficiency - 100}%</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">больше кандидатов</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">С QBS</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.candidatesWithQBS}</span>
                  </div>
                  <div className="text-xs text-violet-600 mt-1">кандидатов обработано</div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-xs text-muted-foreground">Экономия</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.savedDays}</span>
                    <span className="text-sm text-muted-foreground">дней</span>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">на каждую вакансию</div>
                </div>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                asChild
                className="w-full h-12 bg-foreground text-background hover:bg-neutral-800 rounded-xl group"
              >
                <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
                  Начать экономить
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}