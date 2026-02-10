import { relations } from "drizzle-orm";
import { user } from "../auth/user";
import { organization } from "../organization/organization";
import { workspace } from "../workspace/workspace";
import { payment } from "./payment";

/**
 * Связи для таблицы payments
 *
 * Определяет отношения платежей с:
 * - user: пользователь, инициировавший платеж (many-to-one)
 * - workspace: рабочее пространство, для которого производится оплата (many-to-one)
 * - organization: организация, владеющая workspace (many-to-one)
 */
export const paymentRelations = relations(payment, ({ one }) => ({
  // Связь с пользователем, который создал платеж
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),

  // Связь с workspace, для которого производится оплата
  workspace: one(workspace, {
    fields: [payment.workspaceId],
    references: [workspace.id],
  }),

  // Связь с organization для консолидированной отчетности
  organization: one(organization, {
    fields: [payment.organizationId],
    references: [organization.id],
  }),
}));
