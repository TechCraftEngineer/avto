# Анализ метрик откликов

## Проверка выполнена: 2026-02-05

## 📊 Обзор системы метрик

Система подсчета и отображения метрик откликов состоит из нескольких уровней:

1. **База данных** - хранение счетчиков в таблице `vacancies`
2. **Парсинг** - обновление счетчиков при получении откликов
3. **API** - получение и отображение метрик через tRPC
4. **UI** - отображение метрик в интерфейсе

---

## ✅ Что работает правильно

### 1. Схема базы данных (packages/db/src/schema/vacancy/vacancy.ts)

**Поля счетчиков в таблице `vacancies`:**
```typescript
views: integer("views").default(0),
responses: integer("responses").default(0),
newResponses: integer("new_responses").default(0),
resumesInProgress: integer("resumes_in_progress").default(0),
suitableResumes: integer("suitable_resumes").default(0),
```

✅ **Корректно:** Все поля имеют правильные типы и значения по умолчанию.

---

### 2. Скрипты обновления счетчиков

**Файл:** `packages/db/src/scripts/update-vacancy-counters.ts`

**Логика подсчета:**
```typescript
const counters = await db
  .select({
    total: count(),
    new: sql<number>`COUNT(*) FILTER (WHERE ${response.status} = 'NEW')`,
    inProgress: sql<number>`COUNT(*) FILTER (WHERE ${response.hrSelectionStatus} = 'IN_PROGRESS')`,
    suitable: sql<number>`COUNT(*) FILTER (WHERE ${responseScreening.recommendation} = 'HIGHLY_RECOMMENDED' OR ${responseScreening.recommendation} = 'RECOMMENDED')`,
  })
  .from(response)
  .leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
  .where(
    and(
      eq(response.entityType, "vacancy"),
      eq(response.entityId, vac.id),
    ),
  );
```

✅ **Корректно:** 
- Подсчет всех откликов через `count()`
- Фильтрация новых откликов по статусу `NEW`
- Фильтрация откликов в работе по `hrSelectionStatus = 'IN_PROGRESS'`
- Фильтрация подходящих по рекомендациям скрининга

---

### 3. Парсинг откликов

**Файл:** `packages/jobs-parsers/src/parsers/hh/parsers/response/response-parser.ts`

**Возвращаемые данные:**
```typescript
return {
  responses: allResponses,
  newCount,
  totalResponses: allResponses.length,
};
```

✅ **Корректно:** Парсер возвращает:
- `newCount` - количество новых откликов
- `totalResponses` - общее количество откликов

---

### 4. API роуты

**Файл:** `packages/api/src/routers/vacancy/crud/list.ts`

**Проблема найдена:**
```typescript
const vacancies = await ctx.db
  .select({
    // ... другие поля
    responses: vacancy.responses,
    newResponses: vacancy.newResponses,
    resumesInProgress: vacancy.resumesInProgress,
    suitableResumes: vacancy.suitableResumes,
    realResponsesCount: count(responseTable.id), // ⚠️ Дублирование!
  })
  .from(vacancy)
  .leftJoin(
    responseTable,
    and(
      eq(vacancy.id, responseTable.entityId),
      eq(responseTable.entityType, "vacancy"),
    ),
  )
  .where(eq(vacancy.workspaceId, input.workspaceId))
  .groupBy(vacancy.id)
  .orderBy(desc(vacancy.createdAt));
```

❌ **Проблема:** Запрос возвращает два поля для подсчета откликов:
- `responses` - из таблицы вакансий (денормализованное значение)
- `realResponsesCount` - реальный подсчет через JOIN

---

### 5. UI компоненты

**Файл:** `apps/app/src/components/vacancies/components/vacancy-table-row/vacancy-table-row.tsx`

**Отображение метрик:**
```typescript
interface Vacancy {
  totalResponsesCount: number | null; // ⚠️ Неправильное имя поля!
  newResponses: number | null;
  resumesInProgress: number | null;
}

// Использование:
{vacancy.totalResponsesCount ?? 0}
```

❌ **Проблема:** Компонент ожидает поле `totalResponsesCount`, но API возвращает `responses`.

---

## 🐛 Найденные проблемы

### Проблема 1: Несоответствие имен полей

**Где:** API → UI

**Суть:**
- API возвращает поле `responses` (из схемы БД)
- UI ожидает поле `totalResponsesCount`
- Это приводит к тому, что метрики не отображаются

**Затронутые файлы:**
1. `packages/api/src/routers/vacancy/crud/list.ts` - возвращает `responses`
2. `apps/app/src/components/vacancies/components/vacancy-table-row/vacancy-table-row.tsx` - ожидает `totalResponsesCount`
3. `apps/app/src/hooks/use-vacancy-stats.ts` - использует `totalResponsesCount`
4. `apps/app/src/hooks/use-vacancies-stats.ts` - использует `totalResponsesCount`

---

### Проблема 2: Дублирование подсчета откликов

**Где:** `packages/api/src/routers/vacancy/crud/list.ts`

**Суть:**
Запрос возвращает два поля для одной и той же метрики:
- `responses` - денормализованное значение из таблицы
- `realResponsesCount` - реальный подсчет через JOIN

**Проблемы:**
1. Неэффективность - двойной подсчет
2. Потенциальное расхождение данных
3. Непонятно, какое значение использовать

---

### Проблема 3: Отсутствие автоматического обновления счетчиков

**Где:** Система в целом

**Суть:**
Счетчики в таблице `vacancies` обновляются только:
1. Вручную через скрипты
2. При парсинге откликов (но не всегда)

**Риски:**
- Счетчики могут устареть
- Расхождение между реальными данными и отображаемыми
- Необходимость периодического запуска скриптов

---

## 🔧 Рекомендации по исправлению

### Исправление 1: Унификация имен полей

**Вариант A: Переименовать в API (рекомендуется)**

Изменить `packages/api/src/routers/vacancy/crud/list.ts`:

```typescript
const vacancies = await ctx.db
  .select({
    id: vacancy.id,
    workspaceId: vacancy.workspaceId,
    title: vacancy.title,
    url: vacancy.url,
    views: vacancy.views,
    totalResponsesCount: vacancy.responses, // ✅ Переименовать
    newResponses: vacancy.newResponses,
    resumesInProgress: vacancy.resumesInProgress,
    suitableResumes: vacancy.suitableResumes,
    // ... остальные поля
  })
  .from(vacancy)
  .where(eq(vacancy.workspaceId, input.workspaceId))
  .orderBy(desc(vacancy.createdAt));
```

**Преимущества:**
- Минимальные изменения
- Не нужно менять UI
- Соответствует ожиданиям фронтенда

---

### Исправление 2: Убрать дублирование подсчета

**Удалить лишний JOIN:**

```typescript
// ❌ Убрать это:
.leftJoin(
  responseTable,
  and(
    eq(vacancy.id, responseTable.entityId),
    eq(responseTable.entityType, "vacancy"),
  ),
)
.groupBy(vacancy.id)

// ❌ И это:
realResponsesCount: count(responseTable.id),
```

**Обоснование:**
- Денормализованные счетчики уже есть в таблице
- JOIN добавляет нагрузку на БД
- Если нужен реальный подсчет, лучше использовать отдельный запрос

---

### Исправление 3: Автоматическое обновление счетчиков

**Вариант A: Триггеры PostgreSQL (рекомендуется)**

Создать триггеры для автоматического обновления счетчиков при изменении откликов:

```sql
CREATE OR REPLACE FUNCTION update_vacancy_counters()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vacancies
  SET 
    responses = (
      SELECT COUNT(*) 
      FROM responses 
      WHERE entity_type = 'vacancy' 
        AND entity_id = NEW.entity_id
    ),
    new_responses = (
      SELECT COUNT(*) 
      FROM responses 
      WHERE entity_type = 'vacancy' 
        AND entity_id = NEW.entity_id 
        AND status = 'NEW'
    ),
    resumes_in_progress = (
      SELECT COUNT(*) 
      FROM responses 
      WHERE entity_type = 'vacancy' 
        AND entity_id = NEW.entity_id 
        AND hr_selection_status = 'IN_PROGRESS'
    ),
    updated_at = NOW()
  WHERE id = NEW.entity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vacancy_counters_trigger
AFTER INSERT OR UPDATE OR DELETE ON responses
FOR EACH ROW
EXECUTE FUNCTION update_vacancy_counters();
```

**Вариант B: Обновление в коде**

Добавить обновление счетчиков в функцию сохранения откликов:

```typescript
// В packages/jobs/services/response.ts
export async function saveBasicResponse(...) {
  // ... сохранение отклика
  
  // Обновить счетчики вакансии
  await updateVacancyCounters(vacancyId);
  
  return result;
}
```

---

## 📝 План исправления (приоритеты)

### Высокий приоритет (критично)

1. ✅ **Исправить несоответствие имен полей**
   - Файл: `packages/api/src/routers/vacancy/crud/list.ts`
   - Действие: Переименовать `responses` → `totalResponsesCount`
   - Время: 5 минут

2. ✅ **Убрать дублирование подсчета**
   - Файл: `packages/api/src/routers/vacancy/crud/list.ts`
   - Действие: Удалить JOIN и `realResponsesCount`
   - Время: 5 минут

### Средний приоритет (важно)

3. **Добавить автоматическое обновление счетчиков**
   - Вариант: Триггеры PostgreSQL или обновление в коде
   - Время: 30-60 минут

### Низкий приоритет (улучшение)

4. **Добавить валидацию консистентности**
   - Создать скрипт для проверки расхождений
   - Запускать периодически через cron

---

## 🧪 Тестирование после исправлений

### Тест 1: Проверка отображения метрик

```bash
# 1. Открыть страницу списка вакансий
# 2. Проверить, что отображаются:
#    - Общее количество откликов
#    - Новые отклики (зеленый бейдж)
#    - Отклики в работе
```

### Тест 2: Проверка обновления метрик

```bash
# 1. Запустить парсинг откликов
bun run refresh-responses <vacancy-id>

# 2. Проверить, что счетчики обновились
bun run check-vacancy <vacancy-id>

# 3. Обновить страницу и проверить UI
```

### Тест 3: Проверка realtime обновлений

```bash
# 1. Открыть страницу вакансии
# 2. В другой вкладке запустить парсинг
# 3. Проверить, что метрики обновились автоматически
```

---

## 📊 Итоговая оценка

| Компонент | Статус | Проблемы |
|-----------|--------|----------|
| Схема БД | ✅ Корректно | Нет |
| Скрипты обновления | ✅ Корректно | Нет |
| Парсинг откликов | ✅ Корректно | Нет |
| API роуты | ⚠️ Требует исправления | Несоответствие имен, дублирование |
| UI компоненты | ⚠️ Требует исправления | Ожидает неправильное имя поля |
| Автообновление | ❌ Отсутствует | Счетчики не обновляются автоматически |

---

## 🎯 Выводы

1. **Основная проблема:** Несоответствие имен полей между API и UI
2. **Вторичная проблема:** Дублирование подсчета откликов в запросе
3. **Системная проблема:** Отсутствие автоматического обновления счетчиков

**Рекомендация:** Исправить проблемы 1 и 2 немедленно (10 минут работы), проблему 3 - в следующей итерации.
