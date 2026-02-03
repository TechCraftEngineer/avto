# Миграция поля `experience` на `profileData` - Завершено ✅

## Обзор

Успешно выполнена миграция с избыточного текстового поля `experience` на структурированное поле `profileData` в таблице `responses`. Это улучшает структуру данных и устраняет дублирование.

## Ключевые изменения

### 1. Схема базы данных

**Удалено:**
- Поле `experience: text` из `candidateExperienceColumns`
- Валидация `experience` из `CreateResponseSchema`

**Обновлено:**
- Тип `StoredProfileData` теперь поддерживает:
  - `experience?: ExperienceItem[]` - массив опыта работы
  - `education?: EducationItem[]` - образование
  - `languages?: LanguageItem[]` - языки
  - `summary?: string` - краткое резюме

### 2. Вспомогательные функции

**Созданы новые утилиты:**

`packages/db/src/utils/profile-data-helpers.ts`:
- `getExperienceFromProfile()` - извлечение опыта
- `formatExperienceText()` - форматирование в текст
- `hasExperience()` - проверка наличия

`packages/shared/src/utils/experience-helpers.ts`:
- Аналогичные функции для UI компонентов
- `getExperienceSummary()` - краткое описание

### 3. Обновленные сервисы

**Парсинг резюме:**
- ✅ `resume-enrichment.ts` - правильно заполняет `profileData.experience`
- ✅ `response-utils.ts` - использует структурированные данные
- ✅ `refresh-all-resumes.ts` - обновлен для новой структуры

**API и бизнес-логика:**
- ✅ `candidate.service.ts` - вычисляет опыт из `profileData`
- ✅ `screening-prompts.ts` - форматирует опыт для AI
- ✅ `get-interview-questions.ts` - использует `formatExperienceText()`
- ✅ `gig-shortlist-generator.ts` - работает с `profileData`
- ✅ `context-loader.ts` - форматирует опыт для чата
- ✅ `bot-response.ts` - передает форматированный опыт

**Репозитории:**
- ✅ `response-repository.ts` - проверяет `profileData` вместо `experience`
- ✅ `response.ts` (shared) - обновлен `hasDetailedInfo()`

### 4. Типы данных

**SaveResponseData:**
```typescript
// Было:
interface SaveResponseData {
  experience: string;
  // ...
}

// Стало:
interface SaveResponseData {
  profileData?: unknown;
  // ...
}
```

**GigShortlistCandidate:**
```typescript
// Было:
interface GigShortlistCandidate {
  experience?: string;
  // ...
}

// Стало:
interface GigShortlistCandidate {
  profileData?: Record<string, unknown>;
  // ...
}
```

## Преимущества миграции

1. **Устранение дублирования** - данные хранятся в одном месте
2. **Структурированность** - опыт работы в виде массива объектов
3. **Расширяемость** - легко добавлять новые поля (образование, языки)
4. **Типобезопасность** - четкие TypeScript типы
5. **Консистентность** - единый подход к хранению данных профиля

## Обратная совместимость

- Старые записи с `experience` будут работать (поле nullable)
- Новые записи используют только `profileData`
- Вспомогательные функции обрабатывают оба случая

## Следующие шаги

### Обязательно:
1. ✅ Запустить проверку типов: `bun run typecheck`
2. ⚠️ Обновить UI компоненты (см. ниже)
3. ⚠️ Протестировать парсинг резюме
4. ⚠️ Протестировать отображение откликов

### UI компоненты требующие обновления:

```
apps/app/src/components/vacancy/components/responses/response-cards.tsx
apps/app/src/components/vacancy/components/response-detail/hooks/use-vacancy-response-flags.ts
apps/app/src/components/shared/components/response-header-card.tsx
apps/app/src/components/shared/components/response-detail-tabs/tabs/experience-tab.tsx
apps/app/src/components/gig/components/response-detail/portfolio-card.tsx
apps/app/src/components/gig/components/response-detail/hooks/use-gig-response-flags.ts
```

### Рекомендуется:
- Создать миграцию данных для конвертации старых `experience` в `profileData`
- Добавить индексы на `profileData` если нужен поиск по опыту
- Обновить документацию API

## Использование

### Получение опыта из response:

```typescript
import { formatExperienceText, hasExperience } from '@qbs-autonaim/shared';

// Проверка наличия
if (hasExperience(response.profileData)) {
  // Форматирование для отображения
  const experienceText = formatExperienceText(response.profileData);
  
  // Краткое описание
  const summary = getExperienceSummary(response.profileData, 120);
}
```

### Сохранение опыта в response:

```typescript
const profileData = {
  experience: [
    {
      company: "Компания",
      position: "Должность",
      period: "2020-01 - 2023-12",
      description: "Описание"
    }
  ],
  education: [...],
  languages: [...],
  summary: "Краткое резюме",
  parsedAt: new Date().toISOString()
};

await updateResponseDetails({
  // ...
  profileData: profileData,
  skills: ["JavaScript", "TypeScript"]
});
```

## Файлы изменены

### Схема БД (3 файла)
- `packages/db/src/schema/shared/response-columns.ts`
- `packages/db/src/schema/response/response.ts`
- `packages/db/src/schema/types.ts`

### Утилиты (3 файла)
- `packages/db/src/utils/profile-data-helpers.ts` (новый)
- `packages/shared/src/utils/experience-helpers.ts` (новый)
- `packages/db/src/index.ts`
- `packages/shared/src/index.ts`

### Парсинг (3 файла)
- `packages/jobs-parsers/src/parsers/hh/services/resume-enrichment.ts`
- `packages/jobs-parsers/src/parsers/hh/parsers/response/response-utils.ts`
- `packages/jobs-parsers/src/functions/response/refresh-all-resumes.ts`

### Shared сервисы (2 файла)
- `packages/jobs-shared/src/types/response.ts`
- `packages/jobs-shared/src/services/response.ts`

### API сервисы (6 файлов)
- `packages/api/src/services/candidate.service.ts`
- `packages/api/src/routers/recruiter-agent/get-interview-questions.ts`
- `packages/api/src/routers/candidates/get-by-id.ts`
- `packages/api/src/services/gig-chat/context-loader.ts`
- `packages/api/src/services/gig-shortlist-generator.ts`
- `packages/shared/src/gig-shortlist-generator.ts`

### AI и Jobs (3 файла)
- `packages/ai/src/screening-prompts.ts`
- `packages/jobs/src/services/response/response-repository.ts`
- `packages/jobs/src/inngest/functions/telegram/bot-response.ts`

**Всего изменено: 23 файла**
**Создано новых: 2 файла**

---

Миграция backend части завершена успешно! 🎉
