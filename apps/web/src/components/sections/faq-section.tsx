import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@qbs-autonaim/ui/components/accordion"
import { HelpCircle } from "lucide-react"

export function FAQSection() {
  const faqs = [
    {
      question: "Как QBS Автонайм интегрируется с HeadHunter?",
      answer:
        "Вы добавляете свой аккаунт HH.ru в настройках. Система автоматически парсит вакансии и отклики, сохраняя сессию для работы без повторной авторизации. Все credentials шифруются AES-256.",
    },
    {
      question: "Насколько точен AI-скрининг и можно ли его настроить?",
      answer:
        "Мы используем собственный AI, который вы можете полностью настроить под специфику вашей компании. Задайте критерии оценки, ключевые навыки и требования — система будет анализировать кандидатов именно по вашим параметрам. Точность скрининга достигает 95% благодаря гибкой настройке весов и приоритетов.",
    },
    {
      question: "Как настроить Telegram-бота для интервью?",
      answer:
        "Для работы сервиса каждому пользователю необходимо создать и настроить персонализированный Telegram-аккаунт. Вы получите пошаговую инструкцию по созданию бота через @BotFather и подключению его к платформе. Это позволит брендировать бота под вашу компанию и полностью контролировать коммуникацию с кандидатами.",
    },
    {
      question: "Как работают голосовые интервью?",
      answer:
        "После настройки вашего Telegram-бота, он автоматически отправляет приглашения кандидатам и проводит голосовое интервью. Наш AI транскрибирует ответы, анализирует их и генерирует следующие вопросы. Вы можете настроить сценарий интервью, типы вопросов и критерии оценки ответов.",
    },
    {
      question: "Какие возможности персонализации AI доступны?",
      answer:
        "Вы можете настроить: критерии оценки резюме, весовые коэффициенты навыков, сценарии интервью, тон и стиль общения бота, автоматические ответы и уведомления. Все настройки сохраняются в вашем рабочем пространстве и применяются ко всем вакансиям.",
    },
    {
      question: "Можно ли управлять несколькими компаниями?",
      answer:
        "Да, платформа поддерживает мультитенантность через рабочее пространство. Каждое рабочее пространство — это отдельная компания с изолированными данными, собственным Telegram-ботом, индивидуальными настройками AI и командой участников.",
    },
    {
      question: "Безопасны ли мои данные?",
      answer:
        "Все credentials шифруются AES-256 перед сохранением в БД. Токен вашего Telegram-бота хранится в зашифрованном виде. Данные изолированы по рабочему пространству. Соответствие 152-ФЗ о персональных данных.",
    },
    {
      question: "Какие языки поддерживает AI?",
      answer:
        "Система поддерживает широкий спектр языков для анализа резюме и проведения интервью, включая русский, английский, испанский, французский, немецкий, китайский и многие другие. Вы можете настроить приоритетный язык для каждой вакансии.",
    },
    {
      question: "Какие способы оплаты доступны?",
      answer:
        "Мы принимаем оплату от физических и юридических лиц любыми удобными способами: банковские карты, безналичный расчет по счету, электронные кошельки. Для юридических лиц предоставляем полный пакет закрывающих документов.",
    },
  ]

  return (
    <section id="faq" className="relative bg-background py-20 md:py-32 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Subtle glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/50 via-transparent to-transparent" />

      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm mb-6">
            <HelpCircle className="h-4 w-4 text-foreground" />
            <span className="text-muted-foreground">FAQ</span>
          </div>

          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
            Частые вопросы
          </h2>
          <p className="mb-12 text-lg text-muted-foreground">Ответы на популярные вопросы о платформе</p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}