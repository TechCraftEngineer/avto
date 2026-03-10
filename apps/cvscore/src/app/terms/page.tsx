import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования сервиса CVScore",
};

export default function TermsPage() {
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
            Условия использования
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
                Настоящие Условия использования (далее — «Условия») регулируют
                отношения между ООО «КБС» (далее — «Компания») и пользователем
                бесплатного сервиса CVScore (далее — «Пользователь», «Вы»).
                Используя Сервис, Пользователь подтверждает согласие с
                настоящими Условиями.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                2. Описание Сервиса
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                CVScore — бесплатный инструмент для AI-скрининга кандидатов по
                резюме. Сервис анализирует соответствие текста резюме
                требованиям вакансии и формирует оценку, сильные стороны, риски
                и вопросы для интервью. Сервис работает без регистрации и
                предоставляется «как есть».
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                3. Использование и ограничение ответственности
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Вы используете Сервис на свой страх и риск. Компания не
                  гарантирует точность или полноту результатов AI-анализа
                </li>
                <li>
                  Вы обязуетесь получать согласие владельца резюме на обработку
                  персональных данных в соответствии с ФЗ № 152-ФЗ
                </li>
                <li>
                  Запрещается использовать Сервис для противоправных целей или
                  дискриминации кандидатов
                </li>
                <li>
                  Сервис может быть изменён или прекращён в любой момент без
                  предварительного уведомления
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                4. Конфиденциальность
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Обработка персональных данных осуществляется в соответствии с{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Политикой конфиденциальности
                </Link>
                , которая является неотъемлемой частью настоящих Условий, а
                также с требованиями ФЗ № 152-ФЗ.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                5. Контактная информация
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                ООО «КБС»
                <br />
                Email: support@qbs-avtonaim.ru
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
            href="/privacy"
            className="underline underline-offset-4 hover:no-underline"
          >
            Политика конфиденциальности
          </Link>
        </div>
      </footer>
    </div>
  );
}
