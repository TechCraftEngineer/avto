# План рефакторинга полей оценки кандидатов

## Текущая проблема

Дублирование оценочных полей между `responses` и `response_screenings`:
- Оценки (scores) хранятся в обеих таблицах
- Анализы (reasoning/analysis) дублируются
- Нет четкого разделения ответственности

## Рекомендуемое решение

### Принцип разделения

**`responses`** = Факты о кандидате + Бизнес-статусы
**`response_screenings`** = Вся оценка и анализ

### Этап 1: Анализ использования

```bash
# Найти все места использования оценочных полей
grep -r "composite_score\|price_score\|delivery_score" packages/
grep -r "skills_match_score\|experience_score" packages/
grep -r "ranking_position\|recommendation" packages/
```

### Этап 2: Создание view для обратной совместимости

```sql
-- Временный view для плавной миграции
CREATE VIEW responses_with_screening AS
SELECT 
  r.*,
  s.overall_score as composite_score,
  s.skills_match_score,
  s.experience_score,
  s.price_score,
  s.delivery_score,
  s.recommendation,
  s.ranking_position,
  s.strengths,
  s.weaknesses
FROM responses r
LEFT JOIN response_screenings s ON s.response_id = r.id AND s.is_current = true;
```

### Этап 3: Миграция данных

```sql
-- 1. Перенести данные из responses в response_screenings
INSERT INTO response_screenings (
  response_id,
  overall_score,
  skills_match_score,
  experience_score,
  price_score,
  delivery_score,
  skills_analysis,
  experience_analysis,
  price_analysis,
  delivery_analysis,
  overall_analysis,
  strengths,
  weaknesses,
  recommendation,
  ranking_position,
  ranking_analysis,
  screened_at,
  created_at
)
SELECT 
  id as response_id,
  composite_score as overall_score,
  skills_match_score,
  experience_score,
  price_score,
  delivery_score,
  skills_match_score_reasoning as skills_analysis,
  experience_score_reasoning as experience_analysis,
  price_score_reasoning as price_analysis,
  delivery_score_reasoning as delivery_analysis,
  composite_score_reasoning as overall_analysis,
  strengths,
  weaknesses,
  recommendation,
  ranking_position,
  ranking_analysis,
  ranked_at as screened_at,
  created_at
FROM responses
WHERE composite_score IS NOT NULL
ON CONFLICT (response_id) DO NOTHING;

-- 2. Удалить дублирующие колонки из responses
ALTER TABLE responses 
  DROP COLUMN composite_score,
  DROP COLUMN price_score,
  DROP COLUMN delivery_score,
  DROP COLUMN skills_match_score,
  DROP COLUMN experience_score,
  DROP COLUMN price_score_reasoning,
  DROP COLUMN delivery_score_reasoning,
  DROP COLUMN skills_match_score_reasoning,
  DROP COLUMN experience_score_reasoning,
  DROP COLUMN composite_score_reasoning,
  DROP COLUMN evaluation_reasoning,
  DROP COLUMN ranking_position,
  DROP COLUMN ranking_analysis,
  DROP COLUMN candidate_summary,
  DROP COLUMN strengths,
  DROP COLUMN weaknesses,
  DROP COLUMN recommendation,
  DROP COLUMN ranked_at;
```

### Этап 4: Обновление кода

1. **API слой** - использовать JOIN с `response_screenings`
2. **Типы** - обновить TypeScript интерфейсы
3. **Queries** - заменить прямые обращения на JOIN
4. **Mutations** - сохранять оценки в `response_screenings`

### Этап 5: Оптимизация запросов

```sql
-- Индекс для частых JOIN
CREATE INDEX idx_response_screenings_response_id 
ON response_screenings(response_id) 
WHERE is_current = true;

-- Индекс для сортировки по оценке
CREATE INDEX idx_response_screenings_score 
ON response_screenings(overall_score DESC) 
WHERE is_current = true;
```

## Преимущества после рефакторинга

✅ Нет дублирования данных
✅ Четкое разделение ответственности
✅ Возможность хранить историю оценок
✅ Упрощение логики обновления
✅ Соответствие принципам нормализации

## Риски и митигация

⚠️ **Риск**: Сломать существующий код
✅ **Митигация**: Использовать VIEW для обратной совместимости

⚠️ **Риск**: Снижение производительности из-за JOIN
✅ **Митигация**: Правильные индексы + денормализация `current_score` в responses

⚠️ **Риск**: Потеря данных при миграции
✅ **Митигация**: Тестирование на копии БД + транзакции

## Альтернативный подход (если нужна история)

Если требуется версионирование оценок:

```sql
-- Убрать UNIQUE constraint с response_id
ALTER TABLE response_screenings 
  DROP CONSTRAINT response_screenings_response_id_unique;

-- Добавить версионирование
ALTER TABLE response_screenings 
  ADD COLUMN version INTEGER DEFAULT 1,
  ADD COLUMN is_current BOOLEAN DEFAULT true;

-- Уникальность только для текущей версии
CREATE UNIQUE INDEX idx_current_screening 
ON response_screenings(response_id) 
WHERE is_current = true;
```

## Следующие шаги

1. [ ] Провести аудит использования полей в коде
2. [ ] Создать тестовую миграцию на dev окружении
3. [ ] Обновить TypeScript типы
4. [ ] Обновить API endpoints
5. [ ] Обновить UI компоненты
6. [ ] Тестирование
7. [ ] Деплой в production
