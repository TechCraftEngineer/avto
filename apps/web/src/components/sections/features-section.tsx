"use client"

import { useState } from "react"
import {
  Brain,
  BarChart3,
  Link2,
  Mic,
  CheckCircle2,
  ArrowRight,
  Users,
  Zap,
  Target,
  Upload,
  MessageSquare,
  Globe,
  Palette,
} from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ScreenshotPreview } from "../ui/screenshot-preview"

const features = [
  {
    id: "ai-screening",
    icon: Brain,
    label: "Скрининг",
    title: "Скрининг резюме по вашим критериям",
    description: "Автоматический отбор резюме: система оценивает кандидатов по настраиваемым параметрам — навыки, опыт, релевантность — и выставляет рейтинг за секунды",
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
    title: "Интервью в веб-чате",
    description: "Кандидат проходит интервью в удобное время — голосом или текстом. Транскрипция сохраняется, ответы оцениваются автоматически",
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
    stats: [
      { label: "Поддерживаемых сервисов", value: "10+" },
      { label: "Время настройки", value: "2 мин" },
      { label: "Интервал синхронизации", value: "15 сек" },
    ],
    demo: "integrations",
  },
]

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(features[0]!)

  return (
    <section id="features" className="relative py-24 md:py-32 border-b border-border/40">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Всё для подбора персонала
          </h2>
          <p className="text-lg text-muted-foreground">
            Скрининг резюме из HeadHunter и SuperJob, интервью в веб-чате, преквалификация, воронка найма
          </p>
        </div>

        {/* Feature tabs */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="inline-flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border/60">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeFeature.id === feature.id
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <feature.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{feature.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Info */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 border border-border/60">
                <activeFeature.icon className="h-4 w-4 text-foreground" />
                <span className="text-sm font-medium text-foreground">{activeFeature.label}</span>
              </div>

              <h3 className="text-3xl font-bold text-foreground">{activeFeature.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{activeFeature.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {activeFeature.stats.map((stat, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-lg p-4 text-center hover:border-border hover:shadow-sm transition-all">
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Button className="group" size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Right: Demo */}
            <div className="relative">
              {activeFeature.demo === "screening" && <ScreeningDemo />}
              {activeFeature.demo === "interview" && <InterviewDemo />}
              {activeFeature.demo === "prequalification" && <PrequalificationDemo />}
              {activeFeature.demo === "analytics" && <AnalyticsDemo />}
              {activeFeature.demo === "integrations" && <IntegrationsDemo />}
            </div>
          </div>
        </div>

        {/* Bottom quick features */}
        <div className="mt-20 grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { icon: Zap, title: "Быстрый старт", desc: "Подключение за 2 минуты" },
            { icon: Users, title: "Командный режим", desc: "Общий доступ и роли" },
            { icon: Target, title: "97% точность отсева", desc: "По вашим критериям" },
            { icon: CheckCircle2, title: "152-ФЗ / 115-ФЗ", desc: "Соответствие требованиям РФ" },
          ].map((item, i) => (
            <div key={i} className="text-center p-6 rounded-lg border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all">
              <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-foreground" />
              </div>
              <h4 className="font-semibold text-foreground mb-1 text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
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
  return (
    <div className="rounded-lg border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/60">
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
          QD
        </div>
        <div className="flex-1">
          <div className="font-medium text-foreground text-sm">QBS Дмитрий</div>
          <div className="text-xs text-muted-foreground">онлайн</div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto bg-muted/10">
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-lg bg-card border border-border/60 px-3 py-2">
            <p className="text-sm text-foreground">Расскажите о вашем опыте работы с Python</p>
            <div className="text-xs text-muted-foreground mt-1">12:32</div>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg bg-foreground text-background px-3 py-2">
            <p className="text-sm">Работаю с Python уже 6 лет...</p>
            <div className="text-xs opacity-70 mt-1">12:33</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PrequalificationDemo() {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
      <div className="space-y-3">
        {[
          { icon: Target, title: "Кнопка на сайте", desc: "«Узнай, подходишь ли ты»" },
          { icon: Upload, title: "Загрузка резюме", desc: "CV анализируется AI" },
          { icon: MessageSquare, title: "Чат-ассистент", desc: "Общение с ассистентом" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/60">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <step.icon className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.desc}</div>
            </div>
            <CheckCircle2 className="h-4 w-4 text-foreground" />
          </div>
        ))}

        <div className="p-3 rounded-lg bg-foreground/5 border border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Результат: 87% соответствие</div>
              <div className="text-xs text-muted-foreground">Рекомендуем отправить отклик</div>
            </div>
          </div>
        </div>
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
