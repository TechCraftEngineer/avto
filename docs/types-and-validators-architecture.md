# Архитектура типов и Zod-схем

## Текущее состояние

| Пакет | Содержимое | Зависимости |
|-------|------------|-------------|
| **validators** | Zod-схемы + `z.infer` типы | zod, libphonenumber-js, sanitize-html |
| **shared** | TS-интерфейсы + Zod (draft) + утилиты | db, ai, config |
| **db** | Типы схем (ExperienceItem, StoredProfileData) + drizzle | config, drizzle |

**Проблемы:**
- Дублирование: FitDecision, DimensionScore, EvaluationResult в validators и shared с разной структурой
- Циклические зависимости: shared ↔ ai, shared ↔ db
- Нет единого источника правды для доменных типов

---

## Предлагаемая структура

### 1. `@qbs-autonaim/types` (новый пакет)

**Назначение:** Чистые TypeScript-типы для domain-моделей. Источник правды для структуры данных.

**Зависимости:** только `typescript` (или пусто)

**Содержимое:**
- Доменные модели: Vacancy, Response, Candidate, Screening, Workspace, Organization
- Общие типы: VacancyRequirements, VacancyRequirementsStrict, BaseResponseData, ResumeScreeningData
- Profile/Experience: ExperienceItem, EducationItem, WorkExperienceEntry, EducationEntry (унифицированные)
- Enums: FitDecision, ScreeningRecommendation, ProfilePlatform
- Связанные типы: EvaluationResult, DimensionScore (domain-версия для скрининга)

**Структура:**
```
packages/types/
├── package.json      # dependencies: {}
├── tsconfig.json
└── src/
    ├── index.ts      # реэкспорт
    ├── vacancy.ts
    ├── response.ts
    ├── candidate.ts
    ├── evaluation.ts
    ├── workspace.ts
    ├── profile.ts     # ExperienceItem, EducationItem, StoredProfileData
    └── common.ts      # enums, id-типы
```

**Принцип:** Типы только описывают структуру. Без runtime-логики и валидации.

---

### 2. `@qbs-autonaim/validators` (существующий, доработанный)

**Назначение:** Zod-схемы для валидации входных данных (API, формы, AI-ответы).

**Зависимости:** `zod`, `@qbs-autonaim/types` (опционально), libphonenumber-js, sanitize-html

**Содержимое:**
- **Input-схемы** — для API/форм: `createWorkspaceSchema`, `vacancyRequirementsSchema`, `addUserToWorkspaceSchema`
- **Типы из схем:** `z.infer<typeof schema>` — только для input-данных
- **Утилиты:** `formatPhone`, `normalizePhone`, `phoneSchema` (с libphonenumber)
- **Доменные схемы** — когда нужна runtime-валидация: `parsedResumeSchema`, `evaluationResultSchema` (для prequalification)

**Связь с types:**
- Input-типы (`CreateWorkspaceInput`, `VacancyRequirementsInput`) — `z.infer`, не дублируют domain-типы
- Domain-схемы (`vacancyRequirementsSchema`) — результат валидации должен соответствовать `VacancyRequirementsStrict` из types
- Использование: `validators` может импортировать из `types` для `satisfies` или документации совместимости

**Структура (оставляем текущую):**
```
packages/validators/src/
├── index.ts
├── vacancy.ts         # vacancyRequirementsSchema, updateVacancySettingsSchema
├── workspace.ts       # workspaceIdSchema, createWorkspaceSchema
├── organization.ts
├── prequalification.ts # workExperienceSchema, educationSchema, evaluationResultSchema
├── phone.ts           # phoneSchema
├── phone-utils.ts     # formatPhone, normalizePhone
├── payment.ts
├── security.ts
└── ...
```

**Правило:** validators экспортирует **схемы** (runtime) и **input-типы** (z.infer). Domain-типы импортируются из `@qbs-autonaim/types`.

---

### 3. `@qbs-autonaim/shared` (упрощённый)

**Назначение:** Утилиты, константы, хелперы. Без domain-типов.

**После рефакторинга:**
- Удалить `types/` → перенести в `@qbs-autonaim/types`
- Удалить `schemas/draft.ts` → перенести в validators (CreateDraftInputSchema и т.д.)
- Оставить: utils, constants, experience-helpers, server (ranking, interview-link)
- Зависимости: types, validators (при необходимости), db, ai, config

---

### 4. `@qbs-autonaim/db` (обновлённый)

**Зависимости:** `@qbs-autonaim/types`, drizzle, validators (phoneSchema и др.)

**Изменения:**
- Удалить ExperienceItem, EducationItem из db/schema/types.ts
- Импортировать из `@qbs-autonaim/types`
- StoredProfileData: использовать ExperienceItem, EducationItem из types
- VacancyRequirements в vacancy table: `$type<VacancyRequirementsStrict>()` из types

---

## Матрица ответственности

| Категория | types | validators | shared | db |
|-----------|-------|------------|--------|-----|
| VacancyRequirements (domain) | ✓ | — | — | использует |
| vacancyRequirementsSchema (validation) | — | ✓ | — | — |
| CreateWorkspaceInput (form/API) | — | ✓ (z.infer) | — | — |
| ExperienceItem (domain) | ✓ | — | — | использует |
| workExperienceSchema (AI output) | — | ✓ | — | — |
| FitDecision enum | ✓ | schema в validators | — | — |
| formatPhone (util) | — | ✓ | — | — |
| getExperienceFromProfile (util) | — | — | ✓ | — |

---

## Соглашение о naming

### types
- `VacancyRequirementsStrict` — строгий тип для БД
- `VacancyRequirements` — расширенный (опциональные поля)
- `BaseResponseData`, `ResumeScreeningData` — domain-модели

### validators
- `*Schema` — Zod-схема (vacancyRequirementsSchema)
- `*Input` — тип для ввода (z.infer), если это API/form input

### Связь schema ↔ type
Когда схема валидирует domain-данные:
```ts
// types/vacancy.ts
export interface VacancyRequirementsStrict { ... }

// validators/vacancy.ts
import type { VacancyRequirementsStrict } from "@qbs-autonaim/types";
export const vacancyRequirementsSchema = z.object({...}) 
  satisfies z.ZodType<VacancyRequirementsStrict>;
export type VacancyRequirementsInput = z.infer<typeof vacancyRequirementsSchema>;
```
`satisfies` гарантирует, что результат парсинга соответствует domain-типу.

---

## Граф зависимостей (целевой)

```
                    ┌─────────────┐
                    │   types     │  ← нулевые/minimal deps
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ validators  │   │     db      │   │   shared    │
│ zod, phone  │   │   drizzle   │   │  utils, ai  │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       │     ┌───────────┴───────────┐     │
       │     │                       │     │
       └─────┼───────────────────────┼─────┘
             ▼                       ▼
      ┌─────────────┐         ┌─────────────┐
      │     api     │         │    jobs     │
      └─────────────┘         └─────────────┘
```

- **types** — корень, никто от него не зависит на уровне пакетов
- **validators** — зависит от types (для satisfies/совместимости)
- **db** — зависит от types, validators (для phoneSchema и т.п.)
- **shared** — зависит от types, db, ai
- Циклов нет

---

## План миграции

1. ~~**Создать `@qbs-autonaim/types`**~~ ✓ — перенести domain-типы из shared
2. ~~**Обновить validators**~~ ✓ — добавить зависимость types, связать vacancyRequirementsSchema
3. ~~**Обновить db**~~ ✓ — импорт ExperienceItem, EducationItem, VacancyRequirementsStrict из types
4. ~~**Обновить shared**~~ ✓ — удалить types, реэкспортировать из @qbs-autonaim/types для обратной совместимости
5. ~~**Перенести draft schemas**~~ ✓ — из shared/schemas в validators (CreateDraftInputSchema, UpdateDraftInputSchema, DraftSchema, MessageSchema, VacancyDataSchema)
6. **Обновить consumers** — api, jobs, ai, jobs-parsers, app, extension (импорты из shared сохранены)
7. ~~**Унифицировать дубликаты**~~ ✓ — FitDecision в types (validators satisfies, db реэкспорт); DimensionScore/EvaluationResult разведены по JSDoc (screening в types, prequalification в db/validators)

---

## Исключения и граничные случаи

- **Prequalification EvaluationResult** — в validators структура другая (dimensions: hardSkills/softSkills/...). Оставить как PrequalificationEvaluationResult в validators, не смешивать с ScreeningEvaluationResult из types.
- **Drizzle $type<>** — принимает любой тип, достаточно импорта из types
- **tRPC** — input/output типы часто z.infer от validators; для output можно использовать types
- **Клиент (app)** — импортирует из types и validators; validators тянет zod (уже есть в app)
