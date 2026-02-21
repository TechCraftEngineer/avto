import { and, eq } from "drizzle-orm";
import type { DbClient } from "../index";
import { userIntegration, type NewUserIntegration } from "../schema";
import { decryptCredentials, encryptCredentials } from "../utils/encryption";

/**
 * Получить user-интеграцию по типу и userId
 */
export async function getUserIntegration(
  db: DbClient,
  userId: string,
  type: string,
) {
  const result = await db
    .select()
    .from(userIntegration)
    .where(
      and(
        eq(userIntegration.userId, userId),
        eq(userIntegration.type, type),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Создать или обновить user-интеграцию
 */
export async function upsertUserIntegration(
  db: DbClient,
  data: NewUserIntegration,
) {
  const existing = await getUserIntegration(db, data.userId, data.type);

  const encryptedData = {
    ...data,
    credentials: encryptCredentials(data.credentials as Record<string, string>),
  };

  if (existing) {
    const [updated] = await db
      .update(userIntegration)
      .set({
        name: encryptedData.name,
        credentials: encryptedData.credentials,
        metadata: encryptedData.metadata ?? existing.metadata,
        isActive: encryptedData.isActive ?? existing.isActive,
        updatedAt: new Date(),
      })
      .where(eq(userIntegration.id, existing.id))
      .returning();

    if (!updated) throw new Error("Failed to update user integration");
    return updated;
  }

  const [created] = await db
    .insert(userIntegration)
    .values(encryptedData)
    .returning();

  if (!created) throw new Error("Failed to create user integration");
  return created;
}

/**
 * Получить все user-интеграции пользователя
 */
export async function getUserIntegrationsByUser(
  db: DbClient,
  userId: string,
) {
  return db
    .select()
    .from(userIntegration)
    .where(eq(userIntegration.userId, userId));
}

/**
 * Получить credentials для user-интеграции (расшифрованные)
 */
export async function getUserIntegrationCredentials(
  db: DbClient,
  userId: string,
  type: string,
): Promise<Record<string, string> | null> {
  const row = await getUserIntegration(db, userId, type);
  if (!row?.credentials) return null;
  return decryptCredentials(row.credentials as Record<string, string>);
}

/**
 * Удалить user-интеграцию
 */
export async function deleteUserIntegration(
  db: DbClient,
  userId: string,
  type: string,
) {
  const existing = await getUserIntegration(db, userId, type);
  if (existing) {
    await db.delete(userIntegration).where(eq(userIntegration.id, existing.id));
  }
}

/**
 * Обновить время последнего использования
 */
export async function updateUserIntegrationLastUsed(
  db: DbClient,
  userId: string,
  type: string,
) {
  const existing = await getUserIntegration(db, userId, type);
  if (existing) {
    await db
      .update(userIntegration)
      .set({ lastUsedAt: new Date() })
      .where(eq(userIntegration.id, existing.id));
  }
}
