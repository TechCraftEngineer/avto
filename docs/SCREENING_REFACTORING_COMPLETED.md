# Рефакторинг полей оценки кандидатов - ЗАВЕРШЕНО

## ✅ Что сделано

### 1. Обновлена схема базы данных

**`response_screenings`** - теперь содержит ВСЕ оценки:
- `overall_score` (бывший `composite_score`) - общая оценка 0-100
- `skills_match_score` - соответствие навыков
- `experience_score` - оценка опыта
- `price_score` - оценка цены/зарплаты
- `delivery_score` - оценка сроков
- `potential_score` - потенциал роста
- `career_trajectory_score` - карьерная траектория
- `psychometric_score` - психометрическая совместимость

**Анализы:**
- `overall_analysis` (бывший `composite_score_reasoning`)
- `skills_analysis`, `experience_analysis`, `price_analysis`, `delivery_analysis`
- `potential_analysis`, `career_trajectory_analysis`, `hidden_fit_analysis`

**Рекомендации и ранжирование:**
- `recommendation` - уровень рекомендации
- `ranking_position` - позиция в рейтинге
- `ranking_analysis` - анализ ранжирования
- `candidate_summary` - краткое резюме (1-2 предложения)
- `strengths`, `weaknesses` - массивы строк

**`responses`** - очищена от оценочных полей:
- Удалены все `*_score` поля
- Удалены все `*_reasoning` поля
- Удалены `recommendation`, `ranking_position`, `strengths`, `weaknesses`
- Оставлены только факты о кандидате и бизнес-статусы

### 2. Создан SQL скрипт миграции

Файл: `packages/db/migrations/screening-refactoring.sql`

**Что делает:**
1. Добавляет новые колонки в `response_screenings`
2. Мигрирует данные из `responses` в `response_screenings`
3. Создает VIEW `responses_with_screening` для обратной совместимости
4. Проверяет результаты миграции

### 3. Созданы helper-функции

Файл: `packages/db/src/queries/response-with-screening.ts`

**Утилиты:**
- `addScreeningJoin()` - добавляет JOIN с screening
- `responseWithScreeningSelect` - стандартный SELECT
- `legacyResponseFields` - маппинг для обратной совместимости
- `orderByScore`, `orderByRanking` - SQL фрагменты для сортировки
- `hasScreening` - фильтр по наличию оценки

### 4. Обновлены ключевые сервисы

**Обновлено:**
- `packages/jobs/src/services/recommendation/index.ts` - сохранение в screening
- `packages/db/src/schema/response/response-screening.ts` - новая структура
- `packages/db/src/schema/response/response.ts` - удалены оценочные поля
- `packages/db/src/schema/shared/response-columns.ts` - deprecated колонки

## 📋 Следующие шаги

### Шаг 1: Применить SQL миграцию

```bash
# В production окружении
psql -U your_user -d your_database -f packages/db/migrations/screening-refactoring.sql
```

**Важно:** Миграция безопасна - она НЕ удаляет старые колонки, только добавляет новые и копирует данные.

### Шаг 2: Обновить код, использующий оценки

Найти все места, где используются старые поля:

```bash
# Поиск использования старых полей
grep -r "compositeScore\|composite_score" packages/ apps/
grep -r "rankingPosition\|ranking_position" packages/ apps/
grep -r "candidateSummary\|candidate_summary" packages/ apps/
```

**Паттерн обновления:**

```typescript
// ❌ Старый код
const responses = await db.query.response.findMany({
  where: eq(response.entityId, vacancyId),
  orderBy: desc(response.compositeScore),
});

// ✅ Новый код
import { addScreeningJoin, orderByScore } from "@qbs-autonaim/db/queries/response-with-screening";

const responses = await db
  .select()
  .from(response)
  .leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
  .where(eq(response.entityId, vacancyId))
  .orderBy(orderByScore);
```

### Шаг 3: Обновить Drizzle relations

Добавить relation в `packages/db/src/schema/response/response.ts`:

```typescript
export const responseRelations = relations(response, ({ one, many }) => ({
  // ... существующие relations
  
  screening: one(responseScreening, {
    fields: [response.id],
    references: [responseScreening.responseId],
  }),
}));
```

### Шаг 4: Обновить TypeScript типы

Обновить интерфейсы, которые используют оценки:

```typescript
// ❌ Старый тип
interface ResponseWithScores {
  id: string;
  compositeScore: number | null;
  recommendation: string | null;
}

// ✅ Новый тип
import type { ResponseWithScreening } from "@qbs-autonaim/db/queries/response-with-screening";

interface ResponseWithScores {
  id: string;
  screening: {
    overallScore: number | null;
    recommendation: string | null;
  } | null;
}
```

### Шаг 5: Обновить AI агенты

Файлы для обновления:
- `packages/ai/src/agents/recruiter/ranking/ranking-orchestrator.ts`
- `packages/ai/src/agents/recruiter/ranking/recommendation-agent.ts`
- `packages/shared/src/server/ranking-service.ts`

**Изменения:**
- Сохранять оценки в `response_screenings` вместо `responses`
- Использовать `overallScore` вместо `compositeScore`
- Использовать `screenedAt` вместо `rankedAt`

### Шаг 6: Тестирование

1. **Проверить миграцию данных:**
```sql
-- Проверить, что все оценки скопированы
SELECT COUNT(*) FROM responses WHERE composite_score IS NOT NULL;
SELECT COUNT(*) FROM response_screenings WHERE overall_score IS NOT NULL;
```

2. **Проверить VIEW:**
```sql
-- Проверить, что VIEW работает
SELECT id, composite_score, recommendation 
FROM responses_with_screening 
LIMIT 10;
```

3. **Проверить новый код:**
- Запустить тесты: `bun test`
- Проверить UI: открыть список откликов
- Проверить сортировку по оценкам
- Проверить фильтрацию по рекомендациям

### Шаг 7: Удаление старых колонок (после полного тестирования!)

**⚠️ ВНИМАНИЕ:** Выполнять только после того, как весь код обновлен и протестирован!

```sql
-- Раскомментировать и выполнить секцию "Этап 4" в screening-refactoring.sql
ALTER TABLE responses 
  DROP COLUMN IF EXISTS composite_score,
  DROP COLUMN IF EXISTS price_score,
  DROP COLUMN IF EXISTS delivery_score,
  DROP COLUMN IF EXISTS skills_match_score,
  DROP COLUMN IF EXISTS experience_score,
  -- ... остальные колонки
```

## 🎯 Преимущества после рефакторинга

✅ **Нет дублирования данных** - единый источник истины для оценок
✅ **Четкое разделение ответственности** - responses = факты, screenings = оценки
✅ **Возможность версионирования** - можно хранить историю оценок
✅ **Упрощение логики** - все оценки в одном месте
✅ **Соответствие нормализации** - 3NF

## 📊 Статистика изменений

- **Удалено из responses:** 17 колонок
- **Добавлено в response_screenings:** 13 колонок
- **Создано helper-функций:** 6
- **Обновлено файлов:** 5+

## 🔗 Связанные файлы

- `docs/SCREENING_REFACTORING_PLAN.md` - исходный план
- `packages/db/migrations/screening-refactoring.sql` - SQL миграция
- `packages/db/src/queries/response-with-screening.ts` - helper-функции
- `packages/db/src/schema/response/response-screening.ts` - новая схема
- `packages/db/src/schema/response/response.ts` - обновленная схема

## ❓ FAQ

**Q: Что делать, если миграция упала?**
A: Миграция идемпотентна - можно запустить повторно. Используется `IF NOT EXISTS` и `ON CONFLICT DO NOTHING`.

**Q: Можно ли откатить изменения?**
A: Да, старые колонки не удалены. Просто не используйте новые колонки в screening.

**Q: Как работать с кодом во время миграции?**
A: Используйте VIEW `responses_with_screening` - он предоставляет данные в старом формате.

**Q: Когда удалять старые колонки?**
A: Только после того, как весь код обновлен, протестирован и работает в production минимум неделю.

## 📞 Контакты

При возникновении проблем:
1. Проверьте логи миграции
2. Проверьте VIEW `responses_with_screening`
3. Откатитесь на использование старых колонок через VIEW
