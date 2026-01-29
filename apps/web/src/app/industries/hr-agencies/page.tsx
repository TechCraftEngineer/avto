
import {
  Users,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Target,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Footer, Header } from "~/components/layout"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui"

export const metadata: Metadata = {
  title: "Решения для кадровых агентств | QBS Автонайм",
  description:
    "Специализированная платформа для HR-агентств и рекрутинговых компаний. Управляйте сотнями вакансий, увеличивайте скорость закрытия позиций и прибыльность на 40%.",
  keywords: [
    "платформа для hr агентств",
    "рекрутинговая система",
    "ATS для агентств",
    "автоматизация рекрутинга",
    "управление вакансиями",
    "собственный брендинг для агентств",
  ],
}

export default function HRAgenciesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-violet-50/50 via-background to-background dark:from-violet-950/20 dark:via-background dark:to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.7_0.15_280/0.1),transparent_70%)]" />

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
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Кадровые агентства
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Платформа для HR-агентств нового поколения
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                Управляйте сотнями вакансий и тысячами кандидатов с помощью AI. Увеличьте скорость закрытия позиций,
                снизьте операционные расходы и предложите клиентам сервис премиум-класса
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "40%", label: "Рост прибыльности" },
                  { value: "3x", label: "Больше закрытых позиций" },
                  { value: "60%", label: "Экономия времени рекрутеров" },
                  { value: "95%", label: "Удовлетворенность клиентов" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
                    <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">{stat.value}</div>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Вызовы рекрутинговых агентств</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                HR-агентства работают в высококонкурентной среде с жесткими требованиями к скорости и качеству
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Управление сотнями вакансий",
                    description: "Одновременная работа с множеством клиентов и десятками открытых позиций",
                  },
                  {
                    title: "Высокая конкуренция",
                    description: "Необходимость закрывать вакансии быстрее конкурентов для удержания клиентов",
                  },
                  {
                    title: "Ограниченные ресурсы",
                    description: "Небольшая команда рекрутеров должна обрабатывать тысячи откликов",
                  },
                  {
                    title: "Сложность масштабирования",
                    description: "Рост числа клиентов требует пропорционального найма рекрутеров",
                  },
                  {
                    title: "Поиск уникальных специалистов",
                    description: "Клиенты требуют редких экспертов в узких областях",
                  },
                  {
                    title: "Контроль качества",
                    description: "Высокие требования к точности подбора и проверке кандидатов",
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Решения для HR-агентств</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                QBS Автонайм разработан специально для нужд кадровых агентств
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Zap,
                    title: "AI-ускорение всех процессов",
                    description:
                      "Автоматический скрининг, ранжирование кандидатов, генерация описаний вакансий и составление писем. AI берет на себя рутину, освобождая рекрутеров для работы с людьми.",
                    features: ["Авто-скрининг", "Ранжирование", "Генерация контента", "Умный поиск"],
                  },
                  {
                    icon: Briefcase,
                    title: "Мультипроектное управление",
                    description:
                      "Управляйте вакансиями от разных клиентов в одной системе. Раздельная аналитика, отчетность и настройки для каждого проекта с единой базой кандидатов.",
                    features: ["Проекты клиентов", "Общая база", "Отдельная аналитика", "Кастомные воронки"],
                  },
                  {
                    icon: Target,
                    title: "Продвинутый поиск талантов",
                    description:
                      "AI-поиск по профессиональным навыкам, опыту и потенциалу. Семантический поиск находит подходящих кандидатов, даже если формально они не соответствуют требованиям.",
                    features: ["Семантический поиск", "Поиск по навыкам", "Рекомендации", "Пассивные кандидаты"],
                  },
                  {
                    icon: DollarSign,
                    title: "Собственный брендинг",
                    description:
                      "Предлагайте клиентам систему под вашим брендом. Настройте логотип, цвета и домен. Выделяйтесь на фоне конкурентов premium-сервисом.",
                    features: ["Ваш бренд", "Собственный домен", "Брендинг клиента", "Премиум позиционирование"],
                  },
                ].map((solution, i) => {
                  const Icon = solution.icon
                  return (
                    <Card key={i} className="border-2 border-violet-500/20">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
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

        {/* Benefits Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Преимущества для вашего бизнеса</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                Как QBS Автонайм влияет на рост и прибыльность агентства
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: TrendingUp,
                    title: "Масштабирование без найма",
                    description:
                      "Обрабатывайте в 3x больше вакансий с той же командой. AI автоматизирует скрининг и первичную оценку.",
                  },
                  {
                    icon: Clock,
                    title: "Быстрее закрываете позиции",
                    description:
                      "Сокращение времени закрытия вакансий на 50-60%. Довольные клиенты приводят новых по рекомендациям.",
                  },
                  {
                    icon: Shield,
                    title: "Выше качество подбора",
                    description:
                      "AI-оценка снижает процент отказов на испытательном сроке. Клиенты получают точно подходящих кандидатов.",
                  },
                ].map((benefit, i) => {
                  const Icon = benefit.icon
                  return (
                    <Card key={i} className="text-center border-2">
                      <CardHeader>
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/70">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-violet-50/50 to-background dark:from-violet-950/10 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-violet-500/20">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-4">
                    Кейс клиента
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">Московское рекрутинговое агентство</CardTitle>
                  <CardDescription className="text-lg">
                    Увеличили количество одновременных проектов с 25 до 80 без расширения команды
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <TrendingUp className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">+220%</div>
                      <div className="text-sm text-foreground/60">Рост проектов</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Clock className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">-58%</div>
                      <div className="text-sm text-foreground/60">Время закрытия</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <DollarSign className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-1">+42%</div>
                      <div className="text-sm text-foreground/60">Прибыльность</div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-violet-500 pl-4 italic text-foreground/80 mb-6">
                    "QBS Автонайм полностью изменил наш бизнес. Мы смогли взять в 3 раза больше клиентов, при этом наша
                    команда не выросла. AI берет на себя всю рутину - скрининг резюме, первичные собеседования,
                    составление отчетов. Рекрутеры сосредоточились на работе с людьми и развитии клиентских отношений.
                    Окупилось за 2 месяца."
                  </blockquote>

                  <div className="text-sm text-foreground/60">— Основатель агентства</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">Все необходимые инструменты</h2>
              <p className="text-lg text-foreground/70 text-center mb-12 max-w-3xl mx-auto">
                Полный набор функций для эффективной работы HR-агентства
              </p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Мультипроектность",
                  "AI-скрининг",
                  "Автоматические отчеты клиентам",
                  "Общая база кандидатов",
                  "Интеграция с job-досками",
                  "Telegram-бот для кандидатов",
                  "Голосовые интервью",
                  "Аналитика по проектам",
                  "Собственный брендинг",
                  "API для интеграций",
                  "Права доступа команды",
                  "CRM для клиентов",
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-border bg-card hover:border-violet-500/50 transition-all hover:shadow-md"
                  >
                    <CheckCircle2 className="h-5 w-5 text-violet-500 mb-2" />
                    <div className="font-medium text-sm">{feature}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Масштабируйте свое агентство с QBS Автонайм
              </h2>
              <p className="text-lg text-foreground/70 mb-8">
                Запишитесь на демонстрацию и узнайте, как увеличить прибыльность вашего агентства на 40%
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/contact">
                    Запросить демо
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/products/whitelabel">Узнать о собственном брендинге</Link>
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
