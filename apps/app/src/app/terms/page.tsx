import { APP_CONFIG, paths } from "@qbs-autonaim/config";
import { Button } from "@qbs-autonaim/ui/components/button";
import { ArrowLeft, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Условия использования",
  description: "Условия использования сервиса QBS Автонайм",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              {APP_CONFIG.name}
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href={paths.auth.signin} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">
            Условия использования
          </h1>
          <p className="mb-8 text-muted-foreground">
            Последнее обновление: 6 января 2026 г.
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                1. Общие положения
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящие Условия использования (далее — «Условия») регулируют
                отношения между ООО «КБС» (ОГРН: [будет указан], ИНН: [будет
                указан], адрес: г. Москва, [адрес будет указан], далее —
                «Компания») и пользователем сервиса QBS Автонайм (далее —
                «Пользователь», «Вы»). Регистрируясь в Сервисе, Пользователь
                подтверждает полное согласие с настоящими Условиями и обязуется
                их соблюдать.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                2. Описание Сервиса
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                QBS Автонайм — это программная платформа для автоматизации
                процесса найма персонала с использованием технологий
                искусственного интеллекта, предоставляемая на территории
                Российской Федерации в соответствии с законодательством РФ.
                Сервис обеспечивает автоматический скрининг резюме, проведение
                интервью через мессенджер Telegram и формирование отчётов по
                кандидатам.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                3. Регистрация и аккаунт
              </h2>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Для использования Сервиса необходима регистрация с
                  предоставлением достоверных данных организации
                </li>
                <li>
                  Пользователь обязуется предоставить достоверную информацию,
                  включая ИНН, ОГРН и контактные данные уполномоченного лица
                </li>
                <li>
                  Пользователь несёт полную ответственность за сохранность
                  учётных данных
                </li>
                <li>
                  Один аккаунт может использоваться только одним юридическим
                  лицом или ИП
                </li>
                <li>
                  Компания вправе запросить у Пользователя подтверждающие
                  документы (устав, выписку из ЕГРЮЛ/ЕГРИП)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                4. Права и обязанности Пользователя
              </h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Пользователь имеет право:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Использовать функционал Сервиса в соответствии с выбранным
                  тарифным планом
                </li>
                <li>
                  Получать техническую поддержку в рабочие дни с 9:00 до 18:00
                  по московскому времени
                </li>
                <li>Экспортировать свои данные в общепринятых форматах</li>
                <li>
                  Запрашивать удаление своих персональных данных в соответствии
                  с ФЗ № 152-ФЗ
                </li>
              </ul>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Пользователь обязуется:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Соблюдать законодательство РФ при использовании Сервиса,
                  включая Трудовой кодекс РФ
                </li>
                <li>
                  Получать письменное согласие кандидатов на обработку
                  персональных данных в соответствии с ФЗ № 152-ФЗ
                </li>
                <li>
                  Не использовать Сервис для противоправных целей или
                  дискриминации кандидатов
                </li>
                <li>
                  Своевременно оплачивать услуги согласно выбранному тарифу и
                  выставленным счетам
                </li>
                <li>
                  Предоставлять актуальную информацию о компании и
                  уполномоченных лицах
                </li>
                <li>
                  Не передавать доступ к аккаунту третьим лицам без
                  предварительного письменного согласия Компании
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                5. Тарифы и оплата
              </h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Стоимость услуг определяется действующими тарифами,
                опубликованными на сайте Сервиса. Все цены указаны в российских
                рублях с учётом НДС 20%.
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Оплата производится на условиях 100% предоплаты на основании
                  выставленного счёта
                </li>
                <li>
                  Оплата может осуществляться безналичным переводом на расчётный
                  счёт Компании в российском банке или банковской картой
                </li>
                <li>
                  Неиспользованные в течение оплаченного периода услуги не
                  переносятся на следующий период
                </li>
                <li>
                  Возврат денежных средств осуществляется в соответствии с
                  законодательством РФ о защите прав потребителей
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                9. Конфиденциальность
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Обработка персональных данных осуществляется в соответствии с{" "}
                <Link
                  href={paths.legal.privacy}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Политикой конфиденциальности
                </Link>
                , которая является неотъемлемой частью настоящих Условий, а
                также с требованиями ФЗ № 152-ФЗ и ФЗ № 115-ФЗ.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                13. Реквизиты и контактная информация
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Полное наименование: Общество с ограниченной ответственностью
                «КБС»
                <br />
                Сокращённое наименование: ООО «КБС»
                <br />
                ИНН: [будет указан]
                <br />
                КПП: [будет указан]
                <br />
                ОГРН: [будет указан]
                <br />
                Юридический адрес: [будет указан], Российская Федерация
                <br />
                Расчётный счёт: [будет указан]
                <br />
                Банк: [будет указан]
                <br />
                БИК: [будет указан]
                <br />
                Корр. счёт: [будет указан]
                <br />
                <br />
                Email: support@qbs-avtonaim.ru
                <br />
                Телефон: +7 (800) 555-35-35
                <br />
                Генеральный директор: [ФИО будет указан]
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 {APP_CONFIG.name}. Все права защищены.
        </div>
      </footer>
    </div>
  );
}
