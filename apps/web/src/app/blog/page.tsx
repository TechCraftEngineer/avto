import type { Metadata } from "next"
import { Header, Footer } from "@/components/layout"
import { BlogCategoryNav } from "@/components/blog/blog-category-nav"
import { BlogCard } from "@/components/blog/blog-card"

export const metadata: Metadata = {
  title: "Блог | QBS Автонайм",
  description: "Последние новости, советы по найму и обновления платформы QBS",
}

const categories = [
  { id: "all", name: "Обзор", count: 12 },
  { id: "news", name: "Новости компании", count: 4 },
  { id: "guides", name: "Руководства", count: 3 },
  { id: "product", name: "Продукт", count: 2 },
  { id: "cases", name: "Истории клиентов", count: 2 },
  { id: "changelog", name: "Обновления", count: 1 },
]

const blogPosts = [
  {
    id: "ai-screening-launch",
    slug: "ai-screening-launch",
    title: "Запуск AI-скрининга: 10 000 кандидатов обработано за первый месяц",
    excerpt:
      "Мы рады сообщить, что наша система AI-скрининга обработала более 10 000 кандидатов за первый месяц работы, помогая компаниям экономить до 85% времени на первичном отборе.",
    category: "news",
    categoryLabel: "Новости компании",
    date: "15 января 2026",
    author: {
      name: "Алексей Иванов",
      role: "CEO & Co-founder",
      avatar: "/professional-man-ceo-avatar.jpg",
    },
    image: "/ai-recruitment-dashboard-analytics-celebration-con.jpg",
    featured: true,
  },
  {
    id: "telegram-integration",
    slug: "telegram-integration",
    title: "Интеграция с Telegram: автоматические интервью через мессенджер",
    excerpt:
      "Теперь кандидаты могут проходить первичное интервью прямо в Telegram. Используем MTProto для максимальной скорости и надёжности.",
    category: "product",
    categoryLabel: "Продукт",
    date: "10 января 2026",
    author: {
      name: "Мария Петрова",
      role: "Product Manager",
      avatar: "/professional-woman-product-manager-avatar.jpg",
    },
    image: "/telegram-messenger-integration-chat-interface.jpg",
    featured: false,
  },
  {
    id: "hiring-guide-2026",
    slug: "hiring-guide-2026",
    title: "Полное руководство по найму в 2026: тренды и лучшие практики",
    excerpt:
      "Как изменился рынок труда и какие инструменты помогут вам нанимать быстрее и эффективнее. Разбираем AI, автоматизацию и новые подходы.",
    category: "guides",
    categoryLabel: "Руководства",
    date: "5 января 2026",
    author: {
      name: "Дмитрий Смирнов",
      role: "Head of Content",
      avatar: "/professional-man-content-writer-avatar.jpg",
    },
    image: "/hiring-trends-2026-modern-recruitment-strategy.jpg",
    featured: false,
  },
  {
    id: "case-study-techcorp",
    slug: "case-study-techcorp",
    title: "Как TechCorp сократил время найма с 45 до 12 дней",
    excerpt:
      "История успеха: крупная IT-компания внедрила QBS и полностью трансформировала процесс найма. Делимся результатами и уроками.",
    category: "cases",
    categoryLabel: "Истории клиентов",
    date: "28 декабря 2025",
    author: {
      name: "Елена Козлова",
      role: "Customer Success",
      avatar: "/professional-woman-customer-success-avatar.jpg",
    },
    image: "/tech-company-success-story-office-team.jpg",
    featured: false,
  },
  {
    id: "voice-interviews",
    slug: "voice-interviews",
    title: "Голосовые интервью: как AI оценивает soft skills кандидатов",
    excerpt:
      "Разбираем технологию голосового интервью: как работает распознавание речи, какие метрики анализируются и почему это эффективнее текстовых опросов.",
    category: "product",
    categoryLabel: "Продукт",
    date: "20 декабря 2025",
    author: {
      name: "Алексей Иванов",
      role: "CEO & Co-founder",
      avatar: "/professional-man-ceo-avatar.jpg",
    },
    image: "/voice-interview-ai-speech-recognition-waveform.jpg",
    featured: false,
  },
  {
    id: "api-v2-release",
    slug: "api-v2-release",
    title: "API v2.0: новые возможности для интеграции",
    excerpt:
      "Выпустили обновлённый API с поддержкой вебхуков, batch-операций и улучшенной документацией. Миграция с v1 занимает менее часа.",
    category: "changelog",
    categoryLabel: "Обновления",
    date: "15 декабря 2025",
    author: {
      name: "Игорь Волков",
      role: "Lead Developer",
      avatar: "/professional-man-developer-avatar.png",
    },
    image: "/api-documentation-code-terminal-developer.jpg",
    featured: false,
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4">Блог</h1>
            <p className="text-lg text-muted-foreground">Последние новости и обновления от QBS</p>
          </div>

          {/* Category Navigation */}
          <BlogCategoryNav categories={categories} />

          {/* Subtle divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
          </div>

          {/* Blog Posts Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-full transition-colors hover:bg-muted">
              Загрузить ещё
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
