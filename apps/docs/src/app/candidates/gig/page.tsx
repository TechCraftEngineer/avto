import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsToc } from "@/components/docs/docs-toc";

export default function GigPage() {
  const tocItems = [
    { id: "overview", title: "Что такое Gig-задания", level: 2 },
    { id: "creation", title: "Создание задания", level: 2 },
    { id: "responses", title: "Управление откликами", level: 2 },
    { id: "shortlist", title: "Финалисты", level: 2 },
    { id: "interview", title: "AI-интервью", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Работа с кандидатами", href: "/candidates" },
            { title: "Gig-задания" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Работа с кандидатами
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Gig-задания
        </h1>

        <p className="text-lg">
          Gig-задания позволяют публиковать краткосрочные проекты на
          фриланс-платформах и автоматически обрабатывать отклики с помощью AI.
          Идеально для быстрого поиска исполнителей на разовые задачи.
        </p>

        <h2
          id="overview"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Что такое Gig-задания
        </h2>

        <p>
          Gig-задания — это краткосрочные проекты, которые публикуются на
          фриланс-платформах:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">Kwork</strong> —
            российская платформа микрозаданий
          </li>
          <li>
            <strong className="font-semibold text-foreground">FL.ru</strong> —
            крупнейшая российская биржа фриланса
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Freelance.ru
            </strong>{" "}
            — платформа для профессионалов
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Habr Freelance
            </strong>{" "}
            — биржа для IT-специалистов
          </li>
        </ul>

        <DocsCallout type="info" title="Автоматизация">
          Система автоматически импортирует отклики с платформ, оценивает
          кандидатов через AI (1-5 звезд) и формирует шорт-лист лучших
          исполнителей.
        </DocsCallout>

        <h2
          id="creation"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание задания
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Чтобы создать новое Gig-задание:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            Перейдите в раздел «Gig-задания»
          </li>
          <li className="text-foreground/80">Нажмите «Создать задание»</li>
          <li className="text-foreground/80">
            Заполните описание проекта, бюджет и сроки
          </li>
          <li className="text-foreground/80">
            Выберите платформы для публикации
          </li>
          <li className="text-foreground/80">
            Настройте критерии отбора для AI
          </li>
        </ol>

        <div className="my-6 rounded-lg border border-border p-6 bg-muted/30">
          <h4 className="font-semibold text-foreground mb-3">Пример задания</h4>
          <div className="space-y-2 text-sm">
            <p>
              <strong className="font-semibold text-foreground">
                Название:
              </strong>{" "}
              Разработка Telegram-бота
            </p>
            <p>
              <strong className="font-semibold text-foreground">
                Описание:
              </strong>{" "}
              Нужен бот для автоматизации рассылок
            </p>
            <p>
              <strong className="font-semibold text-foreground">Бюджет:</strong>{" "}
              30,000 - 50,000 ₽
            </p>
            <p>
              <strong className="font-semibold text-foreground">Срок:</strong>{" "}
              15 февраля 2024
            </p>
            <p>
              <strong className="font-semibold text-foreground">
                Платформы:
              </strong>{" "}
              Kwork, FL.ru, Habr
            </p>
            <p>
              <strong className="font-semibold text-foreground">
                Требования:
              </strong>{" "}
              Node.js, Telegram боты, опыт 1+ год, наличие портфолио
            </p>
          </div>
        </div>

        {/* PLACEHOLDER: Скриншот создания Gig-задания */}
        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Форма создания Gig-задания
          </p>
          <p className="text-xs text-muted-foreground">
            Показать форму с полями: Название, Описание, Бюджет, Срок, Платформы
            (чекбоксы), Требования
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/[slug]/gigs/create
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
            gig-create-form.png
          </p>
        </div>

        <h2
          id="responses"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Управление откликами
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          После публикации задания система автоматически:
        </p>

        <ul>
          <li>
            <strong className="font-semibold text-foreground">
              Импортирует отклики
            </strong>{" "}
            — собирает заявки с выбранных платформ
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Оценивает кандидатов
            </strong>{" "}
            — AI анализирует портфолио и опыт
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Присваивает рейтинг
            </strong>{" "}
            — от 1 до 5 звезд
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Фильтрует спам
            </strong>{" "}
            — отсеивает нерелевантные отклики
          </li>
        </ul>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Вы можете просматривать все отклики в едином интерфейсе:
        </p>

        <div className="my-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Поле
                </th>
                <th className="px-4 py-3 text-left font-medium text-foreground">
                  Описание
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 text-foreground">Имя</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Имя фрилансера
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Оценка AI</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Рейтинг 1-5 звезд
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Платформа</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Источник отклика
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Цена</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Предложенная стоимость
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Срок</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Предложенные сроки
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-foreground">Портфолио</td>
                <td className="px-4 py-3 text-muted-foreground">
                  Ссылки на работы
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2
          id="shortlist"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Финалисты
        </h2>

        <p>
          AI автоматически формирует шорт-лист лучших кандидатов на основе
          оценок. Вы можете:
        </p>

        <ul>
          <li className="text-foreground/80">
            Просмотреть топ-10 кандидатов с наивысшими оценками
          </li>
          <li className="text-foreground/80">
            Сравнить их предложения по цене и срокам
          </li>
          <li className="text-foreground/80">Изучить портфолио и отзывы</li>
          <li className="text-foreground/80">
            Пригласить на интервью одним кликом
          </li>
        </ul>

        <h2
          id="interview"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          AI-интервью
        </h2>

        <p>
          Для отобранных кандидатов можно сгенерировать уникальные ссылки на
          AI-интервью:
        </p>

        <ol className="my-4 ml-6 list-decimal space-y-2">
          <li className="text-foreground/80">
            Выберите кандидата из шорт-листа
          </li>
          <li className="text-foreground/80">
            Нажмите «Пригласить на интервью»
          </li>
          <li className="text-foreground/80">
            Система сгенерирует уникальную ссылку
          </li>
          <li className="text-foreground/80">
            Отправьте ссылку кандидату через платформу
          </li>
          <li className="text-foreground/80">
            AI проведет интервью и предоставит отчет
          </li>
        </ol>

        <DocsCallout type="info" title="Шаблоны приглашений">
          Используйте <code>gig.generateInvitationTemplate</code> для создания
          персонализированных приглашений на интервью.
        </DocsCallout>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/candidates/pipeline"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Воронка найма
          </Link>
          <Link
            href="/candidates/voice"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Голосовые сообщения
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
