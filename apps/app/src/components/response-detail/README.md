# Response Detail Components

## Архитектура

Компоненты откликов разделены на две независимые группы для **vacancy** и **gig** откликов.

## Старая архитектура (deprecated)

```typescript
// Устаревшие компоненты - не использовать в новом коде
import { ResponseDetailCard, GigResponseTabs, VacancyResponseTabs } from "~/components/response-detail";

// Проблемы:
// - Общий тип ResponseDetail как union
// - Type guards в компонентах
// - Условная логика
// - Смешивание бизнес-логики
```

## Новая архитектура

### Vacancy отклики

```typescript
import { VacancyResponseDetailCard, VacancyResponseTabs } from "~/components/vacancy/response-detail";

// Преимущества:
// - Строгая типизация VacancyResponse
// - Четкая бизнес-логика найма
// - Оптимизированный UI для vacancy процесса
```

### Gig отклики

```typescript
import { GigResponseDetailCard, GigResponseTabs } from "~/components/gig/response-detail";

// Преимущества:
// - Строгая типизация GigResponse
// - Четкая бизнес-логика фриланса
// - Оптимизированный UI для gig процесса
```

## Типы данных

### VacancyResponse
- `entityType: 'vacancy'`
- Специфичные поля: `resumeId`, `resumeUrl`, `salaryExpectationsAmount`
- Screening: `screening` объект
- Процесс: найм на работу

### GigResponse
- `entityType: 'gig'`
- Специфичные поля: `proposedPrice`, `proposedDeliveryDays`, `portfolioLinks`
- Scoring: `compositeScore`, `priceScore`, `deliveryScore`
- Процесс: разовое задание

## Миграция

1. **Новые компоненты**: Использовать новые типизированные компоненты
2. **API**: Обновить роутеры для возврата специфичных типов
3. **Миграция**: Постепенно заменять старые компоненты
4. **Удаление**: После полной миграции удалить старые компоненты

## Файловая структура

```
components/
├── vacancy/
│   └── response-detail/
│       ├── VacancyResponseDetailCard.tsx
│       ├── VacancyResponseTabs.tsx
│       ├── hooks/
│       │   └── use-vacancy-response-flags.ts
│       └── types.ts
└── gig/
    └── response-detail/
        ├── GigResponseDetailCard.tsx
        ├── GigResponseTabs.tsx
        ├── hooks/
        │   └── use-gig-response-flags.ts
        └── types.ts
```