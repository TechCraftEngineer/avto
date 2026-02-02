
import {
  Factory,
  Shield,
  Award,
  MapPin,
  HardHat,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  FileCheck,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Footer, Header } from "~/components/layout"
import { Badge } from "@qbs-autonaim/ui/badge"
import { Button } from "@qbs-autonaim/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui/card"

export const metadata: Metadata = {
  title: "Автоматизация найма в производстве | QBS Автонайм",
  description:
    "Решения для промышленных предприятий с проверкой допусков, сертификатов, соответствием охране труда. Локальный найм в регионах присутствия. Сократите время найма на 55%.",
  keywords: [
    "найм в производстве",
    "найм на заводе",
    "проверка допусков",
    "сертификаты специалистов",
    "охрана труда",
    "локальный рекрутинг",
  ],
}

export default function ManufacturingIndustryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-slate-50/50 via-background to-background dark:from-slate-950/20 dark:via-background dark:to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.7_0.05_220/0.1),transparent_70%)]" />

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
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center shadow-lg">
                  <Factory className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Производство
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Автоматизация найма в производстве
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                Специализированные решения для промышленных предприятий с проверкой квалификаций, допусков,
                сертификатов и соответствием требованиям охраны труда
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "55%", label: "Сокращение времени найма" },
                  { value: "100%", label: "Проверка допусков" },
                  { value: "35+", label: "Регионов РФ" },
                  { value: "0", label: "Инцидентов ОТ" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
                    <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 mb-1">{stat.value}</div>
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
                Промышленные предприятия сталкиваются с уникальными требованиями при найме персонала
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Проверка допусков и сертификатов",
                    description: "Обязательная верификация квалификационных удостоверений, допусков к работам, медосмотров",
                  },
                  {
                    title: "Требования охраны труда",
                    description: "Строгое соответствие нормам ОТ, обязательные инструктажи и проверка знаний",
                  },
                  {
                    title: "Локальный рынок труда",
                    description: "Необходимость найма в конкретных регионах с ограниченным числом квалифицированных кадров",
                  },
                  {
                    title: "Специфические навыки",
                    description: "Поиск операторов станков, сварщиков, наладчиков, инженеров со специализированным опытом",
                  },
                  {
                    title: "Сменный график работы",
                    description: "Необходимость укомплектовать все смены квалифицированным персоналом",
                  },
                  {
                    title: "Проверка медицинских допусков",
                    description: "Обязательные медосмотры, отсутствие противопоказаний для работы на производстве",
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
                QBS Автонайм решает специфические задачи промышленных предприятий
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Award,
                    title: "Проверка квалификаций и допусков",
                    description:
                      "Автоматическая проверка наличия удостоверений, допусков к работам, сертификатов НАКС, разрядов. Верификация подлинности документов через базы данных.",
                    features: ["Проверка удостоверений", "Допуски к работам", "НАКС сертификаты", "Разряды"],
                  },
                  {
                    icon: HardHat,
                    title: "Соответствие охране труда",
                    description:
                      "Проверка прохождения медосмотров, инструктажей по ОТ, знаний правил безопасности. Автоматическое напоминание о переаттестации и продлении допусков.",
                    features: ["Медосмотры", "Инструктажи ОТ", "Правила безопасности", "Напоминания"],
                  },
                  {
                    icon: MapPin,
                    title: "Локальный найм",
                    description:
                      "Таргетированный найм в конкретных регионах и городах присутствия предприятий. Анализ локального рынка труда и зарплатных ожиданий.",
                    features: ["Геотаргетинг", "Локальные источники", "Анализ рынка", "Региональность"],
                  },
                  {
                    icon: FileCheck,
                    title: "Оценка технических навыков",
                    description:
                      "Специализированные тесты для операторов станков, сварщиков, наладчиков. Оценка опыта работы с конкретным оборудованием и технологиями.",
                    features: ["Технические тесты", "Оценка опыта", "Знание оборудования", "Практические задачи"],
                  },
                ].map((solution, i) => {
                  const Icon = solution.icon
                  return (
                    <Card key={i} className="border-2 border-slate-500/20">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center mb-4">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Полное соответствие требованиям промышленности</h2>
              <p className="text-lg text-foreground/70 mb-10">
                QBS Автонайм разработан с учетом всех требований охраны труда и промышленной безопасности
              </p>

              <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-4">
                {["Охрана труда", "ГОСТ 12.0.004", "152-ФЗ", "ISO 45001", "Ростехнадзор"].map((standard, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border-2 border-border bg-card hover:border-slate-500/50 transition-colors"
                  >
                    <Shield className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                    <div className="font-semibold text-sm">{standard}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-slate-50/50 to-background dark:from-slate-950/10 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-slate-500/20">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-4">
                    Кейс клиента
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">Промышленный холдинг</CardTitle>
                  <CardDescription className="text-lg">
                    Укомплектовали 5 заводов в разных регионах за 2 месяца с полной проверкой квалификаций
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <TrendingUp className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 mb-1">-55%</div>
                      <div className="text-sm text-foreground/60">Времени найма</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <CheckCircle2 className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 mb-1">100%</div>
                      <div className="text-sm text-foreground/60">Проверенные допуски</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <Factory className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-slate-600 dark:text-slate-400 mb-1">5</div>
                      <div className="text-sm text-foreground/60">Заводов</div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-slate-500 pl-4 italic text-foreground/80 mb-6">
                    "QBS Автонайм помог нам быстро укомплектовать персонал на всех предприятиях холдинга. Система
                    автоматически проверяла все необходимые допуски и квалификации, что значительно снизило риски и
                    ускорило процесс найма. Все сотрудники прошли проверку Ростехнадзора без замечаний."
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Готовы оптимизировать найм на производстве?
              </h2>
              <p className="text-lg text-foreground/70 mb-8">
                Обсудите с нашими экспертами, как QBS Автонайм может решить задачи вашего промышленного предприятия
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
