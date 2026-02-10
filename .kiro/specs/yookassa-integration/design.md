# Проектирование интеграции с ЮКасса

## Обзор

Данный документ описывает техническое проектирование интеграции платформы с платежной системой ЮКасса. Интеграция обеспечивает прием онлайн-платежей через API ЮКасса с использованием сценария подтверждения через перенаправление (redirect).

### Цели интеграции

- Создание платежей через API ЮКасса
- Обработка уведомлений о статусе платежей (webhooks)
- Безопасное хранение платежной информации
- Обеспечение идемпотентности операций
- Типобезопасная работа с API

### Технологический стек

**tRPC API** (основной API):
- **API**: tRPC для типобезопасных эндпоинтов (create, get, list, checkStatus)
- **База данных**: PostgreSQL с Drizzle ORM
- **Валидация**: Zod v4
- **HTTP клиент**: fetch API (встроенный в Node.js)
- **Аутентификация**: Basic Auth (shopId:secretKey)

**Webhook-сервис** (отдельный сервис на Hono):
- **Фреймворк**: Hono (легковесный веб-фреймворк для Bun)
- **База данных**: PostgreSQL с Drizzle ORM (общая с tRPC API)
- **Валидация**: Zod v4
- **HTTP клиент**: fetch API
- **Расположение**: `apps/webhooks/`

### Разделение ответственности

**tRPC API** отвечает за:
- Создание платежей (create)
- Получение информации о платежах (get, list)
- Проверка статуса платежей (checkStatus)

**Webhook-сервис** отвечает за:
- Обработка webhook-уведомлений от ЮКасса
- API-верификация webhook
- Обновление статусов платежей в БД

**Преимущества разделения:**
1. **Производительность**: Hono в 3-5 раз быстрее для простых HTTP endpoints
2. **Масштабирование**: Webhook-сервис масштабируется независимо
3. **Безопасность**: Легче настроить rate limiting и IP-whitelisting
4. **Изоляция**: Проблемы с webhook не влияют на основной API
5. **Гибкость**: Можно развернуть на edge (Cloudflare Workers, Vercel Edge)

## Архитектура

### Компоненты системы

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Клиент     │─────▶│  tRPC API    │─────▶│  ЮКасса API │
│  (Next.js)  │◀─────│  (payments)  │◀─────│             │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            ▼                      │
                     ┌──────────────┐              │
                     │  PostgreSQL  │              │
                     │  (payments)  │              │
                     └──────────────┘              │
                            ▲                      │
                            │                      │
                     ┌──────────────┐              │
                     │   Webhook    │◀─────────────┘
                     │   Service    │
                     │   (Hono)     │
                     └──────────────┘
```

**Примечание:** Webhook обрабатываются отдельным сервисом на Hono (`apps/webhooks/`), 
а не через tRPC API. Это обеспечивает лучшую производительность, независимое 
масштабирование и изоляцию от основного API.

### Поток создания платежа

1. Пользователь инициирует платеж через UI
2. Клиент вызывает tRPC процедуру `payments.create`
3. Система генерирует Idempotence-Key
4. Система отправляет запрос к API ЮКасса
5. ЮКасса возвращает данные платежа с confirmation_url
6. Система сохраняет платеж в БД
7. Клиент перенаправляет пользователя на confirmation_url
8. Пользователь оплачивает на странице ЮКасса
9. ЮКасса отправляет webhook о статусе
10. Система обновляет статус в БД
11. Пользователь возвращается на return_url


## Компоненты и интерфейсы

### 1. Схема базы данных

#### Таблица `payments`

```typescript
// packages/db/src/schema/payment/payment.ts
import { pgTable, text, timestamp, decimal, pgEnum, uuid, index } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { workspace } from "../workspace/workspace";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "canceled",
]);

export const paymentCurrencyEnum = pgEnum("payment_currency", ["RUB"]);

export const payment = pgTable(
  "payments",
  {
    // Внутренний ID
    id: uuid("id").primaryKey().defaultRandom(),
    
    // ID платежа в ЮКасса
    yookassaId: text("yookassa_id").notNull().unique(),
    
    // Ключ идемпотентности
    idempotenceKey: text("idempotence_key").notNull().unique(),
    
    // Связь с пользователем
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Связь с workspace (опционально)
    workspaceId: text("workspace_id")
      .references(() => workspace.id, { onDelete: "set null" }),
    
    // Сумма платежа
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    
    // Валюта
    currency: paymentCurrencyEnum("currency").notNull().default("RUB"),
    
    // Статус платежа
    status: paymentStatusEnum("status").notNull().default("pending"),
    
    // Описание платежа
    description: text("description"),
    
    // URL для возврата пользователя
    returnUrl: text("return_url").notNull(),
    
    // URL подтверждения от ЮКасса
    confirmationUrl: text("confirmation_url"),
    
    // Метаданные (JSON)
    metadata: text("metadata"),
    
    // Даты
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    
    // Дата завершения платежа
    completedAt: timestamp("completed_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    userIdx: index("payment_user_idx").on(table.userId),
    workspaceIdx: index("payment_workspace_idx").on(table.workspaceId),
    statusIdx: index("payment_status_idx").on(table.status),
    yookassaIdx: index("payment_yookassa_idx").on(table.yookassaId),
  }),
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
```

### 2. Zod схемы валидации

```typescript
// packages/validators/src/payment.ts
import { z } from "zod";

// Схема для создания платежа
export const createPaymentSchema = z.object({
  amount: z.number().positive("Сумма должна быть больше нуля"),
  currency: z.enum(["RUB"]).default("RUB"),
  description: z.string().max(128, "Описание не может превышать 128 символов").optional(),
  returnUrl: z.string().url("Некорректный URL для возврата"),
  workspaceId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// Схема ответа от ЮКасса при создании платежа
export const yookassaPaymentResponseSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]),
  amount: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  description: z.string().optional(),
  confirmation: z.object({
    type: z.literal("redirect"),
    confirmation_url: z.string().url(),
  }).optional(),
  created_at: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type YookassaPaymentResponse = z.infer<typeof yookassaPaymentResponseSchema>;

// Схема webhook уведомления от ЮКасса
export const yookassaWebhookSchema = z.object({
  type: z.enum(["notification"]),
  event: z.enum(["payment.succeeded", "payment.canceled", "payment.waiting_for_capture"]),
  object: z.object({
    id: z.string(),
    status: z.enum(["pending", "waiting_for_capture", "succeeded", "canceled"]),
    amount: z.object({
      value: z.string(),
      currency: z.string(),
    }),
    description: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    created_at: z.string(),
    paid: z.boolean().optional(),
  }),
});

export type YookassaWebhook = z.infer<typeof yookassaWebhookSchema>;

// Схема для проверки статуса платежа
export const checkPaymentStatusSchema = z.object({
  paymentId: z.string().uuid("Некорректный ID платежа"),
});

export type CheckPaymentStatusInput = z.infer<typeof checkPaymentStatusSchema>;
```


### 3. Сервис для работы с API ЮКасса

```typescript
// packages/api/src/services/yookassa/client.ts
import { randomUUID } from "crypto";
import type { YookassaPaymentResponse } from "@qbs-autonaim/validators";
import { yookassaPaymentResponseSchema } from "@qbs-autonaim/validators";

interface YookassaConfig {
  shopId: string;
  secretKey: string;
  apiUrl: string;
}

interface CreatePaymentParams {
  amount: number;
  currency: string;
  description?: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export class YookassaClient {
  private config: YookassaConfig;

  constructor(config: YookassaConfig) {
    this.config = config;
  }

  /**
   * Создает платеж в ЮКасса
   */
  async createPayment(params: CreatePaymentParams): Promise<YookassaPaymentResponse> {
    const idempotenceKey = randomUUID();
    
    const response = await fetch(`${this.config.apiUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
        "Authorization": `Basic ${this.getAuthHeader()}`,
      },
      body: JSON.stringify({
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency,
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: params.returnUrl,
        },
        description: params.description?.substring(0, 128),
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Ошибка создания платежа: ${error.description || response.statusText}`);
    }

    const data = await response.json();
    return yookassaPaymentResponseSchema.parse(data);
  }

  /**
   * Получает информацию о платеже
   */
  async getPayment(paymentId: string): Promise<YookassaPaymentResponse> {
    const response = await fetch(`${this.config.apiUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${this.getAuthHeader()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Платеж не найден");
      }
      const error = await response.json();
      throw new Error(`Ошибка получения платежа: ${error.description || response.statusText}`);
    }

    const data = await response.json();
    return yookassaPaymentResponseSchema.parse(data);
  }

  /**
   * Генерирует заголовок Basic Auth
   */
  private getAuthHeader(): string {
    const credentials = `${this.config.shopId}:${this.config.secretKey}`;
    return Buffer.from(credentials).toString("base64");
  }
}

/**
 * Фабрика для создания клиента ЮКасса
 */
export function createYookassaClient(): YookassaClient {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const apiUrl = process.env.YOOKASSA_API_URL || "https://api.yookassa.ru/v3";

  if (!shopId || !secretKey) {
    throw new Error("Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)");
  }

  return new YookassaClient({
    shopId,
    secretKey,
    apiUrl,
  });
}
```

### 4. tRPC роутер для платежей

#### Структура роутера

```
packages/api/src/routers/payment/
├── index.ts              # Экспорт роутера
├── create.ts             # Создание платежа
├── get.ts                # Получение платежа по ID
├── list.ts               # Список платежей пользователя
└── check-status.ts       # Проверка статуса платежа
```

**Примечание:** Webhook обрабатываются отдельным сервисом на Hono.
См. `apps/webhooks/` для деталей.

#### Процедура создания платежа

```typescript
// packages/api/src/routers/payment/create.ts
import { createPaymentSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { protectedProcedure } from "../../trpc";
import { createYookassaClient } from "../../services/yookassa/client";

export const create = protectedProcedure
  .input(createPaymentSchema)
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    // Проверка доступа к workspace (если указан)
    if (input.workspaceId) {
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        userId,
      );
      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Нет доступа к указанному workspace",
        });
      }
    }

    // Создание клиента ЮКасса
    const yookassa = createYookassaClient();
    
    // Генерация ключа идемпотентности
    const idempotenceKey = randomUUID();
    
    try {
      // Создание платежа в ЮКасса
      const yookassaPayment = await yookassa.createPayment({
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        returnUrl: input.returnUrl,
        metadata: {
          ...input.metadata,
          userId,
          workspaceId: input.workspaceId,
        },
      });

      // Сохранение платежа в БД
      const payment = await ctx.db.insert(payment).values({
        yookassaId: yookassaPayment.id,
        idempotenceKey,
        userId,
        workspaceId: input.workspaceId,
        amount: input.amount.toString(),
        currency: input.currency,
        status: "pending",
        description: input.description,
        returnUrl: input.returnUrl,
        confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
        metadata: JSON.stringify(input.metadata),
      }).returning();

      const createdPayment = payment[0];
      if (!createdPayment) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось сохранить платеж",
        });
      }

      return {
        id: createdPayment.id,
        yookassaId: createdPayment.yookassaId,
        amount: createdPayment.amount,
        currency: createdPayment.currency,
        status: createdPayment.status,
        confirmationUrl: createdPayment.confirmationUrl,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Ошибка создания платежа",
      });
    }
  });
```


#### Обработка webhook

**Примечание:** Webhook обрабатываются отдельным сервисом на Hono, а не через tRPC API.

Webhook-сервис расположен в `apps/webhooks/` и обеспечивает:
- Высокую производительность (Hono в 3-5 раз быстрее для простых HTTP endpoints)
- Независимое масштабирование
- Улучшенную безопасность (API-верификация, проверка HTTPS/порта)
- Изоляцию от основного API

**Основные возможности webhook-сервиса:**
1. Валидация структуры webhook через Zod схему
2. Проверка безопасности соединения (HTTPS, порт 443/8443)
3. API-верификация через GET-запрос к ЮКасса (Метод 2)
4. Обновление статуса платежа в БД
5. Установка completedAt для завершенных платежей
6. Структурированное логирование всех операций

**Подробная документация:**
- `apps/webhooks/README.md` - полная документация
- `apps/webhooks/QUICKSTART.md` - быстрый старт
- `apps/webhooks/DEPLOYMENT.md` - варианты деплоя
- `.kiro/specs/yookassa-integration/WEBHOOK-SERVICE.md` - обзор для спецификации

**Пример использования:**
```bash
# Запуск webhook-сервиса локально
bun run dev:webhooks

# URL для webhook в ЮКасса
https://yourdomain.com/webhooks/yookassa
```

#### Процедура проверки статуса

```typescript
// packages/api/src/routers/payment/check-status.ts
import { checkPaymentStatusSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure } from "../../trpc";
import { payment } from "@qbs-autonaim/db/schema";
import { createYookassaClient } from "../../services/yookassa/client";

export const checkStatus = protectedProcedure
  .input(checkPaymentStatusSchema)
  .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    // Поиск платежа в БД
    const existingPayment = await ctx.db
      .select()
      .from(payment)
      .where(eq(payment.id, input.paymentId))
      .limit(1);

    if (!existingPayment.length) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Платеж не найден",
      });
    }

    const currentPayment = existingPayment[0];
    if (!currentPayment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Платеж не найден",
      });
    }

    // Проверка доступа
    if (currentPayment.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому платежу",
      });
    }

    // Получение актуального статуса из ЮКасса
    const yookassa = createYookassaClient();
    
    try {
      const yookassaPayment = await yookassa.getPayment(currentPayment.yookassaId);
      
      // Маппинг статусов
      let newStatus: "pending" | "succeeded" | "canceled" = "pending";
      if (yookassaPayment.status === "succeeded") {
        newStatus = "succeeded";
      } else if (yookassaPayment.status === "canceled") {
        newStatus = "canceled";
      }

      // Обновление статуса в БД, если изменился
      if (newStatus !== currentPayment.status) {
        await ctx.db
          .update(payment)
          .set({
            status: newStatus,
            completedAt: newStatus !== "pending" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(payment.id, currentPayment.id));
      }

      return {
        id: currentPayment.id,
        yookassaId: currentPayment.yookassaId,
        amount: currentPayment.amount,
        currency: currentPayment.currency,
        status: newStatus,
        description: currentPayment.description,
        confirmationUrl: currentPayment.confirmationUrl,
        createdAt: currentPayment.createdAt,
        completedAt: newStatus !== "pending" ? new Date() : currentPayment.completedAt,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Ошибка проверки статуса",
      });
    }
  });
```

#### Индексный файл роутера

```typescript
// packages/api/src/routers/payment/index.ts
import type { TRPCRouterRecord } from "@trpc/server";

import { checkStatus } from "./check-status";
import { create } from "./create";
import { get } from "./get";
import { list } from "./list";

// Примечание: webhook обрабатываются отдельным сервисом на Hono
// См. apps/webhooks/ для деталей

export const paymentRouter = {
  create,
  get,
  list,
  checkStatus,
} satisfies TRPCRouterRecord;
```


## Модели данных

### Статусы платежа

```typescript
type PaymentStatus = "pending" | "succeeded" | "canceled";
```

- **pending** - платеж создан, ожидает оплаты
- **succeeded** - платеж успешно завершен
- **canceled** - платеж отменен

### Валюты

```typescript
type PaymentCurrency = "RUB";
```

В текущей версии поддерживается только российский рубль.

### Структура платежа

```typescript
interface Payment {
  id: string;                    // UUID внутреннего ID
  yookassaId: string;            // ID платежа в ЮКасса
  idempotenceKey: string;        // Ключ идемпотентности
  userId: string;                // ID пользователя
  workspaceId: string | null;    // ID workspace (опционально)
  amount: string;                // Сумма платежа (decimal)
  currency: PaymentCurrency;     // Валюта
  status: PaymentStatus;         // Статус платежа
  description: string | null;    // Описание платежа
  returnUrl: string;             // URL для возврата
  confirmationUrl: string | null;// URL страницы оплаты
  metadata: string | null;       // JSON метаданные
  createdAt: Date;               // Дата создания
  updatedAt: Date;               // Дата обновления
  completedAt: Date | null;      // Дата завершения
}
```

### Конфигурация окружения

```bash
# .env
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
YOOKASSA_API_URL=https://api.yookassa.ru/v3  # опционально
```

## Свойства корректности

*Свойство — это характеристика или поведение, которое должно выполняться для всех допустимых выполнений системы. Свойства служат мостом между человекочитаемыми спецификациями и машинно-проверяемыми гарантиями корректности.*

### Свойство 1: Уникальность ключа идемпотентности

*Для любого* создаваемого платежа система должна генерировать уникальный Idempotence-Key на основе UUID, и этот ключ должен сохраняться в базе данных вместе с платежом.

**Валидирует: Требования 1.2, 5.5, 6.1, 6.3**

### Свойство 2: Полнота данных платежа

*Для любого* созданного платежа в базе данных должны присутствовать все обязательные поля: yookassaId, idempotenceKey, userId, amount, currency, status, returnUrl, createdAt, updatedAt.

**Валидирует: Требования 5.1, 5.2, 5.3**

### Свойство 3: Начальный статус платежа

*Для любого* вновь созданного платежа начальный статус должен быть установлен в "pending".

**Валидирует: Требование 5.4**

### Свойство 4: Обновление статуса через webhook

*Для любого* webhook-уведомления от ЮКасса со статусом "succeeded" или "canceled", система должна обновить соответствующий платеж в базе данных на новый статус.

**Валидирует: Требования 3.3, 3.4**

### Свойство 5: Корректность HTTP-ответов webhook

*Для любого* успешно обработанного webhook-уведомления система должна вернуть HTTP 200 OK, а для любого webhook с ошибкой обработки — HTTP 500.

**Валидирует: Требования 3.5, 3.6**

### Свойство 6: Валидация входных данных

*Для любого* запроса на создание платежа система должна проверить, что сумма больше нуля, валюта является "RUB", returnUrl является валидным URL, и описание не превышает 128 символов (с автоматической обрезкой).

**Валидирует: Требования 7.1, 7.2, 7.3, 7.4**

### Свойство 7: Обработка ошибок валидации

*Для любых* невалидных входных данных система должна вернуть детальную ошибку валидации с описанием проблемы.

**Валидирует: Требования 7.5, 10.5**

### Свойство 8: Аутентификация запросов

*Для любого* запроса к API ЮКасса система должна включать заголовок Authorization с Basic Auth, содержащим корректные shopId и secretKey.

**Валидирует: Требование 2.1**

### Свойство 9: Синхронизация статуса

*Для любого* запроса на проверку статуса платежа система должна получить актуальный статус из API ЮКасса и обновить его в базе данных, если он изменился.

**Валидирует: Требования 4.1, 4.2**

### Свойство 10: Валидация ответов API

*Для любого* ответа от API ЮКасса система должна валидировать его структуру с помощью Zod схем, и отклонять невалидные ответы.

**Валидирует: Требования 10.3, 10.4**

### Свойство 11: Идемпотентность повторных запросов

*Для любого* повторного запроса с тем же Idempotence-Key в течение 24 часов, ЮКасса должна вернуть информацию о ранее созданном платеже, и система должна корректно обработать такой ответ.

**Валидирует: Требование 6.2**

### Свойство 12: Проверка статуса при возврате

*Для любого* пользователя, возвращающегося на return_url после оплаты, система должна проверить актуальный статус платежа через API ЮКасса перед отображением результата.

**Валидирует: Требование 8.2**


## Обработка ошибок

### Типы ошибок

#### 1. Ошибки валидации (BAD_REQUEST)

Возникают при невалидных входных данных:

```typescript
// Примеры ошибок валидации
- "Сумма должна быть больше нуля"
- "Некорректный URL для возврата"
- "Описание не может превышать 128 символов"
- "Некорректный ID платежа"
```

**Обработка:**
- Код ошибки: `BAD_REQUEST`
- Валидация через Zod схемы
- Детальное сообщение об ошибке на русском языке
- Возврат ошибки до отправки запроса к API

#### 2. Ошибки доступа (FORBIDDEN)

Возникают при попытке доступа к чужим ресурсам:

```typescript
// Примеры ошибок доступа
- "Нет доступа к указанному workspace"
- "Нет доступа к этому платежу"
```

**Обработка:**
- Код ошибки: `FORBIDDEN`
- Проверка прав доступа перед операцией
- Логирование попыток несанкционированного доступа

#### 3. Ошибки конфигурации

Возникают при отсутствии учетных данных:

```typescript
// Пример ошибки конфигурации
- "Отсутствуют учетные данные ЮКасса (YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)"
```

**Обработка:**
- Проверка при инициализации клиента
- Выброс исключения с понятным сообщением
- Логирование ошибки конфигурации

#### 4. Ошибки API ЮКасса

Возникают при проблемах с API ЮКасса:

```typescript
// Примеры ошибок API
- "Ошибка создания платежа: {описание от ЮКасса}"
- "Платеж не найден"
- "Ошибка получения платежа: {описание}"
```

**Обработка:**
- Парсинг ответа от API
- Извлечение описания ошибки
- Логирование полного ответа
- Возврат понятного сообщения пользователю

#### 5. Ошибки базы данных (INTERNAL_SERVER_ERROR)

Возникают при проблемах с БД:

```typescript
// Примеры ошибок БД
- "Не удалось сохранить платеж"
- "Не удалось обновить статус платежа"
```

**Обработка:**
- Код ошибки: `INTERNAL_SERVER_ERROR`
- Логирование полной информации об ошибке
- Возврат общего сообщения пользователю
- Откат транзакции (если применимо)

### Стратегия логирования

```typescript
// Логирование запросов к API (без секретных данных)
console.log("Создание платежа:", {
  amount: params.amount,
  currency: params.currency,
  userId: metadata.userId,
  // НЕ логируем: shopId, secretKey
});

// Логирование webhook
console.log("Получен webhook:", {
  event: webhook.event,
  paymentId: webhook.object.id,
  status: webhook.object.status,
});

// Логирование ошибок
console.error("Ошибка обработки платежа:", {
  error: error.message,
  stack: error.stack,
  context: { userId, paymentId },
});
```

## Стратегия тестирования

### Двойной подход к тестированию

Интеграция требует комбинации unit-тестов и property-based тестов для обеспечения корректности.

#### Unit-тесты

**Назначение:** Проверка конкретных примеров, edge cases и интеграционных точек.

**Примеры unit-тестов:**

1. **Создание платежа с валидными данными**
   ```typescript
   test("создает платеж с корректными параметрами", async () => {
     const payment = await createPayment({
       amount: 1000,
       currency: "RUB",
       description: "Тестовый платеж",
       returnUrl: "https://example.com/return",
     });
     
     expect(payment.status).toBe("pending");
     expect(payment.amount).toBe("1000");
   });
   ```

2. **Обработка webhook с успешным статусом**
   ```typescript
   test("обновляет статус при получении webhook succeeded", async () => {
     const webhook = {
       type: "notification",
       event: "payment.succeeded",
       object: { id: "test-payment-id", status: "succeeded" },
     };
     
     await handleWebhook(webhook);
     const payment = await getPayment("test-payment-id");
     
     expect(payment.status).toBe("succeeded");
     expect(payment.completedAt).toBeDefined();
   });
   ```

3. **Edge case: отсутствующие учетные данные**
   ```typescript
   test("выбрасывает ошибку при отсутствии YOOKASSA_SHOP_ID", () => {
     delete process.env.YOOKASSA_SHOP_ID;
     
     expect(() => createYookassaClient()).toThrow(
       "Отсутствуют учетные данные ЮКасса"
     );
   });
   ```

4. **Edge case: платеж не найден**
   ```typescript
   test("возвращает ошибку для несуществующего платежа", async () => {
     await expect(
       checkPaymentStatus({ paymentId: "non-existent-id" })
     ).rejects.toThrow("Платеж не найден");
   });
   ```

#### Property-based тесты

**Назначение:** Проверка универсальных свойств на большом количестве сгенерированных входных данных.

**Конфигурация:**
- Библиотека: `fast-check` для TypeScript
- Минимум 100 итераций на тест
- Теги с ссылками на свойства из design.md

**Примеры property-based тестов:**

1. **Свойство 1: Уникальность ключа идемпотентности**
   ```typescript
   // Feature: yookassa-integration, Property 1: Уникальность ключа идемпотентности
   test("каждый платеж имеет уникальный idempotenceKey", async () => {
     await fc.assert(
       fc.asyncProperty(
         fc.array(fc.record({
           amount: fc.double({ min: 0.01, max: 1000000 }),
           description: fc.string({ maxLength: 128 }),
         }), { minLength: 2, maxLength: 10 }),
         async (paymentInputs) => {
           const payments = await Promise.all(
             paymentInputs.map(input => createPayment({
               ...input,
               currency: "RUB",
               returnUrl: "https://example.com/return",
             }))
           );
           
           const keys = payments.map(p => p.idempotenceKey);
           const uniqueKeys = new Set(keys);
           
           expect(uniqueKeys.size).toBe(keys.length);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

2. **Свойство 3: Начальный статус платежа**
   ```typescript
   // Feature: yookassa-integration, Property 3: Начальный статус платежа
   test("все новые платежи имеют статус pending", async () => {
     await fc.assert(
       fc.asyncProperty(
         fc.record({
           amount: fc.double({ min: 0.01, max: 1000000 }),
           description: fc.option(fc.string({ maxLength: 128 })),
         }),
         async (input) => {
           const payment = await createPayment({
             ...input,
             currency: "RUB",
             returnUrl: "https://example.com/return",
           });
           
           expect(payment.status).toBe("pending");
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

3. **Свойство 6: Валидация входных данных**
   ```typescript
   // Feature: yookassa-integration, Property 6: Валидация входных данных
   test("валидация отклоняет некорректные данные", async () => {
     await fc.assert(
       fc.asyncProperty(
         fc.oneof(
           fc.record({ amount: fc.double({ max: 0 }) }), // Отрицательная сумма
           fc.record({ amount: fc.constant(0) }), // Нулевая сумма
           fc.record({ returnUrl: fc.string() }), // Невалидный URL
         ),
         async (invalidInput) => {
           await expect(
             createPayment({
               ...invalidInput,
               currency: "RUB",
               returnUrl: invalidInput.returnUrl || "https://example.com",
             })
           ).rejects.toThrow();
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

4. **Свойство 4: Обновление статуса через webhook**
   ```typescript
   // Feature: yookassa-integration, Property 4: Обновление статуса через webhook
   test("webhook обновляет статус платежа", async () => {
     await fc.assert(
       fc.asyncProperty(
         fc.constantFrom("succeeded", "canceled"),
         async (newStatus) => {
           // Создаем платеж
           const payment = await createPayment({
             amount: 1000,
             currency: "RUB",
             returnUrl: "https://example.com/return",
           });
           
           // Отправляем webhook
           await handleWebhook({
             type: "notification",
             event: `payment.${newStatus}`,
             object: {
               id: payment.yookassaId,
               status: newStatus,
               amount: { value: "1000", currency: "RUB" },
             },
           });
           
           // Проверяем обновление
           const updated = await getPayment(payment.id);
           expect(updated.status).toBe(newStatus);
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

### Тестирование с моками

Для тестирования без реальных запросов к API ЮКасса:

```typescript
// Мок клиента ЮКасса
const mockYookassaClient = {
  createPayment: vi.fn().mockResolvedValue({
    id: "test-payment-id",
    status: "pending",
    amount: { value: "1000.00", currency: "RUB" },
    confirmation: {
      type: "redirect",
      confirmation_url: "https://yookassa.ru/checkout/test",
    },
  }),
  getPayment: vi.fn().mockResolvedValue({
    id: "test-payment-id",
    status: "succeeded",
    amount: { value: "1000.00", currency: "RUB" },
  }),
};
```

### Покрытие тестами

**Обязательное покрытие:**
- ✅ Все tRPC процедуры (create, get, list, checkStatus)
- ✅ Webhook-сервис на Hono (обработка webhook, API-верификация, безопасность)
- ✅ Валидация всех Zod схем
- ✅ Обработка всех типов ошибок
- ✅ Все свойства корректности (12 property-based тестов)
- ✅ Edge cases (отсутствие конфигурации, несуществующий платеж, невалидные данные)

**Опциональное покрытие:**
- Интеграционные тесты с реальным API ЮКасса (тестовый режим)
- E2E тесты полного потока оплаты
- Нагрузочное тестирование

