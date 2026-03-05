import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@qbs-autonaim/ui/components/accordion"

const FAQS = [
  {
    question: "Как подключить HeadHunter (hh.ru) к системе подбора персонала?",
    answer:
      "Вы добавляете свой аккаунт HH.ru в настройках. Система автоматически парсит вакансии и отклики, сохраняя сессию для работы без повторной авторизации. Все credentials шифруются AES-256.",
  },
  {
    question: "Как работает скрининг резюме и можно ли его настроить?",
    answer:
      "Мы используем собственный AI, который вы можете полностью настроить под специфику вашей компании. Задайте критерии оценки, ключевые навыки и требования — система будет анализировать кандидатов именно по вашим параметрам. Точность скрининга достигает 95% благодаря гибкой настройке весов и приоритетов.",
  },
  {
    question: "Как настроить интервью в веб-чате?",
    answer:
      "Веб-чат для интервью настраивается прямо в платформе. Вы создаёте приглашение, кандидат получает ссылку и проходит интервью в удобное время. Можно брендировать чат под вашу компанию и полностью контролировать коммуникацию с кандидатами.",
  },
  {
    question: "Как работают интервью в веб-чате?",
    answer:
      "Система автоматически отправляет приглашения кандидатам со ссылкой на веб-чат. AI проводит интервью (голосом или текстом), транскрибирует ответы, анализирует их и генерирует следующие вопросы. Вы можете настроить сценарий интервью, типы вопросов и критерии оценки ответов.",
  },
  {
    question: "Какие возможности персонализации AI доступны?",
    answer:
      "Вы можете настроить: критерии оценки резюме, весовые коэффициенты навыков, сценарии интервью, тон и стиль общения в веб-чате, автоматические ответы и уведомления. Все настройки сохраняются в вашем рабочем пространстве и применяются ко всем вакансиям.",
  },
  {
    question: "Можно ли управлять несколькими компаниями?",
    answer:
      "Да, платформа поддерживает мультитенантность через рабочее пространство. Каждое рабочее пространство — это отдельная компания с изолированными данными, индивидуальными настройками AI и командой участников.",
  },
  {
    question: "Безопасны ли мои данные?",
    answer:
      "Все credentials шифруются AES-256 перед сохранением в БД. Данные изолированы по рабочему пространству. Соответствие 152-ФЗ о персональных данных.",
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
] as const

export function FAQSection() {
  return (
    <section id="faq" className="relative py-28 md:py-36 lg:py-44 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-block mb-8 h-px w-12 bg-linear-to-r from-transparent via-amber-500/60 to-transparent" />

          <p className="mb-6 text-[13px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
            FAQ
          </p>

          <h2 className="mb-6 text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.25rem] lg:text-[2.5rem]">
            Вопросы об автоматизации подбора персонала
          </h2>

          <p className="text-lg text-muted-foreground">
            Интеграция HeadHunter, скрининг резюме, 152-ФЗ — ответы для HR
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-border last:border-b-0 data-[state=open]:bg-muted/20 transition-colors rounded-lg px-2 -mx-2"
              >
                <AccordionTrigger className="py-5 text-left text-base font-medium text-foreground hover:no-underline hover:text-foreground data-[state=open]:text-foreground data-[state=open]:font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-[15px] leading-[1.7] pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
