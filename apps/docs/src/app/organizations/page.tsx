import type { Metadata } from "next";
import Link from "next/link";
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb";
import { DocsCallout } from "@/components/docs/docs-callout";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("organizations", {
  url: "/organizations",
  type: "article",
});

export default function OrganizationsPage() {
  const tocItems = [
    { id: "what-is-org", title: "Что такое организация", level: 2 },
    { id: "create-org", title: "Создание организации", level: 2 },
    { id: "org-settings", title: "Настройки организации", level: 2 },
    { id: "members", title: "Управление участниками", level: 2 },
    { id: "roles", title: "Роли и права доступа", level: 2 },
    { id: "billing", title: "Биллинг и подписка", level: 2 },
    { id: "use-cases", title: "Примеры для разных типов бизнеса", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        <DocsBreadcrumb
          items={[
            { title: "Документация", href: "/docs" },
            { title: "Организации" },
          ]}
        />

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">Управление</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Организации
        </h1>

        <p className="text-lg">
          Организация — это основная единица управления в QBS Автонайм. Она
          объединяет команду, пространства, вакансии и настройки биллинга.
        </p>

        <DocsMobileToc items={tocItems} />

        <h2
          id="what-is-org"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Что такое организация
        </h2>

        <p className="mb-4">
          Организация представляет вашу компанию в системе. Внутри организации
          вы можете создавать несколько пространств для разных команд или
          проектов, приглашать сотрудников и управлять доступом.
        </p>

        <DocsCallout type="info" title="Структура">
          Организация → Пространства → Вакансии → Кандидаты
        </DocsCallout>

        <div className="my-6 space-y-3">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">
              Основные возможности
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Централизованное управление командой и правами доступа</li>
              <li>• Создание нескольких пространств для разных отделов</li>
              <li>• Единый биллинг для всей организации</li>
              <li>• Общие настройки интеграций и шаблонов</li>
              <li>• Аналитика по всем пространствам</li>
            </ul>
          </div>
        </div>

        <h2
          id="create-org"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Создание организации
        </h2>

        <p className="mb-4">
          Организация создается автоматически при регистрации. Вы можете
          изменить название и настройки в любой момент.
        </p>

        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Создание организации
          </p>
          <p className="text-xs text-muted-foreground">
            Показать форму создания организации с полями: Название, Slug,
            Описание
          </p>
          <p className="text-xs text-muted-foreground mt-1">Путь: /orgs/new</p>
        </div>

        <h2
          id="org-settings"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Настройки организации
        </h2>

        <p className="mb-4">
          В настройках организации вы можете изменить основную информацию,
          логотип и другие параметры.
        </p>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Основные настройки</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Название:</strong>{" "}
                Отображается во всех интерфейсах
              </li>
              <li>
                <strong className="text-foreground">Slug:</strong> Уникальный
                идентификатор в URL (например, /orgs/my-company)
              </li>
              <li>
                <strong className="text-foreground">Логотип:</strong>{" "}
                Изображение организации (рекомендуемый размер: 200×200px)
              </li>
              <li>
                <strong className="text-foreground">Описание:</strong> Краткая
                информация о компании
              </li>
            </ul>
          </div>
        </div>

        <h2
          id="members"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Управление участниками
        </h2>

        <p className="mb-4">
          Приглашайте коллег в организацию и управляйте их доступом к
          пространствам и функциям.
        </p>

        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Управление участниками
          </p>
          <p className="text-xs text-muted-foreground">
            Показать список участников с ролями и кнопкой "Пригласить"
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/settings/members
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-3">Приглашение участников</h3>

        <ol className="space-y-3 mb-6">
          <li>1. Откройте раздел «Настройки» → «Участники»</li>
          <li>2. Нажмите кнопку «Пригласить участника»</li>
          <li>3. Введите email и выберите роль</li>
          <li>4. Отправьте приглашение</li>
        </ol>

        <DocsCallout type="tip" title="Совет">
          Приглашение действительно 7 дней. После этого нужно отправить новое.
        </DocsCallout>

        <h2
          id="roles"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Роли и права доступа
        </h2>

        <p className="mb-4">
          В организации доступны три основные роли с разными уровнями доступа:
        </p>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Владелец (Owner)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Полный доступ ко всем функциям организации
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Управление биллингом и подпиской</li>
              <li>• Удаление организации</li>
              <li>• Управление всеми участниками</li>
              <li>• Доступ ко всем пространствам</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">
              Администратор (Admin)
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Управление организацией без доступа к биллингу
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Приглашение и удаление участников</li>
              <li>• Создание и настройка пространств</li>
              <li>• Управление интеграциями</li>
              <li>• Просмотр аналитики</li>
            </ul>
          </div>

          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Участник (Member)</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Доступ только к назначенным пространствам
            </p>
            <ul className="space-y-1 text-sm">
              <li>• Работа с вакансиями в своих пространствах</li>
              <li>• Просмотр и оценка кандидатов</li>
              <li>• Использование AI-инструментов</li>
              <li>• Нет доступа к настройкам организации</li>
            </ul>
          </div>
        </div>

        <h2
          id="billing"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Биллинг и подписка
        </h2>

        <p className="mb-4">
          Подписка оформляется на уровне организации и распространяется на все
          воркспейсы.
        </p>

        <div className="space-y-4 mb-6">
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-base font-semibold mb-2">Тарифы</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <strong className="text-foreground">Бесплатный:</strong> До 50
                кандидатов/месяц, 1 воркспейс
              </li>
              <li>
                <strong className="text-foreground">Профессиональный:</strong>{" "}
                От 2,990₽/месяц, неограниченно кандидатов
              </li>
              <li>
                <strong className="text-foreground">Корпоративный:</strong>{" "}
                Индивидуальные условия, SLA, поддержка
              </li>
            </ul>
          </div>
        </div>

        <DocsCallout type="info" title="Оплата">
          Оплата производится ежемесячно или ежегодно (со скидкой 20%).
          Принимаем карты российских банков и выставляем счета для юрлиц.
        </DocsCallout>

        <h2
          id="use-cases"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Примеры организации для разных типов бизнеса
        </h2>

        <p className="mb-4">
          Структура организации и воркспейсов зависит от специфики вашего
          бизнеса. Вот несколько типичных сценариев:
        </p>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">
              Маленькая компания (5–20 сотрудников)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, 1 воркспейс
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Стартап Технологии"
              <br />
              └─ Воркспейс: "Общий найм"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Основатель или HR-менеджер управляет всем процессом найма в одном
              месте.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong>{" "}
              Простота, все вакансии и кандидаты в одном воркспейсе, минимальные
              настройки.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">
              Средняя компания (50–200 сотрудников)
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, несколько воркспейсов по отделам
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "ТехноКорп"
              <br />
              ├─ Воркспейс: "IT-отдел"
              <br />
              ├─ Воркспейс: "Продажи"
              <br />
              ├─ Воркспейс: "Маркетинг"
              <br />
              └─ Воркспейс: "Поддержка"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Каждый отдел имеет своего рекрутера или менеджера, который
              управляет наймом в своем воркспейсе.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong>{" "}
              Изоляция данных между отделами, специфичные настройки AI для
              каждого направления, отдельная аналитика.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Группа компаний</h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> Несколько
              организаций (по компании) или 1 организация с воркспейсами по
              компаниям
            </p>

            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">
                Вариант 1: Отдельные организации
              </p>
              <div className="bg-muted/30 rounded p-3 text-sm font-mono">
                Организация: "Холдинг Альфа — Ритейл"
                <br />
                └─ Воркспейсы для магазинов
                <br />
                <br />
                Организация: "Холдинг Альфа — Логистика"
                <br />
                └─ Воркспейсы для складов
                <br />
                <br />
                Организация: "Холдинг Альфа — IT"
                <br />
                └─ Воркспейсы для разработки
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm font-semibold mb-2">
                Вариант 2: Одна организация
              </p>
              <div className="bg-muted/30 rounded p-3 text-sm font-mono">
                Организация: "Холдинг Альфа"
                <br />
                ├─ Воркспейс: "Ритейл — Москва"
                <br />
                ├─ Воркспейс: "Ритейл — Регионы"
                <br />
                ├─ Воркспейс: "Логистика"
                <br />
                └─ Воркспейс: "IT-центр"
              </div>
            </div>

            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Централизованный HR-отдел управляет наймом для всех компаний
              группы.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong> Единый
              биллинг, общая аналитика по группе, возможность перемещения
              кандидатов между компаниями.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Кадровое агентство</h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, воркспейсы по клиентам или проектам
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "HR Партнеры Агентство"
              <br />
              ├─ Воркспейс: "Клиент: Банк Восток"
              <br />
              ├─ Воркспейс: "Клиент: Ритейл Сеть"
              <br />
              ├─ Воркспейс: "Клиент: IT Компания"
              <br />
              ├─ Воркспейс: "Массовый подбор"
              <br />
              └─ Воркспейс: "Топ-менеджмент"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Рекрутеры агентства работают с несколькими клиентами одновременно,
              каждый клиент в отдельном воркспейсе.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong> Полная
              изоляция данных клиентов, возможность предоставить доступ клиенту
              к его воркспейсу, отдельная отчетность по проектам.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">
              Аутсорсинговая компания
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, воркспейсы по направлениям аутсорсинга
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Аутсорс Про"
              <br />
              ├─ Воркспейс: "Бухгалтерия"
              <br />
              ├─ Воркспейс: "IT-поддержка"
              <br />
              ├─ Воркспейс: "Колл-центр"
              <br />
              └─ Воркспейс: "Клининг"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              HR-менеджеры по каждому направлению ведут массовый найм
              специалистов.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong> Разные
              критерии оценки для каждого направления, быстрый массовый подбор,
              отдельная аналитика по сегментам.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">
              Фриланс-платформа или маркетплейс
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, воркспейсы по категориям специалистов
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Фриланс Маркет"
              <br />
              ├─ Воркспейс: "Разработчики"
              <br />
              ├─ Воркспейс: "Дизайнеры"
              <br />
              ├─ Воркспейс: "Копирайтеры"
              <br />
              ├─ Воркспейс: "Маркетологи"
              <br />
              └─ Воркспейс: "Переводчики"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Модераторы платформы проверяют и одобряют фрилансеров для работы
              на платформе.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong>{" "}
              Автоматический скрининг заявок фрилансеров, быстрая проверка
              портфолио, категоризация специалистов.
            </p>
          </div>

          <div className="border border-border rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Сезонный бизнес</h3>
            <p className="text-sm text-muted-foreground mb-3">
              <strong className="text-foreground">Структура:</strong> 1
              организация, временные воркспейсы под сезоны
            </p>
            <div className="bg-muted/30 rounded p-3 mb-3 text-sm font-mono">
              Организация: "Летний Фестиваль"
              <br />
              ├─ Воркспейс: "Сезон 2026"
              <br />
              ├─ Воркспейс: "Сезон 2025" (архив)
              <br />
              └─ Воркспейс: "Постоянный персонал"
            </div>
            <p className="text-sm mb-2">
              <strong className="text-foreground">Кто использует:</strong>{" "}
              Организаторы мероприятий, турбазы, горнолыжные курорты с сезонным
              наймом.
            </p>
            <p className="text-sm">
              <strong className="text-foreground">Преимущества:</strong>{" "}
              Возможность вернуться к базе кандидатов прошлых сезонов, сравнение
              эффективности найма по годам.
            </p>
          </div>
        </div>

        <DocsCallout type="tip" title="Выбор структуры">
          Начните с простой структуры и усложняйте по мере роста. Всегда можно
          создать новые воркспейсы или реорганизовать существующие без потери
          данных.
        </DocsCallout>

        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <Link
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">
              ←
            </span>
            Быстрый старт
          </Link>
          <Link
            href="/organizations/workspaces"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Воркспейсы
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
