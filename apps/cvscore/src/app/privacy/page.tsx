import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: "Политика конфиденциальности сервиса CVScore",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80"
          >
            <span className="text-xl font-bold">{SITE_CONFIG.name}</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            На главную
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">
            Политика конфиденциальности
          </h1>
          <p className="mb-8 text-muted-foreground">
            Последнее обновление: 10 марта 2026 г.
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                1. Общие положения
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности определяет порядок
                обработки и защиты персональных данных пользователей сервиса
                CVScore (далее — «Сервис») в соответствии с Федеральным законом
                от 27.07.2006 № 152-ФЗ «О персональных данных». Используя
                Сервис, вы соглашаетесь с условиями данной Политики
                конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                2. Собираемые данные
              </h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Сервис CVScore собирает следующие типы данных:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Текст резюме — может содержать персональные данные (ФИО,
                  контакты, образование, место жительства) в соответствии с тем,
                  что вы вводите
                </li>
                <li>
                  Текст описания вакансии — требования и обязанности должности
                </li>
                <li>
                  Результаты скрининга — оценка (score), сильные стороны, риски,
                  вопросы для интервью
                </li>
                <li>
                  Техническая информация — IP-адрес (для ограничения частоты
                  запросов)
                </li>
              </ul>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Хранение текста резюме и вакансии в базе данных осуществляется
                только при наличии вашего явного согласия (чекбокс в форме). Без
                согласия сохраняются только обезличенные результаты скрининга.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                3. Цели обработки данных
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>AI-оценка соответствия резюме требованиям вакансии</li>
                <li>
                  Формирование результата скрининга (оценка, риски, вопросы)
                </li>
                <li>Улучшение качества Сервиса</li>
                <li>Ограничение злоупотреблений (rate limiting по IP)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                4. Трансграничная передача данных
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Для выполнения AI-скрининга текст резюме и вакансии передаётся
                внешним провайдерам нейросетей (OpenAI, OpenRouter, DeepSeek и
                др.) и сервисам мониторинга (Langfuse), которые могут
                располагаться за пределами Российской Федерации. Используя
                Сервис и отмечая согласие на хранение данных, вы даёте согласие
                на такую обработку. Без отметки согласия текст резюме и вакансии
                не сохраняется в нашей базе данных.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                5. Права субъектов персональных данных
              </h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                В соответствии с главой 3 ФЗ № 152-ФЗ вы имеете право:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Получить информацию об обрабатываемых персональных данных (ст.
                  14 ФЗ № 152-ФЗ)
                </li>
                <li>
                  Требовать уточнения, блокирования или уничтожения данных
                </li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Обжаловать действия оператора в Роскомнадзор или суд</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                6. Контактная информация
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                По вопросам обработки персональных данных обращайтесь:
              </p>
              <p className="mt-2 text-muted-foreground">
                ООО «КБС»
                <br />
                Email: privacy@qbs-avtonaim.ru
                <br />
                Телефон: +7 (800) 555-35-35
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 {SITE_CONFIG.name}. Все права защищены.{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:no-underline"
          >
            Условия использования
          </Link>
        </div>
      </footer>
    </div>
  );
}
