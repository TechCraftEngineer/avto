"use client"

import { useState } from "react"
import {
  Brain,
  BarChart3,
  Link2,
  Mic,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  Target,
  Play,
  Pause,
  Upload,
  MessageSquare,
  Globe,
  Palette,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ScreenshotPreview } from "../ui/screenshot-preview"

const features = [
  {
    id: "ai-screening",
    icon: Brain,
    label: "Скрининг",
    title: "Скрининг резюме по вашим критериям",
    description: "Автоматический отбор резюме: система оценивает кандидатов по настраиваемым параметрам — навыки, опыт, релевантность — и выставляет рейтинг за секунды",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    stats: [
      { label: "Точность отсева", value: "97%" },
      { label: "Время на резюме", value: "< 5 сек" },
      { label: "Настраиваемых параметров", value: "50+" },
    ],
    demo: "screening",
  },
  {
    id: "voice-interview",
    icon: Mic,
    label: "Интервью",
    title: "Интервью в Telegram и веб-чате",
    description: "Кандидат проходит интервью в удобное время — голосом или текстом. Транскрипция сохраняется, ответы оцениваются автоматически",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    stats: [
      { label: "Качество транскрипции", value: "98.5%" },
      { label: "Доступность", value: "24/7" },
      { label: "Рост конверсии", value: "+40%" },
    ],
    demo: "interview",
  },
  {
    id: "prequalification",
    icon: Target,
    label: "Преквалификация",
    title: "Проверка до отклика",
    description:
      "Кнопка на сайте: кандидат загружает резюме, проходит короткий чат и получает оценку соответствия. Откликаются только те, кто подходит",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    stats: [
      { label: "Меньше нерелевантных", value: "-65%" },
      { label: "Экономия на скрининге", value: "4ч/день" },
      { label: "Удовлетворённость кандидатов", value: "+40%" },
    ],
    demo: "prequalification",
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Аналитика",
    title: "Воронка и метрики",
    description: "Конверсия по этапам, время до найма, узкие места — данные для оптимизации процесса с опорой на факты",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    stats: [
      { label: "Экономия на отчётности", value: "85%" },
      { label: "Точность прогнозов", value: "94%" },
      { label: "Цикл найма", value: "от 3 дней" },
    ],
    demo: "analytics",
  },
  {
    id: "integrations",
    icon: Link2,
    label: "Интеграции",
    title: "Интеграция HeadHunter и SuperJob",
    description: "Подключение hh.ru, SuperJob, Avito, Telegram — отклики с площадок подбора персонала попадают в систему автоматически",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    stats: [
      { label: "Поддерживаемых сервисов", value: "10+" },
      { label: "Время настройки", value: "2 мин" },
      { label: "Интервал синхронизации", value: "15 сек" },
    ],
    demo: "integrations",
  },
  {
    id: "whitelabel",
    icon: Globe,
    label: "Белый лейбл",
    title: "Под вашим брендом",
    description:
      "Чат-рекрутер на корпоративном сайте или в career-разделе: свой домен, логотип и цвета без упоминания QBS",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    stats: [
      { label: "Настройка витрины", value: "5 мин" },
      { label: "Кастомизация", value: "100%" },
      { label: "Поддержка", value: "24/7" },
    ],
    demo: "whitelabel",
  },
]

const integrationLogos = [
  { name: "HeadHunter", short: "hh", color: "bg-red-500" },
  { name: "Telegram", short: "TG", color: "bg-sky-500" },
  { name: "SuperJob", short: "SJ", color: "bg-blue-600" },
  { name: "Avito", short: "AV", color: "bg-green-500" },
  { name: "WhatsApp", short: "WA", color: "bg-emerald-500" },
  { name: "1C:ЗУП", short: "1C", color: "bg-yellow-500" },
]

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(features[0]!)

  return (
    <section id="features" className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Soft glow at top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,oklch(0.96_0.01_265/0.35),transparent_60%)]" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6"
          >
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">Функционал</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance"
          >
            Всё для подбора персонала
            <br />
            <span className="text-muted-foreground">скрининг резюме, интервью, аналитика</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Скрининг резюме из HeadHunter и SuperJob, интервью в Telegram, преквалификация, воронка найма — плюс white-label для корпоративного сайта
          </motion.p>
        </div>

        {/* Feature tabs - scrollable on mobile */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-muted/50 border border-border">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeFeature.id === feature.id
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <feature.icon
                  className={`h-4 w-4 md:h-5 md:w-5 ${activeFeature.id === feature.id ? feature.color : ""}`}
                />
                <span className="hidden sm:inline">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature content */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Left: Info */}
                <div className="space-y-6">
                  <div className={`inline-flex items-center gap-2 rounded-full ${activeFeature.bgColor} px-3 py-1.5`}>
                    <activeFeature.icon className={`h-4 w-4 ${activeFeature.color}`} />
                    <span className={`text-sm font-medium ${activeFeature.color}`}>{activeFeature.label}</span>
                  </div>

                  <h3 className="text-3xl font-bold text-foreground">{activeFeature.title}</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">{activeFeature.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {activeFeature.stats.map((stat, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                        <div className={`text-2xl font-bold ${activeFeature.color}`}>{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  <Button className="group" size="lg">
                    Попробовать бесплатно
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                {/* Right: Demo */}
                <div className="relative">
                  <div className={`absolute -inset-4 ${activeFeature.bgColor} blur-3xl rounded-3xl opacity-30`} />
                  <div className="relative">
                    {activeFeature.demo === "screening" && <ScreeningDemo />}
                    {activeFeature.demo === "interview" && <InterviewDemo />}
                    {activeFeature.demo === "prequalification" && <PrequalificationDemo />}
                    {activeFeature.demo === "analytics" && <AnalyticsDemo />}
                    {activeFeature.demo === "integrations" && <IntegrationsDemo />}
                    {activeFeature.demo === "whitelabel" && <WhiteLabelDemo />}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom quick features */}
        <div className="mt-20 grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Zap, title: "Быстрый старт", desc: "Подключение за 2 минуты" },
            { icon: Users, title: "Командный режим", desc: "Общий доступ и роли" },
            { icon: Target, title: "97% точность отсева", desc: "По вашим критериям" },
            { icon: CheckCircle2, title: "152-ФЗ / 115-ФЗ", desc: "Соответствие требованиям РФ" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScreeningDemo() {
  return (
    <ScreenshotPreview
      src="/screenshots/app-ai-screening-candidate-card-1920x1080.png"
      alt="AI-скрининг кандидата"
    />
  )
}

function InterviewDemo() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="rounded-2xl border border-border bg-[#0e1621] overflow-hidden shadow-xl">
      {/* Telegram header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#17212b] border-b border-[#1c2733]">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
          QD
        </div>
        <div className="flex-1">
          <div className="font-medium text-white text-sm">QBS Дмитрий</div>
          <div className="text-xs text-emerald-400">онлайн</div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#182533] px-3.5 py-2 text-white">
            <p className="text-sm">Расскажите о вашем опыте работы с Python</p>
            <div className="text-[10px] text-white/40 mt-1 text-right">12:32</div>
          </div>
        </div>

        {/* Voice message */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2.5 rounded-2xl rounded-tr-sm bg-[#2b5278] px-3 py-2.5 min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-[2px] h-5 mb-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all ${isPlaying ? "bg-white animate-pulse" : "bg-white/60"}`}
                    style={{ height: `${Math.max(20, Math.random() * 100)}%` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/70">0:47</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transcription */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-xl bg-[#182533]/80 border border-[#2b5278]/30 px-3.5 py-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-medium">Транскрибация</span>
            </div>
            <p className="text-xs text-white/80">
              Работаю с Python уже 6 лет. Последние 3 года специализируюсь на бэкенд-разработке...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrequalificationDemo() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="space-y-4">
        {/* Step 1 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Target className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Кнопка на сайте</div>
            <div className="text-xs text-muted-foreground">«Узнай, подходишь ли ты»</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </motion.div>

        {/* Step 2 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Upload className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Загрузка резюме</div>
            <div className="text-xs text-muted-foreground">CV анализируется AI</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </motion.div>

        {/* Step 3 */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">Чат-ассистент</div>
            <div className="text-xs text-muted-foreground">Общение с ассистентом</div>
          </div>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </motion.div>

        {/* Step 4 - Result */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Результат: 87% соответствие</div>
              <div className="text-xs text-muted-foreground">Рекомендуем отправить отклик</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function AnalyticsDemo() {
  return (
    <ScreenshotPreview
      src="/screenshots/app-analytics-funnel-dashboard-1920x1080.png"
      alt="Аналитика воронки найма"
    />
  )
}

function IntegrationsDemo() {
  return (
    <ScreenshotPreview
      src="/screenshots/app-integrations-settings-1920x1080.png"
      alt="Интеграции с сервисами"
    />
  )
}

function WhiteLabelDemo() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
      {/* Browser mockup */}
      <div className="rounded-xl border border-border overflow-hidden mb-6">
        <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground font-mono">
            careers.company.ru/chat
          </div>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm">Career Chat Company</div>
              <div className="text-xs text-emerald-500">онлайн</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground max-w-[80%]">
              Привет! Я ассистент по подбору Company. Расскажи о себе.
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3">
        {[
          { icon: Globe, label: "Свой домен (CNAME)" },
          { icon: Palette, label: "Полный брендинг" },
          { icon: CheckCircle2, label: "Без упоминаний QBS" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <item.icon className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-muted-foreground">{item.label}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}