import { ArrowRight, Star, Sparkles, Shield, Award } from "lucide-react"
import { env } from "@/env"

export function CTASection() {
  return (
    <section className="relative bg-neutral-900 overflow-hidden min-h-screen flex items-center">
      {/* Vertical grid lines - full width */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px)] bg-[size:80px_100%]" />

      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-amber-950/20 to-neutral-900" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-amber-600/10 to-transparent" />

      <div className="absolute top-0 left-0 w-16 h-16 bg-background rounded-br-[2.5rem]" />
      <div className="absolute top-0 right-0 w-16 h-16 bg-background rounded-bl-[2.5rem]" />

      {/* Top rounded corners overlay to create the "card" effect from light bg */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-background" />

      {/* Top rounded "notch" decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[6px] bg-neutral-700 rounded-b-full z-10" />

      {/* Content container - centered */}
      <div className="relative px-8 py-24 md:px-16 w-full max-w-5xl mx-auto flex flex-col justify-center">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800 border border-amber-500/30 px-4 py-2 text-sm font-medium text-neutral-300 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Доверяют более 1000+ HR-специалистов
          </div>
        </div>

        <h2 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl leading-tight text-balance text-center">
          Автоматизируйте найм персонала с помощью искусственного интеллекта
        </h2>

        <p className="mb-12 text-lg md:text-xl text-neutral-300 leading-relaxed text-center max-w-3xl mx-auto">
          Сократите время закрытия вакансий на 70% с помощью QBS Автонайм. Автоматический AI-скрининг, голосовые
          интервью через Telegram и интеграция с HeadHunter — всё в одной платформе для эффективного подбора кандидатов.
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row mb-8">
          <a
            href={`${env.NEXT_PUBLIC_APP_URL}`}
            className="flex h-11 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 text-center text-sm font-medium text-neutral-900 transition-all hover:ring-2 hover:ring-white/20"
          >
            Начать бесплатно
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <a
            href={env.NEXT_PUBLIC_DEMO_URL}
            className="flex h-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 text-center text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:ring-2 hover:ring-white/10"
          >
            Получить демо
          </a>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-neutral-500 mb-4">
            Бесплатная регистрация • Без кредитной карты • Настройка за 5 минут
          </p>
        </div>

        {/* Star ratings */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12 py-8 border-t border-amber-500/20 shadow-[0_-1px_20px_rgba(251,191,36,0.1)]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-red-600 text-[10px] font-bold text-white">
              hh
            </div>
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs text-amber-200/80 ml-1">4.9/5.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-emerald-400" />
            <span className="text-sm text-neutral-300">Соответствует 152-ФЗ</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-400" />
            <span className="text-sm text-neutral-300">{"HR Tech 2025"}</span>
          </div>
        </div>
      </div>
    </section>
  )
}