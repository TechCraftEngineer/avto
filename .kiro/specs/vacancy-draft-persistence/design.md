# Документ проектирования: Сохранение черновиков вакансий

## Обзор

Система сохранения черновиков обеспечивает автоматическое сохранение прогресса создания вакансии через AI-бота с использованием tRPC API и Zod v4 для валидации. Архитектура построена на принципах разделения ответственности между клиентом и сервером, с оптимистичными обновлениями на клиенте и надежным хранением на сервере.

## Архитектура

### Общая структура

```
┌─────────────────────────────────────────────────────────┐
│                    Клиент (Next.js)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Компонент создания вакансии              │   │
│  │  ┌────────────────┐  ┌──────────────────────┐   │   │
│  │  │   AI-бот UI    │  │  Индикатор сохранения│   │   │
│  │  └────────────────┘  └──────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │         Хук useDraftPersistence               │   │
│  │  - Автосохранение (debounce 1s)                │   │
│  │  - Восстановление при монтировании              │   │
│  │  - Управление состоянием                        │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │            tRPC Client                          │   │
│  │  - draft.save()                                 │   │
│  │  - draft.restore()                              │   │
│  │  - draft.delete()                               │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼──────────────────────────────┘
                          │ HTTP/JSON
┌─────────────────────────▼──────────────────────────────┐
│                    Сервер (tRPC)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │            tRPC Router (draft)                   │   │
│  │  - Валидация входных данных (Zod)               │   │
│  │  - Проверка аутентификации                      │   │
│  │  - Обработка ошибок                             │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │         Сервис DraftService                     │   │
│  │  - Бизнес-логика сохранения                     │   │
│  │  - Очистка старых черновиков                    │   │
│  │  - Retry логика                                 │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │         Репозиторий DraftRepository             │   │
│  │  - CRUD операции с БД                           │   │
│  │  - Изоляция доступа к данным                    │   │
│  └──────────────────────┬──────────────────────────┘   │
└─────────────────────────┼──────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────┐
│                  База данных                            │
│  Таблица: vacancy_drafts                               │
│  - id, userId, draftData, createdAt, updatedAt         │
└────────────────────────────────────────────────────────┘
```

### Принципы проектирования

1. **Разделение ответственности**: Клиент управляет UI и локальным состоянием, сервер — бизнес-логикой и хранением
2. **Типобезопасность**: Zod схемы обеспечивают валидацию на всех уровнях
3. **Оптимистичные обновления**: UI обновляется немедленно, синхронизация с сервером происходит асинхронно
4. **Устойчивость к ошибкам**: Retry логика и graceful degradation

## Компоненты и интерфейсы

### 1. Zod схемы (shared/schemas/draft.ts)

```typescript
import { z } from 'zod';

// Схема сообщения в диалоге с AI-ботом
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.date(),
});

// Схема данных вакансии
export const VacancyDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
});

// Схема черновика
export const DraftSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  conversationHistory: z.array(MessageSchema),
  vacancyData: VacancyDataSchema,
  currentStep: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Схема для создания черновика
export const CreateDraftInputSchema = z.object({
  conversationHistory: z.array(MessageSchema).default([]),
  vacancyData: VacancyDataSchema.default({}),
  currentStep: z.string().default('initial'),
});

// Схема для обновления черновика
export const UpdateDraftInputSchema = z.object({
  conversationHistory: z.array(MessageSchema).optional(),
  vacancyData: VacancyDataSchema.optional(),
  currentStep: z.string().optional(),
});

export type Draft = z.infer<typeof DraftSchema>;
export type CreateDraftInput = z.infer<typeof CreateDraftInputSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftInputSchema>;
```

### 2. tRPC Router (server/api/routers/draft.ts)

```typescript
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { DraftService } from '../../services/DraftService';
import { CreateDraftInputSchema, UpdateDraftInputSchema } from '../../../shared/schemas/draft';

export const draftRouter = createTRPCRouter({
  // Получить активный черновик текущего пользователя
  getCurrent: protectedProcedure
    .query(async ({ ctx }) => {
      const draftService = new DraftService(ctx.db);
      return await draftService.getCurrentDraft(ctx.session.user.id);
    }),

  // Создать новый черновик
  create: protectedProcedure
    .input(CreateDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      const draftService = new DraftService(ctx.db);
      return await draftService.createDraft(ctx.session.user.id, input);
    }),

  // Обновить существующий черновик
  update: protectedProcedure
    .input(UpdateDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      const draftService = new DraftService(ctx.db);
      return await draftService.updateDraft(ctx.session.user.id, input);
    }),

  // Удалить черновик
  delete: protectedProcedure
    .mutation(async ({ ctx }) => {
      const draftService = new DraftService(ctx.db);
      return await draftService.deleteDraft(ctx.session.user.id);
    }),
});
```

### 3. Сервис DraftService (server/services/DraftService.ts)

```typescript
import { DraftRepository } from '../repositories/DraftRepository';
import { CreateDraftInput, UpdateDraftInput, Draft } from '../../shared/schemas/draft';

export class DraftService {
  constructor(private db: Database) {}

  async getCurrentDraft(userId: string): Promise<Draft | null> {
    const repo = new DraftRepository(this.db);
    const draft = await repo.findByUserId(userId);
    
    // Удалить черновик, если он старше 7 дней
    if (draft && this.isExpired(draft)) {
      await repo.delete(draft.id);
      return null;
    }
    
    return draft;
  }

  async createDraft(userId: string, input: CreateDraftInput): Promise<Draft> {
    const repo = new DraftRepository(this.db);
    
    // Удалить существующий черновик перед созданием нового
    const existing = await repo.findByUserId(userId);
    if (existing) {
      await repo.delete(existing.id);
    }
    
    return await repo.create({
      userId,
      ...input,
    });
  }

  async updateDraft(userId: string, input: UpdateDraftInput): Promise<Draft> {
    const repo = new DraftRepository(this.db);
    const draft = await repo.findByUserId(userId);
    
    if (!draft) {
      throw new Error('Черновик не найден');
    }
    
    return await this.retryOperation(
      () => repo.update(draft.id, input),
      3
    );
  }

  async deleteDraft(userId: string): Promise<void> {
    const repo = new DraftRepository(this.db);
    const draft = await repo.findByUserId(userId);
    
    if (draft) {
      await repo.delete(draft.id);
    }
  }

  private isExpired(draft: Draft): boolean {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return draft.updatedAt < sevenDaysAgo;
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4. Репозиторий DraftRepository (server/repositories/DraftRepository.ts)

```typescript
import { Draft, CreateDraftInput, UpdateDraftInput } from '../../shared/schemas/draft';

export class DraftRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string): Promise<Draft | null> {
    const result = await this.db.vacancyDrafts.findFirst({
      where: { userId },
    });
    
    return result ? this.mapToDomain(result) : null;
  }

  async create(data: CreateDraftInput & { userId: string }): Promise<Draft> {
    const result = await this.db.vacancyDrafts.create({
      data: {
        userId: data.userId,
        draftData: JSON.stringify({
          conversationHistory: data.conversationHistory,
          vacancyData: data.vacancyData,
          currentStep: data.currentStep,
        }),
      },
    });
    
    return this.mapToDomain(result);
  }

  async update(id: string, data: UpdateDraftInput): Promise<Draft> {
    const existing = await this.db.vacancyDrafts.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new Error('Черновик не найден');
    }
    
    const existingData = JSON.parse(existing.draftData);
    const updatedData = {
      conversationHistory: data.conversationHistory ?? existingData.conversationHistory,
      vacancyData: data.vacancyData ?? existingData.vacancyData,
      currentStep: data.currentStep ?? existingData.currentStep,
    };
    
    const result = await this.db.vacancyDrafts.update({
      where: { id },
      data: {
        draftData: JSON.stringify(updatedData),
        updatedAt: new Date(),
      },
    });
    
    return this.mapToDomain(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.vacancyDrafts.delete({
      where: { id },
    });
  }

  private mapToDomain(dbRecord: any): Draft {
    const data = JSON.parse(dbRecord.draftData);
    return {
      id: dbRecord.id,
      userId: dbRecord.userId,
      conversationHistory: data.conversationHistory,
      vacancyData: data.vacancyData,
      currentStep: data.currentStep,
      createdAt: dbRecord.createdAt,
      updatedAt: dbRecord.updatedAt,
    };
  }
}
```

### 5. React хук useDraftPersistence (hooks/useDraftPersistence.ts)

```typescript
import { useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { Draft, UpdateDraftInput } from '../shared/schemas/draft';

interface UseDraftPersistenceOptions {
  onRestore?: (draft: Draft) => void;
  debounceMs?: number;
}

export function useDraftPersistence(options: UseDraftPersistenceOptions = {}) {
  const { onRestore, debounceMs = 1000 } = options;
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoredDraft, setRestoredDraft] = useState<Draft | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasDraftRef = useRef(false);
  
  const utils = api.useContext();
  
  // Запросы tRPC
  const { data: currentDraft } = api.draft.getCurrent.useQuery(undefined, {
    enabled: !hasDraftRef.current,
  });
  
  const createMutation = api.draft.create.useMutation();
  const updateMutation = api.draft.update.useMutation();
  const deleteMutation = api.draft.delete.useMutation();
  
  // Проверка наличия черновика при монтировании
  useEffect(() => {
    if (currentDraft && !hasDraftRef.current) {
      setRestoredDraft(currentDraft);
      setShowRestorePrompt(true);
    }
  }, [currentDraft]);
  
  // Функция сохранения с debounce
  const saveDraft = (data: UpdateDraftInput) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (hasDraftRef.current) {
          await updateMutation.mutateAsync(data);
        } else {
          await createMutation.mutateAsync(data);
          hasDraftRef.current = true;
        }
        
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        
        // Сбросить статус через 2 секунды
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Ошибка сохранения черновика:', error);
        setSaveStatus('error');
      }
    }, debounceMs);
  };
  
  // Восстановление черновика
  const restoreDraft = () => {
    if (restoredDraft && onRestore) {
      onRestore(restoredDraft);
      hasDraftRef.current = true;
    }
    setShowRestorePrompt(false);
  };
  
  // Начать заново
  const startNew = async () => {
    if (restoredDraft) {
      await deleteMutation.mutateAsync();
    }
    setShowRestorePrompt(false);
    setRestoredDraft(null);
    hasDraftRef.current = false;
  };
  
  // Удаление черновика
  const clearDraft = async () => {
    await deleteMutation.mutateAsync();
    hasDraftRef.current = false;
    setSaveStatus('idle');
    setLastSavedAt(null);
  };
  
  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    saveDraft,
    restoreDraft,
    startNew,
    clearDraft,
    saveStatus,
    lastSavedAt,
    showRestorePrompt,
    restoredDraft,
  };
}
```

### 6. Компонент SaveIndicator (components/SaveIndicator.tsx)

```typescript
import { useMemo } from 'react';

interface SaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: Date | null;
}

export function SaveIndicator({ status, lastSavedAt }: SaveIndicatorProps) {
  const statusText = useMemo(() => {
    switch (status) {
      case 'saving':
        return 'Сохранение...';
      case 'saved':
        return 'Сохранено';
      case 'error':
        return 'Ошибка сохранения';
      default:
        return '';
    }
  }, [status]);
  
  const timeText = useMemo(() => {
    if (!lastSavedAt) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSavedAt.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'только что';
    if (diffMinutes === 1) return '1 минуту назад';
    if (diffMinutes < 5) return `${diffMinutes} минуты назад`;
    return `${diffMinutes} минут назад`;
  }, [lastSavedAt]);
  
  if (status === 'idle') return null;
  
  return (
    <div 
      className="save-indicator"
      title={lastSavedAt ? `Последнее сохранение: ${timeText}` : undefined}
    >
      <span className={`status-icon status-${status}`} />
      <span className="status-text">{statusText}</span>
    </div>
  );
}
```

### 7. Компонент RestorePrompt (components/RestorePrompt.tsx)

```typescript
interface RestorePromptProps {
  onRestore: () => void;
  onStartNew: () => void;
}

export function RestorePrompt({ onRestore, onStartNew }: RestorePromptProps) {
  return (
    <div className="restore-prompt-overlay">
      <div className="restore-prompt-modal">
        <h2>У вас есть несохраненная вакансия</h2>
        <p>Хотите продолжить работу над ней или начать создание новой вакансии?</p>
        
        <div className="restore-prompt-actions">
          <button 
            onClick={onRestore}
            className="button-primary"
          >
            Продолжить работу
          </button>
          
          <button 
            onClick={onStartNew}
            className="button-secondary"
          >
            Начать заново
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Модели данных

### Таблица vacancy_drafts

```sql
CREATE TABLE vacancy_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  draft_data JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_draft UNIQUE (user_id)
);

CREATE INDEX idx_vacancy_drafts_user_id ON vacancy_drafts(user_id);
CREATE INDEX idx_vacancy_drafts_updated_at ON vacancy_drafts(updated_at);
```

### Структура JSONB поля draft_data

```json
{
  "conversationHistory": [
    {
      "role": "user",
      "content": "Создай вакансию для разработчика",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "role": "assistant",
      "content": "Конечно! Давайте начнем...",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ],
  "vacancyData": {
    "title": "Senior TypeScript разработчик",
    "description": "Ищем опытного разработчика...",
    "requirements": [
      "Опыт работы с TypeScript 3+ года",
      "Знание React и Next.js"
    ],
    "conditions": [
      "Удаленная работа",
      "Гибкий график"
    ],
    "salary": {
      "min": 200000,
      "max": 300000,
      "currency": "RUB"
    }
  },
  "currentStep": "requirements"
}
```

## Свойства корректности

*Свойство — это характеристика или поведение, которое должно выполняться во всех допустимых выполнениях системы. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*


### Свойство 1: Создание черновика при начале работы

*Для любого* аутентифицированного рекрутера, когда он начинает создание вакансии через AI-бота, в системе должен быть создан новый черновик, связанный с его userId.

**Проверяет: Требования 1.1**

### Свойство 2: Автоматическое сохранение изменений

*Для любых* данных вакансии или сообщений диалога, когда AI-бот обновляет состояние, система должна сохранить изменения в черновик в течение 2 секунд (с учетом debounce).

**Проверяет: Требования 1.2, 1.3, 8.1**

### Свойство 3: Retry логика при ошибках

*Для любой* операции сохранения, если происходит ошибка, система должна повторить попытку до 3 раз с экспоненциальной задержкой перед тем, как показать ошибку пользователю.

**Проверяет: Требования 1.4, 1.5**

### Свойство 4: Восстановление черновика при возврате

*Для любого* рекрутера с активным черновиком (не старше 7 дней), когда он открывает страницу создания вакансии, система должна предложить восстановить черновик с сохраненными данными.

**Проверяет: Требования 2.1, 2.2, 2.3**

### Свойство 5: Замена черновика при создании нового

*Для любого* рекрутера с существующим черновиком, когда он выбирает "Начать заново", система должна удалить старый черновик и создать новый пустой черновик.

**Проверяет: Требования 2.4**

### Свойство 6: Автоматическое удаление устаревших черновиков

*Для любого* черновика, если его updatedAt старше 7 дней, система должна автоматически удалить его при попытке доступа или при фоновой очистке.

**Проверяет: Требования 2.5, 5.3**

### Свойство 7: Уникальность черновика по пользователю

*Для любого* рекрутера, в системе должен существовать максимум один активный черновик. При создании нового черновика старый должен быть удален.

**Проверяет: Требования 3.1, 3.3**

### Свойство 8: Изоляция черновиков между пользователями

*Для любых* двух разных рекрутеров, каждый должен иметь доступ только к своим черновикам. Попытка доступа к чужому черновику должна возвращать ошибку 403.

**Проверяет: Требования 3.2, 10.2, 10.3**

### Свойство 9: Полнота структуры черновика

*Для любого* сохраненного черновика, он должен содержать все обязательные поля: id, userId, conversationHistory, vacancyData, currentStep, createdAt, updatedAt.

**Проверяет: Требования 4.1, 4.2, 4.3, 4.4**

### Свойство 10: Валидация данных черновика

*Для любых* данных черновика, перед сохранением они должны пройти валидацию через Zod схему. Невалидные данные должны быть отклонены с понятным сообщением об ошибке.

**Проверяет: Требования 4.5, 7.4**

### Свойство 11: Очистка черновика после создания вакансии

*Для любого* черновика, когда вакансия успешно создана и сохранена, соответствующий черновик должен быть удален из системы.

**Проверяет: Требования 5.1, 5.4**

### Свойство 12: Debounce группировки изменений

*Для любой* последовательности изменений, происходящих чаще чем раз в секунду, система должна группировать их и выполнять сохранение не чаще одного раза в секунду.

**Проверяет: Требования 6.4**

### Свойство 13: Жизненный цикл индикатора сохранения

*Для любой* операции сохранения, индикатор должен показывать "Сохранение..." во время операции, затем "Сохранено" на 2 секунды после успеха, или "Ошибка сохранения" при неудаче.

**Проверяет: Требования 6.3, 9.1, 9.2**

### Свойство 14: Обработка поврежденных черновиков

*Для любого* черновика с невалидной структурой данных, система должна предложить пользователю начать создание заново вместо попытки восстановления.

**Проверяет: Требования 7.3**

### Свойство 15: Инициализация AI-бота из черновика

*Для любого* восстанавливаемого черновика, AI-бот должен быть инициализирован с полной историей диалога и данными вакансии из черновика.

**Проверяет: Требования 8.2**

### Свойство 16: Русскоязычный интерфейс без англицизмов

*Для всех* UI текстов, сообщений об ошибках и уведомлений, они должны быть на русском языке без использования англицизмов (кроме технических терминов).

**Проверяет: Требования 9.4**

### Свойство 17: Аутентификация перед доступом

*Для любой* операции с черновиками (чтение, создание, обновление, удаление), система должна проверить аутентификацию пользователя. Неаутентифицированные запросы должны возвращать ошибку 401.

**Проверяет: Требования 10.1**

## Обработка ошибок

### Типы ошибок

1. **Ошибки сети**
   - Таймаут соединения
   - Потеря соединения
   - Обработка: Retry с экспоненциальной задержкой (3 попытки)
   - Сообщение: "Не удалось сохранить изменения. Проверьте подключение к интернету"

2. **Ошибки валидации**
   - Невалидная структура данных
   - Отсутствие обязательных полей
   - Обработка: Логирование деталей, показ общего сообщения
   - Сообщение: "Произошла ошибка при сохранении данных"

3. **Ошибки авторизации**
   - Отсутствие аутентификации (401)
   - Доступ к чужим данным (403)
   - Обработка: Редирект на страницу входа или показ ошибки
   - Сообщение: "Доступ запрещен"

4. **Ошибки базы данных**
   - Нарушение ограничений
   - Недоступность БД
   - Обработка: Retry, логирование, уведомление пользователя
   - Сообщение: "Временные проблемы с сервером. Попробуйте позже"

5. **Ошибки восстановления**
   - Поврежденный черновик
   - Несовместимая версия данных
   - Обработка: Предложение начать заново
   - Сообщение: "Не удалось загрузить черновик. Начните создание заново"

### Стратегия обработки

```typescript
// Централизованный обработчик ошибок
class ErrorHandler {
  handle(error: Error, context: ErrorContext): ErrorResponse {
    // Логирование
    logger.error('Draft operation failed', {
      error: error.message,
      stack: error.stack,
      context,
    });
    
    // Определение типа ошибки
    if (error instanceof NetworkError) {
      return {
        type: 'network',
        message: 'Не удалось сохранить изменения. Проверьте подключение к интернету',
        retryable: true,
      };
    }
    
    if (error instanceof ValidationError) {
      return {
        type: 'validation',
        message: 'Произошла ошибка при сохранении данных',
        retryable: false,
      };
    }
    
    if (error instanceof AuthError) {
      return {
        type: 'auth',
        message: 'Доступ запрещен',
        retryable: false,
        action: 'redirect_to_login',
      };
    }
    
    // Общая ошибка
    return {
      type: 'unknown',
      message: 'Произошла непредвиденная ошибка',
      retryable: false,
    };
  }
}
```

### Graceful Degradation

При недоступности сервера:
1. Показать пользователю предупреждение о проблемах с сохранением
2. Сохранить данные в localStorage как резервную копию
3. Продолжить работу с AI-ботом
4. При восстановлении соединения синхронизировать данные

## Стратегия тестирования

### Двойной подход к тестированию

Система использует комбинацию unit-тестов и property-based тестов для обеспечения корректности:

**Unit-тесты** проверяют:
- Конкретные примеры поведения
- Граничные случаи (пустые данные, максимальные размеры)
- Интеграционные точки между компонентами
- Специфические сценарии ошибок

**Property-based тесты** проверяют:
- Универсальные свойства для всех входных данных
- Инварианты системы
- Корректность при случайных данных
- Устойчивость к edge cases

### Конфигурация property-based тестов

Используем библиотеку **fast-check** для TypeScript:

```typescript
import fc from 'fast-check';

// Минимум 100 итераций на тест
fc.assert(
  fc.property(
    // Генераторы данных
    fc.record({
      userId: fc.uuid(),
      conversationHistory: fc.array(messageArbitrary),
      vacancyData: vacancyDataArbitrary,
    }),
    // Проверяемое свойство
    (draft) => {
      // Feature: vacancy-draft-persistence, Property 9: Полнота структуры черновика
      const saved = saveDraft(draft);
      return (
        saved.id !== undefined &&
        saved.userId === draft.userId &&
        saved.conversationHistory !== undefined &&
        saved.vacancyData !== undefined &&
        saved.currentStep !== undefined &&
        saved.createdAt !== undefined &&
        saved.updatedAt !== undefined
      );
    }
  ),
  { numRuns: 100 }
);
```

### Генераторы данных для тестов

```typescript
// Генератор сообщений
const messageArbitrary = fc.record({
  role: fc.constantFrom('user', 'assistant'),
  content: fc.string({ minLength: 1, maxLength: 1000 }),
  timestamp: fc.date(),
});

// Генератор данных вакансии
const vacancyDataArbitrary = fc.record({
  title: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
  description: fc.option(fc.string({ minLength: 1, maxLength: 5000 })),
  requirements: fc.option(fc.array(fc.string())),
  conditions: fc.option(fc.array(fc.string())),
  salary: fc.option(fc.record({
    min: fc.integer({ min: 0, max: 1000000 }),
    max: fc.integer({ min: 0, max: 1000000 }),
    currency: fc.constantFrom('RUB', 'USD', 'EUR'),
  })),
});

// Генератор черновика
const draftArbitrary = fc.record({
  userId: fc.uuid(),
  conversationHistory: fc.array(messageArbitrary, { minLength: 0, maxLength: 50 }),
  vacancyData: vacancyDataArbitrary,
  currentStep: fc.constantFrom('initial', 'title', 'description', 'requirements', 'conditions', 'salary', 'review'),
});
```

### Примеры unit-тестов

```typescript
describe('DraftService', () => {
  describe('createDraft', () => {
    it('должен создать черновик с корректными полями', async () => {
      const service = new DraftService(mockDb);
      const userId = 'user-123';
      const input = {
        conversationHistory: [],
        vacancyData: {},
        currentStep: 'initial',
      };
      
      const draft = await service.createDraft(userId, input);
      
      expect(draft.userId).toBe(userId);
      expect(draft.id).toBeDefined();
      expect(draft.createdAt).toBeInstanceOf(Date);
    });
    
    it('должен удалить существующий черновик перед созданием нового', async () => {
      const service = new DraftService(mockDb);
      const userId = 'user-123';
      
      // Создать первый черновик
      await service.createDraft(userId, { conversationHistory: [], vacancyData: {}, currentStep: 'initial' });
      
      // Создать второй черновик
      await service.createDraft(userId, { conversationHistory: [], vacancyData: {}, currentStep: 'initial' });
      
      // Проверить, что существует только один черновик
      const drafts = await mockDb.vacancyDrafts.findMany({ where: { userId } });
      expect(drafts).toHaveLength(1);
    });
  });
  
  describe('updateDraft', () => {
    it('должен повторить попытку 3 раза при ошибке', async () => {
      const service = new DraftService(mockDb);
      let attempts = 0;
      
      mockDb.vacancyDrafts.update = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve(mockDraft);
      });
      
      await service.updateDraft('user-123', { currentStep: 'title' });
      
      expect(attempts).toBe(3);
    });
  });
});
```

### Тестирование React компонентов

```typescript
describe('useDraftPersistence', () => {
  it('должен показать prompt восстановления при наличии черновика', async () => {
    const mockDraft = createMockDraft();
    mockTRPC.draft.getCurrent.useQuery.mockReturnValue({ data: mockDraft });
    
    const { result } = renderHook(() => useDraftPersistence());
    
    await waitFor(() => {
      expect(result.current.showRestorePrompt).toBe(true);
      expect(result.current.restoredDraft).toEqual(mockDraft);
    });
  });
  
  it('должен использовать debounce для сохранения', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useDraftPersistence({ debounceMs: 1000 }));
    
    // Вызвать saveDraft несколько раз быстро
    result.current.saveDraft({ currentStep: 'title' });
    result.current.saveDraft({ currentStep: 'description' });
    result.current.saveDraft({ currentStep: 'requirements' });
    
    // Проверить, что сохранение еще не вызвано
    expect(mockTRPC.draft.update.mutateAsync).not.toHaveBeenCalled();
    
    // Продвинуть таймеры
    jest.advanceTimersByTime(1000);
    
    // Проверить, что сохранение вызвано один раз
    await waitFor(() => {
      expect(mockTRPC.draft.update.mutateAsync).toHaveBeenCalledTimes(1);
    });
    
    jest.useRealTimers();
  });
});
```

### Интеграционные тесты

```typescript
describe('Draft persistence integration', () => {
  it('должен сохранить и восстановить полный черновик', async () => {
    // Создать черновик
    const draft = await createDraft({
      userId: 'user-123',
      conversationHistory: [
        { role: 'user', content: 'Создай вакансию', timestamp: new Date() },
        { role: 'assistant', content: 'Конечно!', timestamp: new Date() },
      ],
      vacancyData: {
        title: 'Senior разработчик',
        description: 'Ищем опытного специалиста',
      },
      currentStep: 'requirements',
    });
    
    // Восстановить черновик
    const restored = await getDraft('user-123');
    
    // Проверить, что данные совпадают
    expect(restored.conversationHistory).toHaveLength(2);
    expect(restored.vacancyData.title).toBe('Senior разработчик');
    expect(restored.currentStep).toBe('requirements');
  });
});
```

### Покрытие тестами

Целевые метрики:
- **Покрытие строк**: минимум 80%
- **Покрытие веток**: минимум 75%
- **Property-based тесты**: все 17 свойств корректности
- **Unit-тесты**: все критические пути и граничные случаи
- **Интеграционные тесты**: основные пользовательские сценарии

### Continuous Testing

- Запуск тестов при каждом коммите
- Property-based тесты с 100 итерациями в CI/CD
- Увеличение до 1000 итераций для ночных прогонов
- Мониторинг времени выполнения тестов
