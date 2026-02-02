import {
  Landmark,
  Shield,
  FileSearch,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  Users,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import Badge from "@qbs-autonaim/ui/badge"
import Button from "@qbs-autonaim/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/card"
import { Footer, Header } from "~/components/layout"

export const metadata: Metadata = {
  title: "Автоматизация найма в финтехе и банках | QBS Автонайм",
  description:
    "Решения для финансового сектора с проверкой благонадежности, соответствием требованиям ЦБ РФ и защитой данных. Сократите время найма на 60%.",
  keywords: [
    "найм в финтехе",
    "найм в банках",
    "проверка благонадежности",
    "требования ЦБ РФ",
    "финансовый сектор рекрутинг",
    "PCI DSS compliance",
  ],
}

export default function FintechIndustryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.7_0.15_230/0.1),transparent_70%)]" />

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
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Landmark className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Финтех и банки
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Автоматизация найма в финтехе и банках
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                Специализированные решения для финансового сектора с углубленной проверкой благонадежности,
                соответствием требованиям ЦБ РФ и максимальной защитой данных
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "60%", label: "Сокращение времени найма" },
                  { value: "100%", label: "Проверка благонадежности" },
                  { value: "5x", label: "Быстрее массовый найм" },
                  { value: "0", label: "Утечек данных" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stat.value}</div>
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
                Финансовые организации сталкиваются с уникальными требованиями при подборе персонала
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Требования ЦБ РФ и регуляторов",
                    description: "Обязательная проверка благонадежности сотрудников согласно требованиям ЦБ",
                  },
                  {
                    title: "Проверка кредитной истории",
                    description: "Необходимость верификации финансовой добросовестности кандидатов",
                  },
                  {
                    title: "Массовый найм операционистов",
                    description: "Необходимость быстро закрывать десятки позиций в отделениях по всей стране",
                  },
                  {
                    title: "Высокие требования безопасности",
                    description: "Строгий контроль доступа к данным и соответствие PCI DSS, ISO 27001",
                  },
                  {
                    title: "Дефицит IT-специалистов",
                    description: "Сложность поиска разработчиков, DevOps, ИБ-специалистов с опытом в финтехе",
                  },
                  {
                    title: "Соответствие 152-ФЗ",
                    description: "Обработка и хранение персональных данных согласно законодательству РФ",
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
                QBS Автонайм решает специфические задачи финансового сектора
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: FileSearch,
                    title: "Проверка благонадежности",
                    description:
                      "Интеграция с ФССП, налоговой, кредитными бюро для автоматической проверки кандидатов. Соответствие требованиям ЦБ РФ к проверке сотрудников.",
                    features: ["ФССП", "Кредитная история", "Судимости", "Налоги"],
                  },
                  {
                    icon: Users,
                    title: "Масштабный и быстрый найм",
                    description:
                      "Автоматизация массового найма операционистов, кассиров, менеджеров. Мультирегиональность с учетом локальных требований и рынка труда.",
                    features: ["Массовый найм", "Мультирегиональность", "Быстрый онбординг", "Локализация"],
                  },
                  {
                    icon: Lock,
                    title: "Максимальная защита данных",
                    description:
                      "Соответствие 152-ФЗ, PCI DSS, ISO 27001. Многоуровневое шифрование, аудит-логи всех действий, контроль доступа на уровне ролей.",
                    features: ["152-ФЗ", "PCI DSS", "ISO 27001", "Шифрование"],
                  },
                  {
                    icon: Clock,
                    title: "AI-скрининг IT-специалистов",
                    description:
                      "Глубокий технический скрининг разработчиков, DevOps, ИБ-специалистов. Автоматические технические тесты и оценка опыта в финтехе.",
                    features: ["Технические тесты", "Оценка навыков", "Портфолио", "GitHub анализ"],
                  },
                ].map((solution, i) => {
                  const Icon = solution.icon
                  return (
                    <Card key={i} className="border-2 border-blue-500/20">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
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

        {/* Compliance Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                <Shield className="h-4 w-4 mr-2" />
                Соответствие стандартам
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Полное соответствие требованиям финсектора</h2>
              <p className="text-lg text-foreground/70 mb-10">
                QBS Автонайм разработан с учетом всех требований ЦБ РФ и международных стандартов безопасности
              </p>

              <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-4">
                {["ЦБ РФ", "152-ФЗ", "PCI DSS", "ISO 27001", "GDPR"].map((standard, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-border bg-card hover:border-blue-500/50 transition-colors"
                  >
                    <Shield className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="font-semibold text-sm">{standard}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50/50 to-background dark:from-blue-950/10 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-blue-500/20">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-4">
                    Кейс клиента
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">Российский цифровой банк</CardTitle>
                  <CardDescription className="text-lg">
                    Закрыли 150 позиций операционистов за 3 недели вместо 3 месяцев
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">5x</div>
                      <div className="text-sm text-foreground/60">Быстрее найм</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <CheckCircle2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">100%</div>
                      <div className="text-sm text-foreground/60">Прошли проверку ЦБ</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">150</div>
                      <div className="text-sm text-foreground/60">Позиций закрыто</div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-blue-500 pl-4 italic text-foreground/80 mb-6">
                    "QBS Автонайм позволил нам масштабировать найм во всех регионах России, при этом автоматически
                    проверяя каждого кандидата согласно требованиям ЦБ. Система полностью интегрирована с нашими
                    внутренними процессами безопасности."
                  </blockquote>

                  <div className="text-sm text-foreground/60">— Директор по персоналу</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы оптимизировать найм в финансовой организации?</h2>
              <p className="text-lg text-foreground/70 mb-8">
                Обсудите с нашими экспертами, как QBS Автонайм может решить задачи вашего банка или финтех-компании
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
