/**
 * Relations для глобальной таблицы кандидатов и таблицы связей с организациями.
 */

import { relations } from "drizzle-orm";
import { organization } from "../organization/organization";
import { candidateOrganization } from "./candidate-organization";
import { globalCandidate } from "./global-candidate";

/**
 * Relations для глобального кандидата.
 * Один кандидат может быть связан с несколькими организациями.
 */
export const globalCandidateRelations = relations(
  globalCandidate,
  ({ many }) => ({
    // Связь с организациями через таблицу связей
    organizationLinks: many(candidateOrganization),
  }),
);

/**
 * Relations для таблицы связей кандидат-организация.
 */
export const candidateOrganizationRelations = relations(
  candidateOrganization,
  ({ one }) => ({
    // Связь с глобальным кандидатом
    candidate: one(globalCandidate, {
      fields: [candidateOrganization.candidateId],
      references: [globalCandidate.id],
    }),
    // Связь с организацией
    organization: one(organization, {
      fields: [candidateOrganization.organizationId],
      references: [organization.id],
    }),
  }),
);
