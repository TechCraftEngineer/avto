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
import Button from "@qbs-autonaim/ui/button"

export function VoiceInterviewSection() {
  const [selectedPlatform, setSelectedPlatform] = useState<"telegram" | "webchat">("telegram")

  return (
    <section className="relative bg-background py-20 md:py-32 overflow-hidden">
      {/* Top separator line with gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Subtle radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.05),transparent)]" />

      {/* Gradient orbs - reduced opacity */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6 shadow-sm">
            <Mic className="h-5 w-5 text-primary" />
            Голосовые интервью в Telegram и Веб-чате
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
            Интервью — это не просто вопросы. <br className="hidden md:block" />
            <span className="text-muted-foreground">Это понимание кандидата.</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            QBS Автонайм проводит{" "}
            <span className="inline-flex items-center gap-1 text-foreground font-medium">
              голосовые интервью
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20">
                <Mic className="h-4 w-4 text-violet-500" />
              </span>
            </span>{" "}
            в Telegram или веб-чате, транскрибирует{" "}
            <span className="inline-flex items-center gap-1 text-foreground font-medium">
              ответы
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
                <MessageSquare className="h-4 w-4 text-primary" />
              </span>
            </span>{" "}
            и анализирует{" "}
            <span className="inline-flex items-center gap-1 text-foreground font-medium">
              soft skills
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent/20">
                <Brain className="h-4 w-4 text-accent" />
              </span>
            </span>{" "}
            — всё автоматически.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setSelectedPlatform("telegram")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedPlatform === "telegram"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.121.099.154.232.17.326.016.094.036.308.02.475z" />
                </svg>
                Telegram
              </div>
            </button>
            <button
              onClick={() => setSelectedPlatform("webchat")}
              className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                selectedPlatform === "webchat"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Веб-чат
              </div>
            </button>
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl mb-20">
          {/* Floating stat cards */}
          <div className="absolute -left-4 top-1/4 z-10 hidden lg:block animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Volume2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Точность</div>
                  <div className="text-xs text-muted-foreground">транскрибации</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">98.5%</div>
              <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[98.5%] bg-gradient-to-r from-violet-500 to-purple-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/3 z-10 hidden lg:block animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Анализ</div>
                  <div className="text-xs text-muted-foreground">soft skills</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Уверенность</span>
                  <span className="font-medium text-foreground">87%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Структура</span>
                  <span className="font-medium text-foreground">92%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Релевантность</span>
                  <span className="font-medium text-foreground">95%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 bottom-1/4 z-10 hidden lg:block animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="text-sm text-muted-foreground mb-2">Обработано сегодня</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">247</span>
                <span className="text-sm text-emerald-500 font-medium">+23%</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">голосовых сообщений</div>
            </div>
          </div>

          {/* Main demo - conditional rendering based on selected platform */}
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-violet-500/10 to-accent/10 blur-3xl rounded-3xl" />

            {/*
              VIDEO PLACEHOLDER: Голосовое интервью в действии
              Файл: /videos/qbs-voice-interview-demo.mp4
              Что записать:
              - Реальное голосовое интервью в Telegram или веб-чате (20-30 секунд)
              - Показать: Вопрос AI → Кандидат отвечает голосом → Транскрибация появляется → AI анализирует
              - Акцент на скорости транскрибации и точности
              - Показать оценку soft skills в конце
              Длительность: 20-30 секунд
              Разрешение: 1920x1080 (16:9)
              Формат: MP4 (H.264)
              Примечание: Показать реальный процесс, не ускоренный
            */}
            <div className="relative rounded-2xl border-2 border-dashed border-violet-400/30 bg-violet-500/5 overflow-hidden aspect-video flex items-center justify-center mb-4">
              <div className="text-center space-y-4 p-8">
                <div className="h-20 w-20 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-violet-500" />
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

            {/* Fallback: Keep interactive demos */}
            <div className="opacity-50">
              {selectedPlatform === "telegram" ? <TelegramAppDemo /> : <WebChatDemo />}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="Естественный диалог"
              description="Бот адаптируется под ответы и ведёт беседу как живой рекрутер"
            />
            <FeatureCard
              icon={<Mic className="h-6 w-6" />}
              title="Голосовые ответы"
              description="Кандидатам удобнее говорить — конверсия выше на 40%"
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="AI-анализ ответов"
              description="Оценка уверенности, структуры речи и релевантности"
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
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/20">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          <button className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-3 group-hover:gap-2 transition-all">
            Подробнее <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function TelegramAppDemo() {
  const [playingId, setPlayingId] = useState<number | null>(null)

  const chats = [
    { name: "QBS Дмитрий", lastMsg: "Расскажите о самом сложном...", time: "12:34", unread: 2, active: true },
    { name: "Мама", lastMsg: "Как дела?", time: "11:20", unread: 0, active: false },
    { name: "Работа", lastMsg: "Встреча в 15:00", time: "10:45", unread: 5, active: false },
  ]

  const messages = [
    {
      id: 1,
      type: "bot",
      content:
        "Здравствуйте! Меня зовут Дмитрий, я рекрутер компании TechCorp. Мы получили ваш отклик на вакансию Python Developer. Готовы пройти короткое интервью?",
      time: "12:30",
    },
    {
      id: 2,
      type: "user",
      content: "Да, готов!",
      time: "12:31",
    },
    {
      id: 3,
      type: "bot",
      content: "Отлично! Расскажите о вашем опыте работы с Python. Можете ответить голосовым сообщением — так удобнее.",
      time: "12:32",
    },
    {
      id: 4,
      type: "voice",
      duration: "0:47",
      time: "12:34",
      transcription:
        "Работаю с Python уже 6 лет. Последние 3 года специализируюсь на бэкенд-разработке с использованием Django и FastAPI.",
    },
    {
      id: 5,
      type: "bot",
      content: "Отличный опыт! Расскажите о самом сложном техническом вызове, с которым вы сталкивались?",
      time: "12:35",
    },
  ]

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      <div className="flex h-[500px]">
        {/* Left sidebar - Chats list */}
        <div className="w-[240px] bg-[#0e1621] border-r border-[#1c2733] flex-col hidden md:flex">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2733]">
            <button className="text-white/70 hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/70">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <Search className="h-6 w-6 text-white/70" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat, idx) => (
              <div
                key={idx}
                className={`px-3 py-3 cursor-pointer transition-colors ${
                  chat.active ? "bg-[#2b5278]" : "hover:bg-[#151e27]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium shrink-0 text-sm">
                    {chat.name === "QBS Дмитрий" ? "QD" : chat.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-medium text-white text-sm truncate">{chat.name}</span>
                      <span className="text-[10px] text-white/50 shrink-0">{chat.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white/70 truncate">{chat.lastMsg}</span>
                      {chat.unread > 0 && (
                        <span className="bg-[#0088cc] text-white text-[10px] rounded-full px-1.5 py-0.5 shrink-0">
                          {chat.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Chat window */}
        <div className="flex-1 flex flex-col bg-[#0e1621]">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[#17212b] border-b border-[#1c2733]">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 text-white text-sm font-medium">
              QD
            </div>
            <div className="flex-1">
              <div className="font-medium text-white text-sm">QBS Дмитрий</div>
              <div className="text-xs text-emerald-400">онлайн</div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                <Search className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e1621]">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === "bot" && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[#182533] px-3.5 py-2 text-white shadow-lg">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className="text-[10px] text-white/40 mt-1 text-right">{msg.time}</div>
                    </div>
                  </div>
                )}

                {msg.type === "user" && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#2b5278] px-3.5 py-2 text-white shadow-lg">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <div className="text-[10px] text-white/40 mt-1 text-right">{msg.time} ✓✓</div>
                    </div>
                  </div>
                )}

                {msg.type === "voice" && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="max-w-[80%]">
                      <VoiceMessage
                        duration={msg.duration!}
                        time={msg.time!}
                        isPlaying={playingId === msg.id}
                        onToggle={() => setPlayingId(playingId === msg.id ? null : msg.id)}
                      />
                    </div>
                    <div className="max-w-[80%] rounded-xl bg-[#182533]/80 border border-[#2b5278]/30 px-3.5 py-2.5 shadow-lg">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium">Транскрибация</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">{msg.transcription}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-3 py-2.5 bg-[#17212b] border-t border-[#1c2733]">
            <div className="flex items-center gap-2 bg-[#182533] rounded-full px-3 py-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
              >
                <Smile className="h-5 w-5" />
              </Button>
              <input
                type="text"
                placeholder="Сообщение"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button size="icon" className="h-7 w-7 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white rounded-full">
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceMessage({
  duration,
  time,
  isPlaying,
  onToggle,
}: {
  duration: string
  time: string
  isPlaying: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl rounded-tr-sm bg-[#2b5278] px-3 py-2.5 min-w-[200px] shadow-lg">
      <Button
        size="icon"
        variant="ghost"
        className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white shrink-0"
        onClick={onToggle}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-[2px] h-5 mb-1">
          {Array.from({ length: 28 }).map((_, i) => {
            const height = Math.random() * 100
            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-all ${
                  isPlaying ? "bg-white animate-pulse" : "bg-white/60"
                }`}
                style={{
                  height: `${Math.max(15, height)}%`,
                  animationDelay: `${i * 30}ms`,
                }}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/70">{duration}</span>
          <span className="text-[10px] text-white/40">{time} ✓✓</span>
        </div>
      </div>
    </div>
  )
}

function WebChatDemo() {
  const [playingId, setPlayingId] = useState<number | null>(null)

  const messages = [
    {
      id: 1,
      type: "bot",
      content:
        "Здравствуйте! Меня зовут Дмитрий, я AI-ассистент компании TechCorp. Мы получили ваш отклик на вакансию Python Developer. Готовы пройти короткое интервью?",
      time: "12:30",
    },
    {
      id: 2,
      type: "user",
      content: "Да, готов!",
      time: "12:31",
    },
    {
      id: 3,
      type: "bot",
      content: "Отлично! Расскажите о вашем опыте работы с Python. Можете ответить голосовым сообщением.",
      time: "12:32",
    },
    {
      id: 4,
      type: "voice",
      duration: "0:47",
      time: "12:34",
      transcription:
        "Работаю с Python уже 6 лет. Последние 3 года специализируюсь на бэкенд-разработке с использованием Django и FastAPI.",
    },
    {
      id: 5,
      type: "bot",
      content: "Отличный опыт! Расскажите о самом сложном техническом вызове, с которым вы сталкивались?",
      time: "12:35",
    },
  ]

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 text-white text-sm font-medium">
            AI
          </div>
          <div>
            <div className="font-semibold text-foreground">QBS AI-Рекрутер</div>
            <div className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Онлайн
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-9 w-9">
            <Search className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-9 w-9">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[450px] overflow-y-auto p-6 space-y-4 bg-background">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === "bot" && (
              <div className="flex justify-start">
                <div className="max-w-[75%]">
                  <div className="flex items-start gap-2 mb-1">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-medium shrink-0">
                      AI
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
                      <p className="text-sm leading-relaxed text-foreground">{msg.content}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-10">{msg.time}</div>
                </div>
              </div>
            )}

            {msg.type === "user" && (
              <div className="flex justify-end">
                <div className="max-w-[75%]">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                  <div className="text-xs text-muted-foreground text-right mt-1">{msg.time} ✓✓</div>
                </div>
              </div>
            )}

            {msg.type === "voice" && (
              <div className="flex flex-col items-end gap-2">
                <div className="max-w-[75%]">
                  <WebVoiceMessage
                    duration={msg.duration!}
                    time={msg.time!}
                    isPlaying={playingId === msg.id}
                    onToggle={() => setPlayingId(playingId === msg.id ? null : msg.id)}
                  />
                </div>
                <div className="max-w-[75%] rounded-xl border border-border bg-muted/50 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span className="text-xs text-emerald-500 font-medium">Транскрибация</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{msg.transcription}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-muted/30 border-t border-border">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0">
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5">
            <input
              type="text"
              placeholder="Напишите сообщение или запишите голосовое..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <Button size="icon" className="h-10 w-10 shrink-0">
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function WebVoiceMessage({
  duration,
  time,
  isPlaying,
  onToggle,
}: {
  duration: string
  time: string
  isPlaying: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 min-w-[220px] shadow-sm">
      <Button
        size="icon"
        variant="ghost"
        className="h-10 w-10 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground shrink-0"
        onClick={onToggle}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </Button>
      <div className="flex-1">
        <div className="flex items-center gap-[2px] h-6 mb-1">
          {Array.from({ length: 24 }).map((_, i) => {
            const height = Math.random() * 100
            return (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-all ${
                  isPlaying ? "bg-primary-foreground animate-pulse" : "bg-primary-foreground/60"
                }`}
                style={{
                  height: `${Math.max(20, height)}%`,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-primary-foreground/70">{duration}</span>
          <span className="text-xs text-primary-foreground/50">{time} ✓✓</span>
        </div>
      </div>
    </div>
  )
}