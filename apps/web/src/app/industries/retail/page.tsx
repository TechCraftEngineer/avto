
import {
  ShoppingCart,
  Zap,
  Users,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui"
import { Footer, Header } from "~/components/layout"

export const metadata: Metadata = {
  title: "Автоматизация найма в ритейле и e-commerce | QBS Автонайм",
  description:
    "Решения для массового и сезонного найма в ритейле. Быстрый онбординг, мультирегиональность, аналитика текучести. Наймите 100+ сотрудников за неделю.",
  keywords: [
    "найм в ритейле",
    "найм в e-commerce",
    "массовый найм",
    "сезонный найм",
    "быстрый онбординг",
    "мультирегиональный рекрутинг",
  ],
}

export default function RetailIndustryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-orange-50/50 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.7_0.15_40/0.1),transparent_70%)]" />

          <div className="container mx-auto px-4 relative">
            <Link
              href="/industries"
              className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Все отрасли
            </Link>

            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Ритейл и e-commerce
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Автоматизация найма в ритейле и e-commerce
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                Масштабируемые решения для сезонного и массового найма с быстрым онбордингом, мультирегиональностью и
                аналитикой текучести кадров
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "7 дней", label: "Найм 100+ сотрудников" },
                  { value: "70%", label: "Сокращение времени онбординга" },
                  { value: "50+", label: "Регионов одновременно" },
                  { value: "-40%", label: "Снижение текучести" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
                    <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stat.value}</div>
                    <div className="text-sm text-foreground/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Challenges Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Вызовы отрасли</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                Ритейл и e-commerce сталкиваются с уникальными задачами при массовом найме
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Сезонные пики найма",
                    description: "Необходимость быстро нанимать сотни сотрудников перед новогодними праздниками, распродажами",
                  },
                  {
                    title: "Высокая текучесть кадров",
                    description: "В среднем 40-60% годовая текучесть в розничной торговле требует постоянного найма",
                  },
                  {
                    title: "Мультирегиональность",
                    description: "Необходимость одновременно нанимать в десятках городов с учетом локальной специфики",
                  },
                  {
                    title: "Низкая квалификация кандидатов",
                    description: "Большой поток откликов с минимальным опытом требует эффективного скрининга",
                  },
                  {
                    title: "Быстрый онбординг",
                    description: "Новые сотрудники должны выходить на работу через 1-3 дня после оффера",
                  },
                  {
                    title: "Ограниченный HR-бюджет",
                    description: "Необходимость минимизировать стоимость найма при больших объемах",
                  },
                ].map((challenge, i) => (
                  <Card key={i} className="border-2">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                        <span className="text-lg font-bold text-red-500">{i + 1}</span>
                      </div>
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70">{challenge.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Наши решения</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                QBS Автонайм решает специфические задачи ритейла и e-commerce
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "Массовый и сезонный найм",
                    description:
                      "Наймите 100+ сотрудников за неделю с автоматическим скринингом и приоритизацией. Готовые шаблоны для кассиров, продавцов, курьеров, комплектовщиков.",
                    features: ["Массовый найм", "Автоматический скрининг", "Шаблоны позиций", "Быстрые оффера"],
                  },
                  {
                    icon: MapPin,
                    title: "Мультирегиональность",
                    description:
                      "Управляйте наймом во всех регионах из одной системы. Автоматическая локализация вакансий, учет локального рынка труда и зарплатных ожиданий.",
                    features: ["50+ регионов", "Локализация", "Единая панель", "Региональная аналитика"],
                  },
                  {
                    icon: Clock,
                    title: "Экспресс-онбординг",
                    description:
                      "Автоматизированный онбординг с цифровыми документами, обучающими материалами и чек-листами. Новый сотрудник готов к работе за 1 день.",
                    features: ["Цифровые документы", "Обучение", "Чек-листы", "Автоматизация"],
                  },
                  {
                    icon: TrendingUp,
                    title: "Аналитика текучести",
                    description:
                      "Предсказывайте увольнения и планируйте найм заранее. Аналитика причин ухода, качества кандидатов по источникам, эффективности рекрутеров.",
                    features: ["Прогноз текучести", "Причины ухода", "Качество источников", "KPI рекрутеров"],
                  },
                ].map((solution, i) => {
                  const Icon = solution.icon
                  return (
                    <Card key={i} className="border-2 border-orange-500/20">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl mb-2">{solution.title}</CardTitle>
                        <CardDescription className="text-base">{solution.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {solution.features.map((feature, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Сценарии использования</h2>
              <p className="text-lg text-foreground/70 text-center mb-12">
                QBS Автонайм адаптирован под любые задачи ритейла
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Calendar,
                    title: "Предновогодний найм",
                    description: "Наймите 500+ продавцов-консультантов за 2 недели перед праздниками",
                  },
                  {
                    icon: ShoppingCart,
                    title: "Открытие нового магазина",
                    description: "Полная комплектация персонала нового торгового объекта за 1 неделю",
                  },
                  {
                    icon: Users,
                    title: "E-commerce склад",
                    description: "Массовый найм курьеров, комплектовщиков для маркетплейсов",
                  },
                ].map((useCase, i) => {
                  const Icon = useCase.icon
                  return (
                    <Card key={i} className="text-center">
                      <CardHeader>
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <CardTitle className="text-lg mb-2">{useCase.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/70">{useCase.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-orange-50/50 to-background dark:from-orange-950/10 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-orange-500/20">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-4">
                    Кейс клиента
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">Федеральная розничная сеть</CardTitle>
                  <CardDescription className="text-lg">
                    Наняли 800 сотрудников в 30 городах за 3 недели к новогодним праздникам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Users className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">800</div>
                      <div className="text-sm text-foreground/60">Сотрудников нанято</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <MapPin className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">30</div>
                      <div className="text-sm text-foreground/60">Городов РФ</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">3</div>
                      <div className="text-sm text-foreground/60">Недели</div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-orange-500 pl-4 italic text-foreground/80 mb-6">
                    "QBS Автонайм спас нас в предновогодний сезон. Мы смогли быстро укомплектовать все магазины по всей
                    России, при этом качество кандидатов было на высоте. Система автоматически приоритизировала лучших
                    и ускорила онбординг до 1 дня."
                  </blockquote>

                  <div className="text-sm text-foreground/60">— HR-директор</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы масштабировать найм в ритейле?</h2>
              <p className="text-lg text-foreground/70 mb-8">
                Обсудите с нашими экспертами, как QBS Автонайм может решить задачи вашей розничной сети или
                e-commerce
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Запросить демо
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/industries">Другие отрасли</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
