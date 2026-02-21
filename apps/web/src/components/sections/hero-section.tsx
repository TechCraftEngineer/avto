"use client"

import { Button } from "@qbs-autonaim/ui/components/button"
import { motion } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { env } from "@/env"

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

          {/* Right side - Platform Video */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            {/* Видео обзор платформы - сгенерировано с помощью Remotion */}
            <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-border/50">
              <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                <source src="/videos/qbs-platform-overview-demo.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}