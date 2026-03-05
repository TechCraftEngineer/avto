"use client"

import type React from "react"

import { useState } from "react"
import {
  Play,
  Pause,
  Mic,
  Bot,
  CheckCircle2,
  Volume2,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  ArrowRight,
  Brain,
  MessageSquare,
} from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"

export function VoiceInterviewSection() {
  return (
    <section className="relative bg-background py-20 md:py-32 overflow-hidden">
      {/* Top separator line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6 shadow-sm">
            <Mic className="h-5 w-5 text-foreground" />
            <span className="text-muted-foreground">Интервью в веб-чате</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Интервью — это не просто вопросы. <br className="hidden md:block" />
            <span className="text-muted-foreground">Это понимание кандидата.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            QBS Автонайм проводит голосовые интервью в веб-чате, транскрибирует ответы и анализирует soft skills — всё автоматически.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-border bg-card px-6 py-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="h-4 w-4" />
              Веб-чат
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl mb-20">
          {/* Floating stat cards */}
          <div className="absolute -left-4 top-1/4 z-10 hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
                  <Volume2 className="h-6 w-6 text-violet-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Точность</div>
                  <div className="text-xs text-muted-foreground">транскрибации</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-violet-600">98.5%</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[98.5%] bg-violet-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/3 z-10 hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Анализ</div>
                  <div className="text-xs text-muted-foreground">soft skills</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Уверенность</span>
                  <span className="font-medium text-blue-600">87%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Структура</span>
                  <span className="font-medium text-blue-600">92%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Релевантность</span>
                  <span className="font-medium text-blue-600">95%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 bottom-1/4 z-10 hidden lg:block">
            <div className="rounded-xl border border-border bg-card p-4 shadow-xl">
              <div className="text-sm text-muted-foreground mb-2">Обработано сегодня</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">247</span>
                <span className="text-sm text-emerald-600 font-medium">+23%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">голосовых сообщений</div>
            </div>
          </div>

          {/* Main demo */}
          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-xl border border-border bg-card overflow-hidden aspect-video flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-foreground" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground mb-2">
                    Видео: Голосовое интервью в действии
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    qbs-voice-interview-demo.mp4
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    20-30 сек • 1920x1080 • MP4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="Естественный диалог"
              description="Бот адаптируется под ответы и ведёт беседу как живой рекрутер"
              color="blue"
            />
            <FeatureCard
              icon={<Mic className="h-6 w-6" />}
              title="Голосовые ответы"
              description="Кандидатам удобнее говорить — конверсия выше на 40%"
              color="violet"
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="AI-анализ ответов"
              description="Оценка уверенности, структуры речи и релевантности"
              color="emerald"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color = "blue",
}: {
  icon: React.ReactNode
  title: string
  description: string
  color?: "blue" | "violet" | "emerald"
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-foreground/20">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <button className="inline-flex items-center gap-1 text-sm font-medium text-foreground mt-3 group-hover:gap-2 transition-all">
            Подробнее <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
