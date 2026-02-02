# Диагностика проблемы с vacancy.responses.list

## Проблема
Query `vacancy.responses.list` возвращает пустой результат, хотя в базе данных есть отклики.

## Добавленные инструменты диагностики

### 1. Логирование в API (packages/api/src/routers/vacancy/responses/list.ts)
Добавлены console.log для отслеживания:
- Входных параметров
- Найденной вакансии
- Базовых условий WHERE
- Результатов запроса

### 2. Логирование в компоненте (apps/app/src/components/vacancy/components/responses/response-table.tsx)
Добавлен useEffect для отслеживания:
- Параметров запроса
- Состояния загрузки
- Полученных данных

### 3. Debug endpoint (vacancy.responses.debugList)
Новый endpoint для детальной диагностики:
- Проверяет общее количество откликов в БД
- Фильтрует отклики для конкретной вакансии
- Сравнивает результаты разных методов запроса

### 4. SQL скрипт (debug-responses.sql)
Прямые SQL запросы для проверки данных в базе.

### 5. TypeScript скрипт (scripts/check-responses.ts)
Скрипт для проверки данных через Drizzle ORM.

## Шаги диагностики

### Шаг 1: Проверьте логи в браузере
1. Откройте приложение
2. Откройте DevTools (F12)
3. Перейдите на вкладку Console
4. Откройте страницу с откликами вакансии
5. Найдите логи с префиксом `[ResponseTable]` и `[vacancy.responses.list]`

Что искать:
- Правильные ли передаются workspaceId и vacancyId?
- Какие фильтры применяются (screeningFilter, statusFilter)?
- Что возвращает запрос (total, responsesCount)?

### Шаг 2: Проверьте данные в базе через SQL
```bash
# Подключитесь к базе данных и выполните:
psql -U your_user -d your_database -f debug-responses.sql
```

Или через Drizzle Studio:
```bash
bun run db:studio
```

### Шаг 3: Используйте debug endpoint
1. Запустите приложение
2. Откройте `test-debug-responses.html` в браузере
3. Введите workspaceId и vacancyId
4. Нажмите "Запустить диагностику"

Или вызовите напрямую через tRPC:
```typescript
const result = await trpc.vacancy.responses.debugList.query({
  workspaceId: "ws_...",
  vacancyId: "uuid-here"
});
console.log(result);
```

### Шаг 4: Запустите TypeScript скрипт
```bash
bun run scripts/check-responses.ts
```

## Возможные причины проблемы

### 1. Неправильный entityType
Проверьте, что в таблице responses:
- `entity_type = 'vacancy'` (не 'gig' или 'project')
- `entity_id` совпадает с ID вакансии

### 2. Фильтры
Проверьте, какие фильтры применяются:
- `screeningFilter` - может фильтровать отклики без скрининга
- `statusFilter` - может исключать определенные статусы
- `search` - может не находить совпадений

### 3. Проблемы с workspace
- Вакансия не принадлежит workspace
- Нет доступа к workspace

### 4. Проблемы с данными
- Отклики есть, но для другой вакансии
- Отклики имеют неправильный entityType

## Что делать дальше

После диагностики:

1. **Если данных нет в БД** - проверьте процесс импорта откликов
2. **Если данные есть, но не возвращаются** - проверьте логи и условия WHERE
3. **Если проблема в фильтрах** - сбросьте фильтры или измените их логику
4. **Если проблема в entityType** - исправьте данные в БД или логику запроса

## Очистка после диагностики

После решения проблемы удалите:
- console.log из list.ts
- useEffect с логированием из response-table.tsx
- debug endpoint (debugList)
- Временные файлы (test-debug-responses.html, debug-responses.sql, etc.)
