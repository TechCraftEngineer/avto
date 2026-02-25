import { relations } from "drizzle-orm";
import { user } from "../auth/user";
import { globalCandidate } from "../candidate/global-candidate";
import { file } from "../file/file";
import { workspace } from "../workspace/workspace";
import { personalChatMessage } from "./personal-chat-message";
import { personalChatSession } from "./personal-chat-session";
import { telegramSession } from "./telegram-session";
import { userTelegramSession } from "./user-telegram-session";

/**
 * Relations для telegram сессий
 */
export const telegramSessionRelations = relations(
  telegramSession,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [telegramSession.workspaceId],
      references: [workspace.id],
    }),
  }),
);

/**
 * Relations для личных Telegram сессий пользователей
 */
export const userTelegramSessionRelations = relations(
  userTelegramSession,
  ({ one }) => ({
    user: one(user, {
      fields: [userTelegramSession.userId],
      references: [user.id],
    }),
  }),
);

/**
 * Relations для сессий ручного чата
 */
export const personalChatSessionRelations = relations(
  personalChatSession,
  ({ one, many }) => ({
    candidate: one(globalCandidate, {
      fields: [personalChatSession.globalCandidateId],
      references: [globalCandidate.id],
    }),
    messages: many(personalChatMessage),
    user: one(user, {
      fields: [personalChatSession.userId],
      references: [user.id],
    }),
  }),
);

/**
 * Relations для сообщений ручного чата
 */
export const personalChatMessageRelations = relations(
  personalChatMessage,
  ({ one }) => ({
    file: one(file, {
      fields: [personalChatMessage.fileId],
      references: [file.id],
    }),
    session: one(personalChatSession, {
      fields: [personalChatMessage.sessionId],
      references: [personalChatSession.id],
    }),
  }),
);
