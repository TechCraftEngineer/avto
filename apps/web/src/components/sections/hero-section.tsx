import { Button } from "@qbs-autonaim/ui/components/button"
import { ArrowRight } from "lucide-react"
import { env } from "@/env"

export function HeroSection() {
  return (
    <section className="relative py-28 md:py-36 lg:py-44 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-8 h-px w-12 bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />

          <p className="mb-6 text-[13px] font-medium text-muted-foreground tracking-[0.2em]">
            Умный рекрутинг
          </p>

          <h1 className="mb-8 text-[2.75rem] leading-[1.12] font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
            <span className="text-foreground">ИИ-платформа для </span>
            <span className="bg-linear-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent">
              автоматизации найма
            </span>
          </h1>

          <p className="mb-12 max-w-xl mx-auto text-lg text-muted-foreground leading-[1.7]">
            Сократите время закрытия вакансий на 70%. ИИ-скрининг, умные интервью в веб-чате и интеграция с hh.ru
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="h-11 px-6 font-medium">
              <a href={env.NEXT_PUBLIC_APP_URL}>
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-11 px-6 font-medium">
              <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                Демо
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
