"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Sparkles, Kanban, BarChart3, Link2, Globe, Brain } from "lucide-react"

export function ProductNavigation() {
  const pathname = usePathname()

  const products = [
    {
      name: "AI-Рекрутер",
      href: "/products/ai-recruiter",
      icon: Bot,
      description: "Автоматический скрининг кандидатов",
    },
    {
      name: "AI-Создание вакансий",
      href: "/products/ai-job-creation",
      icon: Sparkles,
      description: "Генерация описаний за 30 сек",
    },
    {
      name: "Управление задачами",
      href: "/products/task-management",
      icon: Kanban,
      description: "Все платформы в одном месте",
    },
    {
      name: "AI-Аналитик",
      href: "/products/ai-analyst",
      icon: Brain,
      description: "Умный поиск по вашим данным",
    },
    {
      name: "Аналитика",
      href: "/products/analytics",
      icon: BarChart3,
      description: "Воронка найма под контролем",
    },
    {
      name: "Интеграции",
      href: "/products/integrations",
      icon: Link2,
      description: "Работа с вашими инструментами",
    },
    {
      name: "Собственный брендинг",
      href: "/products/whitelabel",
      icon: Globe,
      description: "AI-рекрутер под вашим брендом",
    },
  ]

  return (
    <nav className="border-b border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 flex-wrap py-4">
          {products.map((product) => {
            const isActive = pathname === product.href
            const Icon = product.icon

            return (
              <Link
                key={product.href}
                href={product.href}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isActive ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="hidden sm:block">
                  <div className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                    {product.name}
                  </div>
                  <div className="text-xs text-muted-foreground hidden lg:block">{product.description}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}