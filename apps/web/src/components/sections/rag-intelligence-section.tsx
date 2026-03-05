"use client"

import { useState } from "react"
import { Brain, Database, Search, FileText, Users, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { motion, AnimatePresence } from "framer-motion"

const sampleQuestions = [
  "Сколько кандидатов на позицию Python Developer?",
  "Какая средняя конверсия в офферы за последний месяц?",
  "Покажи топ-3 кандидатов на вакансию Senior Frontend",
  "Какие вакансии имеют наименьший отклик?",
]

export function RAGIntelligenceSection() {
  const [activeQuestion, setActiveQuestion] = useState(0)

  return (
    <section className="relative py-24 md:py-32 bg-dub-glow-top">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-muted/30 mb-6">
            <Brain className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Аналитик с доступом к данным</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Аналитика по кандидатам и вакансиям
          </h2>
          <p className="text-lg text-muted-foreground">
            Вопрос на русском — ответ из вашей базы: резюме, история откликов, воронка, внутренние документы
          </p>
        </div>

        {/* Main demo */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Data sources */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Источники данных</h3>
                <p className="text-muted-foreground mb-6">
                  Система ищет ответы во внутренних источниках вашей компании в реальном времени
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    icon: Users,
                    label: "База кандидатов",
                    description: "Резюме, отклики, интервью",
                    count: "1,234",
                  },
                  {
                    icon: FileText,
                    label: "Вакансии",
                    description: "Описания, требования, статусы",
                    count: "47",
                  },
                  {
                    icon: TrendingUp,
                    label: "Аналитика",
                    description: "Метрики, конверсии, воронки",
                    count: "Real-time",
                  },
                  {
                    icon: Database,
                    label: "Внутренние документы",
                    description: "Политики, процессы, FAQ",
                    count: "156",
                  },
                ].map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <source.icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm mb-0.5">{source.label}</div>
                      <div className="text-xs text-muted-foreground">{source.description}</div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground shrink-0">{source.count}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/60">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-1">Принцип работы</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      1. Вы задаёте вопрос на естественном языке
                      <br />
                      2. Система находит релевантные фрагменты в ваших источниках
                      <br />
                      3. Формирует ответ только на основе найденных данных
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Chat interface */}
            <div className="relative">
              <div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm">
                {/* Chat header */}
                <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold text-sm">
                      AI
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">QBS Аналитик</div>
                      <div className="text-xs flex items-center gap-1.5 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600">RAG активен</span>
                      </div>
                    </div>
                  </div>
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Messages */}
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-muted/10">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg bg-card border border-border/60 px-4 py-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        Привет! Я могу ответить на любые вопросы о ваших кандидатах, вакансиях и аналитике. Задайте
                        вопрос ниже 👇
                      </p>
                      <div className="text-xs text-muted-foreground mt-1">12:30</div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`user-${activeQuestion}`}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%] rounded-lg bg-foreground text-background px-4 py-3">
                        <p className="text-sm leading-relaxed">{sampleQuestions[activeQuestion]}</p>
                        <div className="text-xs opacity-70 mt-1">12:31</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`response-${activeQuestion}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[85%] rounded-lg bg-card border border-border/60 px-4 py-3">
                        <RAGResponse questionIndex={activeQuestion} />
                        <div className="text-xs text-muted-foreground mt-1">12:32</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Input area */}
                <div className="border-t border-border/60 p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background rounded-lg border border-border/60 px-4 py-2.5 text-sm text-muted-foreground">
                      Попробуйте другой вопрос...
                    </div>
                    <Button size="icon" className="shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick questions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveQuestion(index)}
                        disabled={activeQuestion === index}
                        className={`text-xs px-3 py-2 rounded-md border transition-all ${
                          activeQuestion === index
                            ? "bg-muted border-border text-foreground cursor-not-allowed"
                            : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50"
                        }`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckCircle2,
              title: "Только факты",
              description: "Ответы строятся на ваших данных, без галлюцинаций",
            },
            {
              icon: Brain,
              title: "Естественный язык",
              description: "Задавайте вопросы как в разговоре с аналитиком",
            },
            {
              icon: Database,
              title: "Изоляция данных",
              description: "Доступ только к внутренним источникам вашей компании",
            },
          ].map((benefit, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-6 rounded-lg bg-card border border-border/60 hover:border-border hover:shadow-sm transition-all"
            >
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                <benefit.icon className="h-5 w-5 text-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-2 text-sm">{benefit.title}</h4>
              <p className="text-xs text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <a
            href="/products/ai-analyst"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors group"
          >
            Подробнее об аналитике
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  )
}

function RAGResponse({ questionIndex }: { questionIndex: number }) {
  if (questionIndex === 0) {
    return (
      <div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          На позицию <span className="font-semibold">Python Developer</span> в данный момент:
        </p>
        <div className="space-y-2 text-sm">
          {[
            { label: "87 активных кандидатов" },
            { label: "23 прошли скрининг (топ 30%)" },
            { label: "12 на этапе интервью" },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
              <span className="text-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1">
          <Database className="h-3 w-3" />
          Источник: База кандидатов, обновлено 5 мин назад
        </div>
      </div>
    )
  }

  if (questionIndex === 1) {
    return (
      <div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          За последние 30 дней средняя конверсия в офферы составила:
        </p>
        <div className="bg-muted/50 rounded-lg p-3 mb-3 border border-border/60">
          <div className="text-3xl font-bold text-foreground mb-1">3.8%</div>
          <div className="text-xs text-muted-foreground">234 отклика → 9 офферов</div>
        </div>
        <p className="text-sm text-foreground">
          Это на <span className="font-semibold">+0.6%</span> выше, чем в прошлом месяце (3.2%)
        </p>
        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Источник: Аналитика найма за 01.12.2025 - 31.12.2025
        </div>
      </div>
    )
  }

  if (questionIndex === 2) {
    return (
      <div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Топ-3 кандидата на позицию <span className="font-semibold">Senior Frontend Developer</span>:
        </p>
        <div className="space-y-2">
          {[
            { name: "Анна Петрова", score: 96, skills: "React, TypeScript, Next.js" },
            { name: "Дмитрий Козлов", score: 94, skills: "Vue.js, Nuxt, GraphQL" },
            { name: "Елена Сидорова", score: 91, skills: "Angular, RxJS, Jest" },
          ].map((candidate, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">{candidate.name}</span>
                <span className="text-xs font-bold text-foreground">{candidate.score}%</span>
              </div>
              <div className="text-xs text-muted-foreground">{candidate.skills}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          Источник: Скрининг по вакансии #3421
        </div>
      </div>
    )
  }

  if (questionIndex === 3) {
    return (
      <div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Вакансии с наименьшим откликом за последнюю неделю:
        </p>
        <div className="space-y-2">
          {[
            { title: "DevOps Engineer", responses: 3, days: 12 },
            { title: "Data Scientist", responses: 5, days: 8 },
            { title: "iOS Developer", responses: 7, days: 6 },
          ].map((vacancy, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 border border-border/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">{vacancy.title}</span>
                <span className="text-xs font-bold text-foreground">{vacancy.responses} откликов</span>
              </div>
              <div className="text-xs text-muted-foreground">Опубликовано {vacancy.days} дней назад</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span className="font-semibold">Рекомендация:</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Рассмотрите возможность пересмотра описания вакансий или увеличения бюджета на продвижение
          </p>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Источник: Активные вакансии + Статистика откликов
        </div>
      </div>
    )
  }

  return null
}
