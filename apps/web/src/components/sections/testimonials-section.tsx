"use client"

import { useState, useEffect, useRef } from "react"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@qbs-autonaim/ui/components/button"
import { motion, AnimatePresence } from "framer-motion"

const testimonials = [
  {
    id: 1,
    name: "Иван Петров",
    role: "HR Director",
    company: "TechCorp",
    avatar: "/professional-man-hr-director.jpg",
    rating: 5,
    text: "Мы обрабатываем тысячи откликов в месяц. Раньше это съедало всё время рекрутеров. С QBS первичный отбор идёт автоматически — фокус переключился на живые интервью с сильными кандидатами.",
    metric: "90% меньше времени на скрининг",
  },
  {
    id: 2,
    name: "Анна Петрова",
    role: "HR-директор",
    company: "ТехноСофт",
    avatar: "/professional-hr-director.png",
    rating: 5,
    text: "100 откликов раньше — это 2 недели ручной работы. Сейчас — 2 дня до списка отобранных. Скрининг по нашим критериям отсекает нерелевантных, остаются только те, кого имеет смысл звать на интервью.",
    metric: "Сократили цикл на 80%",
  },
  {
    id: 3,
    name: "Дмитрий Козлов",
    role: "CEO",
    company: "StartupHub",
    avatar: "/professional-man-ceo-startup.jpg",
    rating: 5,
    text: "Стартап не потянет штатного рекрутера. QBS закрыл этот разрыв: за 3 месяца наняли 15 разработчиков. Интеграция с hh.ru, интервью в веб-чате — всё работает из коробки.",
    metric: "15 наймов без рекрутера",
  },
  {
    id: 4,
    name: "Елена Сидорова",
    role: "Руководитель подбора",
    company: "РитейлПро",
    avatar: "/professional-woman-recruitment-manager.jpg",
    rating: 5,
    text: "Кандидаты отвечают в веб-чате в 3 раза чаще, чем на email. Интервью в веб-чате — каждый рекрутер экономит по 4 часа в день на первичных созвонах.",
    metric: "3× рост откликов в мессенджере",
  },
  {
    id: 5,
    name: "Михаил Новиков",
    role: "HRD",
    company: "ФинТех Банк",
    avatar: "/professional-man-finance-hr.jpg",
    rating: 5,
    text: "Для банка критична безопасность данных. QBS соответствует 152-ФЗ. Аналитика по воронке помогла увидеть узкие места и увеличить конверсию в оффер на 45%.",
    metric: "+45% конверсия в оффер",
  },
]

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section ref={sectionRef} className="relative py-20 md:py-32 overflow-hidden bg-muted/20">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <Quote className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">Отзывы</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-balance">
            Отзывы о системе подбора персонала
          </h2>
          <p className="text-lg text-muted-foreground">HR-директора и рекрутеры об автоматизации подбора персонала</p>
        </div>

        {/* Main testimonial card */}
        <div className="mx-auto max-w-4xl">
          <div className="relative bg-card border border-border rounded-xl p-8 md:p-12 shadow-sm">
            {/* Quote icon */}
            <div className="absolute -top-6 left-12 w-12 h-12 bg-foreground rounded-xl flex items-center justify-center shadow-lg">
              <Quote className="h-6 w-6 text-background" />
            </div>

            {/* Content */}
            <div className="pt-4">
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonials[activeIndex]!.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Text - fade on change */}
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-xl md:text-2xl font-medium leading-relaxed mb-8 text-foreground"
                >
                  "{testimonials[activeIndex]!.text}"
                </motion.blockquote>
              </AnimatePresence>

              {/* Metric badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 mb-8">
                {testimonials[activeIndex]!.metric}
              </div>

              {/* Author */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={testimonials[activeIndex]!.avatar || "/placeholder.svg"}
                    alt={testimonials[activeIndex]!.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-border/60 ring-offset-2"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{testimonials[activeIndex]!.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonials[activeIndex]!.role}, {testimonials[activeIndex]!.company}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevTestimonial}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextTestimonial}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-8 bg-foreground" : "w-2 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats row - compact */}
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 mt-12">
          {[
            { value: "500+", label: "Компаний" },
            { value: "50K+", label: "Успешных наймов" },
            { value: "94%", label: "Точность отсева" },
            { value: "4.9", label: "Рейтинг" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
