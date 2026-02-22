# Фаза 3: Стратегия консолидации типов

## Текущая ситуация

### Проблема дублирования типов

В проекте обнаружено дублирование типов на трех уровнях:

```
┌─────────────────────────────────────────────────────────────┐
│                    Уровни типов                              │
├─────────────────────────────────────────────────────────────┤
│ 1. DB Schema (Drizzle)    → packages/db/src/schema/         │
│    export type Vacancy = typeof vacancy.$inferSelect        │
│                                                              │
│ 2. Domain Types            → packages/types/src/             │
│    export type BaseVacancyData = { ... }                    │
│                                                              │
│ 3. tRPC RouterOutputs     → packages/api (inferred)         │
│    RouterOutputs["vacancy"]["get"]                          │
│                                                              │
│ 4. App Type Aliases       → apps/app/src/types/api.ts       │
│    export type VacancyDetail = RouterOutputs[...]           │
│                                                              │
│ 5. Component Local Types  → apps/app/src/components/        │
│    type Vacancy = NonNullable<RouterOutputs[...]>           │
└─────────────────────────────────────────────────────────────┘
```

### Примеры дублирования

#### Vacancy типы (4 определения)

1. **DB Schema**: `packages/db/src/schema/vacancy/vacancy.ts`
   ```typescript
   export type Vacancy = typeof vacancy.$inferSelect;
   ```

2. **Domain Types**: `packages/types/src/vacancy.ts`
   ```typescript
   export type BaseVacancyData = { ... }
   export type ExtendedVacancyData = { ... }
   ```

3. **App Aliases**: `apps/app/src/types/api.ts`
   ```typescript
   export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
   ```

4. **Component Local**: `apps/app/src/components/vacancy/components/editor/vacancy-full-edit-form.tsx`
   ```typescript
   type Vacancy = NonNullable<RouterOutputs["vacancy"]["get"]>;
   ```

#### Response типы (3 определения)

1. **DB Schema**: `packages/db/src/schema/response/response.ts`
   ```typescript
   export type Response = typeof response.$inferSelect;
   ```

2. **App Aliases**: `apps/app/src/types/api.ts`
   ```typescript
   export type VacancyResponseDetail = RouterOutputs["vacancy"]["responses"]["get"];
   export type VacancyResponseListItem = RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];
   ```

3. **Component Local**: `apps/app/src/components/responses/responses-table.tsx`
   ```typescript
   type Response = RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][number];
   ```

## Целевая архитектура типов

### Принципы

1. **Single Source of Truth**: DB Schema → Domain Types → tRPC Outputs → App Aliases
2. **Минимум дублирования**: Локальные типы только для специфичных случаев
3. **Переиспользование**: Централизованные алиасы в `apps/app/src/types/api.ts`
4. **Типобезопасность**: Полная типизация от БД до UI

### Иерархия типов

```typescript
// 1. DB Schema (источник правды для структуры БД)
packages/db/src/schema/vacancy/vacancy.ts
  export type Vacancy = typeof vacancy.$inferSelect;
  export type NewVacancy = typeof vacancy.$inferInsert;

// 2. Domain Types (бизнес-логика, расширения)
packages/types/src/vacancy.ts
  export type BaseVacancyData = Pick<Vacancy, "id" | "title" | ...>;
  export type ExtendedVacancyData = BaseVacancyData & { ... };

// 3. tRPC RouterOutputs (автоматически выводятся)
packages/api/src/routers/vacancy/get.ts
  return vacancy; // Тип выводится автоматически

// 4. App Type Aliases (удобные алиасы для UI)
apps/app/src/types/api.ts
  export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
  export type VacancyListItem = RouterOutputs["vacancy"]["list"]["items"][number];

// 5. Component Types (только специфичные для компонента)
apps/app/src/components/vacancy/types.ts
  // Только если нужны специфичные расширения
  export type VacancyWithLocalState = VacancyDetail & { isExpanded: boolean };
```

## План консолидации

### Этап 1: Аудит существующих типов

**Цель**: Составить полный список всех определений типов

**Действия**:
- [x] Найти все определения `type Vacancy =`
- [x] Найти все определения `type Response =`
- [x] Найти все определения `type Gig =`
- [x] Найти все использования `RouterOutputs[...]`
- [ ] Составить матрицу дублирования

**Результат**: Документ с полным списком дублирующихся типов

### Этап 2: Централизация алиасов в apps/app/src/types/api.ts

**Цель**: Создать единый источник алиасов для UI

**Текущее состояние** `apps/app/src/types/api.ts`:
```typescript
// ✅ Уже есть централизованные алиасы
export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
export type VacancyResponseListItem = RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];
export type GigResponseDetail = NonNullable<RouterOutputs["gig"]["responses"]["get"]>;
// ... и другие
```

**Действия**:
- [ ] Добавить недостающие алиасы для всех часто используемых типов
- [ ] Создать алиасы для вложенных типов (например, `VacancyOwner`, `VacancyCreator`)
- [ ] Документировать назначение каждого алиаса

**Пример расширения**:
```typescript
// Vacancy
export type VacancyDetail = NonNullable<RouterOutputs["vacancy"]["get"]>;
export type VacancyListItem = RouterOutputs["vacancy"]["list"]["items"][number];
export type VacancyOwner = NonNullable<VacancyDetail["owner"]>;
export type VacancyCreator = VacancyDetail["createdByUser"];

// Response
export type ResponseDetail = NonNullable<RouterOutputs["vacancy"]["responses"]["get"]>;
export type ResponseListItem = RouterOutputs["vacancy"]["responses"]["list"]["responses"][number];
export type ResponseCandidate = ResponseDetail["candidate"];

// Gig
export type GigDetail = NonNullable<RouterOutputs["gig"]["get"]>;
export type GigListItem = RouterOutputs["gig"]["list"]["items"][number];
```

### Этап 3: Миграция компонентов на централизованные алиасы

**Цель**: Заменить локальные определения типов на импорты из `types/api.ts`

**Файлы для миграции**:

1. `apps/app/src/components/vacancy/components/editor/vacancy-full-edit-form.tsx`
   ```typescript
   // ❌ Было
   type Vacancy = NonNullable<RouterOutputs["vacancy"]["get"]>;
   
   // ✅ Станет
   import type { VacancyDetail } from "~/types/api";
   ```

2. `apps/app/src/components/vacancy/components/response-detail/types.ts`
   ```typescript
   // ❌ Было
   export type Vacancy = NonNullable<RouterOutputs["vacancy"]["get"]>;
   export type VacancyResponse = NonNullable<RouterOutputs["vacancy"]["responses"]["get"]>;
   
   // ✅ Станет
   import type { VacancyDetail, ResponseDetail } from "~/types/api";
   export type { VacancyDetail as Vacancy, ResponseDetail as VacancyResponse };
   ```

3. `apps/app/src/components/responses/responses-table.tsx`
   ```typescript
   // ❌ Было
   type Response = RouterOutputs["vacancy"]["responses"]["listWorkspace"]["responses"][number];
   
   // ✅ Станет
   import type { VacancyResponseListWorkspaceItem } from "~/types/api";
   ```

**Действия**:
- [ ] Создать скрипт для автоматической миграции импортов
- [ ] Мигрировать все компоненты vacancy
- [ ] Мигрировать все компоненты response
- [ ] Мигрировать все компоненты gig
- [ ] Мигрировать все компоненты global-candidates
- [ ] Проверить типы с помощью `bun run typecheck`

### Этап 4: Очистка локальных типов

**Цель**: Удалить дублирующиеся локальные определения

**Действия**:
- [ ] Удалить локальные `type Vacancy =` из компонентов
- [ ] Удалить локальные `type Response =` из компонентов
- [ ] Оставить только специфичные для компонента типы
- [ ] Обновить экспорты в `types.ts` файлах

**Критерии для сохранения локального типа**:
- Тип специфичен только для этого компонента
- Тип является композицией нескольких типов
- Тип добавляет локальное состояние UI

**Пример допустимого локального типа**:
```typescript
// ✅ Допустимо: специфичное расширение для компонента
import type { VacancyDetail } from "~/types/api";

type VacancyWithUIState = VacancyDetail & {
  isExpanded: boolean;
  isEditing: boolean;
};
```

### Этап 5: Оптимизация packages/types

**Цель**: Убедиться, что domain types не дублируют DB types

**Текущая структура** `packages/types/src/vacancy.ts`:
```typescript
export type BaseVacancyData = {
  id: string;
  title: string;
  // ... поля из DB
};

export type ExtendedVacancyData = BaseVacancyData & {
  // ... дополнительные поля
};
```

**Проблема**: `BaseVacancyData` дублирует `Vacancy` из DB schema

**Решение**: Использовать DB типы как основу
```typescript
import type { Vacancy } from "@qbs-autonaim/db";

// Базовый тип = DB тип
export type BaseVacancyData = Vacancy;

// Расширенный тип добавляет вычисляемые поля
export type ExtendedVacancyData = Vacancy & {
  responsesCount: number;
  activeResponsesCount: number;
  lastResponseAt: Date | null;
};

// Parsed тип для данных из внешних источников
export type ParsedVacancyData = {
  externalId: string;
  source: string;
  title: string;
  // ... поля до сохранения в БД
};
```

**Действия**:
- [ ] Аудит всех типов в `packages/types/src/`
- [ ] Определить, какие типы дублируют DB schema
- [ ] Рефакторинг типов для использования DB типов как основы
- [ ] Оставить только типы для бизнес-логики и парсинга

### Этап 6: Добавление lint правил

**Цель**: Предотвратить будущее дублирование

**Правила**:
1. Запретить локальные определения `type Vacancy =`, `type Response =` и т.д.
2. Требовать импорт из `~/types/api` для tRPC типов
3. Предупреждать о прямом использовании `RouterOutputs[...]` в компонентах

**Реализация** (ESLint custom rule):
```typescript
// .eslintrc.js
rules: {
  "no-local-router-output-types": "error",
  "prefer-type-aliases": "warn",
}
```

**Действия**:
- [ ] Создать ESLint правило для запрета локальных типов
- [ ] Добавить правило в конфигурацию
- [ ] Проверить все файлы на соответствие

## Метрики успеха

### До оптимизации
- Определений `type Vacancy =`: 4
- Определений `type Response =`: 3
- Прямых использований `RouterOutputs[...]` в компонентах: ~30
- Дублирующихся типов в `packages/types`: ~15

### После оптимизации (цель)
- Определений `type Vacancy =`: 1 (только в DB schema)
- Определений `type Response =`: 1 (только в DB schema)
- Прямых использований `RouterOutputs[...]` в компонентах: 0
- Дублирующихся типов в `packages/types`: 0
- Централизованных алиасов в `types/api.ts`: ~50

## Риски и митигация

### Риск 1: Breaking changes в компонентах
**Митигация**: 
- Постепенная миграция по одному домену
- Тщательное тестирование после каждого изменения
- Использование TypeScript для выявления проблем

### Риск 2: Потеря специфичных типов
**Митигация**:
- Сохранение локальных типов для UI-специфичных случаев
- Документирование критериев для локальных типов

### Риск 3: Конфликты имен
**Митигация**:
- Использование описательных имен (VacancyDetail, VacancyListItem)
- Namespace для группировки (Vacancy.Detail, Vacancy.ListItem)

## Следующие шаги

1. ✅ Создать стратегию консолидации (этот документ)
2. [ ] Расширить `apps/app/src/types/api.ts` недостающими алиасами
3. [ ] Создать скрипт миграции импортов
4. [ ] Мигрировать компоненты vacancy
5. [ ] Мигрировать компоненты response
6. [ ] Мигрировать компоненты gig
7. [ ] Оптимизировать `packages/types`
8. [ ] Добавить lint правила
9. [ ] Создать финальный отчет Фазы 3

## Примеры использования после миграции

### Компонент с централизованными типами

```typescript
// ✅ Правильно: использование централизованных алиасов
import type { VacancyDetail, ResponseListItem } from "~/types/api";

interface VacancyCardProps {
  vacancy: VacancyDetail;
  responses: ResponseListItem[];
}

export function VacancyCard({ vacancy, responses }: VacancyCardProps) {
  return (
    <Card>
      <h2>{vacancy.title}</h2>
      <p>Откликов: {responses.length}</p>
    </Card>
  );
}
```

### Компонент со специфичным локальным типом

```typescript
// ✅ Допустимо: локальный тип для UI состояния
import type { VacancyDetail } from "~/types/api";

type VacancyWithUIState = VacancyDetail & {
  isExpanded: boolean;
  isEditing: boolean;
};

export function VacancyEditor() {
  const [vacancy, setVacancy] = useState<VacancyWithUIState | null>(null);
  // ...
}
```

### Хук с типизированным возвратом

```typescript
// ✅ Правильно: использование алиасов в хуках
import type { VacancyDetail, ResponseListItem } from "~/types/api";

export function useVacancyWithResponses(id: string) {
  const api = useTRPC();
  
  const { data: vacancy } = useQuery(
    api.vacancy.get.queryOptions({ id })
  );
  
  const { data: responses } = useQuery(
    api.vacancy.responses.list.queryOptions({ vacancyId: id })
  );
  
  return {
    vacancy: vacancy as VacancyDetail | undefined,
    responses: responses?.responses as ResponseListItem[] | undefined,
  };
}
```
