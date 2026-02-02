import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header, Footer } from "@/components/layout"
import { ArrowLeft, Twitter, Linkedin, LinkIcon } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/button"

// Mock data - in production this would come from a CMS or database
const blogPosts: Record<
  string,
  {
    title: string
    excerpt: string
    content: string[]
    category: string
    categoryLabel: string
    date: string
    readTime: string
    author: {
      name: string
      role: string
      avatar: string
    }
    image: string
    tableOfContents: { id: string; title: string }[]
  }
> = {
  "ai-screening-launch": {
    title: "Запуск AI-скрининга: 10 000 кандидатов обработано за первый месяц",
    excerpt:
      "Мы рады сообщить, что наша система AI-скрининга обработала более 10 000 кандидатов за первый месяц работы.",
    content: [
      "Сегодня мы достигли важной вехи: наша система AI-скрининга обработала более 10 000 кандидатов за первый месяц работы. Это свидетельство доверия, которое наши клиенты оказывают нам в автоматизации процесса найма.",
      "За этот месяц компании-клиенты сэкономили в среднем 85% времени на первичном отборе кандидатов. Вместо того чтобы тратить часы на просмотр резюме, HR-специалисты получают список финалистов с AI-оценкой каждого кандидата.",
      "Наш алгоритм анализирует не только формальные критерии соответствия вакансии, но и soft skills, мотивацию и потенциал роста кандидата. Это позволяет находить «скрытые жемчужины» — талантливых специалистов, которых легко пропустить при ручном отборе.",
      "Средняя точность AI-скрининга составила 94%, что значительно превышает показатели традиционного отбора. При этом система постоянно обучается на обратной связи от рекрутеров, становясь всё точнее.",
      "Мы благодарим всех наших клиентов за доверие и обещаем продолжать развивать технологию, делая процесс найма ещё эффективнее.",
    ],
    category: "news",
    categoryLabel: "Новости компании",
    date: "15 января 2026",
    readTime: "5 мин",
    author: {
      name: "Алексей Иванов",
      role: "CEO & Co-founder",
      avatar: "/ceo-portrait.png",
    },
    image: "/ai-recruitment-milestone-celebration-confetti-dash.jpg",
    tableOfContents: [
      { id: "milestone", title: "Достижение вехи" },
      { id: "savings", title: "Экономия времени" },
      { id: "accuracy", title: "Точность AI-скрининга" },
    ],
  },
  "telegram-integration": {
    title: "Интеграция с Telegram: автоматические интервью через мессенджер",
    excerpt: "Теперь кандидаты могут проходить первичное интервью прямо в Telegram.",
    content: [
      "Мы запустили полноценную интеграцию с Telegram, позволяющую проводить автоматические интервью прямо в мессенджере. Это значительно упрощает процесс для кандидатов — им не нужно скачивать дополнительные приложения или регистрироваться на новых платформах.",
      "Для интеграции мы используем протокол MTProto напрямую, что обеспечивает максимальную скорость доставки сообщений и надёжность соединения. В отличие от Bot API, MTProto позволяет работать с сообщениями в реальном времени без задержек.",
      "AI-бот задаёт вопросы, анализирует ответы и формирует профиль кандидата автоматически. Рекрутер получает готовый отчёт с оценками по каждому критерию и рекомендацией по дальнейшим действиям.",
      "Первые результаты впечатляют: конверсия из отклика в пройденное интервью выросла на 340%. Кандидатам удобнее отвечать в привычном мессенджере, и они делают это охотнее.",
    ],
    category: "product",
    categoryLabel: "Продукт",
    date: "10 января 2026",
    readTime: "4 мин",
    author: {
      name: "Мария Петрова",
      role: "Product Manager",
      avatar: "/professional-woman-product-manager.png",
    },
    image: "/telegram-messenger-chat-integration-recruitment-bo.jpg",
    tableOfContents: [
      { id: "integration", title: "Запуск интеграции" },
      { id: "mtproto", title: "Технология MTProto" },
      { id: "results", title: "Первые результаты" },
    ],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts[slug]

  if (!post) {
    return { title: "Статья не найдена | QBS Блог" }
  }

  return {
    title: `${post.title} | QBS Блог`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = blogPosts[slug]

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Статья не найдена</h1>
            <Link href="/blog" className="text-primary hover:underline">
              Вернуться к блогу
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <article className="container mx-auto px-4 md:px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад к блогу
          </Link>

          {/* Article Header */}
          <div className="max-w-4xl">
            {/* Category & Date */}
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 text-sm font-medium rounded-full border border-border bg-muted/50">
                {post.categoryLabel}
              </span>
              <span className="text-sm text-muted-foreground">{post.date}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8">{post.excerpt}</p>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-[1fr_320px] gap-12 mt-8">
            {/* Article Content */}
            <div>
              {/* Featured Image */}
              <div className="relative aspect-[2/1] mb-10 overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
                <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" priority />
              </div>

              {/* Article Body */}
              <div className="prose prose-lg max-w-none">
                {post.content.map((paragraph, index) => (
                  <p key={index} className="text-foreground/90 leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Share */}
              <div className="mt-12 pt-8 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-4">Поделиться статьёй</p>
                <div className="flex gap-3">
                  <button className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                    <Twitter className="h-5 w-5" />
                  </button>
                  <button className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </button>
                  <button className="p-2 rounded-full border border-border hover:bg-muted transition-colors">
                    <LinkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                {/* Author Card */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Автор</p>
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-border">
                      <Image
                        src={post.author.avatar || "/placeholder.svg"}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{post.author.name}</p>
                      <p className="text-sm text-muted-foreground">{post.author.role}</p>
                    </div>
                  </div>
                </div>

                {/* Table of Contents */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">На этой странице</span>
                  </div>
                  <nav className="space-y-1">
                    {post.tableOfContents.map((item, index) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block py-2 px-3 text-sm transition-colors border-l-2 ${
                          index === 0
                            ? "border-foreground text-foreground font-medium"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* CTA Card */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="relative aspect-[16/9] mb-4 overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                    <Image src="/qbs-dashboard-preview-analytics.jpg" alt="QBS Dashboard" fill className="object-cover" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">Попробуйте QBS бесплатно</h4>
                  <p className="text-sm text-muted-foreground mb-4">Автоматизируйте найм с помощью AI-платформы</p>
                  <Button className="w-full bg-foreground text-background hover:bg-neutral-800">
                    Начать бесплатно
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  )
}
