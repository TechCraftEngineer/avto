"use client"

import { useState, useMemo } from "react"
import { Calculator, TrendingUp, Clock, Users, ArrowRight } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Slider } from "@qbs-autonaim/ui/components/slider"
import { motion } from "framer-motion"
import { env } from "@/env"

export function ROICalculator() {
  const [vacancies, setVacancies] = useState(10)
  const [hireTimeManual, setHireTimeManual] = useState(21)
  const [hrSalary, setHrSalary] = useState(80000)

  const calculations = useMemo(() => {
    const hireTimeWithQBS = Math.round(hireTimeManual / 3)
    const savedDays = hireTimeManual - hireTimeWithQBS

    const hourlyRate = hrSalary / 160
    const hoursPerVacancy = 20
    const hoursWithQBS = 5
    const savedHoursPerVacancy = hoursPerVacancy - hoursWithQBS
    const totalSavedHours = savedHoursPerVacancy * vacancies
    const moneySaved = Math.round(totalSavedHours * hourlyRate)

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
    <section className="relative py-24 md:py-32 bg-dub-grid-dark border-y border-border/20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/30 mb-6">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Калькулятор ROI</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Калькулятор экономии на подборе персонала
          </h2>
          <p className="text-lg text-muted-foreground">
            Вакансий в месяц, среднее время закрытия, зарплата HR — узнайте, сколько рублей и часов сэкономите
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Input Panel */}
            <div className="bg-card border border-border/60 rounded-xl p-8 shadow-sm">
              <h3 className="text-base font-semibold mb-8 flex items-center gap-2">
                Текущая ситуация
              </h3>

              <div className="space-y-8">
                {/* Vacancies slider */}
                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-sm font-medium">Вакансий в месяц</label>
                    <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded">
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
                    <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded">
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
                    <span className="text-sm font-bold text-foreground bg-muted px-2 py-0.5 rounded">
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
              {/* Main result card - accent, animate on value change */}
              <motion.div
                key={calculations.moneySaved}
                initial={{ scale: 1.02 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-card border-2 border-emerald-500/30 rounded-xl p-8 shadow-lg shadow-emerald-500/5"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Потенциальная экономия в месяц
                </div>
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                  {calculations.moneySaved.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-sm text-muted-foreground">или {calculations.totalSavedHours} часов работы HR</div>
              </motion.div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-border/60 rounded-lg p-5 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Время найма</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.hireTimeWithQBS}</span>
                    <span className="text-sm text-muted-foreground">дней</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">вместо {hireTimeManual} дней</div>
                </div>

                <div className="bg-card border border-border/60 rounded-lg p-5 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Эффективность</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">+{calculations.efficiency - 100}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">больше кандидатов</div>
                </div>

                <div className="bg-card border border-border/60 rounded-lg p-5 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Users className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">С QBS</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.candidatesWithQBS}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">кандидатов обработано</div>
                </div>

                <div className="bg-card border border-border/60 rounded-lg p-5 hover:border-border hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Экономия</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{calculations.savedDays}</span>
                    <span className="text-sm text-muted-foreground">дней</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">на каждую вакансию</div>
                </div>
              </div>

              {/* CTA */}
              <Button
                size="lg"
                asChild
                className="w-full h-12 rounded-lg group"
              >
                <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
                  Начать экономить
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
