"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@qbs-autonaim/ui/button"
import {
  Menu,
  X,
  Bot,
  Sparkles,
  BarChart3,
  FileText,
  HelpCircle,
  BookOpen,
  ChevronDown,
  Kanban,
  Globe,
  Building2,
  Users,
  Phone,
  Brain,
  ShoppingCart,
  Landmark,
  Pill,
  Factory,
  ArrowRight,
} from "lucide-react"
import { env } from "@/env"

type DropdownType = "product" | "resources" | "company" | "industries" | null


export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [clickedDropdown, setClickedDropdown] = useState<DropdownType>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 5)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setClickedDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [])

  const toggleDropdown = (dropdown: DropdownType) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    const newState = activeDropdown === dropdown ? null : dropdown
    setActiveDropdown(newState)
    setClickedDropdown(newState)
  }

  const handleMouseEnter = (dropdown: DropdownType) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // Only open on hover if not already clicked open
    if (clickedDropdown === null) {
      setActiveDropdown(dropdown)
    }
  }

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    closeTimeoutRef.current = setTimeout(() => {
      // Only close on hover if not clicked open
      if (clickedDropdown === null) {
        setActiveDropdown(null)
      }
    }, 150)
  }

  return (
    <header className="sticky top-0 z-[60] w-full transition-all duration-300">
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isMenuOpen
            ? "border-b border-border/60 bg-background backdrop-blur-lg shadow-sm"
            : isScrolled
              ? "border-b border-border/60 bg-background/80 backdrop-blur-lg shadow-sm"
              : "bg-transparent"
        }`}
      />
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 relative">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-semibold text-foreground">
            <span className="text-muted-foreground font-medium tracking-wide">
              QBS
            </span>{" "}
            <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent font-bold">
              Автонайм
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" ref={dropdownRef}>
          {/* Product Dropdown */}
          <div className="relative" onMouseEnter={() => handleMouseEnter("product")} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => toggleDropdown("product")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                activeDropdown === "product"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Продукт
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeDropdown === "product" ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === "product" && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[680px] rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
                onMouseEnter={() => handleMouseEnter("product")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="grid grid-cols-3 gap-4">
                  {/* AI Recruiter Assistant Card */}
                  <Link
                    href="/products/ai-recruiter"
                    className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-lg hover:bg-muted/30"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="mb-3 h-8 w-8 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-foreground/90 transition-colors">
                      AI-Рекрутер
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Автоматический скрининг и интервью кандидатов
                    </p>
                  </Link>

                  {/* AI Job Creator Card */}
                  <Link
                    href="/products/ai-job-creation"
                    className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-lg hover:bg-muted/30"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="mb-3 h-8 w-8 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-foreground/90 transition-colors">
                      AI-Создание вакансий
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Интерактивное создание описаний вакансий
                    </p>
                  </Link>

                  {/* Task Management Card */}
                  <Link
                    href="/products/task-management"
                    className="group rounded-xl border border-border bg-background p-4 transition-all hover:border-foreground/20 hover:shadow-lg hover:bg-muted/30"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="mb-3 h-8 w-8 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
                      <Kanban className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-foreground/90 transition-colors">
                      Управление задачами
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Kanban-доска для управления откликами
                    </p>
                  </Link>
                </div>

                {/* Bottom section */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                  <Link
                    href="/products/analytics"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/70"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                      <BarChart3 className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Аналитика</p>
                      <p className="text-xs text-foreground/60 leading-relaxed">Воронка найма в реальном времени</p>
                    </div>
                  </Link>
                  <Link
                    href="/products/ai-analyst"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/70"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                      <Brain className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">AI-Аналитик</p>
                      <p className="text-xs text-foreground/60 leading-relaxed">Умный поиск по данным найма</p>
                    </div>
                  </Link>
                  <Link
                    href="/products/integrations"
                    className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/70"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                      <Globe className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Интеграции</p>
                      <p className="text-xs text-foreground/60 leading-relaxed">HH, Авито, Хабр Карьера</p>
                    </div>
                  </Link>
                  <Link
                    href="/products/whitelabel"
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted/70 transition-colors group"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                      <Globe className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm mb-0.5 group-hover:text-primary transition-colors">
                        Собственный брендинг
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        AI на вашем домене с вашим стилем
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
          {/* Industries Dropdown */}
          <div className="relative" onMouseEnter={() => handleMouseEnter("industries")} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => toggleDropdown("industries")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                activeDropdown === "industries"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Отрасли
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeDropdown === "industries" ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === "industries" && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[400px] rounded-2xl border border-border bg-card p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
                onMouseEnter={() => handleMouseEnter("industries")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/industries/pharma"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Pill className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Фармацевтика</div>
                    <div className="text-xs text-muted-foreground">GxP комплаенс и проверка лицензий</div>
                  </div>
                </Link>
                <Link
                  href="/industries/hr-agencies"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Users className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Кадровые агентства</div>
                    <div className="text-xs text-muted-foreground">Мультипроектность и white-label</div>
                  </div>
                </Link>
                <Link
                  href="/industries/fintech"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Landmark className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Финтех и банки</div>
                    <div className="text-xs text-muted-foreground">Проверка благонадежности, требования ЦБ</div>
                  </div>
                </Link>
                <Link
                  href="/industries/retail"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <ShoppingCart className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Ритейл и e-commerce</div>
                    <div className="text-xs text-muted-foreground">Сезонный и массовый найм</div>
                  </div>
                </Link>
                <Link
                  href="/industries/manufacturing"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center">
                    <Factory className="size-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Производство</div>
                    <div className="text-xs text-muted-foreground">Проверка допусков и сертификатов</div>
                  </div>
                </Link>
                <div className="mt-2 pt-2 border-t border-border">
                  <Link
                    href="/industries"
                    className="flex items-center justify-between rounded-lg p-3 transition-all hover:bg-muted/70 text-sm font-medium text-foreground"
                    onClick={() => {
                      setActiveDropdown(null)
                      setClickedDropdown(null)
                    }}
                  >
                    Все отрасли
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Resources Dropdown */}
          <div className="relative" onMouseEnter={() => handleMouseEnter("resources")} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => toggleDropdown("resources")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                activeDropdown === "resources"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Ресурсы
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeDropdown === "resources" ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === "resources" && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] rounded-2xl border border-border bg-card p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
                onMouseEnter={() => handleMouseEnter("resources")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/faq"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <HelpCircle className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">FAQ</div>
                    <div className="text-xs text-muted-foreground">Часто задаваемые вопросы</div>
                  </div>
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <FileText className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Блог</div>
                    <div className="text-xs text-muted-foreground">Статьи и обновления</div>
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <BookOpen className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Документация</div>
                    <div className="text-xs text-muted-foreground">API и интеграции</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <div className="relative" onMouseEnter={() => handleMouseEnter("company")} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => toggleDropdown("company")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
                activeDropdown === "company"
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              Компания
              <ChevronDown
                className={`h-4 w-4 transition-transform ${activeDropdown === "company" ? "rotate-180" : ""}`}
              />
            </button>

            {activeDropdown === "company" && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[340px] rounded-2xl border border-border bg-card p-3 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
                onMouseEnter={() => handleMouseEnter("company")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/about"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <Building2 className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">О нас</div>
                    <div className="text-xs text-muted-foreground">Команда и ценности</div>
                  </div>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <Phone className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Контакты</div>
                    <div className="text-xs text-muted-foreground">Свяжитесь с нами</div>
                  </div>
                </Link>
                <Link
                  href="#"
                  className="flex items-center gap-3 rounded-lg p-3 transition-all hover:bg-muted/70 hover:shadow-sm"
                  onClick={() => {
                    setActiveDropdown(null)
                    setClickedDropdown(null)
                  }}
                >
                  <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                    <Users className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">Карьера</div>
                    <div className="text-xs text-muted-foreground">Вакансии в QBS</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/#pricing"
            className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors rounded-lg hover:text-foreground hover:bg-muted/50"
            onClick={() => {
              setActiveDropdown(null)
              setClickedDropdown(null)
            }}
          >
            Цены
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-sm hover:bg-muted hover:text-foreground h-11"
          >
            <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
              Войти
            </a>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-foreground text-background hover:bg-neutral-800 transition-all duration-200 h-11"
          >
            <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
              Начать бесплатно
            </a>
          </Button>
        </div>

        <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/20 z-[45] lg:hidden" onClick={() => setIsMenuOpen(false)} />

          {/* Mobile Menu */}
          <div className="fixed top-16 left-0 right-0 bottom-0 z-[50] lg:hidden">
            <div className="h-full bg-background border-t border-border shadow-2xl overflow-y-auto">
              <nav className="container mx-auto flex flex-col px-4 py-6">
                {/* Product Section */}
                <div className="border-b border-border pb-4 mb-4">
                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">Продукт</p>
                  <div className="space-y-1">
                    <Link
                      href="/products/ai-recruiter"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">AI-Рекрутер</div>
                        <div className="text-sm text-muted-foreground">Автоматический скрининг</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/ai-job-creation"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">AI-Создание вакансий</div>
                        <div className="text-sm text-muted-foreground">Интерактивное создание</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/task-management"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-violet-500 flex items-center justify-center shrink-0">
                        <Kanban className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Управление задачами</div>
                        <div className="text-sm text-muted-foreground">Kanban-доска</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/analytics"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Аналитика</div>
                        <div className="text-sm text-muted-foreground">Глубокая аналитика найма</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/ai-analyst"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-teal-500 flex items-center justify-center shrink-0">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">AI-Аналитик</div>
                        <div className="text-sm text-muted-foreground">Умный поиск по данным найма</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/integrations"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-cyan-500 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Интеграции</div>
                        <div className="text-sm text-muted-foreground">Подключение сервисов</div>
                      </div>
                    </Link>
                    <Link
                      href="/products/whitelabel"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="h-10 w-10 rounded-md bg-purple-500 flex items-center justify-center shrink-0">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Собственный брендинг</div>
                        <div className="text-sm text-muted-foreground">AI на вашем домене с вашим стилем</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Resources Section */}
                <div className="border-b border-border pb-4 mb-4">
                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">Ресурсы</p>
                  <div className="space-y-1">
                    <Link
                      href="/faq"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <HelpCircle className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">FAQ</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">Часто задаваемые вопросы</div>
                      </div>
                    </Link>
                    <Link
                      href="/blog"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <FileText className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">Блог</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">Статьи и обновления</div>
                      </div>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <BookOpen className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">Документация</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">API и интеграции</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Company Section */}
                <div className="border-b border-border pb-4 mb-4">
                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-3">Компания</p>
                  <div className="space-y-1">
                    <Link
                      href="/about"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <Building2 className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">О нас</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">Команда и ценности</div>
                      </div>
                    </Link>
                    <Link
                      href="/contact"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <Phone className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">Контакты</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">Свяжитесь с нами</div>
                      </div>
                    </Link>
                    <Link
                      href="#"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/70 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="shrink-0 rounded-md border border-neutral-200 bg-white/50 p-2.5 dark:border-white/20 dark:bg-white/10">
                        <Users className="size-4 text-neutral-600 transition-colors dark:text-white/60" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-foreground">Карьера</div>
                        <div className="text-sm text-foreground/60 leading-relaxed">Вакансии в QBS</div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Pricing Link */}
                <div className="space-y-1 mb-4">
                  <Link
                    href="/#pricing"
                    className="block p-3 text-sm font-medium rounded-lg hover:bg-muted/70 transition-colors text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Цены
                  </Link>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Button
                    variant="ghost"
                    asChild
                    className="w-full justify-center hover:bg-muted/70 hover:text-foreground h-11"
                  >
                    <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
                      Войти
                    </a>
                  </Button>
                  <Button 
                    asChild
                    className="w-full bg-foreground text-background hover:bg-neutral-800 transition-all duration-200 h-11"
                  >
                    <a href={`${env.NEXT_PUBLIC_APP_URL}`}>
                      Начать бесплатно
                    </a>
                  </Button>
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  )
}