import type { Metadata } from "next";
import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsSteps } from "@/components/docs/docs-steps";
import { DocsToc } from "@/components/docs/docs-toc";
import { ImageWithZoom } from "@/components/docs/image-with-zoom";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("quickstart", {
  url: "/quickstart",
  type: "article",
});

export default function QuickstartPage() {
  const tocItems = [
    { id: "create-account", title: "Создание аккаунта", level: 2 },
    { id: "create-vacancy", title: "Создание вакансии", level: 2 },
    { id: "import-candidates", title: "Импорт кандидатов", level: 2 },
    { id: "next-steps", title: "Следующие шаги", level: 2 },
  ];

  const steps = [
    {
      title: "Регистрация аккаунта",
      content: (
        <div>
          <p className="mb-3">
            Создайте аккаунт с корпоративной почтой (@company.ru). Регистрация
            занимает 1 минуту — подтвердите email и телефон.
          </p>
          <p>
            Выберите тариф:{" "}
            <strong className="font-semibold text-foreground">
              Бесплатный
            </strong>{" "}
            (до 50 кандидатов/месяц) или{" "}
            <strong className="font-semibold text-foreground">
              Профессиональный
            </strong>{" "}
            от 2,990₽/месяц.
          </p>
        </div>
      ),
    },
    {
      title: "Интеграция с HH.ru",
      content: (
        <div>
          <p className="mb-3">
            В разделе «Интеграции» войдите в аккаунт работодателя на HH.ru.
            Данные хранятся в зашифрованном виде по стандартам ФЗ-152.
          </p>
          <p className="mb-4">
            Система импортирует все активные вакансии и начнёт собирать новые
            отклики автоматически.
          </p>
          {/* PLACEHOLDER: Скриншот страницы интеграций */}
          <div className="my-4 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              📸 Скриншот: Страница интеграций с HH.ru
            </p>
            <p className="text-xs text-muted-foreground">
              Показать раздел Настройки → Интеграции с кнопкой "Подключить
              HH.ru"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Путь: /orgs/[orgSlug]/workspaces/[slug]/settings/integrations
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
              quickstart-integrations.png
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Настройка AI-скрининга",
      content: (
        <div>
          <p className="mb-3">
            Откройте вакансию и настройте критерии оценки: опыт работы, навыки,
            образование. AI обучен на большом объеме данных и понимает специфику
            рынка.
          </p>
          <p className="mb-4">
            Пример: Для вакансии "Python-разработчик" AI проверит знание Django,
            опыт с PostgreSQL, наличие высшего образования.
          </p>
          {/* PLACEHOLDER: Скриншот настройки критериев вакансии */}
          <div className="my-4 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              📸 Скриншот: Настройка критериев вакансии
            </p>
            <p className="text-xs text-muted-foreground">
              Показать форму редактирования вакансии с полями: требуемые навыки,
              опыт, образование
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Путь: /orgs/[orgSlug]/workspaces/[slug]/vacancies/[id]/edit
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
              quickstart-vacancy-criteria.png
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Запуск и анализ результатов",
      content: (
        <div>
          <p className="mb-3">
            Новые отклики автоматически оцениваются по шкале 0-100 баллов.
            Кандидаты сортируются по релевантности — лучшие сверху.
          </p>
          <p className="mb-4">
            <strong className="font-semibold text-foreground">
              Результат:
            </strong>{" "}
            Вместо просмотра 100 резюме вручную, вы сразу видите топ-10
            кандидатов с обоснованием оценки.
          </p>
          {/* PLACEHOLDER: Скриншот списка откликов с оценками */}
          <div className="my-4 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              📸 Скриншот: Список откликов с AI-оценками
            </p>
            <p className="text-xs text-muted-foreground">
              Показать таблицу откликов с колонками: Кандидат, Оценка (0-100),
              Навыки, Статус
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Путь: /orgs/[orgSlug]/workspaces/[slug]/vacancies/[id]/responses
            </p>
            <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
              quickstart-responses-list.png
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Начало работы", href: "/docs" },
            { title: "Быстрый старт" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Начало работы
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Быстрый старт
        </h1>

        <p className="text-lg">
          Начните работу с российской AI-платформой для рекрутинга за 10 минут.
          Подключите HH.ru, настройте AI-скрининг и получите первых кандидатов
          уже сегодня. Подходит для компаний любого размера.
        </p>

        <DocsMobileToc items={tocItems} />

        <DocsCallout type="tip" title="Пробный период">
          Все новые пользователи получают бесплатный 14-дневный пробный период с
          полным доступом ко всем функциям платформы.
        </DocsCallout>

        <h2
          id="create-account"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание аккаунта
        </h2>

        <p>
          Для начала работы вам потребуется создать аккаунт в QBS Автонайм.
          Процесс регистрации занимает менее минуты.
        </p>

        {/* PLACEHOLDER: Скриншот страницы регистрации */}
        <ImageWithZoom
          src="/screenshots/quickstart-registration.png"
          alt="Страница регистрации QBS Автонайм"
          width={300}
          height={200}
          className="rounded-lg"
        />

        <h2
          id="steps"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Пошаговая настройка
        </h2>

        <DocsSteps steps={steps} />

        <h2
          id="next-steps"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Следующие шаги
        </h2>

        <p>
          После завершения базовой настройки рекомендуем изучить следующие
          разделы:
        </p>

        <ul>
          <li>
            <Link href="/candidates/screening">AI-скрининг</Link> — как работает
            автоматическая оценка резюме
          </li>
          <li>
            <Link href="/ai-assistant/chat">AI-интервью</Link> — настройка
            автоматических интервью
          </li>
          <li>
            <Link href="/integrations/freelance">Фриланс-платформы</Link> —
            импорт откликов с Kwork и др.
          </li>
          <li>
            <Link href="/integrations/telegram">Telegram-бот</Link> — проведение
            интервью в мессенджере
          </li>
        </ul>

        <h2
          id="case-studies"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Примеры использования
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Посмотрите, как другие компании используют QBS Автонайм:
        </p>

        <div className="grid gap-6 my-6">
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">
              Кейс: IT-компания "ТехноСервис"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="font-semibold text-foreground">Задача:</strong>{" "}
              Найм 15 Python-разработчиков за месяц
            </p>
            <p className="text-sm mb-3">
              <strong className="font-semibold text-foreground">
                Результат:
              </strong>{" "}
              Экономия 40 часов работы HR, повышение качества кандидатов на 35%
            </p>
            <div className="text-sm">
              <strong className="font-semibold text-foreground">
                Как использовали:
              </strong>{" "}
              AI-скрининг по техническим навыкам, автоматические интервью через
              Telegram, интеграция с HH.ru
            </div>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">
              Кейс: Ритейл сеть "Магнит"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="font-semibold text-foreground">Задача:</strong>{" "}
              Подбор 200 продавцов-кассиров ежемесячно
            </p>
            <p className="text-sm mb-3">
              <strong className="font-semibold text-foreground">
                Результат:
              </strong>{" "}
              Сокращение времени найма с 2 недель до 3 дней, снижение текучки на
              25%
            </p>
            <div className="text-sm">
              <strong className="font-semibold text-foreground">
                Как использовали:
              </strong>{" "}
              Массовый скрининг резюме, автоматические отказы неподходящим
              кандидатам
            </div>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">
              Кейс: Стартап "Фудтех"
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="font-semibold text-foreground">Задача:</strong>{" "}
              Найм первых 10 сотрудников без HR-отдела
            </p>
            <p className="text-sm mb-3">
              <strong className="font-semibold text-foreground">
                Результат:
              </strong>{" "}
              Автоматизация всего процесса найма, фокус на развитие продукта
            </p>
            <div className="text-sm">
              <strong className="font-semibold text-foreground">
                Как использовали:
              </strong>{" "}
              Полная автоматизация от отклика до оффера, интеграция с
              фриланс-платформами
            </div>
          </div>
        </div>

        <DocsCallout type="info" title="Нужна помощь?">
          Если у вас возникли вопросы, обратитесь в нашу службу поддержки через
          чат в личном кабинете или напишите на support@avtonaim.qbs.ru
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Введение
          </Link>
          <Link
            href="/glossary"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Глоссарий
            <span className="group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>
      </article>

      <DocsToc items={tocItems} />
    </div>
  );
}
