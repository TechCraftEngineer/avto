"use client"

import { ArrowRight, Clock, Users, Zap, TrendingUp, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export function ProblemSection() {
  return (
    <section className="relative bg-background py-24 md:py-32 overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8881_1px,transparent_1px),linear-gradient(to_bottom,#8881_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Main headline - dub.co style */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance leading-tight">
              Найм — это не только отклики. <br className="hidden md:block" />
              <span className="text-muted-foreground">Это результаты.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              QBS Автонайм — современная платформа, которая объединяет{" "}
              <span className="inline-flex items-center gap-1 text-primary font-medium">
                <Zap className="h-4 w-4" />
                автоматизацию
              </span>
              ,{" "}
              <span className="inline-flex items-center gap-1 text-violet-500 font-medium">
                <TrendingUp className="h-4 w-4" />
                аналитику
              </span>{" "}
              и{" "}
              <span className="inline-flex items-center gap-1 text-accent font-medium">
                <Users className="h-4 w-4" />
                AI-интервью
              </span>{" "}
              — всё в одном месте.
            </p>
          </div>

          {/* Stats row - floating cards style */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { value: "10x", label: "быстрее обработка откликов", color: "primary" },
              { value: "85%", label: "экономия времени рекрутера", color: "violet-500" },
              { value: "3 дня", label: "среднее время до найма", color: "accent" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-border/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1">
                  <div
                    className={`text-4xl md:text-5xl font-bold mb-2 ${
                      stat.color === "primary"
                        ? "text-primary"
                        : stat.color === "violet-500"
                          ? "text-violet-500"
                          : "text-accent"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Value points with checkmarks */}
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-6">
                  Быстро. Надёжно. Красиво.
                  <br />
                  <span className="text-muted-foreground font-normal">И масштабируется вместе с вами.</span>
                </h3>
                <ul className="space-y-4">
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
                      <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Mini demo card */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-violet-500/10 to-accent/10 rounded-3xl blur-2xl" />
                <div className="relative bg-muted/50 border border-border rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-xs text-muted-foreground">Обработка в реальном времени</span>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {[
                    { name: "Иван Петров", status: "Приглашён на интервью", time: "2 мин назад" },
                    { name: "Анна Сидорова", status: "Проходит AI-скрининг", time: "только что" },
                    { name: "Михаил Козлов", status: "Интервью завершено", time: "5 мин назад" },
                  ].map((candidate, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.15 }}
                      viewport={{ once: true }}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-medium">
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{candidate.name}</div>
                          <div className="text-xs text-muted-foreground">{candidate.status}</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{candidate.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA link */}
          <div className="text-center mt-10">
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
            >
              Узнать больше о возможностях
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}