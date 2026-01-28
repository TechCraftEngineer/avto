"use client"

import { Button } from "@qbs-autonaim/ui"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight, User, CheckCircle2, XCircle, Brain, Play } from "lucide-react"
import { useState, useEffect } from "react"
import { env } from "@/env"

// Candidate flow visualization
interface Candidate {
  id: string
  name: string
  role: string
  score: number
  approved: boolean
  stage: "entering" | "processing" | "result"
}

const candidateNames = [
  { name: "Анна С.", role: "Frontend Dev" },
  { name: "Михаил К.", role: "Backend Dev" },
  { name: "Елена П.", role: "Designer" },
  { name: "Дмитрий Л.", role: "Product Manager" },
  { name: "Ольга В.", role: "Data Analyst" },
  { name: "Иван М.", role: "DevOps" },
]

function CandidateFlowVisualization() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [processedCount, setProcessedCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const randomCandidate = candidateNames[Math.floor(Math.random() * candidateNames.length)]
      if (!randomCandidate) return

      const score = Math.floor(Math.random() * 40) + 60 // 60-100
      const approved = score >= 75

      const newCandidate: Candidate = {
        id: `candidate-${Date.now()}`,
        name: randomCandidate.name,
        role: randomCandidate.role,
        score,
        approved,
        stage: "entering",
      }

      setCandidates((prev) => [...prev, newCandidate])
      setProcessedCount((c) => c + 1)
      if (approved) setApprovedCount((c) => c + 1)

      // Update stages
      setTimeout(() => {
        setCandidates((prev) => prev.map((c) => (c.id === newCandidate.id ? { ...c, stage: "processing" } : c)))
      }, 800)

      setTimeout(() => {
        setCandidates((prev) => prev.map((c) => (c.id === newCandidate.id ? { ...c, stage: "result" } : c)))
      }, 1600)

      setTimeout(() => {
        setCandidates((prev) => prev.filter((c) => c.id !== newCandidate.id))
      }, 3000)
    }, 1200)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full h-[400px]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-amber-500/5 to-background rounded-2xl" />

      {/* Ambient glow around central AI node */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"
      />

      {/* Central AI Processing Node */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl border-4 border-white/30">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/40"
            style={{ width: "120%", height: "120%", left: "-10%", top: "-10%" }}
          />
        </div>
      </motion.div>

      {/* Path indicators */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0.1)" />
            <stop offset="50%" stopColor="rgba(251,191,36,0.3)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0.1)" />
          </linearGradient>
        </defs>
        {/* Left path */}
        <motion.path
          d="M 50 50 Q 200 200, 50 50"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        {/* Right path */}
        <motion.path
          d="M 550 50 Q 400 200, 550 50"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
      </svg>

      {/* Flowing candidate cards */}
      <AnimatePresence>
        {candidates.map((candidate) => {
          const yPosition = Math.random() * 40 + 30 // Random vertical position between 30-70%

          return (
            <motion.div
              key={candidate.id}
              initial={{
                left: "-10%",
                top: `${yPosition}%`,
                opacity: 0,
                scale: 0.8,
              }}
              animate={
                candidate.stage === "entering"
                  ? {
                      left: "40%",
                      top: `${yPosition}%`,
                      opacity: 1,
                      scale: 1,
                    }
                  : candidate.stage === "processing"
                    ? {
                        left: "50%",
                        top: "50%",
                        opacity: 1,
                        scale: 0.9,
                      }
                    : {
                        left: candidate.approved ? "110%" : "110%",
                        top: candidate.approved ? "35%" : "65%",
                        opacity: candidate.approved ? 1 : 0.3,
                        scale: candidate.approved ? 1 : 0.8,
                      }
              }
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            >
              {/* Candidate Card */}
              <div
                className={`
                relative bg-card border-2 rounded-xl p-3 shadow-lg backdrop-blur-sm min-w-[180px]
                ${candidate.stage === "processing" ? "ring-4 ring-amber-400/50" : ""}
                ${candidate.approved ? "border-emerald-400/60" : "border-border"}
              `}
              >
                <div className="flex items-center gap-3">
                  {/* Profile icon */}
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${candidate.approved ? "bg-emerald-400/20" : "bg-muted"}
                  `}
                  >
                    <User className={`h-5 w-5 ${candidate.approved ? "text-emerald-600" : "text-muted-foreground"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{candidate.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{candidate.role}</div>
                  </div>

                  {/* Status icon */}
                  {candidate.stage === "result" && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
                      {candidate.approved ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Score badge */}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">AI Score</span>
                  <span
                    className={`text-sm font-bold ${
                      candidate.score >= 85
                        ? "text-emerald-600"
                        : candidate.score >= 75
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {candidate.score}%
                  </span>
                </div>

                {/* Processing animation */}
                {candidate.stage === "processing" && (
                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-amber-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                  />
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Stats display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-4 right-4 flex justify-between gap-2"
      >
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex-1">
          <div className="text-xs text-muted-foreground">Обработано</div>
          <div className="text-lg font-bold text-foreground">{processedCount}</div>
        </div>
        <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-lg px-3 py-2 flex-1">
          <div className="text-xs text-emerald-600">Подходят</div>
          <div className="text-lg font-bold text-emerald-600">{approvedCount}</div>
        </div>
        <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 flex-1">
          <div className="text-xs text-muted-foreground">Точность</div>
          <div className="text-lg font-bold text-amber-600">94%</div>
        </div>
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border"
      >
        AI Скрининг кандидатов
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-[95vh] flex items-center bg-background overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.08),transparent)]" />

      {/* Dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#80808006_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container relative mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left side - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
                <Sparkles className="h-4 w-4" />
                <span>Более 500 компаний используют QBS</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]"
            >
              <span className="text-foreground">AI-платформа для</span>
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                автоматизации найма
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mb-10 max-w-lg mx-auto lg:mx-0 text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              Сократите время закрытия вакансий на 70%. AI-скрининг, умные интервью в Telegram и интеграция с hh.ru
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button
                size="lg"
                asChild
                className="min-w-[200px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all group"
              >
                <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
                  Начать бесплатно
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="min-w-[200px] h-12 text-base font-semibold border-2 bg-transparent"
              >
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Посмотреть демо
                </a>
              </Button>
            </motion.div>
          </div>

          {/* Right side - Candidate Flow Animation */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/*
              VIDEO PLACEHOLDER: Обзор платформы QBS
              Файл: /videos/qbs-platform-overview-demo.mp4
              Что записать:
              - Быстрый обзор всей платформы (30-45 секунд)
              - Показать: Dashboard → Candidates → AI-скрининг → Интервью → Аналитика
              - Плавные переходы между экранами
              - Акцент на скорости работы и автоматизации
              Длительность: 30-45 секунд
              Разрешение: 1920x1080 (16:9)
              Формат: MP4 (H.264)
              Примечание: Это главное видео на лендинге - должно быть динамичным и впечатляющим
            */}
            <div className="relative rounded-2xl border-2 border-dashed border-amber-400/30 bg-amber-500/5 overflow-hidden aspect-video flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
                  <Play className="h-10 w-10 text-amber-500" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground mb-2">
                    Видео: Обзор платформы QBS
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    qbs-platform-overview-demo.mp4
                  </div>
                  <div className="text-xs text-muted-foreground/70">
                    30-45 сек • 1920x1080 • MP4
                  </div>
                </div>
              </div>
            </div>

            {/* Fallback: Keep animation for now */}
            <div className="relative mt-4 opacity-50">
              <CandidateFlowVisualization />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}