import { and, eq } from "drizzle-orm";
import type { DbClient } from "../index";
import { integration, type NewIntegration } from "../schema";
import { decryptCredentials, encryptCredentials } from "../utils/encryption";

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None" | "Default";
}

/**
 * Получить интеграцию по типу и workspace_id
 */
export async function getIntegration(
  db: DbClient,
  type: string,
  workspaceId: string,
) {
  const result = await db
    .select()
    .from(integration)
    .where(
      and(eq(integration.type, type), eq(integration.workspaceId, workspaceId)),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Создать или обновить интеграцию
 * 
 * ВАЖНО: Эта функция должна вызываться минимально:
 * - Один раз в начале процесса верификации для создания записи
 * - При успешной авторизации для обновления credentials
 * - В API роутерах для защиты от race conditions
 * 
 * Для обновления статуса используйте setIntegrationSetupStatus()
 * Для работы с metadata используйте специализированные функции
 */
export async function upsertIntegration(db: DbClient, data: NewIntegration) {
  const existing = await getIntegration(db, data.type, data.workspaceId);

  // Шифруем credentials перед сохранением
  const encryptedData = {
    ...data,
    credentials: encryptCredentials(data.credentials as Record<string, string>),
  };

  if (existing) {
    // Явно обновляем только нужные поля — metadata (hhPendingCaptcha и др.) не трогаем
    const [updated] = await db
      .update(integration)
      .set({
        workspaceId: encryptedData.workspaceId,
        type: encryptedData.type,
        name: encryptedData.name,
        credentials: encryptedData.credentials,
        isActive: encryptedData.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existing.id))
      .returning();

    if (!updated) throw new Error("Failed to update integration");
    return updated;
  }

  // При создании новой интеграции проверяем уникальность через БД
  // Constraint workspaceTypeUnique автоматически выбросит ошибку если уже существует
  const [created] = await db
    .insert(integration)
    .values(encryptedData)
    .returning();
  if (!created) throw new Error("Failed to create integration");
  return created;
}

/** Метаданные для интеграции Kwork (web cookies) */
export const KWORK_WEB_COOKIES_SAVED_AT_KEY = "kworkWebCookiesSavedAt" as const;

/** Статус настройки интеграции */
export const INTEGRATION_SETUP_STATUS_KEY = "setupStatus" as const;
export type IntegrationSetupStatus =
  | "completed"
  | "pending_verification"
  | "pending_captcha";

/** Ключ для ожидающего кода 2FA HH — job опрашивает, юзер вводит в UI */
export const HH_PENDING_VERIFICATION_CODE_KEY =
  "hhPendingVerificationCode" as const;
export const HH_PENDING_VERIFICATION_AT_KEY =
  "hhPendingVerificationCodeAt" as const;

/** Ключ для запроса повторной отправки кода — job кликает кнопку на HH */
export const HH_RESEND_REQUESTED_KEY = "hhResendRequested" as const;

/** Ключ для ожидающего ввода капчи HH — job опрашивает, юзер вводит в UI */
export const HH_PENDING_CAPTCHA_KEY = "hhPendingCaptcha" as const;

export async function saveHHResendRequested(
  db: DbClient,
  workspaceId: string,
): Promise<void> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing) {
    throw new Error(`Integration hh not found for workspace ${workspaceId}`);
  }
  const metadata = (existing.metadata as Record<string, unknown>) ?? {};
  await db
    .update(integration)
    .set({
      metadata: {
        ...metadata,
        [HH_RESEND_REQUESTED_KEY]: true,
      },
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));
}

export async function getAndClearHHResendRequested(
  db: DbClient,
  workspaceId: string,
): Promise<boolean> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing?.metadata) return false;

  const meta = existing.metadata as Record<string, unknown>;
  if (meta[HH_RESEND_REQUESTED_KEY] !== true) return false;

  const { [HH_RESEND_REQUESTED_KEY]: _, ...rest } = meta;
  await db
    .update(integration)
    .set({
      metadata: Object.keys(rest).length > 0 ? rest : null,
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));

  return true;
}

/**
 * Устанавливает статус настройки интеграции
 */
export async function setIntegrationSetupStatus(
  db: DbClient,
  type: string,
  workspaceId: string,
  status: IntegrationSetupStatus,
): Promise<void> {
  const existing = await getIntegration(db, type, workspaceId);
  if (!existing) {
    throw new Error(`Integration ${type} not found for workspace ${workspaceId}`);
  }
  const metadata = (existing.metadata as Record<string, unknown>) ?? {};
  await db
    .update(integration)
    .set({
      metadata: {
        ...metadata,
        [INTEGRATION_SETUP_STATUS_KEY]: status,
      },
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));
}

/**
 * Сохраняет код 2FA от юзера для HH — job с открытым браузером опрашивает и найдёт
 */
export async function saveHHPendingVerificationCode(
  db: DbClient,
  workspaceId: string,
  code: string,
): Promise<void> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing) {
    throw new Error(`Integration hh not found for workspace ${workspaceId}`);
  }
  const metadata = (existing.metadata as Record<string, unknown>) ?? {};
  await db
    .update(integration)
    .set({
      metadata: {
        ...metadata,
        [HH_PENDING_VERIFICATION_CODE_KEY]: code,
        [HH_PENDING_VERIFICATION_AT_KEY]: Date.now(),
      },
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));
}

/**
 * Читает и очищает код 2FA — вызывает job в цикле опроса
 */
export async function getAndClearHHPendingVerificationCode(
  db: DbClient,
  workspaceId: string,
): Promise<string | null> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing?.metadata) return null;

  const meta = existing.metadata as Record<string, unknown>;
  const code = meta[HH_PENDING_VERIFICATION_CODE_KEY] as string | undefined;
  if (!code || typeof code !== "string") return null;

  // Очищаем сразу — код одноразовый
  const {
    [HH_PENDING_VERIFICATION_CODE_KEY]: _,
    [HH_PENDING_VERIFICATION_AT_KEY]: __,
    ...rest
  } = meta;
  await db
    .update(integration)
    .set({
      metadata: Object.keys(rest).length > 0 ? rest : null,
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));

  return code;
}

/**
 * Сохраняет введённую капчу от юзера для HH — job опрашивает и найдёт
 */
export async function saveHHPendingCaptcha(
  db: DbClient,
  workspaceId: string,
  captcha: string,
): Promise<void> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing) {
    throw new Error(`Integration hh not found for workspace ${workspaceId}`);
  }
  const metadata = (existing.metadata as Record<string, unknown>) ?? {};
  await db
    .update(integration)
    .set({
      metadata: {
        ...metadata,
        [HH_PENDING_CAPTCHA_KEY]: captcha,
        [INTEGRATION_SETUP_STATUS_KEY]: "pending_captcha" as IntegrationSetupStatus,
      },
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));
}

/**
 * Читает и очищает введённую капчу — вызывает job в цикле опроса
 */
export async function getAndClearHHPendingCaptcha(
  db: DbClient,
  workspaceId: string,
): Promise<string | null> {
  const existing = await getIntegration(db, "hh", workspaceId);
  if (!existing?.metadata) return null;

  const meta = existing.metadata as Record<string, unknown>;
  const captcha = meta[HH_PENDING_CAPTCHA_KEY] as string | undefined;
  if (!captcha || typeof captcha !== "string") return null;

  const { [HH_PENDING_CAPTCHA_KEY]: _, ...rest } = meta;
  await db
    .update(integration)
    .set({
      metadata: Object.keys(rest).length > 0 ? rest : null,
      updatedAt: new Date(),
    })
    .where(eq(integration.id, existing.id));

  return captcha;
}

/** Время жизни web cookies в секундах (~50 мин, web auth token живёт 1 мин) */
export const KWORK_WEB_COOKIES_TTL_SEC = 50 * 60;

/**
 * Сохранить cookies для интеграции.
 * Для kwork можно передать metadataUpdate чтобы обновить kworkWebCookiesSavedAt.
 */
export async function saveCookiesForIntegration(
  db: DbClient,
  type: string,
  cookies: Cookie[],
  workspaceId: string,
  metadataUpdate?: Record<string, unknown>,
) {
  const existing = await getIntegration(db, type, workspaceId);

  if (!existing) {
    throw new Error(`Integration ${type} not found`);
  }

  const updateData: {
    cookies: typeof integration.$inferInsert.cookies;
    lastUsedAt: Date;
    updatedAt: Date;
    metadata?: Record<string, unknown>;
  } = {
    cookies: cookies as unknown as typeof integration.$inferInsert.cookies,
    lastUsedAt: new Date(),
    updatedAt: new Date(),
  };

  if (metadataUpdate) {
    updateData.metadata = {
      ...((existing.metadata as Record<string, unknown>) ?? {}),
      ...metadataUpdate,
    };
  }

  await db
    .update(integration)
    .set(updateData)
    .where(eq(integration.id, existing.id));
}

/**
 * Загрузить cookies для интеграции
 */
export async function loadCookiesForIntegration(
  db: DbClient,
  type: string,
  workspaceId: string,
): Promise<Cookie[] | null> {
  const result = await getIntegration(db, type, workspaceId);

  if (!result?.cookies) {
    return null;
  }

  return result.cookies as Cookie[];
}

/**
 * Получить credentials для интеграции (расшифрованные)
 */
export async function getIntegrationCredentials(
  db: DbClient,
  type: string,
  workspaceId: string,
): Promise<Record<string, string> | null> {
  const result = await getIntegration(db, type, workspaceId);
  if (!result?.credentials) {
    return null;
  }

  // Расшифровываем credentials перед возвратом
  return decryptCredentials(result.credentials as Record<string, string>);
}

/**
 * Получить credentials и workspaceId для интеграции
 */
export async function getIntegrationWithCredentials(
  db: DbClient,
  type: string,
  workspaceId: string,
): Promise<{
  credentials: Record<string, string>;
  workspaceId: string;
} | null> {
  const result = await getIntegration(db, type, workspaceId);
  if (!result?.credentials) {
    return null;
  }

  return {
    credentials: decryptCredentials(
      result.credentials as Record<string, string>,
    ),
    workspaceId: result.workspaceId,
  };
}

/**
 * Обновить время последнего использования
 */
export async function updateLastUsed(
  db: DbClient,
  type: string,
  workspaceId: string,
) {
  const existing = await getIntegration(db, type, workspaceId);

  if (existing) {
    await db
      .update(integration)
      .set({
        lastUsedAt: new Date(),
      })
      .where(eq(integration.id, existing.id));
  }
}

/**
 * Получить все интеграции
 */
export async function getAllIntegrations(db: DbClient) {
  return db.select().from(integration);
}

/**
 * Получить интеграции по workspace
 */
export async function getIntegrationsByWorkspace(
  db: DbClient,
  workspaceId: string,
) {
  return db
    .select()
    .from(integration)
    .where(eq(integration.workspaceId, workspaceId));
}

/**
 * Удалить интеграцию
 */
export async function deleteIntegration(
  db: DbClient,
  type: string,
  workspaceId: string,
) {
  const existing = await getIntegration(db, type, workspaceId);

  if (existing) {
    await db.delete(integration).where(eq(integration.id, existing.id));
  }
}

/**
 * Пометить интеграцию как имеющую проблемы с авторизацией
 */
export async function markIntegrationAuthError(
  db: DbClient,
  type: string,
  workspaceId: string,
  reason: string,
) {
  const existing = await getIntegration(db, type, workspaceId);

  if (existing) {
    const metadata = (existing.metadata as Record<string, unknown>) ?? {};
    await db
      .update(integration)
      .set({
        metadata: {
          ...metadata,
          authError: reason,
          authErrorAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existing.id));
  }
}

/**
 * Очистить ошибку авторизации (при успешном входе)
 */
export async function clearIntegrationAuthError(
  db: DbClient,
  type: string,
  workspaceId: string,
) {
  const existing = await getIntegration(db, type, workspaceId);

  if (existing?.metadata) {
    const metadata = existing.metadata as Record<string, unknown>;
    const { authError: _, authErrorAt: __, ...rest } = metadata;

    await db
      .update(integration)
      .set({
        metadata: Object.keys(rest).length > 0 ? rest : null,
        updatedAt: new Date(),
      })
      .where(eq(integration.id, existing.id));
  }
}
