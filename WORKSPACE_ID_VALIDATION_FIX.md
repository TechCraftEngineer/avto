# Исправление ошибки валидации workspaceId

## Проблема

При использовании tRPC процедур с параметром `workspaceId` возникала ошибка валидации:

```
Error [TRPCError]: [
  {"origin": "string","code": "too_small","minimum": 1,"inclusive": true,"path": ["workspaceId"],"message": "Workspace ID обязателен"},
  {"code": "custom","path": ["workspaceId"],"message": "Неверный формат идентификатора рабочей области"}
]
```

## Причина

Схема `workspaceIdSchema` в `packages/validators/src/workspace.ts` требует, чтобы `workspaceId` соответствовал одному из форматов:
- `ws_[32 hex символа]` (например, `ws_1234567890abcdef1234567890abcdef`)
- UUID формат (36 символов с дефисами)

Во многих компонентах использовался паттерн:

```tsx
const { data } = useQuery({
  ...trpc.procedure.queryOptions({
    workspaceId: workspace?.id ?? "", // ❌ Пустая строка не проходит валидацию
  }),
  enabled: !!workspace?.id,
});
```

Даже с `enabled: !!workspace?.id`, пустая строка передавалась в `queryOptions()`, что вызывало ошибку валидации Zod.

## Решение

Использовать `skipToken` из `@tanstack/react-query` вместо передачи пустой строки:

```tsx
import { skipToken, useQuery } from "@tanstack/react-query";

const { data } = useQuery(
  workspace?.id
    ? trpc.procedure.queryOptions({
        workspaceId: workspace.id, // ✅ Типобезопасно, валидация пройдет
      })
    : skipToken, // ✅ Запрос не выполнится, пока нет workspaceId
);
```

## Исправленные файлы

- ✅ `apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/vacancies/page.tsx`

## Файлы, требующие исправления

Следующие файлы используют паттерн `workspace?.id ?? ""` и должны быть исправлены аналогично:

- `apps/app/src/components/vacancy/components/responses/table/response-table.tsx`
- `apps/app/src/components/vacancies/components/import-section/import-section.tsx`
- `apps/app/src/components/shared/components/response-detail-tabs/tabs/notes-tags-tab.tsx`
- `apps/app/src/components/shared/components/response-detail-tabs/tabs/portfolio-tab.tsx`
- `apps/app/src/components/shared/components/response-detail-tabs/tabs/timeline-tab.tsx`
- `apps/app/src/components/shared/components/response-detail-tabs/tabs/comparison-tab.tsx`
- `apps/app/src/components/interviews/components/interview-scenarios-list/interview-scenarios-list.tsx`
- `apps/app/src/components/gig/components/templates/gig-invitation-template.tsx`
- `apps/app/src/components/gigs/components/gig-interview-settings/gig-interview-settings.tsx`
- `apps/app/src/components/interviews/components/interview-scenario-form/interview-scenario-form.tsx`
- `apps/app/src/components/dashboard/components/responses-chart/responses-chart.tsx`
- `apps/app/src/components/dashboard/components/top-responses/top-responses.tsx`
- `apps/app/src/components/dashboard/components/recent-responses/recent-responses.tsx`
- `apps/app/src/components/dashboard/components/recent-chats/recent-chats.tsx`
- `apps/app/src/components/dashboard/components/pending-actions/pending-actions.tsx`
- `apps/app/src/components/dashboard/components/dashboard-stats/dashboard-stats.tsx`
- `apps/app/src/components/dashboard/components/active-vacancies/active-vacancies.tsx`

## Паттерн для исправления

### Было:
```tsx
const { data } = useQuery({
  ...trpc.procedure.queryOptions({
    workspaceId: workspace?.id ?? "",
    // другие параметры
  }),
  enabled: !!workspace?.id,
});
```

### Стало:
```tsx
import { skipToken } from "@tanstack/react-query";

const { data } = useQuery(
  workspace?.id
    ? trpc.procedure.queryOptions({
        workspaceId: workspace.id,
        // другие параметры
      })
    : skipToken,
);
```

## Преимущества skipToken

1. **Типобезопасность**: TypeScript гарантирует, что `workspace.id` существует
2. **Нет ошибок валидации**: Zod схемы не получают невалидные значения
3. **Чистый код**: Не нужен `enabled` флаг
4. **Соответствие best practices**: Рекомендуемый подход TanStack Query v5

## Дополнительная информация

- [TanStack Query - skipToken](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries#skiptoken)
- [tRPC + TanStack Query Standards](/.kiro/steering/trpc.md)
