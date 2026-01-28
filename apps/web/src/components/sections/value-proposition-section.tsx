"use client"

import { Zap, TrendingUp, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ScreenshotPreview } from "@/components/ui/screenshot-preview"

export function ValuePropositionSection() {
  return (
    <section id="value" className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Soft mesh gradient - replaces harsh grid pattern */}
      <div className="absolute inset-0 bg-mesh-soft opacity-50" />

      {/* Top border for visual separation */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Section header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Zap className="h-4 w-4" />
              Почему QBS Автонайм
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance leading-tight"
            >
              Найм — это результаты,
              <br className="hidden md:block" />
              <span className="text-muted-foreground">а не бесконечные отклики</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Единая платформа, которая объединяет <span className="text-foreground font-semibold">автоматизацию</span>,{" "}
              <span className="text-foreground font-semibold">аналитику</span> и{" "}
              <span className="text-foreground font-semibold">AI-интервью</span>
            </motion.p>
          </div>

          {/* Key metrics - 3 cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                value: "70%",
                label: "сокращение времени найма",
                icon: Zap,
                description: "От отклика до оффера за 3 дня",
              },
              {
                value: "94%",
                label: "точность AI-скрининга",
                icon: TrendingUp,
                description: "Только релевантные кандидаты",
              },
              {
                value: "24/7",
                label: "автоматические интервью",
                icon: Users,
                description: "AI работает без выходных",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-border/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full min-h-[280px] flex flex-col bg-card/80 backdrop-blur-sm border-2 border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-foreground/10 backdrop-blur-sm">
                      <stat.icon className="h-6 w-6 text-foreground" />
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-3 text-foreground">{stat.value}</div>
                  <div className="text-base font-semibold text-foreground mb-2 leading-snug">{stat.label}</div>
                  <div className="text-sm text-foreground/70 mt-auto">{stat.description}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Value points with live demo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-8 md:p-10"
          >
            <div className="space-y-8">
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-semibold text-foreground mb-3">Всё в одном месте</h3>
                <p className="text-muted-foreground mb-8">Единый дашборд для управления всеми этапами найма</p>
                <ul className="grid sm:grid-cols-2 gap-4 text-left">
                  {[
                    "Автоматический скрининг резюме за секунды",
                    "AI-интервью в Telegram 24/7",
                    "Единый дашборд для всех вакансий",
                    "Интеграция с hh.ru, SuperJob и другими",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="h-6 w-6 text-foreground shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Live demo card - full width below text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-violet-500/10 to-accent/10 rounded-3xl blur-2xl" />
                <div className="relative bg-muted/50 border border-border rounded-xl overflow-hidden">
                  <ScreenshotPreview
                    src="/screenshots/app-dashboard-recent-activity-1920x1080.png"
                    alt="Dashboard - Обработка кандидатов в реальном времени"
                    height="aspect-video"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom CTA link */}
          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
            >
              Узнать больше о возможностях
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}