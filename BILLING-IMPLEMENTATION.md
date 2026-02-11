# Реализация биллинга на уровне организации

## Что сделано

### 1. Схема БД
- ✅ Добавлен `organizationPlanEnum` (free, pro, enterprise)
- ✅ Добавлено поле `plan` в таблицу `organizations`
- ✅ Добавлено поле `billingEmail` в таблицу `organizations`

**Файлы:**
- `packages/db/src/schema/organization/organization.ts`

### 2. Утилиты
- ✅ `getEffectivePlan()` - получает эффективный план для воркспейса (сейчас возвращает план организации)
- ✅ `hasFeatureAccess()` - проверяет доступ к функциям по плану
- ✅ `getPlanDisplayName()` - возвращает русские названия планов

**Файлы:**
- `packages/db/src/utils/get-effective-plan.ts`
- `packages/jobs-shared/src/utils/plan-names.ts`

### 3. Валидаторы
- ✅ Добавлена схема `organizationPlanSchema`
- ✅ Обновлена `updateOrganizationSchema` с полями `plan` и `billingEmail`

**Файлы:**
- `packages/validators/src/organization.ts`

### 4. API (tRPC)
- ✅ Создана процедура `organization.updatePlan` для обновления плана
- ✅ Проверка прав доступа (только owner может менять план)

**Файлы:**
- `packages/api/src/routers/organization/update-plan.ts`
- `packages/api/src/routers/organization/index.ts`

### 5. UI
- ✅ Обновлён workspace-switcher для показа плана организации
- ✅ Обновлена страница биллинга организации
- ✅ Добавлена возможность переключения между планами
- ✅ Интеграция с tRPC для получения и обновления данных

**Файлы:**
- `apps/app/src/components/layout/components/workspace-switcher/workspace-switcher.tsx`
- `apps/app/src/app/(dashboard)/orgs/[orgSlug]/settings/billing/page.tsx`

## Текущая логика

```typescript
// Воркспейс наследует план организации
getEffectivePlan(workspace, organization) → organization.plan

// Все воркспейсы организации используют один план
// Один биллинг на всю организацию
```

## Что нужно сделать дальше

### 1. Миграция БД (ВАЖНО!)
```sql
-- Добавить enum для планов организации
CREATE TYPE organization_plan AS ENUM ('free', 'pro', 'enterprise');

-- Добавить поля в таблицу organizations
ALTER TABLE organizations 
  ADD COLUMN plan organization_plan NOT NULL DEFAULT 'free',
  ADD COLUMN billing_email TEXT;

-- Опционально: синхронизировать существующие данные
-- UPDATE organizations o
-- SET plan = (
--   SELECT w.plan 
--   FROM workspaces w 
--   WHERE w.organization_id = o.id 
--   LIMIT 1
-- );
```

### 2. Обновить места использования лимитов
Найти все места, где используется `workspace.plan` и заменить на `getEffectivePlan()`:

```typescript
// Было:
const limit = getResponsesLimit(workspace.plan);

// Стало:
const effectivePlan = getEffectivePlan(workspace, organization);
const limit = getResponsesLimit(effectivePlan);
```

**Файлы для обновления:**
- `packages/jobs/src/inngest/functions/vacancy/collect-chat-ids.ts`
- `packages/jobs-parsers/src/parsers/hh/parsers/response/*.ts`

### 3. Обновить queries для получения данных
Везде, где получаем workspace, нужно также получать organization:

```typescript
// Пример:
const workspace = await db.workspace.findUnique({
  where: { id: workspaceId },
  include: {
    organization: {
      select: { plan: true }
    }
  }
});
```

### 4. Интеграция с платёжной системой
- Реализовать создание платежа через ЮКасса
- Обработка webhook от ЮКасса
- Автоматическое обновление плана после успешной оплаты
- История платежей на странице биллинга

### 5. Ограничения по планам
Добавить проверки лимитов в критичных местах:

```typescript
// Пример проверки перед созданием вакансии
const effectivePlan = getEffectivePlan(workspace, organization);
if (!hasFeatureAccess(workspace, organization, "pro")) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Эта функция доступна только на тарифе Профессиональный или выше"
  });
}
```

## Будущее: Переход на гибридную модель

Когда понадобится независимый биллинг для воркспейсов (для кадровых агентств):

### 1. Добавить поля в workspace
```typescript
// workspace.ts
billingType: pgEnum("billing_type", ["inherited", "independent"])
  .default("inherited")
  .notNull(),
billingEmail: text("billing_email"),
```

### 2. Обновить логику getEffectivePlan
```typescript
export function getEffectivePlan(
  workspace: { plan?: WorkspacePlan; billingType?: "inherited" | "independent" },
  organization: { plan: OrganizationPlan }
): WorkspacePlan {
  // Новая логика
  if (workspace.billingType === "independent") {
    return workspace.plan!;
  }
  return organization.plan as WorkspacePlan;
}
```

### 3. UI для управления
- Добавить переключатель "Независимый биллинг" в настройках воркспейса
- Страница биллинга воркспейса (если independent)
- Показывать в workspace-switcher источник плана

## Преимущества текущей реализации

✅ Простота - один биллинг на организацию
✅ Понятность - все воркспейсы на одном плане
✅ Масштабируемость - легко добавить независимый биллинг позже
✅ Обратная совместимость - существующие данные не ломаются
✅ Типобезопасность - все типизировано через TypeScript

## Тестирование

После миграции БД протестировать:
1. Создание новой организации (должна быть на free плане)
2. Переключение между планами на странице биллинга
3. Отображение плана в workspace-switcher
4. Проверка лимитов (например, количество откликов)
5. Права доступа (только owner может менять план)
