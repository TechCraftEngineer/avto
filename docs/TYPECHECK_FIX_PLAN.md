# План исправления ошибок typecheck

## Статус: В процессе

## Проблема
После рефакторинга схемы БД (перенос полей из `response` в `response_screening`) возникли ошибки типов в 27 файлах.

## Перенесенные поля

### Из таблицы `response` удалены:
- `recommendation` → `responseScreening.recommendation`
- `compositeScore` → вычисляется из `responseScreening.overallScore`
- `strengths` → `responseScreening.strengths`
- `weaknesses` → `responseScreening.weaknesses`
- `evaluationReasoning` → удалено (не используется)
- `compositeScoreReasoning` → удалено (не используется)

### В таблице `response_screening` доступны:
- `overallScore` - общая оценка (0-100)
- `recommendation` - рекомендация (HIGHLY_RECOMMENDED, RECOMMENDED, NEUTRAL, NOT_RECOMMENDED)
- `strengths` - сильные стороны
- `weaknesses` - слабые стороны
- `skillsMatchScore` - оценка соответствия навыков
- `experienceScore` - оценка опыта
- `priceScore` - оценка цены
- `deliveryScore` - оценка сроков
- `potentialScore` - оценка потенциала
- `careerTrajectoryScore` - оценка карьерной траектории
- `psychometricScore` - психометрическая оценка
- И соответствующие поля `*Analysis` для каждой оценки

## Выполнено

### packages/db ✅
- [x] `src/scripts/check-vacancy-data.ts` - добавлен JOIN с response_screening
- [x] `src/scripts/update-vacancy-counter-by-id.ts` - добавлен JOIN с response_screening
- [x] `src/scripts/update-vacancy-counters.ts` - добавлен JOIN с response_screening

### packages/api (частично)
- [x] Создан `mappers/screening-mapper.ts` - маппер для преобразования ResponseScreening
- [x] Обновлен `mappers/response-mapper.ts` - использует новый маппер
- [x] Обновлен `utils/priority-score.ts` - работает с ResponseScreening

## Требуется исправить

### packages/api/src/routers/vacancy/responses/

#### Файлы с ошибками `score`/`detailedScore`/`analysis`:
1. `compare.ts` (10 ошибок) - использует старые поля
2. `get.ts` (2 ошибки) - обращается к screening.analysis
3. `list-all-workspace.ts` (14 ошибок) - множественные обращения к старым полям
4. `list-all.ts` (2 ошибки) - screening.analysis
5. `list-recent.ts` (2 ошибки) - screening.analysis
6. `list-top.ts` (3 ошибки) - screening.score, screening.detailedScore
7. `list.ts` (1 ошибка) - несоответствие типов
8. `queries/fetch-related-data.ts` (1 ошибка) - screening.score
9. `queries/fetch-responses.ts` (5 ошибок) - compositeScore, strengths, weaknesses, evaluationReasoning
10. `utils/screening-filters.ts` (2 ошибки) - responseScreening.score
11. `utils/sorting.ts` (3 ошибки) - score, detailedScore, compositeScore

#### Другие роутеры:
12. `routers/candidates/get-by-id.ts` (2 ошибки)
13. `routers/candidates/list.ts` (1 ошибка)
14. `routers/freelance-platforms/analytics/get-analytics.ts` (8 ошибок)
15. `routers/freelance-platforms/import-export/export-analytics.ts` (3 ошибки)
16. `routers/funnel/list.ts` (2 ошибки)
17. `routers/prequalification/submit-application.ts` (1 ошибка)
18. `routers/recruiter-agent/get-interview-questions.ts` (3 ошибки)
19. `routers/recruiter-agent/get-priority.ts` (4 ошибки)
20. `routers/vacancy/analytics/analytics.ts` (3 ошибки)
21. `routers/vacancy/analytics/dashboard-stats.ts` (3 ошибки)
22. `routers/vacancy/analytics/responses-chart.ts` (2 ошибки)

### packages/api/src/services/

23. `services/chat/loaders/gig-loader.ts` (7 ошибок)
24. `services/chat/loaders/vacancy-loader.ts` (7 ошибок)
25. `services/gig-chat/context-loader.ts` (7 ошибок)
26. `services/gig-shortlist-generator.ts` (14 ошибок)
27. `services/shortlist-generator.ts` (2 ошибки)

## Стратегия исправления

### 1. Обновить queries для загрузки данных
Все запросы должны использовать JOIN с `response_screening`:

```typescript
.leftJoin(responseScreening, eq(response.id, responseScreening.responseId))
```

### 2. Использовать маппер screening-mapper
Вместо прямого доступа к полям использовать `mapScreeningToOutput()`:

```typescript
import { mapScreeningToOutput } from "./mappers/screening-mapper";

const screening = mapScreeningToOutput(screeningData);
```

### 3. Обновить фильтры и сортировки
Заменить обращения к старым полям:
- `response.compositeScore` → `responseScreening.overallScore`
- `response.recommendation` → `responseScreening.recommendation`
- `response.strengths` → `responseScreening.strengths`
- `response.weaknesses` → `responseScreening.weaknesses`

### 4. Удалить неиспользуемые поля
- `evaluationReasoning` - удалить все обращения
- `compositeScoreReasoning` - удалить все обращения

## Приоритет исправления

1. **Высокий** - основные роуты списков и получения откликов
   - list.ts, list-all.ts, get.ts
   - queries/fetch-responses.ts
   
2. **Средний** - фильтры, сортировки, аналитика
   - utils/screening-filters.ts, utils/sorting.ts
   - analytics/*.ts
   
3. **Низкий** - вспомогательные сервисы
   - services/chat/loaders/*
   - services/*-generator.ts

## Следующие шаги

1. Исправить queries/fetch-responses.ts - базовый запрос для получения откликов
2. Обновить utils/screening-filters.ts и utils/sorting.ts
3. Исправить основные роуты list*.ts и get.ts
4. Обновить аналитику и сервисы
5. Запустить полный typecheck для проверки

## Примечания

- Все изменения должны быть обратно совместимы на уровне API
- Маппер `screening-mapper.ts` обеспечивает единообразное преобразование данных
- После исправления нужно обновить тесты (если есть)
