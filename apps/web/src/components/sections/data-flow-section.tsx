"use client"

import { motion } from "framer-motion"
import { FileText, Link2, MessageSquare, Target } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ArrowRight } from "lucide-react"
import { env } from "@/env"

const sources = [
  { icon: Link2, label: "HeadHunter", sublabel: "hh.ru" },
  { icon: FileText, label: "SuperJob", sublabel: "отклики" },
  { icon: FileText, label: "Резюме", sublabel: "загрузка" },
  { icon: MessageSquare, label: "Веб-чат", sublabel: "интервью" },
]

const stagger = { delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

const PATH_DATA = [
  "M 50 0 C 50 38 165 48 200 80",
  "M 150 0 C 150 40 182 50 200 80",
  "M 250 0 C 250 40 218 50 200 80",
  "M 350 0 C 350 38 235 48 200 80",
]

function ConnectorLines({ delay }: { delay: number }) {
  return (
    <div className="hidden lg:block relative h-24 w-full">
      <svg
        className="absolute inset-0 w-full h-full text-border"
        viewBox="0 0 400 96"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="dataflow-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {PATH_DATA.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke="url(#dataflow-line-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0.5 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              pathLength: { delay: delay + i * 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
              opacity: { delay: delay + i * 0.08, duration: 0.4 },
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export function DataFlowSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-muted/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-[830px] text-center">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
            <span className="text-foreground">Подключайте за минуты. </span>
            <span className="text-muted-foreground font-medium">
              Без долгой настройки. QBS синхронизируется с HeadHunter и SuperJob — отклики попадают в систему сразу,
              резюме проходят скрининг автоматически.
            </span>
          </h3>
          <div className="mt-7">
            <Button size="lg" asChild className="h-11 px-6 font-medium">
              <a href={env.NEXT_PUBLIC_APP_URL}>
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Diagram */}
        <div className="grid grid-cols-[24px_1fr_24px] mt-10 lg:mt-14 w-full max-w-4xl mx-auto select-none">
          {/* Top-left corner */}
          <div className="relative">
            <svg
              width="100%"
              height="1"
              className="text-border absolute right-0 -bottom-px"
            >
              <line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>
            <svg
              width="1"
              height="100%"
              className="text-border absolute -right-px bottom-0 h-6"
            >
              <line
                x1="0.5"
                y1="0"
                x2="0.5"
                y2="100%"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Sources + Connectors + Card */}
          <div className="relative flex flex-col items-center pt-6">
            {/* Source badges - mobile stacked */}
            <div className="flex flex-col lg:hidden gap-3 w-full max-w-xs mx-auto">
              {sources.map((src, i) => (
                <motion.div
                  key={src.label}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    ...stagger,
                    delay: stagger.delay + i * 0.12,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 shadow-sm"
                >
                  <src.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium text-sm text-foreground block">{src.label}</span>
                    {src.sublabel && (
                      <span className="text-xs text-muted-foreground">{src.sublabel}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Source badges - desktop row */}
            <div className="hidden lg:grid relative w-full grid-cols-4 gap-x-6 justify-items-center">
              {sources.map((src, i) => (
                <motion.div
                  key={src.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: stagger.delay + i * 0.1,
                    type: "spring",
                    stiffness: 350,
                    damping: 22,
                  }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 shadow-sm cursor-default"
                >
                  <src.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="font-medium text-sm text-foreground block">{src.label}</span>
                    {src.sublabel && (
                      <span className="text-xs text-muted-foreground">{src.sublabel}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <ConnectorLines delay={stagger.delay + 0.35} />

            {/* Central candidate card */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: stagger.delay + 0.6,
                type: "spring",
                stiffness: 300,
                damping: 24,
              }}
              className="relative w-full max-w-3xl mt-6 lg:mt-2 border border-border rounded-2xl bg-card shadow-xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-[280px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
                {/* Left: Candidate summary */}
                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-3">
                    <div className="size-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-foreground">
                      АП
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-base">Анна Петрова</div>
                      <div className="text-sm text-muted-foreground">Python Developer</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Москва • отклик 15.02.2025</div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                      <Target className="h-4 w-4 text-emerald-600" />
                      <span className="font-bold text-emerald-600 text-sm">94%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">рейтинг скрининга</span>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <div><span className="font-medium">Навыки:</span> Python, FastAPI, PostgreSQL, Docker</div>
                    <div><span className="font-medium">Опыт:</span> 6 лет • ex Yandex, VK</div>
                    <div><span className="font-medium">Зарплата:</span> от 250 000 ₽</div>
                  </div>
                </div>

                {/* Right: Activity / status */}
                <div className="p-5 lg:p-6">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Источники и этапы</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">HeadHunter</span>
                      <span className="text-emerald-600 font-medium">скрининг пройден</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Веб-чат</span>
                      <span className="text-foreground font-medium">интервью пройдено ✓</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-emerald-500/5">
                      <span className="text-muted-foreground">Статус</span>
                      <span className="text-emerald-600 font-semibold">В лонг-листе</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Рекомендация: пригласить на финальное интервью
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bottom grid placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: stagger.delay + 0.9,
                type: "spring",
                stiffness: 400,
                damping: 28,
              }}
              className="w-full mt-6 h-20 lg:h-24 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center"
            >
              <span className="text-xs text-muted-foreground">
                Остальные кандидаты в воронке найма →
              </span>
            </motion.div>
          </div>

          {/* Bottom-right corner */}
          <div className="relative">
            <svg
              width="100%"
              height="1"
              className="text-border absolute -bottom-px left-0"
            >
              <line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>
            <svg
              width="1"
              height="100%"
              className="text-border absolute bottom-0 -left-px h-6"
            >
              <line
                x1="0.5"
                y1="0"
                x2="0.5"
                y2="100%"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
