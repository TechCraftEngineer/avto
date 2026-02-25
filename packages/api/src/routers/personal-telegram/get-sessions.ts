/**
 * Список личных Telegram-сессий пользователя
 */

import { eq } from "@qbs-autonaim/db";
import { userTelegramSession } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../orpc";

export const getSessionsRouter = protectedProcedure.handler(
  async ({ context }) => {
    const userId = context.session.user.id;

    const sessions = await context.db
      .select()
      .from(userTelegramSession)
      .where(eq(userTelegramSession.userId, userId));

    return sessions.map((s) => ({
      id: s.id,
      phone: s.phone,
      userInfo: s.userInfo,
      isActive: s.isActive,
      authError: s.authError,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
    }));
  },
);
