import type { Metadata } from "next"
import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@qbs-autonaim/ui/accordion"
import { Button } from "@qbs-autonaim/ui/button"
import { Search, MessageCircle, HelpCircle, Mail, Send, Phone } from "lucide-react"
import { Header, Footer } from "@/components/layout"

export const metadata: Metadata = {
  title: "Часто задаваемые вопросы | QBS Автонайм",
  description:
    "Ответы на часто задаваемые вопросы о платформе QBS Автонайм: интеграции, AI-скрининг, голосовые интервью, настройка и безопасность.",
  keywords: ["FAQ QBS", "вопросы и ответы", "помощь QBS", "инструкция QBS", "как пользоваться QBS"],
  openGraph: {
    title: "FAQ | QBS Автонайм",
    description: "Ответы на часто задаваемые вопросы о платформе QBS.",
  },
}

export default function FAQPage() {
  const faqCategories = [
    {
      category: "Начало работы",
      icon: HelpCircle,
      faqs: [
        {
          question: "Как начать работу с QBS Автонайм?",
          answer:
            "Зарегистрируйтесь на платформе, создайте проект для вашей компании, подключите аккаунт HeadHunter или другой источник кандидатов, настройте критерии AI-скрининга под ваши требования. Вы сможете сразу начать автоматический анализ откликов.",
        },
        {
          question: "Нужны ли технические знания для использования платформы?",
          answer:
            "Нет, платформа разработана для HR-специалистов без технического бэкграунда. Интерфейс интуитивен, все настройки выполняются через визуальный редактор. Для настройки Telegram-бота предоставляется пошаговая инструкция.",
        },
        {
          question: "Какой тарифный план выбрать для начала?",
          answer:
            "Мы рекомендуем начать с бесплатного плана Starter, который включает 50 откликов в месяц и базовый AI-скрининг. Это позволит протестировать платформу. При росте потребностей можно перейти на Professional или Enterprise.",
        },
        {
          question: "Как долго занимает первоначальная настройка?",
          answer:
            "Базовая настройка занимает 15-20 минут: регистрация, подключение HeadHunter, создание первой вакансии и настройка критериев скрининга. Настройка Telegram-бота для голосовых интервью займет дополнительно 10-15 минут.",
        },
      ],
    },
    {
      category: "Интеграции",
      icon: Search,
      faqs: [
        {
          question: "Как QBS Автонайм интегрируется с HeadHunter?",
          answer:
            "Вы добавляете свой аккаунт HH.ru в настройках. Система автоматически парсит вакансии и отклики, сохраняя сессию для работы без повторной авторизации. Все credentials шифруются AES-256. Синхронизация происходит в реальном времени.",
        },
        {
          question: "Поддерживаются ли другие платформы кроме HeadHunter?",
          answer:
            "Да, мы поддерживаем интеграцию с Авито Работа, Хабр Карьера, SuperJob, Kwork, FL.ru, Freelance.ru. Вы можете подключить несколько источников одновременно и управлять всеми откликами в едином интерфейсе.",
        },
        {
          question: "Можно ли интегрироваться с корпоративной ATS?",
          answer:
            "Да, на тарифе Enterprise доступна интеграция с популярными ATS через REST API. Мы поддерживаем Greenhouse, Lever, BambooHR и другие системы. Также можно настроить кастомную интеграцию через вебхуки.",
        },
        {
          question: "Как работает синхронизация данных?",
          answer:
            "Данные синхронизируются автоматически каждые 5 минут. Вы также можете запустить ручную синхронизацию в любой момент. Все изменения в статусах кандидатов отображаются в реальном времени на дашборде.",
        },
      ],
    },
    {
      category: "AI-Скрининг",
      icon: MessageCircle,
      faqs: [
        {
          question: "Насколько точен AI-скрининг и можно ли его настроить?",
          answer:
            "Мы используем собственный AI, который вы можете полностью настроить под специфику вашей компании. Задайте критерии оценки, ключевые навыки и требования — система будет анализировать кандидатов именно по вашим параметрам. Точность скрининга достигает 95% благодаря гибкой настройке весов и приоритетов.",
        },
        {
          question: "Какие параметры учитывает AI при анализе резюме?",
          answer:
            "AI анализирует опыт работы, релевантность навыков, образование, знание языков, soft skills по описанию, соответствие зарплатным ожиданиям, географическое расположение. Вы можете настроить вес каждого параметра.",
        },
        {
          question: "Как AI оценивает soft skills кандидатов?",
          answer:
            "AI анализирует стиль изложения в резюме, достижения, описание проектов и рекомендации для оценки коммуникативных навыков, лидерства, командной работы. Более точная оценка soft skills происходит во время голосового интервью.",
        },
        {
          question: "Можно ли обучить AI под нашу специфику?",
          answer:
            "Да, на тарифе Enterprise доступно дообучение модели на ваших исторических данных найма. Это повышает точность оценки кандидатов с учетом особенностей вашей индустрии и корпоративной культуры.",
        },
      ],
    },
    {
      category: "Голосовые интервью",
      icon: MessageCircle,
      faqs: [
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
          question: "Можно ли настроить сценарий интервью?",
          answer:
            "Да, вы создаете собственные сценарии интервью: задаете список вопросов, их последовательность, условия для follow-up вопросов, критерии оценки ответов. Можно создавать разные сценарии для разных позиций.",
        },
        {
          question: "Что делать, если кандидат не использует Telegram?",
          answer:
            "Кандидаты без Telegram могут пройти интервью через web-интерфейс на нашей платформе. Также доступна интеграция с WhatsApp на тарифе Enterprise для проведения голосовых интервью.",
        },
      ],
    },
    {
      category: "Персонализация и настройка",
      icon: HelpCircle,
      faqs: [
        {
          question: "Какие возможности персонализации AI доступны?",
          answer:
            "Вы можете настроить: критерии оценки резюме, весовые коэффициенты навыков, сценарии интервью, тон и стиль общения бота, автоматические ответы и уведомления. Все настройки сохраняются в вашем проекте и применяются ко всем вакансиям.",
        },
        {
          question: "Можно ли управлять несколькими компаниями?",
          answer:
            "Да, платформа поддерживает мультитенантность через проекты. Каждый проект — это отдельная компания с изолированными данными, собственным Telegram-ботом, индивидуальными настройками AI и командой участников.",
        },
        {
          question: "Как настроить права доступа для команды?",
          answer:
            "Вы можете приглашать участников в проект и назначать им роли: Admin (полный доступ), Recruiter (работа с кандидатами), Viewer (только просмотр). Каждая роль имеет гранулярные права на различные функции платформы.",
        },
        {
          question: "Можно ли брендировать интерфейс под нашу компанию?",
          answer:
            "На тарифе Enterprise доступна кастомизация: загрузка логотипа компании, настройка цветовой схемы, персонализация email-уведомлений, брендирование страниц для кандидатов. Telegram-бот всегда использует ваше название и описание.",
        },
      ],
    },
    {
      category: "Безопасность и конфиденциальность",
      icon: HelpCircle,
      faqs: [
        {
          question: "Безопасны ли мои данные?",
          answer:
            "Все credentials шифруются AES-256 перед сохранением в БД. Токен вашего Telegram-бота хранится в зашифрованном виде. Данные изолированы по проекту. Соблюдается соответствие 152-ФЗ о персональных данных и требования Роскомнадзора.",
        },
        {
          question: "Где хранятся данные кандидатов?",
          answer:
            "Все данные хранятся на серверах в России в соответствии с 152-ФЗ. Используются сертифицированные дата-центры с резервным копированием. Доступ к данным защищен многофакторной аутентификацией и ролевой моделью.",
        },
        {
          question: "Как долго хранятся данные кандидатов?",
          answer:
            "Данные хранятся в течение срока, указанного в вашей политике обработки персональных данных. По умолчанию — 3 года с момента последнего взаимодействия. Вы можете настроить автоматическое удаление или экспортировать данные в любой момент.",
        },
        {
          question: "Соответствует ли платформа требованиям 115-ФЗ?",
          answer:
            "Да, платформа соответствует требованиям Федерального закона №115-ФЗ о противодействии легализации доходов. Реализована обязательная идентификация клиентов, ведение записей транзакций, система мониторинга подозрительных операций.",
        },
      ],
    },
    {
      category: "Технические вопросы",
      icon: Search,
      faqs: [
        {
          question: "Какие языки поддерживает AI?",
          answer:
            "Система поддерживает широкий спектр языков для анализа резюме и проведения интервью, включая русский, английский, испанский, французский, немецкий, китайский и многие другие. Вы можете настроить приоритетный язык для каждой вакансии.",
        },
        {
          question: "Какие браузеры поддерживаются?",
          answer:
            "Платформа работает в Chrome, Firefox, Safari, Edge последних версий. Рекомендуем использовать Chrome или Edge для лучшей производительности. Мобильная версия оптимизирована для iOS Safari и Android Chrome.",
        },
        {
          question: "Есть ли мобильное приложение?",
          answer:
            "Веб-интерфейс полностью адаптирован для мобильных устройств. Нативные приложения для iOS и Android находятся в разработке и будут доступны в Q2 2026. Уведомления о новых откликах можно получать в Telegram.",
        },
        {
          question: "Какие ограничения по количеству откликов?",
          answer:
            "Ограничения зависят от тарифа: Бесплатный — 25 откликов/месяц (1 вакансия), Стартовый — 150 откликов (3 вакансии), Профессиональный — 1 000 откликов (10 вакансий), Корпоративный — без ограничений. Неиспользованные отклики не переносятся на следующий месяц.",
        },
      ],
    },
    {
      category: "Биллинг и тарифы",
      icon: HelpCircle,
      faqs: [
        {
          question: "Как происходит оплата?",
          answer:
            "Доступна оплата банковской картой, по счету для юридических лиц, через систему быстрых платежей (СБП). Оплата происходит ежемесячно или ежегодно (со скидкой 20%). Все платежи проходят через защищенный шлюз с поддержкой 3D Secure.",
        },
        {
          question: "Можно ли изменить тарифный план?",
          answer:
            "Да, вы можете повысить или понизить тариф в любой момент. При повышении тарифа доплата рассчитывается пропорционально оставшимся дням. При понижении новый тариф вступит в силу со следующего расчетного периода.",
        },
        {
          question: "Есть ли скидки для некоммерческих организаций?",
          answer:
            "Да, некоммерческие организации, образовательные учреждения и стартапы на ранней стадии могут получить скидку до 50%. Свяжитесь с нами для получения специального предложения.",
        },
        {
          question: "Что происходит при превышении лимита откликов?",
          answer:
            "При достижении 90% лимита вы получите уведомление. При превышении лимита обработка новых откликов приостанавливается до начала следующего расчетного периода или приобретения дополнительного пакета откликов.",
        },
      ],
    },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border/40 bg-section-primary">
          <div className="absolute inset-0 bg-dots-subtle opacity-60" />
          <div className="absolute inset-0 bg-glow-top" />

          <div className="container relative mx-auto px-4 py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Центр помощи</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                Как мы можем вам помочь?
              </h1>

              <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto text-pretty">
                Найдите ответы на часто задаваемые вопросы о платформе QBS Автонайм
              </p>

              {/* Search Bar */}
              <div className="mx-auto max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Поиск по вопросам..."
                    className="w-full rounded-xl border border-border bg-background py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              {faqCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-12 last:mb-0">
                  {/* Category Header */}
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <category.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">{category.category}</h2>
                  </div>

                  {/* FAQ Accordion */}
                  <Accordion type="single" collapsible className="w-full">
                    {category.faqs.map((faq, index) => (
                      <AccordionItem
                        key={index}
                        value={`${categoryIndex}-${index}`}
                        className="border-border rounded-lg mb-2 border bg-card px-6"
                      >
                        <AccordionTrigger className="text-left text-foreground hover:no-underline py-5 font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border/40 bg-section-accent py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">
                Не нашли ответ на свой вопрос?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground text-pretty">
                Наша команда поддержки всегда готова помочь вам
              </p>

              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/contact">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Связаться с поддержкой
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/blog">
                    <Search className="mr-2 h-5 w-5" />
                    Читать блог
                  </Link>
                </Button>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                <div className="group rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Email поддержка</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">support@qbs-auto.ru</p>
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Ответ в течение 24 часов
                  </p>
                </div>

                <div className="group rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 transition-all duration-300 hover:shadow-lg hover:border-accent/50 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#0088cc] to-[#229ED9] shadow-lg shadow-[#0088cc]/20 transition-transform duration-300 group-hover:scale-110">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Telegram</h3>
                  <p className="text-sm font-medium text-[#0088cc] dark:text-[#229ED9]">@qbs_support</p>
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Мгновенные ответы
                  </p>
                </div>

                <div className="group rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-6 transition-all duration-300 hover:shadow-lg hover:border-amber-500/50 hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Телефон</h3>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">+7 (495) 123-45-67</p>
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Пн-Пт 9:00-18:00 МСК
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
