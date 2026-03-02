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
        <p className="text-center text-xs uppercase tracking-wider text-muted-foreground/60 mb-12 font-medium">
          Система подбора персонала для российского рынка
        </p>

        <div className="relative overflow-hidden mb-16">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-muted/30 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-muted/30 to-transparent z-10" />

          <motion.div
            className="flex items-center gap-16"
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
                className="flex-shrink-0 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
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

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all duration-300">
                <div className="mb-4 p-3 rounded-xl bg-foreground/5 group-hover:bg-foreground/10 transition-colors duration-300">
                  <stat.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}