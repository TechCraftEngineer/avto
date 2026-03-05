import { ArrowRight, Star, Sparkles, Shield, Award } from "lucide-react"
import { env } from "@/env"

export function CTASection() {
  return (
    <section className="relative bg-background overflow-hidden py-24 md:py-32">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Content container */}
      <div className="relative px-8 py-24 md:px-16 w-full max-w-5xl mx-auto flex flex-col justify-center">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Sparkles className="h-5 w-5 text-foreground" />
            <span className="text-muted-foreground">Подбор персонала для компаний по всей России</span>
          </div>
        </div>

        <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl leading-tight text-balance text-center">
          Автоматизация подбора персонала — от откликов к офферу
        </h2>

        <p className="mb-12 text-lg md:text-xl text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
          QBS Автонайм: скрининг резюме, HeadHunter и SuperJob в одном окне, интервью в веб-чате. Система автоматизации рекрутинга для российского рынка. Соответствие 152-ФЗ.
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row mb-8">
          <a
            href={`${env.NEXT_PUBLIC_APP_URL}`}
            className="flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-center text-sm font-medium text-background transition-all hover:bg-foreground/90"
          >
            Начать бесплатно
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <a
            href={env.NEXT_PUBLIC_DEMO_URL}
            className="flex h-11 items-center justify-center rounded-lg border border-border bg-card px-6 text-center text-sm font-medium text-foreground transition-all hover:bg-muted"
          >
            Получить демо
          </a>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-4">
            Регистрация бесплатно • Без привязки карты • Подключение HeadHunter за 2 минуты
          </p>
        </div>

        {/* Star ratings */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 py-8 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-red-600 text-[10px] font-bold text-white">
              hh
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">4.9/5.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-emerald-600" />
            <span className="text-sm text-muted-foreground">Соответствует 152-ФЗ</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-500" />
            <span className="text-sm text-muted-foreground">{"HR Tech 2025"}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
