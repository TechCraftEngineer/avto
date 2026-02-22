# План реализации: Миграция с tRPC на oRPC

## Обзор

Данный план описывает пошаговую миграцию API проекта с tRPC на oRPC. Миграция выполняется инкрементально, с сохранением работоспособности системы на каждом этапе. Каждая задача строится на предыдущих и заканчивается интеграцией кода.

## Задачи

- [x] 1. Установка зависимостей и начальная настройка
  - Установить пакеты @orpc/server, @orpc/client, @orpc/tanstack-react-query
  - Обновить package.json в packages/api и apps/app
  - Запустить `bun install` для установки зависимостей
  - _Requirements: 1.1, 1.2, 7.1, 7.7_

- [x] 2. Создание серверной конфигурации oRPC
  - [x] 2.1 Создать packages/api/src/orpc.ts с функцией createContext
    - Реализовать createContext с теми же зависимостями что и в tRPC (auth, db, repositories, auditLogger, ipAddress, userAgent, interviewToken, inngest, headers)
    - Экспортировать тип Context
    - _Requirements: 1.1, 1.4_
  
  - [x] 2.2 Инициализировать oRPC с конфигурацией
    - Настроить SuperJSON как transformer
    - Настроить errorFormatter с поддержкой Zod flattenError
    - Экспортировать createRouter, middleware, procedure
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 2.3 Написать property тест для создания контекста
    - **Property 1: Контекст содержит все необходимые зависимости**
    - **Validates: Requirements 1.1**

- [x] 3. Миграция middleware
  - [x] 3.1 Создать timingMiddleware
    - Реализовать логирование времени выполнения процедур
    - Логировать предупреждения для медленных операций (>5000ms)
    - _Requirements: 2.1, 2.2_
  
  - [x] 3.2 Создать securityAudit middleware
    - Реализовать логирование UNAUTHORIZED, FORBIDDEN, TOO_MANY_REQUESTS ошибок
    - Реализовать логирование mutations для аудита
    - Реализовать логирование медленных операций
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  
  - [x] 3.3 Создать securityHeadersMiddleware
    - Добавить заглушку для security headers (headers устанавливаются в route handler)
    - _Requirements: 2.7_
  
  - [x] 3.4 Написать property тесты для middleware
    - **Property 3: Время выполнения логируется**
    - **Property 4: UNAUTHORIZED ошибки логируются**
    - **Property 5: FORBIDDEN ошибки логируются**
    - **Property 6: TOO_MANY_REQUESTS ошибки логируются**
    - **Property 7: Mutations логируются для аудита**
    - **Property 8: Middleware применяются в правильном порядке**
    - **Validates: Requirements 2.1, 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 4. Создание процедур (procedures)
  - [x] 4.1 Создать publicProcedure
    - Применить middleware: timingMiddleware, securityHeadersMiddleware, securityAudit
    - _Requirements: 3.1, 3.5_
  
  - [x] 4.2 Создать protectedProcedure
    - Применить все middleware из publicProcedure
    - Добавить проверку авторизации с выбросом UNAUTHORIZED
    - Обеспечить типобезопасность ctx.session.user
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.3 Написать unit тесты для процедур
    - Тест: protectedProcedure выбрасывает UNAUTHORIZED без сессии
    - Тест: protectedProcedure выполняется успешно с валидной сессией
    - Тест: publicProcedure выполняется без авторизации
    - _Requirements: 3.3, 3.4_
  
  - [x] 4.4 Написать property тесты для процедур
    - **Property 9: protectedProcedure требует авторизации**
    - **Property 10: protectedProcedure гарантирует наличие user**
    - **Property 11: Middleware применяются к обоим типам процедур**
    - **Validates: Requirements 3.3, 3.4, 3.5**

- [x] 5. Контрольная точка - Проверка базовой инфраструктуры
  - Убедиться что все тесты проходят
  - Проверить что типы экспортируются корректно
  - Задать вопросы пользователю если что-то неясно

- [~] 6. Миграция первого роутера (workspace)
  - [~] 6.1 Мигрировать workspace.list процедуру
    - Изменить импорт с ../../trpc на ../../orpc
    - Сохранить логику процедуры без изменений
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 6.2 Мигрировать workspace.get процедуру
    - Изменить импорт с ../../trpc на ../../orpc
    - Заменить TRPCError на ORPCError
    - Сохранить логику процедуры
    - _Requirements: 4.2, 4.5, 5.1, 6.2, 12.2, 12.3_
  
  - [~] 6.3 Мигрировать workspace.create процедуру
    - Изменить импорт с ../../trpc на ../../orpc
    - Заменить TRPCError на ORPCError
    - Сохранить Zod валидацию
    - _Requirements: 4.2, 4.5, 5.1, 5.3, 6.4, 12.2, 12.3_
  
  - [~] 6.4 Обновить workspace/index.ts
    - Изменить импорт TRPCRouterRecord на ORPCRouterRecord
    - Сохранить структуру экспорта с satisfies
    - _Requirements: 4.2, 4.4_
  
  - [~] 6.5 Написать property тесты для workspace роутера
    - **Property 12: Zod валидация работает**
    - **Property 13: Вложенные роутеры поддерживаются**
    - **Property 14: Именованные экспорты роутеров**
    - **Validates: Requirements 4.1, 4.4, 5.1**

- [~] 7. Создание главного роутера
  - [~] 7.1 Создать packages/api/src/root-orpc.ts
    - Импортировать createRouter из ./orpc
    - Создать appRouter с workspace роутером
    - Экспортировать тип AppRouter
    - _Requirements: 4.2, 10.1_
  
  - [~] 7.2 Написать property тесты для типобезопасности
    - **Property 15: Типобезопасность входных параметров**
    - **Property 16: Типобезопасность выходных данных**
    - **Property 17: Автокомплит имен процедур**
    - **Validates: Requirements 10.4, 10.5, 10.6**

- [~] 8. Создание Next.js route handler
  - [~] 8.1 Создать apps/app/src/app/api/orpc/[...orpc]/route.ts
    - Импортировать fetchRequestHandler из @orpc/server/adapters/fetch
    - Настроить endpoint /api/orpc
    - Использовать createContext из @qbs-autonaim/api/orpc
    - Экспортировать handler как GET и POST
    - _Requirements: 11.1, 11.5_
  
  - [~] 8.2 Написать integration тест для route handler
    - Тест: GET запрос возвращает корректный ответ
    - Тест: POST запрос с валидными данными работает
    - Тест: POST запрос с невалидными данными возвращает ошибку
    - _Requirements: 11.1_

- [~] 9. Контрольная точка - Проверка серверной части
  - Убедиться что все серверные тесты проходят
  - Проверить что API endpoint /api/orpc доступен
  - Задать вопросы пользователю если что-то неясно

- [~] 10. Создание клиентской конфигурации
  - [~] 10.1 Создать apps/app/src/orpc/react.tsx
    - Импортировать createORPCClient, httpBatchStreamLink из @orpc/client
    - Импортировать createORPCContext из @orpc/tanstack-react-query
    - Создать useORPC, useORPCClient, ORPCProvider
    - Настроить SuperJSON transformer
    - Настроить URL /api/orpc
    - _Requirements: 7.1, 7.2, 7.7, 7.8, 15.1_
  
  - [~] 10.2 Создать apps/app/src/orpc/server.ts для серверных хелперов
    - Создать функцию для prefetch на сервере
    - Настроить интеграцию с HydrationBoundary
    - _Requirements: 7.5, 11.2, 11.3_
  
  - [~] 10.3 Написать property тесты для клиента
    - **Property 18: Query keys генерируются корректно**
    - **Property 22: Батчинг запросов**
    - **Property 23: SuperJSON сериализация**
    - **Validates: Requirements 7.7, 8.1, 15.1, 15.3**

- [~] 11. Обновление layout.tsx для использования ORPCProvider
  - [~] 11.1 Добавить ORPCReactProvider в apps/app/src/app/layout.tsx
    - Импортировать ORPCReactProvider из ~/orpc/react
    - Обернуть children в ORPCReactProvider параллельно с TRPCReactProvider
    - Сохранить существующий TRPCReactProvider для обратной совместимости
    - _Requirements: 7.1, 12.1_
  
  - [~] 11.2 Написать integration тест для провайдеров
    - Тест: Оба провайдера работают одновременно
    - Тест: oRPC клиент доступен через useORPC
    - _Requirements: 12.1_

- [~] 12. Создание примера использования на клиенте
  - [~] 12.1 Создать тестовый компонент с использованием oRPC
    - Создать apps/app/src/components/test-orpc.tsx
    - Реализовать query с useQuery и orpc.workspace.list.queryOptions()
    - Реализовать mutation с useMutation и orpc.workspace.create.mutationOptions()
    - Добавить обработку ошибок с русскими сообщениями
    - _Requirements: 5.2, 6.7, 7.2, 7.3, 8.2_
  
  - [~] 12.2 Написать property тесты для клиентских операций
    - **Property 19: Инвалидация конкретного запроса**
    - **Property 20: Инвалидация всего роутера**
    - **Validates: Requirements 8.2, 8.3**

- [~] 13. Контрольная точка - Проверка клиентской части
  - Убедиться что все клиентские тесты проходят
  - Проверить что тестовый компонент работает корректно
  - Задать вопросы пользователю если что-то неясно

- [~] 14. Реализация оптимистичных обновлений
  - [~] 14.1 Создать пример оптимистичного обновления
    - Создать apps/app/src/hooks/use-optimistic-workspace.ts
    - Реализовать onMutate с отменой запросов и сохранением предыдущего состояния
    - Реализовать onError с откатом к предыдущему состоянию
    - Реализовать onSettled с синхронизацией через invalidateQueries
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [~] 14.2 Написать property тест для оптимистичных обновлений
    - **Property 21: Оптимистичное обновление с откатом**
    - **Validates: Requirements 9.4**

- [~] 15. Реализация server-side prefetch
  - [~] 15.1 Создать пример серверного компонента с prefetch
    - Создать apps/app/src/app/test-orpc/page.tsx
    - Использовать серверный хелпер для prefetch workspace.list
    - Обернуть клиентский компонент в HydrationBoundary
    - _Requirements: 7.5, 11.2, 11.3_
  
  - [~] 15.2 Написать property тест для prefetch
    - **Property 24: Prefetch на сервере**
    - **Validates: Requirements 7.5, 11.3**

- [~] 16. Миграция остальных роутеров (batch 1: user, organization, vacancy)
  - [~] 16.1 Мигрировать user роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 16.2 Мигрировать organization роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 16.3 Мигрировать vacancy роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 16.4 Обновить root-orpc.ts с новыми роутерами
    - Добавить user, organization, vacancy в appRouter
    - _Requirements: 4.2_
  
  - [~] 16.5 Написать integration тесты для мигрированных роутеров
    - Тест: user роутер работает идентично tRPC версии
    - Тест: organization роутер работает идентично tRPC версии
    - Тест: vacancy роутер работает идентично tRPC версии
    - _Requirements: 12.3, 13.4_

- [~] 17. Контрольная точка - Проверка первого batch миграции
  - Убедиться что все тесты проходят
  - Проверить что мигрированные роутеры работают корректно
  - Задать вопросы пользователю если что-то неясно

- [~] 18. Миграция остальных роутеров (batch 2: candidate, interview, assessment)
  - [~] 18.1 Мигрировать candidate роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 18.2 Мигрировать interview роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 18.3 Мигрировать assessment роутер
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 18.4 Обновить root-orpc.ts с новыми роутерами
    - Добавить candidate, interview, assessment в appRouter
    - _Requirements: 4.2_
  
  - [~] 18.5 Написать integration тесты для мигрированных роутеров
    - _Requirements: 12.3, 13.4_

- [~] 19. Миграция остальных роутеров (batch 3: все оставшиеся)
  - [~] 19.1 Мигрировать оставшиеся роутеры (template, notification, analytics, и т.д.)
    - Изменить все импорты с tRPC на oRPC
    - Заменить TRPCError на ORPCError
    - Обновить index.ts с ORPCRouterRecord для каждого
    - _Requirements: 4.2, 4.5, 12.2, 12.3_
  
  - [~] 19.2 Обновить root-orpc.ts со всеми роутерами
    - Добавить все оставшиеся роутеры в appRouter
    - Убедиться что структура идентична root.ts (tRPC версии)
    - _Requirements: 4.2, 4.3_
  
  - [~] 19.3 Написать сравнительные тесты
    - **Property 25: Идентичность API путей**
    - **Property 26: Идентичность сигнатур процедур**
    - **Property 27: Совместимость тестов**
    - **Validates: Requirements 12.2, 12.3, 13.4**

- [~] 20. Контрольная точка - Проверка полной миграции роутеров
  - Убедиться что все 27 роутеров мигрированы
  - Убедиться что все тесты проходят
  - Проверить что структура root-orpc.ts идентична root.ts
  - Задать вопросы пользователю если что-то неясно

- [~] 21. Обновление клиентского кода для использования oRPC
  - [~] 21.1 Создать скрипт для поиска всех использований useTRPC
    - Найти все файлы с импортом useTRPC
    - Создать список файлов для миграции
    - _Requirements: 7.1_
  
  - [~] 21.2 Мигрировать клиентские компоненты (batch подход)
    - Заменить useTRPC на useORPC
    - Заменить переменную trpc на orpc
    - Обновить обработку ошибок с русскими сообщениями
    - _Requirements: 5.2, 6.7, 7.1, 7.2, 7.3, 7.4_
  
  - [~] 21.3 Написать integration тесты для мигрированных компонентов
    - Тест: Компоненты работают с oRPC клиентом
    - Тест: Обработка ошибок работает корректно
    - _Requirements: 7.2, 7.3_

- [~] 22. Обновление серверных компонентов для использования oRPC prefetch
  - [~] 22.1 Найти все использования tRPC server helpers
    - Найти все файлы с server-side prefetch
    - Создать список файлов для миграции
    - _Requirements: 11.2_
  
  - [~] 22.2 Мигрировать серверные компоненты
    - Заменить tRPC server helpers на oRPC версии
    - Обновить HydrationBoundary для использования oRPC
    - _Requirements: 7.5, 11.2, 11.3_

- [~] 23. Финальное тестирование
  - [~] 23.1 Запустить все unit тесты
    - Выполнить `bun test:unit`
    - Убедиться что все тесты проходят
    - _Requirements: 13.1, 13.2_
  
  - [~] 23.2 Запустить все property тесты
    - Выполнить `bun test:property`
    - Убедиться что все property тесты проходят (минимум 100 итераций каждый)
    - _Requirements: 13.5_
  
  - [~] 23.3 Запустить все integration тесты
    - Выполнить `bun test:integration`
    - Убедиться что все integration тесты проходят
    - _Requirements: 13.2_
  
  - [~] 23.4 Проверить покрытие кода
    - Выполнить `bun test:coverage`
    - Убедиться что покрытие >= 80%
    - _Requirements: 13.1, 13.2_

- [~] 24. Контрольная точка - Финальная проверка
  - Убедиться что все тесты проходят
  - Убедиться что приложение работает корректно
  - Проверить что нет breaking changes
  - Задать вопросы пользователю если что-то неясно

- [~] 25. Удаление tRPC зависимостей (опционально, после подтверждения)
  - [ ] 25.1 Удалить TRPCReactProvider из layout.tsx
    - Оставить только ORPCReactProvider
    - _Requirements: 12.1_
  
  - [ ] 25.2 Удалить tRPC файлы
    - Удалить apps/app/src/trpc/
    - Удалить packages/api/src/trpc.ts
    - Удалить apps/app/src/app/api/trpc/
    - _Requirements: 12.5_
  
  - [ ] 25.3 Удалить tRPC зависимости из package.json
    - Удалить @trpc/server, @trpc/client, @trpc/react-query
    - Выполнить `bun install`
    - _Requirements: 12.5_
  
  - [ ] 25.4 Финальная проверка
    - Запустить все тесты
    - Убедиться что приложение работает без tRPC
    - _Requirements: 12.5_

- [~] 26. Создание примеров использования
  - [~] 26.1 Создать примеры в документации
    - Пример простой query процедуры
    - Пример mutation процедуры
    - Пример процедуры с middleware
    - Пример вложенного роутера
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [~] 26.2 Создать примеры клиентского использования
    - Пример использования с TanStack Query
    - Пример оптимистичного обновления
    - Пример server-side prefetch
    - _Requirements: 14.4, 14.5, 14.6_

- [~] 27. Финальная контрольная точка
  - Убедиться что все задачи выполнены
  - Убедиться что все тесты проходят
  - Убедиться что документация обновлена
  - Получить финальное подтверждение от пользователя

## Примечания

- Задачи, помеченные `*`, являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживаемости
- Контрольные точки обеспечивают инкрементальную валидацию
- Property тесты валидируют универсальные свойства корректности
- Unit тесты валидируют конкретные примеры и граничные случаи
- Миграция выполняется постепенно с сохранением обратной совместимости
- Все пользовательские сообщения об ошибках должны быть на русском языке
