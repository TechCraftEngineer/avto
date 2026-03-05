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
      { label: "Точность отсева", value: "97%", color: "text-emerald-600" },
      { label: "Время на резюме", value: "< 5 сек", color: "text-blue-600" },
      { label: "Настраиваемых параметров", value: "50+", color: "text-violet-600" },
    ],
    demo: "screening",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    id: "voice-interview",
    icon: Mic,
    label: "Интервью",
    title: "Интервью в веб-чате",
    description: "Кандидат проходит интервью в удобное время — голосом или текстом. Транскрипция сохраняется, ответы оцениваются автоматически",
    stats: [
      { label: "Качество транскрипции", value: "98.5%", color: "text-emerald-600" },
      { label: "Доступность", value: "24/7", color: "text-blue-600" },
      { label: "Рост конверсии", value: "+40%", color: "text-amber-600" },
    ],
    demo: "interview",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "prequalification",
    icon: Target,
    label: "Преквалификация",
    title: "Проверка до отклика",
    description:
      "Кнопка на сайте: кандидат загружает резюме, проходит короткий чат и получает оценку соответствия. Откликаются только те, кто подходит",
    stats: [
      { label: "Меньше нерелевантных", value: "-65%", color: "text-emerald-600" },
      { label: "Экономия на скрининге", value: "4ч/день", color: "text-blue-600" },
      { label: "Удовлетворённость кандидатов", value: "+40%", color: "text-amber-600" },
    ],
    demo: "prequalification",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: "analytics",
    icon: BarChart3,
    label: "Аналитика",
    title: "Воронка и метрики",
    description: "Конверсия по этапам, время до найма, узкие места — данные для оптимизации процесса с опорой на факты",
    stats: [
      { label: "Экономия на отчётности", value: "85%", color: "text-emerald-600" },
      { label: "Точность прогнозов", value: "94%", color: "text-blue-600" },
      { label: "Цикл найма", value: "от 3 дней", color: "text-violet-600" },
    ],
    demo: "analytics",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "integrations",
    icon: Link2,
    label: "Интеграции",
    title: "Интеграция HeadHunter и SuperJob",
    description: "Подключение hh.ru, SuperJob, Avito, Telegram — отклики с площадок подбора персонала попадают в систему автоматически",
    stats: [
      { label: "Поддерживаемых сервисов", value: "10+", color: "text-blue-600" },
      { label: "Время настройки", value: "2 мин", color: "text-emerald-600" },
      { label: "Интервал синхронизации", value: "15 сек", color: "text-violet-600" },
    ],
    demo: "integrations",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
]

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(features[0]!)

  return (
    <section id="features" className="relative py-24 md:py-32 bg-muted/10">
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
              <div className={`inline-flex items-center gap-2 rounded-md ${activeFeature.bgColor} px-3 py-1.5 border border-border/60`}>
                <activeFeature.icon className={`h-4 w-4 ${activeFeature.color}`} />
                <span className={`text-sm font-medium ${activeFeature.color}`}>{activeFeature.label}</span>
              </div>

              <h3 className="text-3xl font-bold text-foreground">{activeFeature.title}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{activeFeature.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {activeFeature.stats.map((stat, i) => (
                  <div key={i} className="bg-card border border-border/60 rounded-lg p-4 text-center hover:border-border hover:shadow-sm transition-all">
                    <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
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
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/60">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
          AI
        </div>
        <div className="flex-1">
          <div className="font-medium text-foreground text-sm">QBS AI-Рекрутер</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            онлайн
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto bg-muted/10">
        {/* Bot message */}
        <div className="flex justify-start">
          <div className="max-w-[85%]">
            <div className="rounded-xl rounded-tl-sm bg-card border border-border/60 px-3.5 py-2.5 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed">Расскажите о вашем опыте работы с Python. Можете ответить голосом или текстом.</p>
              <div className="text-xs text-muted-foreground mt-1.5">12:32</div>
            </div>
          </div>
        </div>

        {/* User voice message */}
        <div className="flex justify-end">
          <div className="max-w-[85%]">
            <div className="rounded-xl rounded-tr-sm bg-foreground text-background px-3.5 py-2.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-background/20 flex items-center justify-center">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                  </svg>
                </div>
                <div className="flex-1 flex items-center gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-background/60"
                      style={{ height: `${Math.random() * 16 + 8}px` }}
                    />
                  ))}
                </div>
                <span className="text-xs opacity-90">0:47</span>
              </div>
              <div className="text-xs opacity-90 text-right">12:34</div>
            </div>
            
            {/* Transcription */}
            <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-medium text-emerald-700">Транскрибация</span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">Работаю с Python уже 6 лет. Последние 3 года специализируюсь на бэкенд-разработке с Django и FastAPI.</p>
            </div>
          </div>
        </div>

        {/* Bot follow-up */}
        <div className="flex justify-start">
          <div className="max-w-[85%]">
            <div className="rounded-xl rounded-tl-sm bg-card border border-border/60 px-3.5 py-2.5 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed">Отличный опыт! Расскажите о самом сложном техническом вызове?</p>
              <div className="text-xs text-muted-foreground mt-1.5">12:35</div>
            </div>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="px-3 py-3 bg-muted/30 border-t border-border/60">
        <div className="flex items-center gap-2 bg-card rounded-lg border border-border/60 px-3 py-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="Напишите сообщение..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            disabled
          />
          <button className="h-7 w-7 rounded-lg bg-foreground hover:bg-foreground/90 flex items-center justify-center text-background transition-colors">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function PrequalificationDemo() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <div className="space-y-3">
        {[
          { 
            icon: Target, 
            title: "Кнопка на сайте", 
            desc: "«Узнай, подходишь ли ты»",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            status: "done"
          },
          { 
            icon: Upload, 
            title: "Загрузка резюме", 
            desc: "CV анализируется AI",
            color: "text-violet-600",
            bgColor: "bg-violet-50",
            status: "done"
          },
          { 
            icon: MessageSquare, 
            title: "Чат-ассистент", 
            desc: "Общение с ассистентом",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            status: "done"
          },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/60">
            <div className={`h-8 w-8 rounded-lg ${step.bgColor} flex items-center justify-center shrink-0`}>
              <step.icon className={`h-4 w-4 ${step.color}`} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.desc}</div>
            </div>
            <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </div>
          </div>
        ))}

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-900 mb-1">Результат: 87% соответствие</div>
              <div className="text-xs text-emerald-700">Рекомендуем отправить отклик на вакансию</div>
              <div className="mt-3 flex gap-2">
                <div className="px-2 py-1 rounded-md bg-emerald-100 text-xs font-medium text-emerald-700">
                  Python: 9/10
                </div>
                <div className="px-2 py-1 rounded-md bg-emerald-100 text-xs font-medium text-emerald-700">
                  Опыт: 6 лет
                </div>
              </div>
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
