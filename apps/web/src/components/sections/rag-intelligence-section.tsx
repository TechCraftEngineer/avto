"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Database, Search, FileText, Users, TrendingUp, Sparkles, Send, CheckCircle2, Play } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"

const sampleQuestions = [
  "Сколько кандидатов на позицию Python Developer?",
  "Какая средняя конверсия в офферы за последний месяц?",
  "Покажи топ-3 кандидатов на вакансию Senior Frontend",
  "Какие вакансии имеют наименьший отклик?",
]

export function RAGIntelligenceSection() {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  const handleQuestionClick = (index: number) => {
    setActiveQuestion(index)
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }

  return (
    <section className="relative bg-muted/30 py-20 md:py-32 overflow-hidden">
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Gradient orbs */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6 shadow-sm"
          >
            <Brain className="h-5 w-5 text-violet-500" />
            <span className="text-muted-foreground">Аналитик с доступом к данным</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance"
          >
            Аналитика по кандидатам и вакансиям — <span className="text-violet-500">вопрос на русском, ответ из ваших данных</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Вопрос на русском — ответ из вашей базы: резюме, история откликов, воронка, внутренние документы. Без выдумок, только факты
          </motion.p>
        </div>

        {/* Main demo */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Data sources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Источники данных</h3>
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
                    color: "text-blue-500",
                    bgColor: "bg-blue-500/10",
                  },
                  {
                    icon: FileText,
                    label: "Вакансии",
                    description: "Описания, требования, статусы",
                    count: "47",
                    color: "text-emerald-500",
                    bgColor: "bg-emerald-500/10",
                  },
                  {
                    icon: TrendingUp,
                    label: "Аналитика",
                    description: "Метрики, конверсии, воронки",
                    count: "Real-time",
                    color: "text-violet-500",
                    bgColor: "bg-violet-500/10",
                  },
                  {
                    icon: Database,
                    label: "Внутренние документы",
                    description: "Политики, процессы, FAQ",
                    count: "156",
                    color: "text-amber-500",
                    bgColor: "bg-amber-500/10",
                  },
                ].map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                  >
                    <div
                      className={`h-12 w-12 rounded-lg ${source.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <source.icon className={`h-6 w-6 ${source.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm mb-0.5">{source.label}</div>
                      <div className="text-xs text-muted-foreground">{source.description}</div>
                    </div>
                    <div className="text-xs font-bold text-muted-foreground shrink-0">{source.count}</div>
                  </motion.div>
                ))}
              </div>

              {/* How it works */}
              <div className="mt-8 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground mb-1">Принцип работы</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      1. Вы задаёте вопрос на естественном языке
                      <br />
                      2. Система находит релевантные фрагменты в ваших источниках
                      <br />
                      3. Формирует ответ только на основе найденных данных
                      <br />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Chat interface */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 via-transparent to-amber-500/10 blur-2xl rounded-3xl" />

              {/* Fallback: Keep interactive chat demo */}
              <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden opacity-50">
                {/* Chat header */}
                <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      AI
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">QBS Аналитик</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        RAG активен
                      </div>
                    </div>
                  </div>
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Messages */}
                <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-background">
                  {/* Initial message */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
                        <p className="text-sm text-foreground leading-relaxed">
                          Привет! Я могу ответить на любые вопросы о ваших кандидатах, вакансиях и аналитике. Задайте
                          вопрос ниже 👇
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-2">12:30</div>
                    </div>
                  </div>

                  {/* User question */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeQuestion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%]">
                        <div className="rounded-2xl rounded-tr-sm bg-violet-500 text-white px-4 py-3 shadow-sm">
                          <p className="text-sm leading-relaxed">{sampleQuestions[activeQuestion]}</p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right mt-1 mr-2">12:31 ✓✓</div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* AI Response */}
                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-start"
                      >
                        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`answer-${activeQuestion}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%]">
                          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
                            <RAGResponse questionIndex={activeQuestion} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 ml-2">12:32</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input area */}
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground">
                      Попробуйте другой вопрос...
                    </div>
                    <Button size="icon" className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick questions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(index)}
                        disabled={activeQuestion === index}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          activeQuestion === index
                            ? "bg-violet-500/20 border-violet-500/30 text-violet-500 cursor-not-allowed"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-violet-500/50"
                        }`}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mt-16 grid md:grid-cols-3 gap-6"
        >
          {[
            {
              icon: CheckCircle2,
              title: "Только факты",
              description: "Ответы строятся на ваших данных, без галлюцинаций",
            },
            {
              icon: Sparkles,
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
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all"
            >
              <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-4">
                <benefit.icon className="h-6 w-6 text-violet-500" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">{benefit.title}</h4>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </motion.div>

        <div className="mt-12 text-center">
          <a
            href="/products/ai-analyst"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium transition-colors"
          >
            <Brain className="h-5 w-5" />
            Подробнее об аналитике
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
            { id: "active", color: "blue-500", label: "87 активных кандидатов", desc: "" },
            { id: "screened", color: "emerald-500", label: "23 прошли скрининг", desc: " (топ 30%)" },
            { id: "interview", color: "amber-500", label: "12 на этапе интервью", desc: "" },
          ].map((stat) => (
            <div key={stat.id} className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full bg-${stat.color}`} />
              <span className="text-foreground">
                <span className={`font-bold text-${stat.color}`}>{stat.label}</span>
                {stat.desc}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
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
        <div className="bg-emerald-500/10 rounded-lg p-3 mb-3">
          <div className="text-3xl font-bold text-emerald-500 mb-1">3.8%</div>
          <div className="text-xs text-muted-foreground">234 отклика → 9 офферов</div>
        </div>
        <p className="text-sm text-foreground">
          Это на <span className="font-semibold text-emerald-500">+0.6%</span> выше, чем в прошлом месяце (3.2%)
        </p>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
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
            <div key={i} className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">{candidate.name}</span>
                <span className="text-xs font-bold text-violet-500">{candidate.score}%</span>
              </div>
              <div className="text-xs text-muted-foreground">{candidate.skills}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1">
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
            <div key={i} className="bg-card rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">{vacancy.title}</span>
                <span className="text-xs font-bold text-red-500">{vacancy.responses} откликов</span>
              </div>
              <div className="text-xs text-muted-foreground">Опубликовано {vacancy.days} дней назад</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
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