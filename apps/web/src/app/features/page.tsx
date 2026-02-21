import { Header, Footer } from "@/components/layout"
import { FeaturesSection } from "@/components/sections"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Возможности платформы | QBS Автонайм",
  description:
    "AI-скрининг резюме, голосовые интервью в Telegram, аналитика воронки найма и интеграции с популярными сервисами — всё в одной платформе для автоматизации подбора персонала.",
}

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-section-primary pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-glow-top" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Полный функционал</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance">
                Всё для найма
                <br />
                <span className="text-muted-foreground">в одной платформе</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                От AI-скрининга резюме до голосовых интервью и детальной аналитики — автоматизируйте каждый этап найма
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/#pricing">
                    Начать бесплатно
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">Связаться с нами</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Features Section */}
        <FeaturesSection />

        {/* Additional Benefits Section */}
        <section className="relative bg-section-secondary py-24 md:py-32">
          <div className="absolute inset-0 bg-glow-center opacity-60" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Почему выбирают QBS Автонайм</h2>
              <p className="text-lg text-muted-foreground">
                Комплексное решение для современного рекрутинга с фокусом на автоматизацию и результат
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Zap,
                  title: "Мгновенный старт",
                  description: "Настройка платформы занимает всего 2 минуты. Не требуется техническая экспертиза.",
                },
                {
                  icon: CheckCircle2,
                  title: "97% точность AI",
                  description: "Наша модель обучена на миллионах резюме и вакансий для максимальной точности.",
                },
                {
                  icon: Sparkles,
                  title: "Постоянные обновления",
                  description: "Регулярные улучшения AI-моделей и добавление новых функций без дополнительной платы.",
                },
                {
                  icon: CheckCircle2,
                  title: "Соответствие ФЗ-152 и 115",
                  description: "Полное соответствие российскому законодательству о защите персональных данных.",
                },
                {
                  icon: Zap,
                  title: "Техподдержка 24/7",
                  description: "Наша команда всегда готова помочь с любыми вопросами по работе платформы.",
                },
                {
                  icon: Sparkles,
                  title: "Гибкие интеграции",
                  description: "Подключение к hh.ru, SuperJob, Avito и другим сервисам за несколько кликов.",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative bg-foreground py-20 md:py-24">
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">Готовы автоматизировать найм?</h2>
              <p className="text-lg text-background/70 mb-8 max-w-2xl mx-auto">
                Присоединяйтесь к 500+ компаниям, которые уже используют QBS для ускорения найма.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/#pricing">Начать бесплатно</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-background/20 text-background hover:bg-background/10 hover:text-background bg-transparent"
                >
                  <Link href="/contact">Связаться с нами</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
