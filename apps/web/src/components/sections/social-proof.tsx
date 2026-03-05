"use client"

import { Users, Target, Clock } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export function SocialProof() {
  const stats = [
    {
      icon: Users,
      value: "100 000+",
      label: "резюме прошло скрининг",
    },
    {
      icon: Target,
      value: "94%",
      label: "точность отсева при подборе персонала",
    },
    {
      icon: Clock,
      value: "в 10 раз",
      label: "быстрее ручного скрининга резюме",
    },
  ]

  const companies = [
    { name: "Яндекс", logo: "/logos/yandex.jpg" },
    { name: "Сбер", logo: "/logos/sber.jpg" },
    { name: "VK", logo: "/logos/vk.jpg" },
    { name: "Ozon", logo: "/logos/ozon.jpg" },
    { name: "Wildberries", logo: "/logos/wildberries.jpg" },
    { name: "Авито", logo: "/logos/avito.jpg" },
    { name: "Тинькофф", logo: "/logos/tinkoff.jpg" },
    { name: "Kaspersky", logo: "/logos/kaspersky.jpg" },
  ]

  return (
    <section className="bg-muted/30 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm uppercase tracking-wider text-muted-foreground mb-12 font-semibold">
          Система подбора персонала для российского рынка
        </p>

        <div className="relative overflow-hidden mb-16">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-muted/30 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-muted/30 to-transparent z-10" />

          <motion.div
            className="flex items-center gap-16 will-change-transform"
            animate={{ x: [0, -1200] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            {[...companies, ...companies].map((company, index) => (
              <div
                key={`${company.name}-${index}`}
                className="shrink-0 grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:scale-110"
              >
                <Image
                  src={company.logo || "/placeholder.svg"}
                  alt={company.name}
                  width={180}
                  height={60}
                  className="h-12 w-auto object-contain"
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Compact stats row with optional dividers on desktop */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative flex items-center gap-4 group sm:[&:not(:last-child)]:pr-12 sm:[&:not(:last-child)]:border-r sm:[&:not(:last-child)]:border-border/40"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <div className="p-2.5 rounded-xl bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-300">
                <stat.icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground leading-tight whitespace-nowrap">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}