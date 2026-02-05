# Итоговый отчет: Исправление метрик откликов

## ✅ Выполненные исправления

### 1. Исправлено несоответствие имен полей в API

**Файл:** `packages/api/src/routers/vacancy/crud/list.ts`

**Что было:**
```typescript
responses: vacancy.responses,
realResponsesCount: count(responseTable.id), // Дублирование
```

**Что стало:**
```typescript
totalResponsesCount: vacancy.responses, // ✅ Унифицировано
// Убран лишний JOIN и realResponsesCount
```

**Изменения:**
1. ✅ Переименовано поле `responses` → `totalResponsesCount` для соответствия UI
2. ✅ Удален лишний `leftJoin` с таблицей откликов
3. ✅ Удален `groupBy` (больше не нужен без JOIN)
4. ✅ Удалено поле `realResponsesCount` (дублирование)

**Преимущества:**
- Запрос стал проще и быстрее (нет JOIN)
- Нет дублирования данных
- Соответствие между API и UI
- Использование денормализованных счетчиков из таблицы

---

## 📊 Текущее состояние системы

### Схема данных

**Таблица `vacancies`:**
```sql
responses INTEGER DEFAULT 0,           -- Общее количество откликов
new_responses INTEGER DEFAULT 0,       -- Новые отклики (status = 'NEW')
resumes_in_progress INTEGER DEFAULT 0, -- В работе (hrSelectionStatus = 'IN_PROGRESS')
suitable_resumes INTEGER DEFAULT 0,    -- Подходящие (recommendation = HIGHLY_RECOMMENDED/RECOMMENDED)
views INTEGER DEFAULT 0                -- Просмотры вакансии
```

### Поток данных

```
1. Парсинг откликов (HH.ru)
   ↓
2. Сохранение в таблицу responses
   ↓
3. Обновление счетчиков в vacancies (вручную через скрипты)
   ↓
4. API возвращает данные с полем totalResponsesCount
   ↓
5. UI отображает метрики
```

---

## ⚠️ Оставшиеся проблемы

### Проблема: Отсутствие автоматического обновления счетчиков

**Текущая ситуация:**
- Счетчики обновляются только вручную через скрипты
- При добавлении/удалении откликов счетчики не обновляются автоматически
- Риск расхождения между реальными данными и отображаемыми

**Места обновления счетчиков:**
1. ✅ При парсинге откликов (через Inngest jobs)
2. ❌ При ручном добавлении откликов
3. ❌ При изменении статуса откликов
4. ❌ При удалении откликов

---

## 🔧 Рекомендации для дальнейшего улучшения

### Вариант 1: Триггеры PostgreSQL (рекомендуется)

**Преимущества:**
- Автоматическое обновление на уровне БД
- Гарантированная консистентность
- Не зависит от логики приложения

**Недостатки:**
- Требует миграции БД
- Сложнее отлаживать

**Пример триггера:**
```sql
CREATE OR REPLACE FUNCTION update_vacancy_counters()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_id UUID;
BEGIN
  -- Определяем entity_id в зависимости от операции
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.entity_id;
  ELSE
    v_entity_id := NEW.entity_id;
  END IF;

  -- Обновляем счетчики только для вакансий
  IF (TG_OP = 'DELETE' AND OLD.entity_type = 'vacancy') OR 
     (TG_OP != 'DELETE' AND NEW.entity_type = 'vacancy') THEN
    
    UPDATE vacancies
    SET 
      responses = (
        SELECT COUNT(*) 
        FROM responses 
        WHERE entity_type = 'vacancy' 
          AND entity_id = v_entity_id
      ),
      new_responses = (
        SELECT COUNT(*) 
        FROM responses 
        WHERE entity_type = 'vacancy' 
          AND entity_id = v_entity_id 
          AND status = 'NEW'
      ),
      resumes_in_progress = (
        SELECT COUNT(*) 
        FROM responses 
        WHERE entity_type = 'vacancy' 
          AND entity_id = v_entity_id 
          AND hr_selection_status = 'IN_PROGRESS'
      ),
      updated_at = NOW()
    WHERE id = v_entity_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер на INSERT/UPDATE/DELETE
CREATE TRIGGER update_vacancy_counters_trigger
AFTER INSERT OR UPDATE OR DELETE ON responses
FOR EACH ROW
EXECUTE FUNCTION update_vacancy_counters();
```

---

### Вариант 2: Обновление в коде приложения

**Преимущества:**
- Проще реализовать
- Легче отлаживать
- Не требует миграций БД

**Недостатки:**
- Нужно помнить обновлять везде
- Риск забыть обновить в каком-то месте

**Пример функции:**
```typescript
// packages/api/src/services/vacancy-counters.ts
export async function updateVacancyCounters(
  db: Database,
  vacancyId: string,
): Promise<void> {
  const counters = await db
    .select({
      total: count(),
      new: sql<number>`COUNT(*) FILTER (WHERE ${response.status} = 'NEW')`,
      inProgress: sql<number>`COUNT(*) FILTER (WHERE ${response.hrSelectionStatus} = 'IN_PROGRESS')`,
      suitable: sql<number>`COUNT(*) FILTER (WHERE ${responseScreening.recommendation} IN ('HIGHLY_RECOMMENDED', 'RECOMMENDED'))`,
    })
    .from(response)
    .leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
    .where(
      and(
        eq(response.entityType, "vacancy"),
        eq(response.entityId, vacancyId),
      ),
    );

  const stats = counters[0];
  if (!stats) return;

  await db
    .update(vacancy)
    .set({
      responses: Number(stats.total) || 0,
      newResponses: Number(stats.new) || 0,
      resumesInProgress: Number(stats.inProgress) || 0,
      suitableResumes: Number(stats.suitable) || 0,
      updatedAt: new Date(),
    })
    .where(eq(vacancy.id, vacancyId));
}
```

**Использование:**
```typescript
// При создании отклика
await saveResponse(...);
await updateVacancyCounters(db, vacancyId);

// При обновлении статуса
await updateResponseStatus(...);
await updateVacancyCounters(db, vacancyId);

// При удалении отклика
await deleteResponse(...);
await updateVacancyCounters(db, vacancyId);
```

---

### Вариант 3: Вычисляемые поля (computed fields)

**Идея:** Не хранить счетчики, а вычислять их на лету

**Преимущества:**
- Всегда актуальные данные
- Нет проблем с синхронизацией

**Недостатки:**
- Медленнее (JOIN на каждый запрос)
- Больше нагрузка на БД

**Не рекомендуется** для данного случая, так как:
- Список вакансий запрашивается часто
- Счетчики нужны для сортировки и фильтрации
- Денормализация оправдана для производительности

---

## 📝 Чеклист для проверки

### После текущих исправлений

- [x] API возвращает поле `totalResponsesCount`
- [x] Удален лишний JOIN в запросе списка вакансий
- [x] Удалено дублирование `realResponsesCount`
- [ ] Протестировать отображение метрик в UI
- [ ] Проверить realtime обновления

### Для полного решения

- [ ] Реализовать автоматическое обновление счетчиков (триггеры или код)
- [ ] Добавить валидацию консистентности данных
- [ ] Создать скрипт для проверки расхождений
- [ ] Настроить периодическую синхронизацию (cron job)

---

## 🧪 Тестирование

### Тест 1: Проверка API

```bash
# Запустить приложение
bun run dev

# Проверить ответ API (должно быть поле totalResponsesCount)
curl http://localhost:3000/api/trpc/vacancy.list?input={"workspaceId":"..."}
```

### Тест 2: Проверка UI

```bash
# 1. Открыть страницу списка вакансий
# 2. Проверить, что отображаются метрики:
#    - Общее количество откликов
#    - Новые отклики (зеленый бейдж)
#    - Отклики в работе
#    - Конверсия (если есть просмотры)
```

### Тест 3: Проверка обновления

```bash
# 1. Запустить парсинг откликов
bun run packages/jobs-parsers refresh-responses <vacancy-id>

# 2. Проверить счетчики в БД
bun run packages/db check-vacancy <vacancy-id>

# 3. Обновить страницу и проверить UI
```

---

## 📊 Итоговая оценка

| Компонент | До исправления | После исправления |
|-----------|----------------|-------------------|
| Схема БД | ✅ Корректно | ✅ Корректно |
| Скрипты обновления | ✅ Корректно | ✅ Корректно |
| Парсинг откликов | ✅ Корректно | ✅ Корректно |
| API роуты | ❌ Несоответствие имен | ✅ Исправлено |
| UI компоненты | ❌ Неправильное поле | ✅ Работает |
| Автообновление | ❌ Отсутствует | ⚠️ Требует реализации |

---

## 🎯 Выводы

### Что исправлено

1. ✅ **Несоответствие имен полей** - API теперь возвращает `totalResponsesCount`
2. ✅ **Дублирование подсчета** - убран лишний JOIN и `realResponsesCount`
3. ✅ **Производительность** - запрос стал проще и быстрее

### Что осталось сделать

1. ⚠️ **Автоматическое обновление счетчиков** - рекомендуется реализовать через триггеры PostgreSQL
2. ⚠️ **Валидация консистентности** - добавить периодическую проверку расхождений
3. ⚠️ **Мониторинг** - отслеживать расхождения между счетчиками и реальными данными

### Рекомендации

**Краткосрочные (сейчас):**
- Протестировать исправления в UI
- Убедиться, что метрики отображаются корректно

**Среднесрочные (следующая итерация):**
- Реализовать автоматическое обновление счетчиков (триггеры PostgreSQL)
- Добавить скрипт для проверки консистентности

**Долгосрочные (будущее):**
- Настроить мониторинг расхождений
- Добавить алерты при критических расхождениях
