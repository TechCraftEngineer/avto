"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Brain, Database, Search, FileText, Users, TrendingUp, Sparkles, Send, CheckCircle2, Zap, ArrowRight, Activity } from "lucide-react"
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
  const [activeSource, setActiveSource] = useState<number | null>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleQuestionClick = (index: number) => {
    setActiveQuestion(index)
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 2000)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative bg-gradient-to-b from-background via-muted/20 to-background py-24 md:py-40 overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]" />

      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-5xl text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2.5 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-blue-500/10 px-5 py-2 text-sm font-semibold mb-8 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
          >
            <div className="relative">
              <Brain className="h-5 w-5 text-violet-400" />
              <motion.div
                className="absolute inset-0 rounded-full bg-violet-400/30 blur-md"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Аналитик с доступом к данным
            </span>
            <Activity className="h-4 w-4 text-violet-400 animate-pulse" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance"
          >
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Аналитика по кандидатам —{" "}
            </span>
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                вопрос на русском
              </span>
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-blue-500/20 blur-2xl -z-10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Ответ из вашей базы: резюме, история откликов, воронка, внутренние документы.{" "}
            <span className="text-foreground font-semibold">Без выдумок, только факты</span>
          </motion.p>
        </div>

        {/* Main demo */}
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr,1.2fr] gap-12 items-start">
            {/* Left: Data sources */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, type: "spring" }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="relative">
                <motion.div
                  className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-violet-500 via-purple-500 to-transparent rounded-full"
                  initial={{ height: 0 }}
                  whileInView={{ height: "100%" }}
                  transition={{ duration: 1, delay: 0.3 }}
                  viewport={{ once: true }}
                />
                <h3 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
                  <Zap className="h-7 w-7 text-violet-500" />
                  Источники данных
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Система ищет ответы во внутренних источниках вашей компании в реальном времени
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Users,
                    label: "База кандидатов",
                    description: "Резюме, отклики, интервью",
                    count: "1,234",
                    color: "blue",
                    gradient: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: FileText,
                    label: "Вакансии",
                    description: "Описания, требования, статусы",
                    count: "47",
                    color: "emerald",
                    gradient: "from-emerald-500 to-teal-500",
                  },
                  {
                    icon: TrendingUp,
                    label: "Аналитика",
                    description: "Метрики, конверсии, воронки",
                    count: "Real-time",
                    color: "violet",
                    gradient: "from-violet-500 to-purple-500",
                  },
                  {
                    icon: Database,
                    label: "Внутренние документы",
                    description: "Политики, процессы, FAQ",
                    count: "156",
                    color: "amber",
                    gradient: "from-amber-500 to-orange-500",
                  },
                ].map((source, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    onHoverStart={() => setActiveSource(i)}
                    onHoverEnd={() => setActiveSource(null)}
                    className="group relative"
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${source.gradient} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`}
                    />
                    <div className="relative flex items-center gap-5 p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:shadow-xl hover:shadow-black/5 transition-all duration-300 group-hover:scale-[1.02]">
                      <motion.div
                        className={`relative h-14 w-14 rounded-xl bg-gradient-to-br ${source.gradient} flex items-center justify-center shrink-0 shadow-lg`}
                        animate={activeSource === i ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        <source.icon className="h-7 w-7 text-white" />
                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${source.gradient} blur-md opacity-50`}
                          animate={activeSource === i ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.6 }}
                        />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground mb-1 text-base">{source.label}</div>
                        <div className="text-sm text-muted-foreground">{source.description}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className={`text-sm font-bold bg-gradient-to-r ${source.gradient} bg-clip-text text-transparent`}>
                          {source.count}
                        </div>
                        <motion.div
                          className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* How it works */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="relative mt-8 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/30 backdrop-blur-sm overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="relative flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                      Принцип работы
                      <ArrowRight className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-violet-500">1</span>
                        </div>
                        <span>Вы задаёте вопрос на естественном языке</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-violet-500">2</span>
                        </div>
                        <span>Система находит релевантные фрагменты в ваших источниках</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-violet-500">3</span>
                        </div>
                        <span>Формирует ответ только на основе найденных данных</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Chat interface */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, type: "spring" }}
              viewport={{ once: true }}
              className="relative lg:sticky lg:top-8"
            >
              {/* Animated glow effect */}
              <motion.div
                className="absolute -inset-8 bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-blue-500/20 blur-3xl rounded-3xl"
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Chat demo */}
              <div className="relative rounded-3xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                {/* Chat header */}
                <div className="relative flex items-center justify-between px-6 py-5 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 backdrop-blur-xl border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <motion.div
                        className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Brain className="h-6 w-6" />
                      </motion.div>
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 blur-lg opacity-50"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-base">QBS Аналитик</div>
                      <div className="text-xs text-emerald-500 flex items-center gap-1.5 font-medium">
                        <motion.span
                          className="h-2 w-2 rounded-full bg-emerald-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        RAG активен
                      </div>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </motion.div>
                </div>

                {/* Messages */}
                <div className="h-[480px] overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-background/50 to-background/80 backdrop-blur-sm">
                  {/* Initial message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%]">
                      <div className="relative rounded-2xl rounded-tl-md bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm px-5 py-4 shadow-lg border border-border/30">
                        <p className="text-sm text-foreground leading-relaxed">
                          Привет! Я могу ответить на любые вопросы о ваших кандидатах, вакансиях и аналитике. Задайте
                          вопрос ниже 👇
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 ml-3 font-medium">12:30</div>
                    </div>
                  </motion.div>

                  {/* User question */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeQuestion}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="flex justify-end"
                    >
                      <div className="max-w-[85%]">
                        <div className="relative rounded-2xl rounded-tr-md bg-gradient-to-br from-violet-500 via-purple-500 to-violet-600 text-white px-5 py-4 shadow-xl">
                          <p className="text-sm leading-relaxed font-medium">{sampleQuestions[activeQuestion]}</p>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        </div>
                        <div className="text-xs text-muted-foreground text-right mt-2 mr-3 font-medium flex items-center justify-end gap-1">
                          12:31
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            ✓✓
                          </motion.span>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* AI Response */}
                  <AnimatePresence mode="wait">
                    {isTyping ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex justify-start"
                      >
                        <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm px-5 py-4 shadow-lg border border-border/30">
                          <div className="flex items-center gap-1.5">
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-violet-500"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                            />
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-purple-500"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-blue-500"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`answer-${activeQuestion}`}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex justify-start"
                      >
                        <div className="max-w-[85%]">
                          <div className="rounded-2xl rounded-tl-md bg-gradient-to-br from-muted/80 to-muted/60 backdrop-blur-sm px-5 py-4 shadow-lg border border-border/30">
                            <RAGResponse questionIndex={activeQuestion} />
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 ml-3 font-medium">12:32</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input area */}
                <div className="border-t border-border/50 p-5 bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-background/80 backdrop-blur-sm rounded-xl border border-border/50 px-5 py-3 text-sm text-muted-foreground shadow-inner hover:border-violet-500/30 transition-colors">
                      Попробуйте другой вопрос...
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="icon" className="shrink-0 h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg">
                        <Send className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  </div>

                  {/* Quick questions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {sampleQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => handleQuestionClick(index)}
                        disabled={activeQuestion === index}
                        whileHover={activeQuestion !== index ? { scale: 1.05, y: -2 } : {}}
                        whileTap={activeQuestion !== index ? { scale: 0.95 } : {}}
                        className={`text-xs px-4 py-2 rounded-xl border font-medium transition-all ${
                          activeQuestion === index
                            ? "bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-violet-500/40 text-violet-500 cursor-not-allowed shadow-inner"
                            : "bg-card/80 backdrop-blur-sm border-border/50 text-muted-foreground hover:text-foreground hover:border-violet-500/50 hover:shadow-md"
                        }`}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mt-24 grid md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: CheckCircle2,
              title: "Только факты",
              description: "Ответы строятся на ваших данных, без галлюцинаций",
              gradient: "from-emerald-500 to-teal-500",
            },
            {
              icon: Sparkles,
              title: "Естественный язык",
              description: "Задавайте вопросы как в разговоре с аналитиком",
              gradient: "from-violet-500 to-purple-500",
            },
            {
              icon: Database,
              title: "Изоляция данных",
              description: "Доступ только к внутренним источникам вашей компании",
              gradient: "from-blue-500 to-cyan-500",
            },
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-10 rounded-3xl blur-xl transition-opacity duration-500`} />
              <div className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:shadow-2xl transition-all duration-300">
                <motion.div
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <benefit.icon className="h-8 w-8 text-white" />
                </motion.div>
                <h4 className="font-bold text-foreground mb-3 text-lg">{benefit.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <motion.a
            href="/products/ai-analyst"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500 hover:from-violet-600 hover:via-purple-600 hover:to-blue-600 text-white rounded-2xl font-bold text-base shadow-2xl shadow-violet-500/30 transition-all group"
          >
            <Brain className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            Подробнее об аналитике
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>
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