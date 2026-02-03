# Исправление ошибки валидации entityId в чате

## Проблема

При вызове `chat.getHistory` с `entityType: "project"` и `entityId: workspace.id` возникала ошибка валидации UUID, так как:
- `workspace.id` имеет формат `ws_...` (кастомный ID), а не UUID
- Валидация требовала UUID для всех типов сущностей

## Решение

### 1. Изменена схема БД

**Файлы:**
- `packages/db/src/schema/chat/chat-session.ts`
- `packages/db/src/schema/interview/interview-link.ts`

**Изменения:**
```typescript
// Было:
entityId: uuid("entity_id").notNull()

// Стало:
entityId: text("entity_id").notNull()
```

### 2. Обновлена валидация в tRPC процедурах

**Файлы:**
- `packages/api/src/routers/chat/get-history.ts`
- `packages/api/src/routers/chat/send-message.ts`
- `packages/api/src/routers/chat/clear-history.ts`
- `packages/api/src/routers/chat/list-sessions.ts`
- `packages/api/src/routers/chat/create-session.ts`

**Логика валидации:**
- Для типов `gig` и `vacancy` требуется UUID (так как они используют UUID в БД)
- Для типов `project` и `team` принимается любая строка (для поддержки кастомных ID)

**Пример:**
```typescript
.refine(
  (v) => {
    // Для gig и vacancy требуется UUID
    if (v.entityId && v.entityType && ["gig", "vacancy"].includes(v.entityType)) {
      return z.string().uuid().safeParse(v.entityId).success;
    }
    return true;
  },
  {
    message: "entityId должен быть UUID для типов gig и vacancy",
    path: ["entityId"],
  },
)
```

### 3. Обновлены схемы валидации

**Файл:** `packages/db/src/schema/interview/interview-link.ts`

```typescript
// Было:
entityId: z.string().uuid()

// Стало:
entityId: z.string() // Может быть UUID или кастомный ID
```

## SQL для обновления БД

```sql
-- Изменение типа колонки entity_id в таблице chat_sessions
ALTER TABLE chat_sessions 
  ALTER COLUMN entity_id TYPE text;

-- Изменение типа колонки entity_id в таблице interview_links
ALTER TABLE interview_links 
  ALTER COLUMN entity_id TYPE text;
```

## Типы сущностей и их ID

| Тип сущности | Формат ID | Пример |
|--------------|-----------|--------|
| `gig` | UUID | `550e8400-e29b-41d4-a716-446655440000` |
| `vacancy` | UUID | `550e8400-e29b-41d4-a716-446655440001` |
| `project` | Кастомный (workspace.id) | `ws_abc123def456` |
| `team` | Кастомный | `team_xyz789` |

## Проверка

После применения изменений чат должен работать корректно для всех типов сущностей:

```typescript
// Работает для workspace (project)
<UniversalChatPanel
  entityType="project"
  entityId={workspace.id} // ws_...
  isOpen={isOpen}
  onClose={onClose}
/>

// Работает для vacancy (UUID)
<UniversalChatPanel
  entityType="vacancy"
  entityId={vacancyId} // UUID
  isOpen={isOpen}
  onClose={onClose}
/>
```
