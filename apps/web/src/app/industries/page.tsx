import { Pill, Landmark, ShoppingCart, Factory, ArrowRight, Building2, Users } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { Footer, Header } from "~/components/layout"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qbs-autonaim/ui"

export const metadata: Metadata = {
  title: "Отраслевые решения для автоматизации найма | QBS Автонайм",
  description:
    "Специализированные решения для найма с учетом требований комплаенса, безопасности и специфики вашей индустрии: фармацевтика, финтех, ритейл, производство.",
  keywords: [
    "отраслевые решения",
    "найм в фармацевтике",
    "найм в финтех",
    "найм в ритейле",
    "найм в производстве",
    "комплаенс найма",
    "автоматизация найма",
  ],
}

const industries = [
  {
    id: "pharma",
    name: "Фармацевтика",
    icon: Pill,
    gradient: "from-emerald-500 to-teal-500",
    description:
      "Специализированные решения с учетом GxP, FDA и требований к квалификации специалистов",
    highlights: ["GxP комплаенс", "Проверка лицензий", "Аудит-логи", "152-ФЗ"],
    href: "/industries/pharma",
  },
  {
    id: "hr-agencies",
    name: "Кадровые агентства",
    icon: Users,
    gradient: "from-violet-500 to-purple-500",
    description: "Платформа для HR-агентств с мультипроектностью, собственным брендингом и AI-автоматизацией",
    highlights: ["Мультипроектность", "Собственный брендинг", "AI-скрининг", "Масштабирование"],
    href: "/industries/hr-agencies",
  },
  {
    id: "fintech",
    name: "Финтех и банки",
    icon: Landmark,
    gradient: "from-blue-500 to-cyan-500",
    description: "Решения для финансового сектора с фокусом на безопасность и проверку благонадежности",
    highlights: ["Проверка благонадежности", "Требования ЦБ", "Массовый найм", "PCI DSS"],
    href: "/industries/fintech",
  },
  {
    id: "retail",
    name: "Ритейл и e-commerce",
    icon: ShoppingCart,
    gradient: "from-orange-500 to-amber-500",
    description: "Масштабируемые решения для сезонного и массового найма",
    highlights: ["Сезонный найм", "Мультирегиональность", "Быстрый онбординг", "Аналитика текучести"],
    href: "/industries/retail",
  },
  {
    id: "manufacturing",
    name: "Производство",
    icon: Factory,
    gradient: "from-slate-500 to-gray-500",
    description: "Решения с проверкой квалификаций, сертификатов и допусков",
    highlights: ["Проверка допусков", "Сертификаты", "Охрана труда", "Локальный найм"],
    href: "/industries/manufacturing",
  },
]

export default function IndustriesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.95_0.01_270/0.15),transparent_70%)]" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 px-4 py-1.5">
                <Building2 className="h-4 w-4 mr-2" />
                Отраслевые решения
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Решения для вашей индустрии
              </h1>
              <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
                Специализированные решения для автоматизации найма с учетом требований комплаенса, безопасности и
                специфики вашей отрасли
              </p>
            </div>
          </div>
        </section>

        {/* Industries Grid */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {industries.map((industry) => {
                const Icon = industry.icon
                return (
                  <Card
                    key={industry.id}
                    className="group relative overflow-hidden border-2 hover:border-foreground/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-300`}
                    />
                    
                    {/* Animated gradient border */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300`} />

                    <CardHeader className="relative">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`h-14 w-14 rounded-xl bg-gradient-to-br ${industry.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300`}
                        >
                          <Icon className="h-7 w-7 text-white group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-foreground/40 group-hover:text-foreground group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-2xl mb-2">{industry.name}</CardTitle>
                      <CardDescription className="text-base leading-relaxed">{industry.description}</CardDescription>
                    </CardHeader>

                    <CardContent className="relative">
                      {/* Highlights */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {industry.highlights.map((highlight, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full group-hover:bg-foreground group-hover:text-background transition-colors bg-transparent pointer-events-none">
                        <span>
                          Подробнее
                          <ArrowRight className="ml-2 h-4 w-4 inline" />
                        </span>
                      </Button>
                    </CardContent>

                    {/* Hover overlay */}
                    <Link href={industry.href} className="absolute inset-0" />
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Не нашли вашу отрасль?</h2>
              <p className="text-lg text-foreground/70 mb-8">
                Мы адаптируем QBS Автонайм под требования любой индустрии. Расскажите о своих задачах, и мы найдем
                решение.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/contact">Обсудить проект</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/">Вернуться на главную</Link>
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
