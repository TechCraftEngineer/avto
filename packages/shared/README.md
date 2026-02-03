# @qbs-autonaim/shared

Общие типы, утилиты и сервисы для проекта.

## Структура

```
src/
├── index.ts              # Клиентские экспорты (безопасно для фронта)
├── server/               # Серверные сервисы (только для бэкенда)
│   ├── index.ts
│   ├── gig-shortlist-generator.ts
│   ├── interview-link-generator.ts
│   └── ranking-service.ts
├── client/               # Клиентские утилиты
├── schemas/              # Zod схемы
├── types/                # TypeScript типы
└── utils/                # Общие утилиты
```

## Использование

### На клиенте (фронтенд)

```typescript
// ✅ Безопасно - только типы и клиентские утилиты
import { 
  parsePlatformLink, 
  formatExperienceText,
  type GigShortlistCandidate 
} from "@qbs-autonaim/shared";
```

### На сервере (бэкенд)

```typescript
// ✅ Серверные сервисы с доступом к БД
import { 
  GigShortlistGenerator,
  InterviewLinkGenerator,
  RankingService 
} from "@qbs-autonaim/shared/server";

// ✅ Типы доступны из основного экспорта
import type { 
  GigShortlist,
  InterviewLink 
} from "@qbs-autonaim/shared";
```

## ⚠️ Важно

- **НЕ импортируйте** `@qbs-autonaim/shared/server` на клиенте - это приведет к ошибкам сборки
- Серверные сервисы содержат зависимости от `@qbs-autonaim/db` и не могут работать в браузере
- Типы безопасны для использования везде

## Экспорты

### Основной экспорт (`@qbs-autonaim/shared`)

- Схемы валидации (Zod)
- TypeScript типы
- Клиентские утилиты
- Типы серверных сервисов (только типы!)

### Серверный экспорт (`@qbs-autonaim/shared/server`)

- `GigShortlistGenerator` - генерация шортлиста кандидатов
- `InterviewLinkGenerator` - управление ссылками на интервью
- `RankingService` - ранжирование кандидатов с AI
