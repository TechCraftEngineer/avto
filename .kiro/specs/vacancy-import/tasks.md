# План реализации: Импорт вакансий

## Обзор

Реализация функционала импорта вакансий из внешних источников (hh.ru) с поддержкой трёх режимов: массовый импорт новых вакансий, массовый импорт архивных вакансий и импорт по ссылке. Все операции выполняются асинхронно через Inngest с отображением прогресса в реальном времени.

## Задачи

- [x] 1. Создать Inngest каналы для отслеживания прогресса импорта
  - Добавить определения каналов в `packages/jobs/src/inngest/channels/client.ts`
  - Создать канал `importNewVacanciesChannel` с топиками progress и result
  - Создать канал `importArchivedVacanciesChannel` с топиками progress и result
  - Создать канал `importVacancyByUrlChannel` с топиками progress и result
  - Использовать Zod v4 для схем валидации событий
  - Экспортировать каналы из `packages/jobs/src/inngest/channels/index.ts`
  - _Requirements: 4.1, 4.3_

- [ ]* 1.1 Написать property-тест для получения токенов подписки
  - **Property 5: Получение токена подписки для всех операций**
  - **Validates: Requirements 4.1**

- [x] 2. Создать Server Actions для управления импортом
  - Создать файл `apps/app/src/actions/vacancy-import.ts`
  - Реализовать `fetchImportNewVacanciesToken(workspaceId: string)`
  - Реализовать `fetchImportArchivedVacanciesToken(workspaceId: string)`
  - Реализовать `fetchImportVacancyByUrlToken(workspaceId: string, requestId: string)`
  - Реализовать `triggerImportNewVacancies(workspaceId: string)`
  - Реализовать `triggerImportArchivedVacancies(workspaceId: string)`
  - Реализовать `triggerImportVacancyByUrl(workspaceId: string, url: string)`
  - Использовать паттерн из `apps/app/src/actions/realtime.ts`
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1_

- [ ]* 2.1 Написать property-тест для валидации URL
  - **Property 4: Валидация URL вакансий**
  - **Validates: Requirements 3.1, 3.5**

- [ ]* 2.2 Написать unit-тесты для Server Actions
  - Тест создания Inngest событий
  - Тест получения токенов подписки
  - Тест валидации входных параметров
  - _Requirements: 1.1, 2.1, 3.2_

- [x] 3. Создать схемы валидации для импорта
  - Создать файл `packages/validators/src/vacancy-import.ts`
  - Создать `ImportByUrlSchema` с валидацией URL hh.ru
  - Создать функцию `extractExternalIdFromUrl(url: string)`
  - Создать `VacancyDataSchema` для валидации данных вакансии
  - Использовать Zod v4 для всех схем
  - _Requirements: 3.1, 6.1, 6.3, 6.4_

- [ ]* 3.1 Написать property-тесты для валидации данных
  - **Property 9: Валидация обязательных полей**
  - **Property 10: Валидация типов данных**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 4. Расширить парсер HH для импорта одной вакансии
  - Добавить функцию `importSingleVacancy` в `packages/jobs/src/parsers/hh/runner.ts`
  - Добавить функцию `parseSingleVacancy` в `packages/jobs/src/parsers/hh/vacancy-parser.ts`
  - Реализовать получение данных вакансии по externalId
  - Реализовать логику проверки на дубликаты (по source + externalId + workspaceId)
  - Реализовать обновление существующих вакансий
  - Вернуть `{ vacancyId, isNew }` для отслеживания результата
  - _Requirements: 3.3, 3.4, 8.1, 8.2, 8.3, 8.4_

- [ ]* 4.1 Написать property-тест для обработки дубликатов
  - **Property 12: Обновление существующих вакансий вместо дублирования**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [ ]* 4.2 Написать property-тест для сохранения полей
  - **Property 2: Сохранение всех полей вакансии**
  - **Validates: Requirements 1.4, 2.4**

- [x] 5. Создать Inngest функцию для импорта новых вакансий
  - Создать файл `packages/jobs/src/inngest/functions/vacancy/import-new.ts`
  - Реализовать `importNewVacanciesFunction`
  - Настроить concurrency: 1 для предотвращения конфликтов
  - Публиковать события прогресса в канал
  - Вызывать существующий `runHHParser` с параметрами
  - Обрабатывать ошибки и публиковать результат
  - Подсчитывать новые и обновлённые вакансии
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.3, 5.1, 5.2, 5.4, 5.5_

- [ ]* 5.1 Написать property-тест для публикации прогресса
  - **Property 6: Публикация прогресса при изменении состояния**
  - **Validates: Requirements 4.3**

- [ ]* 5.2 Написать property-тест для подсчёта результатов
  - **Property 3: Корректный подсчёт результатов импорта**
  - **Validates: Requirements 1.5, 2.5, 5.5, 8.5**

- [x] 6. Создать Inngest функцию для импорта архивных вакансий
  - Создать файл `packages/jobs/src/inngest/functions/vacancy/import-archived.ts`
  - Реализовать `importArchivedVacanciesFunction`
  - Настроить concurrency: 1
  - Публиковать события прогресса в канал
  - Вызывать `runHHParser` с параметром `includeArchived: true`
  - Обрабатывать ошибки и публиковать результат
  - Подсчитывать новые и обновлённые архивные вакансии
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.3, 5.1, 5.2, 5.4, 5.5_

- [ ]* 6.1 Написать property-тест для сохранения архивных вакансий
  - **Property 1: Сохранение всех импортированных вакансий**
  - **Validates: Requirements 1.3, 2.3, 3.4, 7.2**

- [x] 7. Создать Inngest функцию для импорта по ссылке
  - Создать файл `packages/jobs/src/inngest/functions/vacancy/import-by-url.ts`
  - Реализовать `importVacancyByUrlFunction`
  - Настроить concurrency: 5 для параллельной обработки
  - Валидировать URL с помощью `ImportByUrlSchema`
  - Извлекать externalId из URL
  - Вызывать `importSingleVacancy`
  - Публиковать прогресс на каждом этапе
  - Обрабатывать ошибки валидации и сети
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 5.1, 5.2_

- [ ]* 7.1 Написать property-тест для обработки ошибок
  - **Property 8: Продолжение импорта при ошибках отдельных вакансий**
  - **Validates: Requirements 5.3, 5.4**

- [ ]* 7.2 Написать unit-тесты для обработки ошибок
  - Тест ошибки недоступности HH.ru
  - Тест ошибки невалидных учётных данных
  - Тест ошибки невалидного URL
  - _Requirements: 5.1, 5.2, 3.5_

- [x] 8. Зарегистрировать Inngest функции
  - Добавить импорты в `packages/jobs/src/inngest/functions/index.ts`
  - Экспортировать `importNewVacanciesFunction`
  - Экспортировать `importArchivedVacanciesFunction`
  - Экспортировать `importVacancyByUrlFunction`
  - _Requirements: 1.1, 2.1, 3.2_

- [x] 9. Создать UI компонент для раздела импорта
  - Создать файл `apps/app/src/components/vacancy/import-section.tsx`
  - Реализовать три кнопки: "Загрузить активные вакансии", "Загрузить архивные вакансии", "Добавить вакансию по ссылке"
  - Использовать понятные названия без технических терминов
  - Добавить модальное окно для ввода ссылки
  - Интегрировать компонент прогресса для каждой операции
  - Отображать результаты импорта понятным языком
  - _Requirements: 9.1, 9.2, 9.4, 9.5_

- [ ]* 9.1 Написать unit-тесты для UI компонента
  - Тест отображения трёх кнопок
  - Тест открытия модального окна
  - Тест валидации ввода URL
  - _Requirements: 9.1, 9.2_

- [x] 10. Создать UI компонент для отображения прогресса
  - Создать файл `apps/app/src/components/vacancy/import-progress.tsx`
  - Реализовать подключение к Inngest Realtime каналу
  - Отображать прогресс-бар с процентом выполнения
  - Показывать текущее действие понятным языком
  - Обрабатывать события progress и result
  - Отображать финальный результат с количеством вакансий
  - Обрабатывать ошибки и показывать понятные сообщения
  - _Requirements: 4.2, 4.4, 4.5, 9.3, 9.4, 9.5_

- [ ]* 10.1 Написать property-тест для обновления UI
  - **Property 7: Обновление UI при получении событий прогресса**
  - **Validates: Requirements 4.4**

- [ ]* 10.2 Написать unit-тесты для компонента прогресса
  - Тест подключения к Realtime каналу
  - Тест обновления прогресс-бара
  - Тест отображения финального результата
  - _Requirements: 4.2, 4.4, 4.5_

- [ ] 11. Добавить property-тест для изоляции по workspace
  - **Property 11: Изоляция вакансий по рабочим пространствам**
  - Генерировать случайные вакансии с разными workspaceId
  - Проверять, что запросы возвращают только вакансии своего workspace
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.5**

- [ ] 12. Добавить property-тест для round-trip токенов
  - **Property 13: Round-trip для токенов подписки**
  - Получать токен подписки для канала
  - Подключаться к каналу с токеном
  - Проверять успешность подключения
  - **Validates: Requirements 4.2**

- [x] 13. Checkpoint - Проверка работоспособности
  - Убедиться, что все тесты проходят
  - Проверить работу импорта в dev окружении
  - Проверить отображение прогресса в UI
  - Спросить пользователя, если возникли вопросы

## Примечания

- Задачи, отмеченные `*`, являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Property-тесты должны запускаться минимум 100 итераций
- Все сообщения для пользователей должны быть на русском языке без технических терминов
- Используется Zod v4 для всех схем валидации
- Не создаются миграции базы данных (используется существующая схема)
