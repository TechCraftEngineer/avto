import type { Metadata } from "next";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("faq", {
  title: "Часто задаваемые вопросы — QBS Автонайм",
  description:
    "Ответы на популярные вопросы о AI-платформе для рекрутинга. Цены, интеграции, возможности, поддержка клиентов из России.",
  url: "/help/faq",
  keywords: [
    "FAQ QBS Автонайм",
    "вопросы по рекрутингу AI",
    "цены на HR софт",
    "интеграция HH.ru",
    "поддержка клиентов",
    "тарифы найм",
  ],
});

export default function FAQPage() {
  const tocItems = [
    { id: "general", title: "Общие вопросы", level: 2 },
    { id: "pricing", title: "Цены и тарифы", level: 2 },
    { id: "ai-screening", title: "AI-скрининг", level: 2 },
    { id: "integrations", title: "Интеграции", level: 2 },
    { id: "security", title: "Безопасность", level: 2 },
    { id: "support", title: "Поддержка", level: 2 },
  ];

  const faqData = [
    {
      id: "general",
      title: "Общие вопросы",
      questions: [
        {
          q: "Что такое QBS Автонайм?",
          a: "QBS Автонайм — это российская AI-платформа для автоматизации рекрутинга. Мы помогаем компаниям экономить до 80% времени на подборе персонала с помощью искусственного интеллекта, интеграций с HH.ru и автоматических интервью.",
        },
        {
          q: "Для каких компаний подходит платформа?",
          a: "Платформа подходит для компаний любого размера: от стартапов до корпораций. Особенно полезна для HR-команд, которые закрывают 5+ вакансий в месяц и получают более 50 откликов на позицию.",
        },
        {
          q: "Как быстро можно начать работу?",
          a: "Базовую настройку можно завершить за 10-15 минут. Регистрация → Подключение HH.ru → Создание вакансии → Получение первых результатов AI-скрининга.",
        },
        {
          q: "Работает ли система на русском языке?",
          a: "Да, платформа поддерживает русский язык, работает с HH.ru, SuperJob и популярными мессенджерами.",
        },
      ],
    },
    {
      id: "pricing",
      title: "Цены и тарифы",
      questions: [
        {
          q: "Сколько стоит использование платформы?",
          a: "У нас гибкие тарифы: Бесплатный (до 50 кандидатов/месяц), Стартап (2,990₽/месяц), Профессиональный (7,990₽/месяц), Корпоративный (от 19,990₽/месяц). Есть скидки при годовой оплате.",
        },
        {
          q: "Есть ли бесплатный период?",
          a: "Да, все новые пользователи получают 14-дневный бесплатный период со всеми функциями. Можно протестировать на реальных вакансиях без ограничений.",
        },
        {
          q: "Как происходит оплата?",
          a: "Оплата ежемесячно или ежегодно банковской картой. Поддерживаем популярные карты (Visa, Mastercard). Есть возможность оплаты по счёту для юридических лиц.",
        },
        {
          q: "Можно ли изменить тариф в процессе работы?",
          a: "Да, тариф можно изменить в любой момент в личном кабинете. При повышении тарифа доплата рассчитывается пропорционально оставшимся дням. При понижении изменения вступают в силу со следующего месяца.",
        },
      ],
    },
    {
      id: "ai-screening",
      title: "AI-скрининг",
      questions: [
        {
          q: "Как точно работает AI-скрининг?",
          a: "AI анализирует резюме по 100+ критериям: опыт работы, навыки, образование, достижения. Сравнивает с требованиями вакансии и присваивает оценку от 0 до 100 баллов. Обучен на большом объеме данных.",
        },
        {
          q: "Можно ли доверять оценкам AI?",
          a: "AI является помощником рекрутера, а не заменой. Точность оценки — около 85% при правильно составленном описании вакансии. Рекомендуем проверять топ-кандидатов лично, особенно на начальном этапе.",
        },
        {
          q: "Как настроить критерии скрининга?",
          a: "В настройках вакансии можно указать обязательные требования, желательные навыки и их весовые коэффициенты. AI автоматически определит базовые критерии из описания вакансии.",
        },
        {
          q: "Что делать, если AI неправильно оценивает кандидатов?",
          a: "Проверьте корректность описания вакансии — оно должно содержать конкретные требования. При необходимости откалибруйте критерии вручную или обратитесь в поддержку для настройки под вашу специфику.",
        },
      ],
    },
    {
      id: "integrations",
      title: "Интеграции",
      questions: [
        {
          q: "Как подключить HH.ru?",
          a: "В разделе «Интеграции» введите логин и пароль от аккаунта работодателя на HH.ru. Система автоматически импортирует вакансии и начнёт собирать новые отклики. Данные хранятся зашифрованными.",
        },
        {
          q: "Работает ли интеграция с SuperJob?",
          a: "Да, поддерживается официальная интеграция с SuperJob. Можно импортировать вакансии и отклики, синхронизировать статусы кандидатов между платформами.",
        },
        {
          q: "Как настроить Telegram-бот для интервью?",
          a: "Создайте бота через BotFather, получите токен и настройте в разделе «Интеграции». AI автоматически проведёт первичное интервью через чат с кандидатом на русском языке.",
        },
        {
          q: "Можно ли интегрировать с 1С или Bitrix24?",
          a: "Да, мы поддерживаем интеграцию с 1С и Bitrix24. Свяжитесь с нашей командой для настройки подключения к вашей HR-системе.",
        },
      ],
    },
    {
      id: "security",
      title: "Безопасность",
      questions: [
        {
          q: "Где хранятся данные кандидатов?",
          a: "Все данные хранятся на защищенных серверах с соблюдением требований по защите персональных данных. Используем шифрование AES-256 и регулярные аудиты безопасности.",
        },
        {
          q: "Кто имеет доступ к данным кандидатов?",
          a: "Доступ имеют только авторизованные пользователи вашей компании. Данные изолированы между организациями. Мы не передаём данные третьим сторонам без вашего согласия.",
        },
        {
          q: "Как обеспечивается защита от утечек?",
          a: "Многоуровневая система безопасности: шифрование данных, двухфакторная аутентификация, мониторинг доступа, регулярные penetration testing. Сертификаты соответствия ФСТЭК.",
        },
        {
          q: "Что происходит с данными при удалении аккаунта?",
          a: "При удалении аккаунта все персональные данные кандидатов анонимизируются или удаляются в соответствии с требованиями законодательства.",
        },
      ],
    },
    {
      id: "support",
      title: "Поддержка",
      questions: [
        {
          q: "Как получить помощь?",
          a: "Поддержка доступна через чат в личном кабинете, email support@avtonaim.qbs.ru или Telegram @qbs_support. Время ответа — в течение 2 часов в рабочее время.",
        },
        {
          q: "Есть ли обучение для новых пользователей?",
          a: "Да, предоставляем бесплатное онлайн-обучение: видео-инструкции, вебинары, подробная документация. Для корпоративных клиентов — индивидуальные консультации.",
        },
        {
          q: "Как сообщить о проблеме или баге?",
          a: "Используйте форму обратной связи в личном кабинете или напишите на support@avtonaim.qbs.ru. Приложите скриншоты и описание проблемы для быстрого решения.",
        },
        {
          q: "Есть ли SLA для корпоративных клиентов?",
          a: "Да, для тарифов «Корпоративный» и выше предоставляем SLA с гарантированным временем реакции: 1 час для критических инцидентов, 4 часа для обычных проблем.",
        },
      ],
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Помощь и поддержка", href: "/help" },
            { title: "Часто задаваемые вопросы" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Помощь и поддержка
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Часто задаваемые вопросы
        </h1>

        <p className="text-lg">
          Ответы на самые популярные вопросы о работе с QBS Автонайм. Не нашли
          ответ? Напишите нам в{" "}
          <a
            href="https://t.me/qbs_support"
            className="text-primary hover:underline"
          >
            Telegram
          </a>{" "}
          или{" "}
          <a
            href="mailto:support@avtonaim.qbs.ru"
            className="text-primary hover:underline"
          >
            email
          </a>
          .
        </p>

        <DocsMobileToc items={tocItems} />

        <DocsCallout type="info" title="Обновления">
          FAQ обновляется регулярно. Последнее обновление:{" "}
          {new Date().toLocaleDateString("ru-RU")}.
        </DocsCallout>

        {faqData.map((section) => (
          <div key={section.id}>
            <h2
              id={section.id}
              className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
            >
              {section.title}
            </h2>
            <div className="space-y-6">
              {section.questions.map((item) => (
                <div
                  key={`${section.id}-${item.q}`}
                  className="border-b border-border pb-6 last:border-b-0"
                >
                  <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <DocsCallout type="tip" title="Не нашли ответ?">
          <p>
            Если ваш вопрос не освещён в FAQ, обратитесь в нашу службу
            поддержки. Мы отвечаем в течение 2 часов в рабочее время и 4 часов в
            выходные.
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="https://t.me/qbs_support"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              💬 Написать в Telegram
            </a>
            <a
              href="mailto:support@avtonaim.qbs.ru"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
            >
              📧 Написать email
            </a>
          </div>
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <a
            href="/help/knowledge-base"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Помощь и поддержка
          </a>
          <a
            href="https://t.me/qbs_autonaim"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Связаться с поддержкой
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
