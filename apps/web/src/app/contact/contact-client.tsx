"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Header, Footer } from "@/components/layout"
import {
  Button,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  MessageSquare,
  Building2,
  Users,
  HelpCircle,
} from "lucide-react"

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "info@avtonaim.qbsoft.ru",
    description: "Ответим в течение 24 часов",
    href: "mailto:info@avtonaim.qbsoft.ru",
  },
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (495) 123-45-67",
    description: "Пн-Пт, 9:00 - 18:00 МСК",
    href: "tel:+74951234567",
  },
  {
    icon: TelegramIcon,
    title: "Telegram",
    value: "@qbs_support",
    description: "Быстрые ответы на вопросы",
    href: "https://t.me/qbs_support",
  },
  {
    icon: WhatsAppIcon,
    title: "WhatsApp",
    value: "+7 (495) 123-45-67",
    description: "Для срочных вопросов",
    href: "https://wa.me/74951234567",
  },
]

const departments = [
  {
    icon: MessageSquare,
    title: "Отдел продаж",
    email: "sales@qbs.ru",
    description: "Вопросы о тарифах и демо",
  },
  {
    icon: HelpCircle,
    title: "Техподдержка",
    email: "support@qbs.ru",
    description: "Помощь с платформой",
  },
  {
    icon: Building2,
    title: "Для партнёров",
    email: "partners@qbs.ru",
    description: "Интеграции и партнёрство",
  },
  {
    icon: Users,
    title: "HR / Карьера",
    email: "hr@qbs.ru",
    description: "Вакансии в QBS",
  },
]

export default function ContactPageClient() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-glow-top opacity-60" />
          <div className="absolute inset-0 bg-dots-subtle" />

          <div className="container relative mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">Свяжитесь с нами</h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Есть вопросы о QBS? Мы всегда рады помочь. Выберите удобный способ связи или заполните форму ниже.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods Grid */}
        <section className="py-12 border-b border-border/40">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method) => (
                <Link
                  key={method.title}
                  href={method.href}
                  className="group flex flex-col items-center p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
                  <p className="text-primary font-medium mb-1">{method.value}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content: Form + Info */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Contact Form */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-border bg-card p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Отправить сообщение</h2>
                  <p className="text-muted-foreground mb-8">Заполните форму, и мы свяжемся с вами в ближайшее время</p>

                  {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-6">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">Сообщение отправлено!</h3>
                      <p className="text-muted-foreground mb-6">
                        Спасибо за обращение. Мы ответим вам в течение 24 часов.
                      </p>
                      <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                        Отправить ещё одно сообщение
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">Имя *</Label>
                          <Input id="name" placeholder="Иван Иванов" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Компания</Label>
                          <Input id="company" placeholder="ООО Компания" />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input id="email" type="email" placeholder="ivan@company.ru" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон</Label>
                          <Input id="phone" type="tel" placeholder="+7 (999) 123-45-67" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Тема обращения *</Label>
                        <Select required>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тему" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Запросить демо</SelectItem>
                            <SelectItem value="pricing">Вопрос о тарифах</SelectItem>
                            <SelectItem value="support">Техническая поддержка</SelectItem>
                            <SelectItem value="partnership">Партнёрство</SelectItem>
                            <SelectItem value="other">Другое</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Сообщение *</Label>
                        <Textarea
                          id="message"
                          placeholder="Расскажите подробнее о вашем вопросе..."
                          rows={5}
                          required
                        />
                      </div>

                      <div className="flex items-start gap-2">
                        <input type="checkbox" id="consent" required className="mt-1 rounded border-border" />
                        <Label htmlFor="consent" className="text-sm text-muted-foreground font-normal">
                          Я согласен на обработку персональных данных в соответствии с{" "}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Политикой конфиденциальности
                          </Link>
                        </Label>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Отправка...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Отправить сообщение
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Office Info */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Наш офис</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Адрес</p>
                        <p className="text-sm text-muted-foreground">
                          г. Москва, ул. Тверская, д. 1,
                          <br />
                          БЦ "Тверская Плаза", офис 512
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Часы работы</p>
                        <p className="text-sm text-muted-foreground">
                          Пн-Пт: 9:00 - 18:00 (МСК)
                          <br />
                          Сб-Вс: выходные
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Map placeholder */}
                  <div className="mt-6 aspect-video rounded-xl overflow-hidden border border-border bg-muted">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2244.8553697055795!2d37.60506231597696!3d55.75843998055582!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46b54a50b315e573%3A0xa886bf5a3d9b2e68!2z0KLQstC10YDRgdC60LDRjyDRg9C7Liwg0JzQvtGB0LrQstCw!5e0!3m2!1sru!2sru!4v1704067200000!5m2!1sru!2sru"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Офис QBS на карте"
                    />
                  </div>
                </div>

                {/* Departments */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Отделы</h3>

                  <div className="space-y-4">
                    {departments.map((dept) => (
                      <div key={dept.title} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <dept.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{dept.title}</p>
                          <Link href={`mailto:${dept.email}`} className="text-sm text-primary hover:underline">
                            {dept.email}
                          </Link>
                          <p className="text-xs text-muted-foreground">{dept.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legal Info */}
                <div className="rounded-2xl border border-border bg-muted/30 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Реквизиты</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="text-foreground">ООО "КьюБиЭс"</span>
                    </p>
                    <p>ИНН: 7707123456</p>
                    <p>ОГРН: 1234567890123</p>
                    <p>КПП: 770701001</p>
                    <p>
                      Юр. адрес: 125009, г. Москва,
                      <br />
                      ул. Тверская, д. 1, офис 512
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ CTA */}
        <section className="py-16 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Не нашли ответ?</h2>
            <p className="text-muted-foreground mb-6">
              Загляните в раздел часто задаваемых вопросов — возможно, там уже есть ответ
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/#faq">
                <HelpCircle className="mr-2 h-4 w-4" />
                Перейти в FAQ
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
