import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@qbs-autonaim/ui"
import { Globe, ArrowRight, Palette, CheckCircle2, Sparkles, Settings, Shield, Zap, Crown, Code } from "lucide-react"
import Link from "next/link"
import { ProductNavigation } from "@/components/product-navigation"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Собственный брендинг | QBS Автонайм",
  description:
    "Запустите AI-рекрутера на своем домене с полным брендингом. Логотип, цвета, корпоративный домен — всё под вашим контролем.",
  keywords: ["собственный брендинг", "корпоративный домен", "кастомизация HR", "брендированный рекрутинг"],
  openGraph: {
    title: "Собственный брендинг | QBS Автонайм",
    description: "Запустите AI-рекрутера на своем домене с полным брендингом за 5 минут.",
  },
}

export default function WhiteLabelPage() {
  const features = [
    {
      icon: Globe,
      title: "Корпоративный домен",
      description: "Разместите AI-рекрутера на вашем домене через CNAME. Кандидаты видят только ваш бренд.",
    },
    {
      icon: Palette,
      title: "Полный брендинг",
      description: "Настройте логотип, цвета, шрифты и все элементы интерфейса под ваш фирменный стиль.",
    },
    {
      icon: Shield,
      title: "Без упоминаний QBS",
      description: "Полностью white-label решение. Никаких ссылок и упоминаний нашего бренда.",
    },
    {
      icon: Zap,
      title: "Быстрая настройка",
      description: "Запуск за 5 минут. Просто добавьте CNAME-запись и загрузите свой логотип.",
    },
    {
      icon: Settings,
      title: "Гибкие настройки",
      description: "Настраивайте поведение бота, тексты приветствий и сценарии под вашу компанию.",
    },
    {
      icon: Code,
      title: "Встраивание на сайт",
      description: "Виджет чата для встраивания на ваш карьерный сайт одной строкой кода.",
    },
  ]

  const benefits = [
    { value: "5 мин", label: "Время настройки" },
    { value: "100%", label: "Ваш брендинг" },
    { value: "24/7", label: "Поддержка" },
    { value: "∞", label: "Кастомизация" },
  ]

  const useCases = [
    {
      title: "Крупный бизнес",
      description: "Для компаний с сильным HR-брендом, которым важна единая экосистема.",
      icon: Crown,
    },
    {
      title: "Кадровые агентства",
      description: "Предлагайте AI-рекрутера клиентам как свой собственный продукт.",
      icon: Sparkles,
    },
    {
      title: "Корпоративные порталы",
      description: "Встраивайте AI-чат на внутренний карьерный портал компании.",
      icon: Globe,
    },
  ]

  const brandingOptions = [
    "Логотип компании",
    "Фирменные цвета",
    "Собственный домен",
    "Кастомные тексты",
    "Шрифты и стили",
    "Иконки и изображения",
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProductNavigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.95_0.02_300/0.15),transparent_60%)]" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/5 px-4 py-1.5 text-sm mb-6">
              <Globe className="h-4 w-4 text-purple-500" />
              <span className="text-purple-500 font-medium">Собственный брендинг</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
              AI-рекрутер{" "}
              <span className="bg-gradient-to-r from-purple-500 to-violet-600 bg-clip-text text-transparent">
                под вашим брендом
              </span>
            </h1>

            <p className="text-lg md:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
              Запустите AI-рекрутера на своем домене с полным брендингом. Ваш логотип, цвета и корпоративный стиль.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={env.NEXT_PUBLIC_DEMO_URL} target="_blank" rel="noopener noreferrer">
                  Посмотреть демо
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {benefits.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-purple-500 mb-1">{stat.value}</div>
                  <div className="text-sm text-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Before */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-sm font-bold">
                    ✗
                  </span>
                  Стандартное решение
                </h3>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                      </div>
                      <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-muted-foreground font-mono">
                        chat.qbs-avtonaym.ru
                      </div>
                    </div>
                    <div className="bg-background p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                          Q
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">QBS AI-рекрутер</div>
                          <div className="text-xs text-emerald-500">онлайн</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
                    ✓
                  </span>
                  С вашим брендом
                </h3>
                <div className="rounded-2xl border border-purple-500/20 bg-card p-6 shadow-xl ring-2 ring-purple-500/10">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 flex items-center gap-2 border-b border-border">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 bg-background rounded px-3 py-1 text-xs text-foreground/70 font-mono">
                        careers.yourcompany.ru
                      </div>
                    </div>
                    <div className="bg-background p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          C
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">Ваша компания HR</div>
                          <div className="text-xs text-emerald-500">онлайн</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Branding Options */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Что вы можете настроить</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Полный контроль над внешним видом и поведением AI-рекрутера
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            {brandingOptions.map((option, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-purple-500/30 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Возможности Собственного брендинга</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Всё необходимое для запуска AI-рекрутера под вашим брендом
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 hover:border-purple-500/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Для кого подходит</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Собственное брендинг решение для компаний с особыми требованиями к брендингу
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {useCases.map((useCase, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="h-7 w-7 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                <p className="text-sm text-foreground/70">{useCase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Steps */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Запуск за 3 шага</h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">Простая настройка без технических знаний</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Добавьте CNAME",
                description: "Создайте CNAME-запись в DNS вашего домена, указывающую на наш сервер",
              },
              {
                step: "2",
                title: "Настройте брендинг",
                description: "Загрузите логотип, выберите цвета и настройте тексты в панели управления",
              },
              {
                step: "3",
                title: "Готово!",
                description: "AI-рекрутер работает на вашем домене с вашим брендом",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-500">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center rounded-3xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-purple-500/10 border border-purple-500/20 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-1.5 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-purple-500 font-medium">Начните бесплатно</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Готовы запустить AI-рекрутера под своим брендом?
            </h2>

            <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
              Настройте собственное брендинг решение за 5 минут и предложите кандидатам уникальный опыт.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg">
                Попробовать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/#pricing">
                <Button size="lg" variant="outline">
                  Посмотреть тарифы
                </Button>
              </Link>
            </div>

            <p className="text-sm text-foreground/60 mt-6">14 дней бесплатно • Без кредитной карты</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
