"use client"

import { useState } from "react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { Check } from "lucide-react"
import { env } from "@/env"
import { cn } from "@qbs-autonaim/ui"

const PLANS = [
  {
    name: "Бесплатный",
    price: "Бесплатно",
    priceAnnual: "Бесплатно",
    description: "Попробовать платформу",
    features: ["25 откликов/мес", "1 вакансия", "AI-скрининг", "Базовые шаблоны"],
    cta: "Начать бесплатно",
    href: env.NEXT_PUBLIC_APP_URL,
    popular: false,
  },
  {
    name: "Стартовый",
    price: "490 ₽",
    priceAnnual: "390 ₽",
    description: "Небольшой объём вакансий",
    features: ["150 откликов/мес", "3 вакансии", "AI-скрининг", "Базовые шаблоны"],
    cta: "Выбрать тариф",
    href: env.NEXT_PUBLIC_APP_URL,
    popular: false,
  },
  {
    name: "Профессиональный",
    price: "1 490 ₽",
    priceAnnual: "1 190 ₽",
    description: "Активный набор, несколько рекрутеров",
    features: ["1 000 откликов/мес", "10 вакансий", "AI-интервью в веб-чате", "Расширенная аналитика", "Приоритетная поддержка"],
    cta: "Выбрать тариф",
    href: env.NEXT_PUBLIC_APP_URL,
    popular: true,
  },
  {
    name: "Корпоративный",
    price: "от 4 990 ₽",
    priceAnnual: "от 3 990 ₽",
    description: "Высокий объём, API, персональная настройка",
    features: ["Безлимит откликов", "Безлимит вакансий", "API и расширенная аналитика", "Персональный менеджер", "Кастомные интеграции"],
    cta: "Связаться с нами",
    href: `${env.NEXT_PUBLIC_APP_URL}/contact?plan=enterprise`,
    popular: false,
  },
] as const

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="relative py-28 md:py-36 lg:py-44 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-8 h-px w-12 bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />

          <p className="mb-6 text-[13px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
            Тарифы
          </p>

          <h2 className="mb-6 text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]">
            Тарифы на автоматизацию подбора персонала
          </h2>

          <p className="mb-12 text-lg text-muted-foreground">
            Бесплатный тариф для теста. Оплата в рублях. Годовая подписка — скидка 20%.
          </p>

          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                !isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Помесячно
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
                isAnnual
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ежегодно
              <span className="text-[11px] font-normal opacity-90">−20%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card overflow-hidden",
                plan.popular
                  ? "border-amber-500/50 ring-1 ring-amber-500/20"
                  : "border-border"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-amber-500 to-transparent" />
              )}

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                {plan.popular && (
                  <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
                    Популярный
                  </p>
                )}

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 min-h-10">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                    {isAnnual ? plan.priceAnnual : plan.price}
                  </span>
                  {plan.price !== "Бесплатно" && (
                    <span className="text-sm text-muted-foreground ml-1">/мес</span>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 mt-0.5 text-foreground/70" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button
                    className="w-full h-11 font-medium"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
