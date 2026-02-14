"use client"

import { useState } from "react"
import { Badge } from "@qbs-autonaim/ui"
import { Button } from "@qbs-autonaim/ui"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@qbs-autonaim/ui"
import { Check, Sparkles } from "lucide-react"
import { env } from "@/env"

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Бесплатный",
      price: "Бесплатно",
      priceAnnual: "Бесплатно",
      description: "Для тестирования продукта",
      features: [
        "До 25 откликов в месяц",
        "1 активная вакансия",
        "AI-скрининг резюме",
        "Базовые шаблоны",
      ],
      cta: "Начать бесплатно",
      href: `${env.NEXT_PUBLIC_APP_URL}`,
      popular: false,
    },
    {
      name: "Стартовый",
      price: "490 ₽",
      priceAnnual: "390 ₽",
      description: "Для микробизнеса и фрилансеров",
      features: [
        "До 150 откликов в месяц",
        "До 3 активных вакансий",
        "AI-скрининг резюме",
        "Базовые шаблоны",
      ],
      cta: "Выбрать тариф",
      href: `${env.NEXT_PUBLIC_APP_URL}`,
      popular: false,
    },
    {
      name: "Профессиональный",
      price: "1 490 ₽",
      priceAnnual: "1 190 ₽",
      description: "Для малого и среднего бизнеса и IT-компаний",
      features: [
        "До 1 000 откликов в месяц",
        "До 10 активных вакансий",
        "AI-интервью в Telegram и веб-чате",
        "Расширенная аналитика",
        "Приоритетная поддержка",
      ],
      cta: "Выбрать тариф",
      href: `${env.NEXT_PUBLIC_APP_URL}`,
      popular: true,
    },
    {
      name: "Корпоративный",
      price: "от 4 990 ₽",
      priceAnnual: "от 3 990 ₽",
      description: "Для агентств и крупных компаний",
      features: [
        "Неограниченные отклики",
        "Неограниченные вакансии",
        "Расширенная аналитика и API",
        "Персональный менеджер",
        "Кастомные интеграции",
      ],
      cta: "Связаться с нами",
      href: `${env.NEXT_PUBLIC_APP_URL}/contact?plan=enterprise`,
      popular: false,
    },
  ]

  return (
    <section id="pricing" className="relative bg-muted/30 py-24 md:py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,oklch(0.96_0.01_265/0.2),transparent_70%)]" />

      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">Тарифы</span>
          </div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Прозрачные цены для каждой команды
          </h2>
          <p className="mb-12 text-xl text-muted-foreground">Начните бесплатно. Масштабируйтесь по мере роста.</p>

          <div className="mb-16 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                !isAnnual ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Помесячно
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isAnnual ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ежегодно
              <Badge variant="secondary" className="ml-2">
                -20%
              </Badge>
            </button>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border transition-all ${
                plan.popular
                  ? "border-foreground shadow-xl scale-105"
                  : "border-border hover:border-foreground/20 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-foreground text-background border-0 px-4 py-1">Популярный</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">{isAnnual ? plan.priceAnnual : plan.price}</span>
                  {plan.price !== "Бесплатно" && plan.price !== "По запросу" && (
                    <span className="text-muted-foreground ml-1">/мес</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <a href={plan.href}>
                    {plan.cta}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}