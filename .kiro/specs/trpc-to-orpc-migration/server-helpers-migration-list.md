# Список файлов для миграции tRPC server helpers на oRPC

## Обзор

Данный документ содержит полный список файлов, использующих tRPC server helpers (`api()` и `trpc` proxy), которые необходимо мигрировать на oRPC.

## Категории использования

### 1. Файлы с использованием `api()` (createCaller)

Эти файлы используют `const caller = await api()` для прямого вызова процедур на сервере.

#### Основные страницы

1. **apps/app/src/app/(dashboard)/page.tsx**
   - Использует: `caller.user.me()`, `caller.workspace.list()`, `caller.workspace.invites.pending()`
   - Назначение: Главная страница дашборда с редиректами

2. **apps/app/src/app/invitations/page.tsx**
   - Использует: `caller.workspace.invites.pending()`
   - Назначение: Страница приглашений

3. **apps/app/src/app/onboarding/layout.tsx**
   - Использует: `caller.workspace.list()`
   - Назначение: Layout для онбординга

4. **apps/app/src/app/invite/[token]/page.tsx**
   - Использует: `caller.workspace.invites.getByToken({ token })`
   - Назначение: Страница принятия приглашения

#### Dashboard Layout

5. **apps/app/src/app/(dashboard)/layout.tsx**
   - Использует: `caller.workspace.list()`, `caller.organization.list()`
   - Назначение: Главный layout дашборда с сайдбаром

#### Workspace Pages

6. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/layout.tsx**
   - Использует: `caller.organization.getBySlug({ slug })`, `caller.organization.getWorkspaceBySlug({ organizationId, slug })`
   - Назначение: Layout для workspace

7. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/settings/members/page.tsx**
   - Использует: `caller.organization.getBySlug({ slug })`, `caller.workspace.getBySlug({ organizationId, slug })`
   - Назначение: Страница управления участниками

8. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/vacancies/page.tsx**
   - Использует: `caller.organization.getBySlug({ slug })`, `caller.organization.getWorkspaceBySlug({ organizationId, slug })`
   - Назначение: Страница вакансий

9. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/responses/page.tsx**
   - Использует: `caller.organization.getBySlug({ slug })`, `caller.organization.getWorkspaceBySlug({ organizationId, slug })`
   - Назначение: Страница откликов

10. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/page.tsx**
    - Использует: `caller.organization.getBySlug({ slug })`, `caller.organization.getWorkspaceBySlug({ organizationId, slug })`
    - Назначение: Страница гигов

### 2. Файлы с использованием `trpc` proxy для prefetch

Эти файлы используют `trpc.*.queryOptions()` для prefetch данных в QueryClient.

11. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/vacancies/page.tsx**
    - Использует: `trpc.freelancePlatforms.getVacancies.queryOptions({ ... })`
    - Prefetch: Список вакансий с фильтрами

12. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/responses/page.tsx**
    - Использует: 
      - `trpc.vacancy.listActive.queryOptions({ workspaceId, limit: 100 })`
      - `trpc.vacancy.responses.listWorkspace.queryOptions({ workspaceId, ... })`
    - Prefetch: Активные вакансии и список откликов

13. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/page.tsx**
    - Использует: `trpc.gig.list.queryOptions({ workspaceId })`
    - Prefetch: Список гигов

### 3. Файлы с использованием `HydrateClient`

Эти файлы используют `HydrateClient` (обертку над `HydrationBoundary`) для передачи prefetch данных клиенту.

14. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/vacancies/page.tsx**
    - Использует: `<HydrateClient><VacanciesPageClient /></HydrateClient>`

15. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/responses/page.tsx**
    - Использует: `<HydrateClient><ResponsesPageClient /></HydrateClient>`

16. **apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/page.tsx**
    - Использует: `<HydrateClient><GigsPageClient /></HydrateClient>`

## Паттерны миграции

### Паттерн 1: Миграция `api()` на oRPC caller

**До (tRPC):**
```typescript
import { api } from "~/trpc/server";

const caller = await api();
const data = await caller.workspace.list();
```

**После (oRPC):**
```typescript
import { api } from "~/orpc/server";

const caller = await api();
const data = await caller.workspace.list();
```

**Изменения:**
- Изменить импорт с `~/trpc/server` на `~/orpc/server`
- Логика остается идентичной

### Паттерн 2: Миграция `trpc` proxy для prefetch

**До (tRPC):**
```typescript
import { trpc, getQueryClient } from "~/trpc/server";

const queryClient = getQueryClient();
await queryClient.prefetchQuery(
  trpc.workspace.list.queryOptions({ workspaceId })
);
```

**После (oRPC):**
```typescript
import { orpc, getQueryClient } from "~/orpc/server";

const queryClient = getQueryClient();
await queryClient.prefetchQuery(
  orpc.workspace.list.queryOptions({ workspaceId })
);
```

**Изменения:**
- Изменить импорт с `~/trpc/server` на `~/orpc/server`
- Заменить `trpc` на `orpc`

### Паттерн 3: Миграция `HydrateClient`

**До (tRPC):**
```typescript
import { HydrateClient } from "~/trpc/server";

return (
  <HydrateClient>
    <ClientComponent />
  </HydrateClient>
);
```

**После (oRPC):**
```typescript
import { HydrateClient } from "~/orpc/server";

return (
  <HydrateClient>
    <ClientComponent />
  </HydrateClient>
);
```

**Изменения:**
- Изменить импорт с `~/trpc/server` на `~/orpc/server`
- Компонент остается идентичным

## Статистика

- **Всего файлов для миграции:** 16
- **Файлов с `api()`:** 10
- **Файлов с `trpc` proxy:** 3
- **Файлов с `HydrateClient`:** 3
- **Файлов с комбинированным использованием:** 3 (vacancies, responses, gigs pages)

## Порядок миграции

Рекомендуется мигрировать файлы в следующем порядке:

1. **Простые страницы** (только `api()`):
   - invitations/page.tsx
   - onboarding/layout.tsx
   - invite/[token]/page.tsx
   - (dashboard)/page.tsx

2. **Layout файлы**:
   - (dashboard)/layout.tsx
   - orgs/[orgSlug]/workspaces/[slug]/layout.tsx

3. **Страницы с prefetch** (комбинированное использование):
   - settings/members/page.tsx
   - vacancies/page.tsx
   - responses/page.tsx
   - gigs/page.tsx

## Примечания

- Все файлы находятся в директории `apps/app/src/app/`
- Миграция не требует изменения логики, только импортов
- После миграции необходимо убедиться, что все тесты проходят
- Рекомендуется тестировать каждую страницу после миграции
