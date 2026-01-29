# Design Document: Vacancy Owner Assignment

## Overview

Система назначения ответственного рекрутера для вакансий расширяет существующую модель вакансий, добавляя возможность назначения и управления ответственным рекрутером (owner). Решение интегрируется с существующей архитектурой tRPC API и использует Drizzle ORM для работы с PostgreSQL.

Основные компоненты:

- Расширение схемы базы данных для хранения связи vacancy-owner
- tRPC процедуры для назначения, изменения и фильтрации по owner
- Zod v4 схемы для валидации входных данных
- Интеграция с существующей системой прав доступа

## Architecture

### Архитектурный подход

Решение следует существующей архитектуре приложения:

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  (UI компоненты для назначения и отображения owner)     │
└────────────────────┬────────────────────────────────────┘
                     │ tRPC Client
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    tRPC API Layer                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  vacancy.assignOwner(vacancyId, recruiterId)     │  │
│  │  vacancy.updateOwner(vacancyId, recruiterId?)    │  │
│  │  vacancy.list(filters: { ownerId?, ... })        │  │
│  │  vacancy.getById(vacancyId) → includes owner     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ Drizzle ORM
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │  vacancies table                                  │  │
│  │    - id (uuid)                                    │  │
│  │    - owner_id (uuid, nullable, FK → users)       │  │
│  │    - workspace_id (uuid, FK → workspaces)        │  │
│  │    - updated_at (timestamp)                      │  │
│  │    - ... (existing fields)                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Ключевые архитектурные решения

1. **Расширение существующей таблицы**: Добавляем поле `owner_id` в таблицу `vacancies` вместо создания отдельной таблицы связей. Это упрощает запросы и соответствует паттерну "один owner на вакансию".

2. **Nullable owner**: Поле `owner_id` может быть null, что позволяет создавать вакансии без назначенного owner и удалять owner при необходимости.

3. **Eager loading owner**: При запросе вакансий автоматически загружаем информацию об owner через JOIN, чтобы избежать N+1 проблемы.

4. **Валидация на уровне API**: Используем Zod v4 для валидации входных данных перед обращением к БД.

5. **Проверка workspace**: Все операции проверяют, что recruiter и vacancy принадлежат одному workspace.

## Components and Interfaces

### Database Schema Extension

Расширение схемы Drizzle для таблицы vacancies:

```typescript
// apps/app/src/server/db/schema/vacancies.ts
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { workspaces } from './workspaces';

export const vacancies = pgTable('vacancies', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id),
  ownerId: uuid('owner_id').references(() => users.id), // NEW FIELD
  // ... existing fields
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### Zod Validation Schemas

```typescript
// apps/app/src/server/api/routers/vacancy/schemas.ts
import { z } from 'zod';

// Схема для назначения owner
export const assignOwnerSchema = z.object({
  vacancyId: z.string().uuid('Invalid vacancy ID'),
  recruiterId: z.string().uuid('Invalid recruiter ID'),
});

// Схема для обновления owner (может быть null)
export const updateOwnerSchema = z.object({
  vacancyId: z.string().uuid('Invalid vacancy ID'),
  recruiterId: z.string().uuid('Invalid recruiter ID').nullable(),
});

// Расширение схемы фильтров для списка вакансий
export const vacancyListFiltersSchema = z.object({
  ownerId: z.string().uuid().optional(),
  ownerIds: z.array(z.string().uuid()).optional(),
  withoutOwner: z.boolean().optional(),
  // ... existing filters
});
```

### tRPC Procedures

```typescript
// apps/app/src/server/api/routers/vacancy/index.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { assignOwnerSchema, updateOwnerSchema, vacancyListFiltersSchema } from './schemas';

export const vacancyRouter = createTRPCRouter({
  // Назначить ответственного рекрутера
  assignOwner: protectedProcedure
    .input(assignOwnerSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Проверить права доступа пользователя
      // 2. Проверить, что vacancy существует и принадлежит workspace пользователя
      // 3. Проверить, что recruiter существует и принадлежит тому же workspace
      // 4. Обновить owner_id в таблице vacancies
      // 5. Вернуть обновленную вакансию с информацией об owner
    }),

  // Обновить ответственного рекрутера (или удалить, если null)
  updateOwner: protectedProcedure
    .input(updateOwnerSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Проверить права доступа пользователя
      // 2. Проверить, что vacancy существует и принадлежит workspace пользователя
      // 3. Если recruiterId не null, проверить, что recruiter существует и принадлежит тому же workspace
      // 4. Обновить owner_id в таблице vacancies
      // 5. Обновить updated_at
      // 6. Вернуть обновленную вакансию
    }),

  // Получить вакансию по ID (включая owner)
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 1. Проверить права доступа к workspace
      // 2. Выполнить запрос с JOIN к таблице users для получения owner
      // 3. Вернуть вакансию с полной информацией об owner
    }),

  // Получить список вакансий с фильтрацией по owner
  list: protectedProcedure
    .input(vacancyListFiltersSchema)
    .query(async ({ ctx, input }) => {
      // 1. Построить запрос с базовыми фильтрами
      // 2. Если указан ownerId, добавить WHERE owner_id = ownerId
      // 3. Если указан ownerIds, добавить WHERE owner_id IN (ownerIds)
      // 4. Если указан withoutOwner, добавить WHERE owner_id IS NULL
      // 5. Выполнить JOIN к таблице users для получения owner
      // 6. Вернуть список вакансий с информацией об owner
    }),
});
```

### Service Layer Functions

```typescript
// apps/app/src/server/api/routers/vacancy/service.ts

interface AssignOwnerParams {
  vacancyId: string;
  recruiterId: string;
  userId: string;
  workspaceId: string;
}

// Проверить, что recruiter принадлежит workspace
async function validateRecruiterInWorkspace(
  db: Database,
  recruiterId: string,
  workspaceId: string
): Promise<boolean> {
  // Запрос к таблице workspace_members
  // Проверить, что recruiter является активным членом workspace
}

// Проверить права доступа пользователя на изменение вакансии
async function checkVacancyEditPermission(
  db: Database,
  userId: string,
  vacancyId: string,
  workspaceId: string
): Promise<boolean> {
  // Проверить роль пользователя в workspace (admin, manager)
  // Или проверить, что пользователь является owner вакансии
}

// Назначить owner для вакансии
async function assignOwnerToVacancy(
  db: Database,
  params: AssignOwnerParams
): Promise<VacancyWithOwner> {
  // 1. Валидация прав доступа
  // 2. Валидация recruiter в workspace
  // 3. UPDATE vacancies SET owner_id = ?, updated_at = NOW()
  // 4. SELECT vacancy с JOIN к users
  // 5. Вернуть результат
}
```

## Data Models

### Database Models

```typescript
// Расширение типа Vacancy
export type Vacancy = {
  id: string;
  workspaceId: string;
  ownerId: string | null; // NEW FIELD
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  // ... existing fields
};

// Тип для вакансии с информацией об owner
export type VacancyWithOwner = Vacancy & {
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
};
```

### API Response Types

```typescript
// Ответ при назначении/обновлении owner
export type AssignOwnerResponse = {
  success: boolean;
  vacancy: VacancyWithOwner;
};

// Ответ при получении списка вакансий
export type VacancyListResponse = {
  vacancies: VacancyWithOwner[];
  total: number;
  page: number;
  pageSize: number;
};
```

### Error Types

```typescript
export type VacancyOwnerError =
  | { code: 'VACANCY_NOT_FOUND'; message: string }
  | { code: 'RECRUITER_NOT_FOUND'; message: string }
  | { code: 'RECRUITER_NOT_IN_WORKSPACE'; message: string }
  | { code: 'PERMISSION_DENIED'; message: string }
  | { code: 'INVALID_INPUT'; message: string; details: z.ZodError };
```

## Correctness Properties

*Свойство (property) - это характеристика или поведение, которое должно выполняться для всех валидных выполнений системы. По сути, это формальное утверждение о том, что система должна делать. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*

### Property 1: Сохранение связи vacancy-owner

*For any* вакансии и валидного рекрутера из того же workspace, после назначения рекрутера как owner, запрос вакансии должен возвращать owner_id равный ID назначенного рекрутера.

**Validates: Requirements 1.1**

### Property 2: Валидация workspace при назначении owner

*For any* вакансии и рекрутера из разных workspace, попытка назначить рекрутера как owner должна возвращать ошибку с кодом 403.

**Validates: Requirements 1.2, 2.2, 5.4**

### Property 3: Валидация активного статуса рекрутера

*For any* вакансии и неактивного рекрутера, попытка назначить рекрутера как owner должна возвращать ошибку.

**Validates: Requirements 1.3**

### Property 4: Полнота информации об owner в ответах

*For any* вакансии с назначенным owner, запрос вакансии (getById или list) должен возвращать полную информацию об owner, включая id, name, email и avatarUrl.

**Validates: Requirements 1.5, 2.5, 3.1, 3.4**

### Property 5: Обновление связи при изменении owner

*For any* вакансии с owner A, после изменения owner на рекрутера B, запрос вакансии должен возвращать owner_id равный ID рекрутера B.

**Validates: Requirements 2.1**

### Property 6: Обновление timestamp при изменении owner

*For any* вакансии, после изменения owner, поле updated_at должно содержать более позднее значение, чем до изменения.

**Validates: Requirements 2.3**

### Property 7: Удаление owner (установка null)

*For any* вакансии с назначенным owner, после установки owner в null, запрос вакансии должен возвращать owner_id равный null.

**Validates: Requirements 2.4**

### Property 8: Соответствие структуры owner модели пользователя

*For any* вакансии с owner, структура данных owner в ответе должна соответствовать схеме: { id: string, name: string, email: string, avatarUrl: string | null }.

**Validates: Requirements 3.3**

### Property 9: Фильтрация по одному owner

*For any* набора вакансий и конкретного owner ID, применение фильтра по этому owner ID должно возвращать только вакансии, у которых owner_id равен указанному ID.

**Validates: Requirements 4.1**

### Property 10: Отсутствие фильтра возвращает все вакансии

*For any* набора вакансий в workspace, запрос списка без фильтра по owner должен возвращать все вакансии workspace.

**Validates: Requirements 4.2**

### Property 11: Фильтрация по нескольким owner

*For any* набора вакансий и массива owner IDs, применение фильтра по этому массиву должно возвращать только вакансии, у которых owner_id присутствует в массиве.

**Validates: Requirements 4.3**

### Property 12: Фильтрация вакансий без owner

*For any* набора вакансий, применение фильтра withoutOwner=true должно возвращать только вакансии с owner_id равным null.

**Validates: Requirements 4.4**

### Property 13: Комбинирование фильтров

*For any* набора вакансий, применение фильтра по owner вместе с другими фильтрами (например, status) должно возвращать вакансии, соответствующие всем указанным фильтрам.

**Validates: Requirements 4.5**

### Property 14: Валидация UUID входных параметров

*For any* невалидной UUID строки, использование её как vacancy ID или recruiter ID должно возвращать ошибку валидации Zod с кодом 400.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 15: Ошибка для несуществующей вакансии

*For any* несуществующего vacancy ID (валидный UUID, но не существует в БД), попытка назначить owner должна возвращать ошибку с кодом 404.

**Validates: Requirements 5.5**

### Property 16: Контроль доступа на основе ролей

*For any* пользователя без роли admin или manager в workspace, попытка назначить или изменить owner вакансии должна возвращать ошибку с кодом 403.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 17: Права на чтение для всех членов workspace

*For any* пользователя (включая рекрутеров) в workspace, запрос информации о вакансиях должен включать информацию об owner без ограничений.

**Validates: Requirements 6.5**

## Error Handling

### Типы ошибок

1. **Validation Errors (400)**
   - Невалидный UUID для vacancy ID или recruiter ID
   - Отсутствие обязательных полей
   - Обработка: Zod валидация на уровне tRPC input, возврат детальной информации об ошибке

2. **Permission Denied (403)**
   - Пользователь не имеет прав на изменение вакансии
   - Recruiter из другого workspace
   - Обработка: Проверка прав доступа перед выполнением операции, возврат понятного сообщения

3. **Not Found (404)**
   - Вакансия не существует
   - Recruiter не существует
   - Обработка: Проверка существования ресурсов перед операцией, возврат информации о том, какой ресурс не найден

4. **Internal Server Error (500)**
   - Ошибки базы данных
   - Неожиданные ошибки
   - Обработка: Логирование ошибки, возврат общего сообщения без раскрытия внутренних деталей

### Стратегия обработки ошибок

```typescript
// Пример обработки в tRPC procedure
assignOwner: protectedProcedure
  .input(assignOwnerSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      // 1. Валидация входных данных (автоматически через Zod)
      
      // 2. Проверка существования вакансии
      const vacancy = await db.query.vacancies.findFirst({
        where: eq(vacancies.id, input.vacancyId),
      });
      
      if (!vacancy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vacancy not found',
        });
      }
      
      // 3. Проверка прав доступа
      const hasPermission = await checkVacancyEditPermission(
        db,
        ctx.user.id,
        input.vacancyId,
        vacancy.workspaceId
      );
      
      if (!hasPermission) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to edit this vacancy',
        });
      }
      
      // 4. Проверка recruiter в workspace
      const isRecruiterValid = await validateRecruiterInWorkspace(
        db,
        input.recruiterId,
        vacancy.workspaceId
      );
      
      if (!isRecruiterValid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Recruiter is not a member of the vacancy workspace',
        });
      }
      
      // 5. Выполнение операции
      const updatedVacancy = await assignOwnerToVacancy(db, {
        vacancyId: input.vacancyId,
        recruiterId: input.recruiterId,
        userId: ctx.user.id,
        workspaceId: vacancy.workspaceId,
      });
      
      return {
        success: true,
        vacancy: updatedVacancy,
      };
      
    } catch (error) {
      // Логирование для внутреннего использования
      console.error('Error assigning owner:', error);
      
      // Если это уже TRPCError, пробрасываем дальше
      if (error instanceof TRPCError) {
        throw error;
      }
      
      // Для неожиданных ошибок возвращаем общее сообщение
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      });
    }
  }),
```

## Testing Strategy

### Dual Testing Approach

Система тестирования использует комбинацию unit-тестов и property-based тестов для обеспечения комплексного покрытия:

- **Unit tests**: Проверяют конкретные примеры, edge cases и условия ошибок
- **Property tests**: Проверяют универсальные свойства на множестве сгенерированных входных данных

Оба типа тестов дополняют друг друга и необходимы для полного покрытия.

### Property-Based Testing Configuration

**Библиотека**: fast-check (для TypeScript/JavaScript)

**Конфигурация**:

- Минимум 100 итераций на каждый property test
- Каждый тест должен ссылаться на свойство из design document
- Формат тега: `Feature: vacancy-owner-assignment, Property {number}: {property_text}`

**Пример property test**:

```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Vacancy Owner Assignment - Property Tests', () => {
  // Feature: vacancy-owner-assignment, Property 1: Сохранение связи vacancy-owner
  it('should persist vacancy-owner relationship for any valid vacancy and recruiter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // vacancyId
        fc.uuid(), // recruiterId
        fc.uuid(), // workspaceId
        async (vacancyId, recruiterId, workspaceId) => {
          // Setup: создать вакансию и рекрутера в том же workspace
          await setupVacancy(vacancyId, workspaceId);
          await setupRecruiter(recruiterId, workspaceId);
          
          // Act: назначить owner
          await assignOwner({ vacancyId, recruiterId });
          
          // Assert: проверить, что owner сохранен
          const vacancy = await getVacancy(vacancyId);
          expect(vacancy.ownerId).toBe(recruiterId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: vacancy-owner-assignment, Property 2: Валидация workspace
  it('should reject owner assignment when recruiter is from different workspace', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(), // vacancyId
        fc.uuid(), // recruiterId
        fc.uuid(), // vacancyWorkspaceId
        fc.uuid(), // recruiterWorkspaceId
        async (vacancyId, recruiterId, vacancyWorkspaceId, recruiterWorkspaceId) => {
          fc.pre(vacancyWorkspaceId !== recruiterWorkspaceId); // Ensure different workspaces
          
          // Setup
          await setupVacancy(vacancyId, vacancyWorkspaceId);
          await setupRecruiter(recruiterId, recruiterWorkspaceId);
          
          // Act & Assert
          await expect(
            assignOwner({ vacancyId, recruiterId })
          ).rejects.toThrow('FORBIDDEN');
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

**Фокус unit-тестов**:

1. Конкретные примеры корректного поведения
2. Edge cases (вакансия без owner, null values)
3. Интеграционные точки между компонентами
4. Специфические сценарии ошибок

**Пример unit test**:

```typescript
describe('Vacancy Owner Assignment - Unit Tests', () => {
  it('should allow creating vacancy without owner', async () => {
    const vacancy = await createVacancy({
      title: 'Software Engineer',
      workspaceId: 'workspace-1',
      // ownerId не указан
    });
    
    expect(vacancy.ownerId).toBeNull();
  });

  it('should return null owner when vacancy has no owner assigned', async () => {
    const vacancy = await getVacancy('vacancy-without-owner');
    
    expect(vacancy.owner).toBeNull();
  });

  it('should update timestamp when owner is changed', async () => {
    const vacancy = await getVacancy('vacancy-1');
    const oldTimestamp = vacancy.updatedAt;
    
    await updateOwner({
      vacancyId: 'vacancy-1',
      recruiterId: 'recruiter-2',
    });
    
    const updatedVacancy = await getVacancy('vacancy-1');
    expect(updatedVacancy.updatedAt.getTime()).toBeGreaterThan(oldTimestamp.getTime());
  });
});
```

### Test Coverage Goals

- **Property tests**: Покрывают все 17 correctness properties
- **Unit tests**: Покрывают edge cases и специфические сценарии
- **Integration tests**: Проверяют взаимодействие с БД и tRPC layer
- **Целевое покрытие кода**: минимум 80% для критических путей

### Testing Tools

- **Test Framework**: Vitest
- **Property-Based Testing**: fast-check
- **Database Testing**: In-memory PostgreSQL или test containers
- **API Testing**: tRPC test client
- **Validation Testing**: Zod schema validation tests
