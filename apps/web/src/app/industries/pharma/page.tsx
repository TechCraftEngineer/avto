import {
  Pill,
  Shield,
  FileCheck,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Footer, Header } from "~/components/layout"
import { Badge } from "@qbs-autonaim/ui"
import { Button } from "@qbs-autonaim/ui"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui"

export const metadata: Metadata = {
  title: "Автоматизация найма в фармацевтике | QBS Автонайм",
  description:
    "Специализированные решения для фармацевтических компаний с учетом GxP, ГОСТ Р 52249, проверкой лицензий и соответствием 152-ФЗ. Сократите время найма на 65%.",
  keywords: [
    "найм в фармацевтике",
    "GxP комплаенс",
    "ГОСТ Р 52249",
    "найм R&D специалистов",
    "проверка лицензий",
    "фармацевтический рекрутинг",
  ],
}

export default function PharmaIndustryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-br from-emerald-50/50 via-background to-background dark:from-emerald-950/20 dark:via-background dark:to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.7_0.15_160/0.1),transparent_70%)]" />

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
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Pill className="h-8 w-8 text-white" />
                </div>
                <Badge variant="outline" className="px-3 py-1">
                  Фармацевтика
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Автоматизация найма в фармацевтике
              </h1>
              <p className="text-xl text-foreground/70 leading-relaxed mb-8">
                Специализированные решения для фармацевтических компаний с учетом строгих требований к комплаенсу,
                конфиденциальности данных и квалификации специалистов
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { value: "65%", label: "Сокращение времени найма" },
                  { value: "100%", label: "Комплаенс документации" },
                  { value: "3x", label: "Больше квалифицированных кандидатов" },
                  { value: "0", label: "Нарушений аудита" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-card border border-border">
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">{stat.value}</div>
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
                Фармацевтические компании сталкиваются с уникальными сложностями при найме специалистов
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Строгие требования GxP и Минздрава",
                    description: "Необходимость документировать все этапы найма согласно российским регуляторным требованиям",
                  },
                  {
                    title: "Долгий цикл согласований",
                    description: "Множественные проверки и одобрения из-за требований комплаенса",
                  },
                  {
                    title: "Дефицит квалифицированных специалистов",
                    description: "Сложность поиска R&D, QA, RA специалистов с нужным опытом",
                  },
                  {
                    title: "Проверка лицензий и сертификатов",
                    description: "Необходимость верификации образования, сертификатов и допусков",
                  },
                  {
                    title: "Высокая стоимость ошибки",
                    description: "Неправильный найм в критические позиции может привести к серьезным последствиям",
                  },
                  {
                    title: "Защита персональных данных",
                    description: "Соответствие 152-ФЗ и GDPR при обработке данных кандидатов",
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
                QBS Автонайм решает специфические задачи фармацевтической отрасли
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: FileCheck,
                    title: "Автоматическая проверка квалификаций",
                    description:
                      "AI проверяет наличие необходимых сертификатов, лицензий и образования согласно требованиям позиции. Интеграция с базами данных для верификации.",
                    features: ["Проверка дипломов", "Верификация сертификатов", "Проверка допусков", "История работы"],
                  },
                  {
                    icon: Shield,
                    title: "Комплаенс-ready документация",
                    description:
                      "Все этапы найма документируются с аудит-логами для соответствия GxP, ГОСТ Р 52249-2009 и внутренним политикам компании.",
                    features: ["Аудит-логи", "GxP compliance", "ГОСТ Р 52249", "Электронная подпись"],
                  },
                  {
                    icon: Clock,
                    title: "Ускоренный скрининг специалистов",
                    description:
                      "Глубокий анализ опыта в регуляторике, клинических исследованиях и производстве. Автоматическая оценка соответствия требованиям.",
                    features: ["AI-скрининг", "Оценка опыта", "Технические тесты", "Приоритизация"],
                  },
                  {
                    icon: Lock,
                    title: "Защита персональных данных",
                    description:
                      "Соответствие 152-ФЗ и GDPR с шифрованием и контролем доступа к данным кандидатов. Безопасное хранение в облаке.",
                    features: ["152-ФЗ", "GDPR", "Шифрование", "Контроль доступа"],
                  },
                ].map((solution, i) => {
                  const Icon = solution.icon
                  return (
                    <Card key={i} className="border-2 border-emerald-500/20">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Полное соответствие регуляторным требованиям</h2>
              <p className="text-lg text-foreground/70 mb-10">
                QBS Автонайм разработан с учетом всех требований фармацевтической индустрии
              </p>

              <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-4">
                {["GxP", "ГОСТ Р 52249", "152-ФЗ", "ISO 27001", "Минздрав РФ"].map((standard, i) => (
                  <div key={i} className="p-4 rounded-xl border-2 border-border bg-card hover:border-emerald-500/50 transition-colors">
                    <Shield className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <div className="font-semibold text-sm">{standard}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-emerald-50/50 to-background dark:from-emerald-950/10 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-emerald-500/20">
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-4">
                    Кейс клиента
                  </Badge>
                  <CardTitle className="text-2xl md:text-3xl">Крупная российская фармкомпания</CardTitle>
                  <CardDescription className="text-lg">
                    Сократили время закрытия позиций R&D с 90 до 35 дней
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">-61%</div>
                      <div className="text-sm text-foreground/60">Времени найма</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">100%</div>
                      <div className="text-sm text-foreground/60">Прошли аудит</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-muted/50">
                      <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">3x</div>
                      <div className="text-sm text-foreground/60">Больше кандидатов</div>
                    </div>
                  </div>

                  <blockquote className="border-l-4 border-emerald-500 pl-4 italic text-foreground/80 mb-6">
                    "QBS Автонайм позволил нам значительно сократить время найма критически важных R&D специалистов, при
                    этом полностью соблюдая все требования GxP и внутренние политики компании. Система прошла все
                    внутренние и внешние аудиты."
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы оптимизировать найм в вашей компании?</h2>
              <p className="text-lg text-foreground/70 mb-8">
                Обсудите с нашими экспертами, как QBS Автонайм может решить задачи вашей фармацевтической компании
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
