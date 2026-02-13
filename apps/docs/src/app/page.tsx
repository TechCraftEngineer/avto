import { Bot, FileText, Plug, Users, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DocsCard } from "@/components/docs/docs-card";
import { DocsFeedback } from "@/components/docs/docs-feedback";
import { DocsMobileToc } from "@/components/docs/docs-mobile-toc";
import { DocsToc } from "@/components/docs/docs-toc";
import { generatePageSEO } from "@/lib/seo";

export const metadata: Metadata = generatePageSEO("home");

export default function DocsIntroductionPage() {
  const tocItems = [
    { id: "key-features", title: "Ключевые возможности", level: 2 },
    { id: "getting-started", title: "С чего начать", level: 2 },
    { id: "stay-updated", title: "Будьте в курсе", level: 2 },
  ];

  return (
    <div className="flex gap-12">
      <article className="flex-1 max-w-3xl">
        {/* Hero-раздел */}
        <div className="mb-8">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            Начало работы
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Добро пожаловать в QBS Автонайм
          </h1>
          <p className="text-xl text-muted-foreground">
            Современная AI-платформа для автоматизации рекрутинга. Интеграция с
            HH.ru, Telegram-боты, экономия до 80% времени на подборе персонала.
          </p>
        </div>

        <DocsMobileToc items={tocItems} />

        {/* PLACEHOLDER: Скриншот главной страницы */}
        <div className="my-6 rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            📸 Скриншот: Главная страница платформы
          </p>
          <p className="text-xs text-muted-foreground">
            Показать дашборд с: Статистика (активные вакансии, новые отклики),
            Последние кандидаты, Быстрые действия
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Путь: /orgs/[orgSlug]/workspaces/[slug]
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-2 bg-muted px-2 py-1 rounded">
            home-dashboard.png
          </p>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-primary">
            Начало работы
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">
          Введение
        </h1>

        <p className="text-lg">
          <strong className="font-semibold text-foreground">
            QBS Автонайм
          </strong>{" "}
          — это первая российская AI-платформа для автоматизации рекрутинга,
          которая помогает{" "}
          <Link href="/candidates/screening">
            автоматически оценивать кандидатов по 100+ критериям
          </Link>
          , <Link href="/integrations/hh">импортировать отклики с HH.ru</Link> и{" "}
          <Link href="/ai-assistant">
            проводить интервью через Telegram-ботов
          </Link>
          . Работает с крупнейшими работодателями России.
        </p>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Вы экономите до 80% времени на рекрутинге, если вы:
        </p>

        <ul className="my-4 ml-6 list-disc space-y-2">
          <li>
            <strong className="font-semibold text-foreground">
              HR в IT-компании
            </strong>{" "}
            — закрываете 50+ вакансий в месяц, тратите 4 часа на просмотр 100
            резюме
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Рекрутер в ритейле
            </strong>{" "}
            — нанимаете продавцов и кассиров, получаете 200+ откликов на
            вакансию
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Фрилансер на Kwork
            </strong>{" "}
            — ищете исполнителей на разовые задачи, проверяете портфолио вручную
          </li>
          <li>
            <strong className="font-semibold text-foreground">
              Руководитель отдела
            </strong>{" "}
            — хотите, чтобы первичное интервью проводил AI, а не стажёр
          </li>
        </ul>

        <p className="leading-relaxed text-foreground/80 mb-4">
          <strong className="font-semibold text-foreground">Результат:</strong>{" "}
          Время на одну вакансию сокращается с 2 недель до 3 дней. Качество
          кандидатов растёт на 40% благодаря объективной AI-оценке.
        </p>

        <h2
          id="key-features"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Ключевые возможности
        </h2>

        <p className="leading-relaxed text-foreground/80 mb-4">
          QBS Автонайм — это не просто база данных кандидатов. Мы предлагаем
          полный набор инструментов для автоматизации и оптимизации процесса
          найма.
        </p>

        <p className="leading-relaxed text-foreground/80 mb-4">
          Ключевые возможности российской AI-платформы:
        </p>

        <ul className="my-4 ml-6 list-disc space-y-2">
          <li>
            <Link href="/candidates/screening">AI-скрининг резюме</Link> —
            оценивает кандидатов по 100+ критериям, находит лучших за минуты
          </li>
          <li>
            <Link href="/integrations/hh">Интеграция с HH.ru</Link> —
            автоматический импорт вакансий и откликов, синхронизация статусов
          </li>
          <li>
            <Link href="/ai-assistant/chat">Автоматические интервью</Link> —
            чат-боты проводят первичное интервью 24/7
          </li>
          <li>
            <Link href="/candidates/gig">Gig-экономика</Link> — платформа для
            поиска фрилансеров с AI-проверкой навыков
          </li>
          <li>
            <Link href="/integrations/telegram">Telegram-боты</Link> — нанимайте
            через популярный мессенджер
          </li>
          <li>
            <Link href="/candidates/voice">Голосовые резюме</Link> —
            транскрибация аудио
          </li>
          <li>
            Безопасность и настройки — управление доступом, приватность данных
          </li>
          <li>
            <Link href="/analytics">Аналитика найма</Link> — метрики
            эффективности, ROI рекрутинга, отчёты для руководства
          </li>
        </ul>

        <h2
          id="getting-started"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          С чего начать
        </h2>

        <p>
          Выберите подходящий для вас путь, чтобы начать работу с QBS Автонайм:
        </p>

        <div className="grid gap-4 sm:grid-cols-2 my-6">
          <DocsCard
            title="Быстрый старт"
            description="Подключите HH.ru за 3 минуты, создайте вакансию и получите первых кандидатов"
            href="/quickstart"
            icon={<Zap className="h-5 w-5" />}
          />
          <DocsCard
            title="AI-скрининг резюме"
            description="Как AI оценивает кандидатов: настройка критериев, весовые коэффициенты, примеры"
            href="/candidates/screening"
            icon={<Users className="h-5 w-5" />}
          />
          <DocsCard
            title="Интеграции"
            description="HH.ru, Telegram, Kwork, FL.ru — все популярные платформы"
            href="/integrations"
            icon={<Plug className="h-5 w-5" />}
          />
          <DocsCard
            title="База знаний"
            description="Статьи, гайды и кейсы по современному рекрутингу и HR-автоматизации"
            href="/help/knowledge-base"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        <h2
          id="stay-updated"
          className="text-xl font-semibold tracking-tight text-foreground mt-10 mb-4 scroll-mt-20"
        >
          Будьте в курсе
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 my-6">
          <DocsCard
            title="Блог и кейсы"
            description="Статьи, гайды и кейсы по современному рекрутингу и HR-автоматизации"
            href="https://avtonaim.qbsoft.ru/blog"
            icon={<FileText className="h-5 w-5" />}
          />
          <DocsCard
            title="Сообщество HR"
            description="Telegram-канал для HR-менеджеров: новости, обсуждения, поддержка пользователей"
            href="https://t.me/qbs_autonaim"
            icon={<Bot className="h-5 w-5" />}
          />
        </div>

        {/* Компонент обратной связи */}
        <div className="my-8">
          <DocsFeedback />
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <div />
          <Link
            href="/quickstart"
            className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Быстрый старт
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
