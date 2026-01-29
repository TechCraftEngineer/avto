# QBS Автонайм — Документация

Полнофункциональная документация для AI-ассистента рекрутера QBS Автонайм, созданная на Next.js 16 с использованием структуры и стиля [dub.co](https://dub.co/docs).

## 🚀 Возможности

- **📱 Полностью адаптивная** — работает на всех устройствах
- **🔍 Мощный поиск** — быстрый поиск по всем страницам документации (⌘K/Ctrl+K)
- **🌓 Темная тема** — автоматическое переключение светлой/темной темы
- **📑 Навигация** — sidebar с автораскрытием секций и активной страницей
- **📖 TOC** — автоматическое оглавление с отслеживанием прокрутки
- **💅 Компоненты** — готовые компоненты для документации (карточки, callout, steps, табы)
- **⚡ Быстрая** — оптимизирована для производительности
- **🎨 Дизайн в стиле dub.co** — профессиональный и современный интерфейс

## 📂 Структура проекта

```
├── app/
│   ├── docs/                    # Все страницы документации
│   │   ├── ai-assistant/        # AI-ассистент
│   │   ├── analytics/           # Аналитика
│   │   ├── candidates/          # Работа с кандидатами
│   │   ├── integrations/        # Интеграции
│   │   ├── layout.tsx           # Layout документации
│   │   └── page.tsx             # Главная страница документации
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Глобальные стили
├── components/
│   ├── docs/                    # Компоненты документации
│   │   ├── docs-header.tsx      # Шапка с поиском и навигацией
│   │   ├── docs-sidebar.tsx     # Боковая навигация
│   │   ├── docs-toc.tsx         # Оглавление справа
│   │   ├── docs-search.tsx      # Диалог поиска
│   │   ├── docs-breadcrumb.tsx  # Хлебные крошки
│   │   ├── docs-card.tsx        # Карточки для ссылок
│   │   ├── docs-callout.tsx     # Подсветка важной информации
│   │   ├── docs-steps.tsx       # Пошаговые инструкции
│   │   ├── docs-code.tsx        # Блоки кода
│   │   ├── docs-tabs.tsx        # Вкладки
│   │   └── docs-accordion.tsx   # Аккордеон
│   ├── ui/                      # Базовые UI компоненты (shadcn/ui)
│   └── theme-provider.tsx       # Провайдер темы
├── lib/
│   ├── docs-config.ts           # Конфигурация навигации
│   └── utils.ts                 # Утилиты
└── README.md                    # Эта документация
```

## 🎯 Разделы документации

### 📘 Начало работы
- Введение в QBS Автонайм
- Быстрый старт
- Глоссарий терминов

### 👥 Работа с кандидатами
- Обзор
- AI-скрининг резюме
- Скоринг кандидатов
- Воронка найма

### 🤖 AI-ассистент
- Обзор AI-ассистента
- Чат с кандидатами
- Автоматические ответы
- Шаблоны сообщений

### 📊 Аналитика
- Обзор аналитики
- Отчёты по найму
- Метрики эффективности

### 🔌 Интеграции
- Обзор интеграций
- hh.ru
- SuperJob
- Telegram
- WhatsApp
- Webhooks


## 🛠 Технологии

- **Next.js 16** — React framework с App Router
- **React 19.2** — последняя версия с новыми возможностями
- **TypeScript** — типобезопасность
- **Tailwind CSS v4** — утилитарный CSS
- **shadcn/ui** — набор React компонентов
- **next-themes** — управление темами
- **Lucide React** — иконки
- **Vercel Analytics** — аналитика

## 📝 Создание новой страницы

1. Создайте файл `app/docs/your-section/page.tsx`:

```tsx
import { DocsBreadcrumb } from "@/components/docs/docs-breadcrumb"
import { DocsToc } from "@/components/docs/docs-toc"

export default function YourPage() {
  const tocItems = [
    { id: "section-1", title: "Раздел 1", level: 2 },
    { id: "section-2", title: "Раздел 2", level: 2 },
  ]

  return (
    <div className="flex gap-12">
      <article className="docs-content flex-1 max-w-3xl">
        <DocsBreadcrumb items={[{ title: "Раздел", href: "/docs" }, { title: "Страница" }]} />
        
        <h1>Заголовок страницы</h1>
        <p className="text-lg">Описание страницы</p>

        <h2 id="section-1">Раздел 1</h2>
        <p>Контент...</p>

        <h2 id="section-2">Раздел 2</h2>
        <p>Контент...</p>
      </article>

      <DocsToc items={tocItems} />
    </div>
  )
}
```

2. Добавьте страницу в `lib/docs-config.ts`:

```ts
{
  title: "Раздел",
  items: [
    { title: "Страница", href: "/docs/your-section" },
  ],
}
```

## 🎨 Использование компонентов

### Callout (подсветка информации)

```tsx
<DocsCallout type="info" title="Важно">
  Это важная информация для пользователей.
</DocsCallout>
```

Типы: `info`, `warning`, `tip`, `note`

### Steps (пошаговая инструкция)

```tsx
<DocsSteps 
  steps={[
    { title: "Шаг 1", content: <p>Описание</p> },
    { title: "Шаг 2", content: <p>Описание</p> },
  ]} 
/>
```

### Card (карточка-ссылка)

```tsx
<DocsCard 
  title="Название" 
  description="Описание" 
  href="/docs/page" 
  icon={<Icon />}
/>
```

### Code (блок кода)

```tsx
<DocsCode
  title="Пример"
  language="bash"
  code={`curl https://api.example.com`}
/>
```

### Tabs (вкладки)

```tsx
<DocsTabs
  tabs={[
    { label: "JavaScript", value: "js", content: <DocsCode code="..." /> },
    { label: "Python", value: "py", content: <DocsCode code="..." /> },
  ]}
/>
```

## 🚀 Деплой

Проект автоматически деплоится на Vercel при push в репозиторий.

### Требования для деплоя:
- Node.js 18+
- Next.js 16
- TypeScript 5+

### Переменные окружения:
- `QBS_API_KEY` — API ключ для QBS Автонайм (если используется)

## 📦 Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для production
npm run build

# Запуск production сборки
npm start
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## ✨ Особенности реализации

### Поиск
- Горячая клавиша ⌘K/Ctrl+K для быстрого доступа
- Поиск по заголовкам и разделам
- Мгновенные результаты

### Навигация
- Автоматическое раскрытие активной секции
- Подсветка текущей страницы
- Плавная анимация

### TOC (Table of Contents)
- Автоматическое отслеживание прокрутки
- Подсветка активного раздела
- Плавная прокрутка к разделам

### Адаптивность
- Мобильное меню в header
- Скрытие sidebar на планшетах
- Скрытие TOC на маленьких экранах

## 📄 Лицензия

© 2025 QBS Автонайм. Все права защищены.

## 🤝 Поддержка

Если у вас есть вопросы или предложения, свяжитесь с нами:
- Email: support@avtonaim.qbs.ru
- Website: https://avtonaim.qbs.ru
