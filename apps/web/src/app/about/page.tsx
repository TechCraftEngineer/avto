import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Header, Footer } from "@/components/layout"
import { Button } from "@qbs-autonaim/ui/components/button"
import { ArrowRight, Github, Linkedin, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "О нас | QBS Автонайм",
  description:
    "Узнайте о команде QBS — мы создаём AI-платформу для автоматизации найма, которая меняет рынок рекрутинга в России.",
  keywords: ["о компании QBS", "команда QBS", "HR tech стартап", "автоматизация рекрутинга Россия"],
  openGraph: {
    title: "О нас | QBS Автонайм",
    description: "Команда, меняющая рынок найма в России. Узнайте нашу историю и миссию.",
  },
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

const team = [
  {
    name: "Александр Иванов",
    role: "Основатель и CEO",
    image: "/professional-russian-man-ceo-founder-tech-startup.jpg",
    bio: "10+ лет в HR-tech. Ранее руководил разработкой в HeadHunter.",
    social: {
      telegram: "#",
      linkedin: "#",
    },
  },
  {
    name: "Мария Петрова",
    role: "CTO",
    image: "/professional-russian-woman-cto-tech-leader.jpg",
    bio: "Ex-Yandex. Эксперт в ML и NLP для HR-задач.",
    social: {
      telegram: "#",
      github: "#",
    },
  },
  {
    name: "Дмитрий Козлов",
    role: "Lead Engineer",
    image: "/professional-russian-man-software-engineer-develop.jpg",
    bio: "Full-stack разработчик. Архитектор AI-систем.",
    social: {
      telegram: "#",
      github: "#",
    },
  },
  {
    name: "Анна Смирнова",
    role: "Head of Product",
    image: "/professional-russian-woman-product-manager.jpg",
    bio: "Создаёт продукты, которые любят пользователи.",
    social: {
      telegram: "#",
      linkedin: "#",
    },
  },
]

const values = [
  {
    number: "01",
    title: "Клиенты на первом месте",
    description:
      "Наши клиенты — сердце нашего бизнеса. Мы добиваемся успеха, когда успешны они, и стремимся создавать продукты, которые превосходят ожидания.",
  },
  {
    number: "02",
    title: "Безопасность по умолчанию",
    description:
      "Мы строго соблюдаем ФЗ-152 о персональных данных. Все данные хранятся на серверах в России и защищены шифрованием по ГОСТ.",
  },
  {
    number: "03",
    title: "Действуй как владелец",
    description:
      "Мы даём команде свободу принимать решения без бюрократии. Доверяем каждому брать ответственность за свою работу.",
  },
  {
    number: "04",
    title: "Не останавливайся",
    description:
      "Застой — враг прогресса. Мы быстро выпускаем обновления и ещё быстрее итерируем — не жертвуя качеством.",
  },
]

const partners = [
  { name: "HeadHunter", logo: "/headhunter-logo-transparent.jpg" },
  { name: "Авито", logo: "/avito-logo-transparent.jpg" },
  { name: "Superjob", logo: "/superjob-logo-transparent.jpg" },
  { name: "Работа.ру", logo: "/rabota-ru-logo-transparent.jpg" },
  { name: "Telegram", logo: "/telegram-logo-transparent.jpg" },
  { name: "Сбер", logo: "/sber-logo-transparent.jpg" },
]

const lifePhotos = [
  { src: "/team-meeting-modern-office-russia.jpg", alt: "Командная встреча" },
  { src: "/team-collaboration-whiteboard-brainstorm.jpg", alt: "Брейншторм" },
  { src: "/team-celebration-success-startup.jpg", alt: "Празднование успеха" },
  { src: "/remote-work-home-office-laptop.jpg", alt: "Удалённая работа" },
  {
    src: "/team-building-outdoor-activity-nature.jpg",
    alt: "Тимбилдинг на природе",
  },
  { src: "/conference-presentation-stage-speaker.jpg", alt: "Выступление" },
  { src: "/casual-office-chat-colleagues-coffee.jpg", alt: "Кофе-брейк" },
  { src: "/hackathon-team-coding-together-intense.jpg", alt: "Хакатон" },
  { src: "/team-dinner-restaurant-celebration-happy.jpg", alt: "Командный ужин" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-glow-top opacity-60" />
          <div className="absolute inset-0 bg-dots-subtle" />

          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight text-balance">
                Преданная команда,
                <br />
                <span className="bg-gradient-to-r from-primary via-chart-2 to-accent bg-clip-text text-transparent">
                  меняющая рынок найма
                </span>
                <br />в России
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                Мы создаём AI-платформу для автоматизации рекрутинга, которая помогает компаниям нанимать лучших
                специалистов быстрее и эффективнее
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" asChild>
                  <Link href="#team">
                    Познакомиться с командой
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/contact">Связаться с нами</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Logos */}
        <section className="py-12 border-y border-border/40">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground mb-8">Нам доверяют ведущие компании России</p>
            <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16">
              {partners.map((partner) => (
                <Image
                  key={partner.name}
                  src={partner.logo || "/placeholder.svg"}
                  alt={partner.name}
                  width={180}
                  height={60}
                  className="h-12 w-auto grayscale hover:grayscale-0 transition-all"
                />
              ))}
            </div>
          </div>
        </section>

        {/* What is QBS */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Что такое QBS?</h2>
                <p className="text-xl md:text-2xl text-foreground leading-relaxed">
                  QBS — это современная AI-платформа для автоматизации найма. Мы помогаем компаниям с{" "}
                  <Link href="/products/ai-recruiter" className="text-primary hover:underline">
                    AI-скринингом кандидатов
                  </Link>
                  ,{" "}
                  <Link href="/products/ai-job-creation" className="text-primary hover:underline">
                    автоматическими интервью
                  </Link>{" "}
                  и{" "}
                  <Link href="/products/task-management" className="text-primary hover:underline">
                    управлением воронкой найма
                  </Link>{" "}
                  для 500+ компаний по всей России.
                </p>
              </div>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-xl">
                <Image src="/placeholder.svg?height=400&width=600" alt="Видео о QBS" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background/90 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                    <div className="ml-1 h-0 w-0 border-y-8 border-y-transparent border-l-12 border-l-foreground" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-foreground">
                    Познакомьтесь с QBS вместе с основателем Александром
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Наша миссия — переосмыслить рекрутинг для современного бизнеса
              </h2>
              <div className="prose prose-lg text-muted-foreground">
                <p>
                  Найм — один из самых важных процессов в любой компании. Каждый день рекрутеры тратят часы на просмотр
                  откликов, первичные интервью и административную работу.
                </p>
                <p>
                  Мы переосмысляем роль рекрутера — от рутинной обработки откликов к стратегическому партнёрству с
                  бизнесом. Наш AI берёт на себя 80% операционной работы, позволяя HR-специалистам сосредоточиться на
                  том, что действительно важно — на людях.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Наша команда</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Мы ценим человеческую связь</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                QBS — это полностью удалённая команда профессионалов, объединённых скоростью, действием и страстью к
                изменению рынка рекрутинга в России.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-3">{member.bio}</p>
                  <div className="flex items-center gap-3">
                    {member.social.telegram && (
                      <Link href={member.social.telegram} className="text-muted-foreground hover:text-foreground">
                        <TelegramIcon className="h-5 w-5" />
                      </Link>
                    )}
                    {member.social.linkedin && (
                      <Link href={member.social.linkedin} className="text-muted-foreground hover:text-foreground">
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    )}
                    {member.social.github && (
                      <Link href={member.social.github} className="text-muted-foreground hover:text-foreground">
                        <Github className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Life at QBS - Photo Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">Оставаемся на связи</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Жизнь в QBS</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Мы — разработчики со всей России, которые увлечены своей работой, но знают, когда пора отдохнуть. Лучшие
                идеи приходят, когда мы не смотрим в экраны.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {lifePhotos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative rounded-xl overflow-hidden ${
                    index === 0 || index === 2 || index === 5 ? "row-span-2 aspect-[3/4]" : "aspect-video"
                  }`}
                >
                  <Image
                    src={photo.src || "/placeholder.svg"}
                    alt={photo.alt}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-soft opacity-50" />

          <div className="container relative mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Наши ценности</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {values.map((value) => (
                <div key={value.number} className="flex gap-6">
                  <div className="flex-shrink-0 text-4xl font-bold text-muted-foreground/30">{value.number}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-foreground text-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы автоматизировать найм?</h2>
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
                className="border-background/20 text-background hover:bg-background/10 hover:text-background bg-transparent"
                asChild
              >
                <Link href="/contact">
                  <Mail className="mr-2 h-5 w-5" />
                  Связаться с нами
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
