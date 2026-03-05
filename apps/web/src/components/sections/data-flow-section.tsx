"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { FileText, Link2, MessageSquare, Target } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ArrowRight } from "lucide-react"
import { env } from "@/env"

const CANDIDATE_AVATAR = "/professional-hr-director.png"

const sources = [
  { icon: Link2, label: "HeadHunter", sublabel: "hh.ru" },
  { icon: FileText, label: "SuperJob", sublabel: "отклики" },
  { icon: FileText, label: "Резюме", sublabel: "загрузка" },
  { icon: MessageSquare, label: "Веб-чат", sublabel: "интервью" },
]

const stagger = { delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }

function ConnectorLines({ delay }: { delay: number }) {
  return (
    <div className="hidden lg:block relative h-24 w-full">
      <svg
        className="absolute inset-0 w-full h-full text-border"
        viewBox="0 0 800 96"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="dataflow-line-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Line from first source */}
        <motion.path
          d="M 100 0 C 100 40 280 50 400 96"
          fill="none"
          stroke="url(#dataflow-line-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            pathLength: { delay: delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: delay, duration: 0.4 },
          }}
        />
        {/* Line from second source */}
        <motion.path
          d="M 300 0 C 300 35 360 45 400 96"
          fill="none"
          stroke="url(#dataflow-line-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            pathLength: { delay: delay + 0.08, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: delay + 0.08, duration: 0.4 },
          }}
        />
        {/* Line from third source */}
        <motion.path
          d="M 500 0 C 500 35 440 45 400 96"
          fill="none"
          stroke="url(#dataflow-line-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            pathLength: { delay: delay + 0.16, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: delay + 0.16, duration: 0.4 },
          }}
        />
        {/* Line from fourth source */}
        <motion.path
          d="M 700 0 C 700 40 520 50 400 96"
          fill="none"
          stroke="url(#dataflow-line-grad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            pathLength: { delay: delay + 0.24, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
            opacity: { delay: delay + 0.24, duration: 0.4 },
          }}
        />
      </svg>
    </div>
  )
}

export function DataFlowSection() {
  return (
    <section className="relative pt-8 md:pt-12 pb-20 md:pb-28 overflow-hidden bg-muted/30">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            Подключайте за минуты
          </h3>
          <p className="mt-2 text-muted-foreground text-base md:text-lg">
            HeadHunter и SuperJob → отклики в системе → скрининг → карточка кандидата
          </p>
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
              <div className="h-full w-full gap-px grid grid-rows-[auto_244px] lg:grid-cols-[319px_1fr] lg:grid-rows-[auto_1fr]">
                {/* Left: Candidate summary */}
                <div className="relative flex flex-col bg-card p-4">
                  <div className="size-10 overflow-hidden rounded-full border border-border">
                    <Image
                      src={CANDIDATE_AVATAR}
                      alt="Анна Петрова"
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      priority
                    />
                  </div>
                  <div className="mt-3 flex">
                    <span className="font-semibold text-foreground text-lg leading-6 tracking-tight">Анна Петрова</span>
                  </div>
                  <div className="mt-0.5 flex">
                    <span className="font-medium text-sm leading-5 tracking-tight text-muted-foreground">Python Developer</span>
                  </div>
                  <div className="mt-3 flex gap-x-2 flex-wrap">
                    <div className="rounded-lg bg-card ring-1 ring-border ring-inset shadow-sm hover:shadow transition-shadow">
                      <div className="flex h-7 items-center gap-x-1.5 px-2">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm leading-5 tracking-tight truncate">Написать</span>
                      </div>
                    </div>
                    <div className="rounded-lg bg-card ring-1 ring-border ring-inset shadow-sm hover:shadow transition-shadow">
                      <div className="flex h-7 items-center gap-x-1.5 px-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                    <div className="rounded-lg bg-card ring-1 ring-border ring-inset shadow-sm hover:shadow transition-shadow">
                      <div className="flex h-7 items-center gap-x-1.5 px-2">
                        <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Highlights & Activity */}
                <div className="bg-card px-6 pt-6 pb-4 hidden lg:row-span-2 lg:block">
                  <div>
                    <div className="flex items-center gap-x-1.5 pl-1">
                      <svg width="14" height="14" fill="none" className="text-muted-foreground">
                        <rect x="1.75" y="1.75" width="4.2" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="1.75" y="9.25" width="4.2" height="3" rx="1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="8.05" y="1.65" width="4.2" height="3" rx="1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        <rect x="8.05" y="6.75" width="4.2" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-semibold text-foreground text-sm leading-5 tracking-tight">Основное</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-[176fr_176fr_218fr] grid-rows-[99px_99px] gap-[7px]">
                    {/* Summary card */}
                    <div className="overflow-hidden rounded-xl border border-border transition-colors duration-300 ease-in-out col-span-2 hover:bg-muted/30">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Резюме</span>
                          <svg width="12" height="12" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M1.507.178a.527.527 0 0 0-.402.195A.813.813 0 0 0 1 .538a2.047 2.047 0 0 0-.124.337l-.06.019a2.047 2.047 0 0 0-.277.105.813.813 0 0 0-.165.105.527.527 0 0 0-.195.402c0 .235.156.37.195.403.06.05.123.084.165.105a2.048 2.048 0 0 0 .337.123l.019.06c.026.084.061.188.105.277.02.043.055.106.105.166a.527.527 0 0 0 .402.195c.235 0 .37-.157.403-.195a.812.812 0 0 0 .105-.166 2.047 2.047 0 0 0 .123-.337l.06-.018c.084-.026.188-.062.277-.105a.813.813 0 0 0 .166-.105.527.527 0 0 0 .195-.403.527.527 0 0 0-.195-.402.813.813 0 0 0-.166-.105 2.047 2.047 0 0 0-.337-.124 2.047 2.047 0 0 0-.124-.337.812.812 0 0 0-.104-.165.527.527 0 0 0-.403-.195Zm3.51 4.469c.13-1 .387-1.86.646-2.46.121-.283.239-.497.337-.638.098.141.216.355.338.637.259.6.515 1.46.645 2.46a.429.429 0 0 0 .37.37c1 .13 1.86.387 2.46.646.282.121.496.239.638.337a3.773 3.773 0 0 1-.638.338c-.6.259-1.46.515-2.46.645a.429.429 0 0 0-.37.37c-.13 1-.386 1.86-.645 2.46-.122.282-.24.496-.338.638a3.772 3.772 0 0 1-.337-.638c-.26-.6-.515-1.46-.646-2.46a.429.429 0 0 0-.37-.37c-1-.13-1.86-.386-2.46-.645a3.774 3.774 0 0 1-.637-.338c.141-.098.355-.216.637-.337.6-.26 1.46-.515 2.46-.646a.429.429 0 0 0 .37-.37Zm1.116-3.254-.005.004a.028.028 0 0 1 .005-.004Zm-.26.004a.03.03 0 0 1-.006-.004s.002 0 .005.004Zm4.73 4.73a.026.026 0 0 0 .004.005l-.001-.001-.003-.004Zm0-.256a.032.032 0 0 1 .004-.005l-.004.005Zm-4.735 4.734h.001l.003-.003a.039.039 0 0 0-.004.003Zm.26-.003a.026.026 0 0 1 .005.003s-.002 0-.005-.003ZM1.394 5.866l.004.005a.027.027 0 0 1-.004-.005Zm.004.261a.03.03 0 0 1-.004.005s0-.002.004-.005ZM6 .57c-.192 0-.338.099-.42.167a1.523 1.523 0 0 0-.253.278 4.432 4.432 0 0 0-.451.831 10.134 10.134 0 0 0-.662 2.366c-.94.15-1.758.4-2.366.662-.337.145-.622.3-.83.45-.104.076-.202.16-.279.253A.669.669 0 0 0 .572 6c0 .192.099.339.167.421.077.093.175.177.278.252.21.152.494.307.831.452.608.262 1.426.512 2.366.661.15.94.4 1.758.662 2.366.145.337.3.622.45.83.076.104.16.203.253.28a.669.669 0 0 0 .421.167c.192 0 .339-.1.421-.168.093-.076.177-.175.252-.278.152-.209.307-.494.452-.83.262-.609.512-1.427.661-2.367.94-.15 1.758-.4 2.366-.661.337-.145.622-.3.83-.452.104-.075.203-.16.28-.252a.669.669 0 0 0 .167-.42c0-.193-.1-.34-.168-.422a1.524 1.524 0 0 0-.278-.252 4.43 4.43 0 0 0-.83-.451 10.134 10.134 0 0 0-2.367-.662c-.15-.94-.4-1.758-.661-2.366a4.432 4.432 0 0 0-.452-.83 1.523 1.523 0 0 0-.252-.279.669.669 0 0 0-.42-.167Z" fill="url(#ai-grad)" />
                            <defs>
                              <linearGradient id="ai-grad" x1="-.269" y1=".178" x2="11.808" y2="11.005" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#DC8FA5" />
                                <stop offset=".75" stopColor="#70A1F0" />
                              </linearGradient>
                            </defs>
                          </svg>
                          </div>
                          <span className="font-medium text-sm leading-5 tracking-tight line-clamp-2">
                            Опытный Python-разработчик с фокусом на backend. Работала в крупных компаниях, участвовала в проектах высоконагруженных систем.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="overflow-hidden rounded-xl border transition-colors duration-300 ease-in-out relative border-[#006699]/[0.08] hover:border-[#006699]/20">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="absolute inset-0 bg-[linear-gradient(55deg,rgba(0,102,153,0.06)_0%,rgba(0,102,153,0.02)_35.01%)] transition-opacity duration-300 ease-in-out opacity-100"></div>
                          <div className="relative flex items-center justify-between">
                            <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">LinkedIn</span>
                          <svg width="14" height="14" fill="none">
                            <path d="M1 1.86c0-.475.398-.86.888-.86h10.226c.49 0 .887.385.887.86v10.28c0 .475-.397.86-.887.86H1.888A.873.873 0 0 1 1 12.14V1.86Z" fill="#069" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M4.639 11.045V5.626H2.826v5.419H4.64Zm-.907-6.158c.632 0 1.026-.416 1.026-.936-.012-.532-.394-.937-1.014-.937s-1.025.405-1.025.937c0 .52.393.936 1.002.936h.011ZM5.641 11.045h1.813V8.019c0-.162.012-.324.06-.44.13-.323.429-.658.93-.658.655 0 .918.497.918 1.225v2.899h1.812V7.938c0-1.664-.894-2.439-2.087-2.439-.977 0-1.407.543-1.645.913h.012v-.786H5.64c.024.509 0 5.419 0 5.419Z" fill="#fff" />
                          </svg>
                          </div>
                          <div className="relative flex w-fit">
                            <span className="font-medium text-sm leading-5 tracking-tight text-[#069]">anna-petrova</span>
                            <div className="absolute bottom-px left-[-0.5px] h-px w-[calc(100%+1px)] rounded-sm bg-[#069]"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="overflow-hidden rounded-xl border border-border transition-colors duration-300 ease-in-out hover:bg-muted/30">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Компания</span>
                            <svg width="12" height="12" fill="none" className="text-muted-foreground">
                              <path d="M1.5 3.95v4.096c0 1.122 0 1.682.218 2.11a2 2 0 0 0 .874.874c.428.218.988.218 2.108.218h2.6c1.12 0 1.68 0 2.108-.218a2 2 0 0 0 .874-.874c.218-.428.218-.988.218-2.108v-4.1c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C8.98.748 8.42.748 7.3.748H4.7c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874c-.218.428-.218.988-.218 2.11h0ZM3.5 3.197h3.4M5.1 5.648h3.4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="font-medium text-sm leading-5 tracking-tight truncate">Yandex</span>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming */}
                    <div className="overflow-hidden rounded-xl border border-border transition-colors duration-300 ease-in-out hover:bg-muted/30">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Следующий шаг</span>
                            <svg className="stroke-muted-foreground" width="12" height="12" fill="none">
                              <rect x=".75" y="1.65" width="10.5" height="9" rx="2" />
                              <path d="M3 4.5h6M3.6.75v1.5M8.4.75v1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          <span className="font-medium text-sm leading-5 tracking-tight truncate">Финальное интервью</span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/50 transition-colors duration-300 ease-in-out hover:bg-emerald-50">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Рейтинг</span>
                            <Target className="h-3 w-3 text-emerald-600" />
                          </div>
                          <div className="flex items-baseline gap-x-1">
                            <span className="font-semibold text-2xl leading-none text-emerald-600">94</span>
                            <span className="font-medium text-xs text-emerald-600">%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mt-8 flex items-center gap-x-1.5 pl-1">
                      <svg width="14" height="14" fill="none" className="text-muted-foreground">
                        <path d="M1.5 6.81h2.353a.4.4 0 0 0 .385-.29l1.017-3.56c.113-.395.677-.384.774.016l1.93 7.993c.096.403.668.41.774.01l1.033-3.872a.4.4 0 0 1 .386-.297H12.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-semibold text-foreground text-sm leading-5 tracking-tight">Активность</span>
                      <svg width="14" height="14" fill="none" className="text-muted-foreground">
                        <path d="m5.5 4 3 3-3 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute right-5 -bottom-1 left-5 h-10 rounded-lg border border-border"></div>
                    <div className="absolute right-3 -bottom-0.5 left-3 h-10 rounded-lg border border-border bg-card"></div>
                    <div className="overflow-hidden rounded-xl border border-border transition-colors duration-300 ease-in-out relative mt-3 bg-card">
                      <div className="h-full">
                        <div className="flex h-full flex-col justify-between gap-y-4 px-3 py-2.5">
                          <div className="flex flex-col gap-y-[1.5px]">
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center">
                                <div className="size-5 overflow-hidden rounded-md border border-border">
                                  <div className="flex h-full w-full items-center justify-center bg-muted/50">
                                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-sm leading-5 tracking-tight ml-3">Веб-интервью пройдено</span>
                                </div>
                              </div>
                              <div className="flex">
                                <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">6 часов назад</span>
                              </div>
                            </div>
                            <div className="ml-[9.5px] h-[13px] w-px rounded-full bg-border"></div>
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center">
                                <div className="size-5 rounded-md border border-border">
                                  <div className="flex h-full w-full items-center justify-center bg-muted/50">
                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-sm leading-5 tracking-tight ml-3">Скрининг пройден</span>
                                </div>
                              </div>
                              <div className="flex">
                                <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">2 дня назад</span>
                              </div>
                            </div>
                            <div className="ml-[9.5px] h-[13px] w-px rounded-full bg-border"></div>
                            <div className="flex items-baseline justify-between">
                              <div className="flex items-center">
                                <div className="relative size-5 rounded-md border border-emerald-200">
                                  <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                                    <svg width="12" height="12" fill="none">
                                      <path d="m3 6.318.052.082c.442.699.663 1.048.947 1.17a1 1 0 0 0 .778.007c.285-.118.512-.464.965-1.156L7 4.5" stroke="#059669" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="font-medium text-sm leading-5 tracking-tight ml-3">Отклик получен</span>
                                </div>
                              </div>
                              <div className="flex">
                                <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">4 дня назад</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom: Details section */}
                <div className="border-t border-border bg-card px-4 pt-1.5 pb-3.5">
                  <div className="flex flex-col gap-x-4">
                    <div className="grid origin-left auto-rows-[32px] grid-cols-[124px_1fr] items-center lg:grid-cols-[100px_1fr]">
                      <div className="col-span-2 flex items-center gap-x-1.5">
                        <svg width="14" height="14" fill="none" className="text-muted-foreground">
                          <path d="m4 5.5 3 3 3-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Детали</span>
                      </div>
                    </div>
                    <div className="grid origin-left auto-rows-[32px] grid-cols-[124px_1fr] items-center lg:grid-cols-[100px_1fr]">
                      <div className="flex items-center gap-x-1.5">
                        <svg width="14" height="14" fill="none" className="text-muted-foreground">
                          <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.466 7a2.466 2.466 0 1 1-4.93 0 2.466 2.466 0 0 1 4.93 0Z" />
                            <path d="M7 12.5a5.5 5.5 0 1 1 0-11c4.41 0 5.5 3.319 5.5 5.5v.948a1.517 1.517 0 0 1-3.034 0V4.534" />
                          </g>
                        </svg>
                        <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Email</span>
                      </div>
                      <div className="flex w-fit rounded-lg border border-blue-200 px-[5px] pb-px">
                        <span className="font-medium text-sm leading-5 tracking-tight truncate text-blue-600">anna@example.com</span>
                      </div>
                    </div>
                    <div className="grid origin-left auto-rows-[32px] grid-cols-[124px_1fr] items-center lg:grid-cols-[100px_1fr]">
                      <div className="flex items-center gap-x-1.5">
                        <svg width="14" height="14" fill="none" className="text-muted-foreground">
                          <path d="M12 6.143C12 9.84 8.928 13 7 13S2 9.84 2 6.143C2 3.303 4.239 1 7 1s5 2.303 5 5.143Z" stroke="currentColor" strokeWidth="1.1" />
                          <circle cx="7" cy="6" r="1.75" stroke="currentColor" strokeWidth="1.1" />
                        </svg>
                        <span className="font-medium tracking-normal text-xs leading-4 text-muted-foreground">Локация</span>
                      </div>
                      <span className="font-medium text-sm leading-5 tracking-tight truncate">Москва, Россия</span>
                    </div>
                    <div className="grid origin-left auto-rows-[32px] grid-cols-[124px_1fr] items-center lg:grid-cols-[100px_1fr]">
                      <div className="flex items-center gap-x-1.5">
                        <svg width="14" height="14" fill="none" className="text-muted-foreground">
                          <path d="M12 6.143C12 9.84 8.928 13 7 13S2 9.84 2 6.143C2 3.303 4.239 1 7 1s5 2.303 5 5.143Z" stroke="currentColor" strokeWidth="1.1" />
                          <circle cx="7" cy="6" r="1.75" stroke="currentColor" strokeWidth="1.1" />
                        </svg>
                        <span className="font-medium tracking-normal text-xs leading-4 truncate text-muted-foreground">Последний контакт</span>
                      </div>
                      <span className="font-medium text-sm leading-5 tracking-tight truncate">6 часов назад</span>
                    </div>
                  </div>
                </div>
              </div>
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
