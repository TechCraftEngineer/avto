import Link from "next/link"
import { Button } from "@qbs-autonaim/ui"
import { ArrowLeft, Zap } from "lucide-react"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">QBS Автонайм</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold text-foreground">Политика конфиденциальности</h1>
          <p className="mb-8 text-muted-foreground">Последнее обновление: 6 января 2026 г.</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">1. Общие положения</h2>
              <p className="text-muted-foreground leading-relaxed">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
                пользователей сервиса QBS Автонайм (далее — «Сервис») в соответствии с Федеральным законом от 27.07.2006
                № 152-ФЗ «О персональных данных». Используя Сервис, вы соглашаетесь с условиями данной Политики
                конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">2. Собираемые данные</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">Мы собираем следующие типы данных:</p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Контактная информация (имя, email, номер телефона)</li>
                <li>Данные о компании (название, ИНН, ОГРН, адрес)</li>
                <li>Данные кандидатов (резюме, контактные данные, записи интервью)</li>
                <li>Техническая информация (IP-адрес, тип браузера, данные об устройстве)</li>
                <li>Данные об использовании Сервиса (журналы действий, аналитика)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">3. Цели обработки данных</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Персональные данные обрабатываются в соответствии со ст. 5 Федерального закона № 152-ФЗ для следующих
                целей:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Предоставления услуг по автоматизации найма персонала</li>
                <li>Проведения AI-интервью и анализа кандидатов</li>
                <li>Улучшения качества Сервиса</li>
                <li>Связи с пользователями по вопросам работы Сервиса</li>
                <li>Выполнения требований законодательства РФ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">4. Правовые основания обработки данных</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Обработка персональных данных осуществляется на основании:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Согласия субъекта персональных данных (ст. 6 ФЗ № 152-ФЗ)</li>
                <li>Договора, стороной которого является субъект персональных данных (ст. 6 ФЗ № 152-ФЗ)</li>
                <li>Федерального закона от 07.08.2001 № 115-ФЗ «О противодействии легализации (отмыванию) доходов»</li>
                <li>Иных правовых оснований, предусмотренных законодательством РФ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">5. Защита данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                В соответствии с требованиями ст. 19 ФЗ № 152-ФЗ и Постановлением Правительства РФ от 01.11.2012 № 1119
                мы применяем современные технические и организационные меры для защиты персональных данных от
                несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищённых
                серверах на территории Российской Федерации с использованием шифрования по ГОСТ 28147-89 и регулярного
                резервного копирования.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">6. Трансграничная передача данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                В соответствии со ст. 12 ФЗ № 152-ФЗ трансграничная передача персональных данных на территорию
                иностранных государств не осуществляется без согласия субъекта персональных данных. Все данные хранятся
                исключительно на серверах, расположенных на территории Российской Федерации.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">7. Соответствие ФЗ № 115-ФЗ</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                В рамках исполнения требований Федерального закона от 07.08.2001 № 115-ФЗ «О противодействии легализации
                (отмыванию) доходов, полученных преступным путём, и финансированию терроризма» мы:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Осуществляем идентификацию клиентов и выгодоприобретателей</li>
                <li>Храним документы и информацию о клиентах в течение 5 лет после окончания договора</li>
                <li>Проводим мониторинг операций и выявление подозрительных транзакций</li>
                <li>
                  Направляем сведения в Росфинмониторинг в случаях, предусмотренных законодательством (ст. 7 ФЗ №
                  115-ФЗ)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">8. Передача данных третьим лицам</h2>
              <p className="text-muted-foreground leading-relaxed">
                Мы не передаём персональные данные третьим лицам, за исключением случаев, предусмотренных
                законодательством РФ (в том числе ФЗ № 152-ФЗ, ФЗ № 115-ФЗ), а также при использовании сторонних
                российских сервисов, необходимых для работы платформы (хостинг, аналитика). Все партнёры обязуются
                соблюдать конфиденциальность данных.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">9. Хранение данных</h2>
              <p className="text-muted-foreground leading-relaxed">
                Персональные данные хранятся в течение срока действия договора и 5 лет после его окончания в
                соответствии с требованиями ФЗ № 115-ФЗ. Данные кандидатов хранятся в соответствии с настройками
                пользователя и могут быть удалены по запросу с учётом требований законодательства.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">10. Права субъектов персональных данных</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                В соответствии с главой 3 ФЗ № 152-ФЗ вы имеете право:
              </p>
              <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Получить информацию об обрабатываемых персональных данных (ст. 14 ФЗ № 152-ФЗ)</li>
                <li>Требовать уточнения, блокирования или уничтожения неточных или незаконно обрабатываемых данных</li>
                <li>Отозвать согласие на обработку персональных данных (ст. 9 ФЗ № 152-ФЗ)</li>
                <li>Обжаловать действия или бездействие оператора в Роскомнадзор или суд (ст. 17 ФЗ № 152-ФЗ)</li>
                <li>На защиту своих прав и законных интересов</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">11. Файлы cookie</h2>
              <p className="text-muted-foreground leading-relaxed">
                Сервис использует файлы cookie для обеспечения работоспособности и улучшения пользовательского опыта в
                соответствии с Федеральным законом от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о
                защите информации». Вы можете настроить использование cookie в настройках браузера.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">12. Уведомление Роскомнадзора</h2>
              <p className="text-muted-foreground leading-relaxed">
                ООО «КБС» уведомило Роскомнадзор об обработке персональных данных в соответствии с требованиями ст. 22
                ФЗ № 152-ФЗ. Регистрационный номер в реестре операторов персональных данных: [номер будет указан после
                регистрации].
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">13. Контактная информация</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                По вопросам, связанным с обработкой персональных данных и исполнением требований ФЗ № 152-ФЗ и ФЗ №
                115-ФЗ, вы можете связаться с нами:
              </p>
              <p className="text-muted-foreground">
                ООО «КБС»
                <br />
                ИНН: [будет указан]
                <br />
                ОГРН: [будет указан]
                <br />
                Адрес: г. Москва, [адрес будет указан]
                <br />
                Email: privacy@qbs-avtonaim.ru
                <br />
                Телефон: +7 (800) 555-35-35
                <br />
                Ответственный за обработку ПД: [ФИО будет указан]
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 QBS Автонайм. Все права защищены.
        </div>
      </footer>
    </div>
  )
}
