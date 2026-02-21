import { relations } from "drizzle-orm";
import { user } from "../auth/user";
import { userIntegration } from "./user-integration";

export const userIntegrationRelations = relations(userIntegration, ({ one }) => ({
  user: one(user, {
    fields: [userIntegration.userId],
    references: [user.id],
  }),
}));
