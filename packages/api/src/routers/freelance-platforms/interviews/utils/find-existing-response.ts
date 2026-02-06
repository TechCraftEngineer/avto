import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";
import { normalizeProfileUrl } from "./normalize-profile-url";

interface FreelancerInfo {
  name: string;
  email?: string;
  platformProfileUrl?: string;
}

export async function findExistingResponse(
  db: Database,
  entityType: "vacancy" | "gig",
  entityId: string,
  freelancerInfo: FreelancerInfo,
) {
  if (freelancerInfo.platformProfileUrl) {
    const normalizedProfileUrl = normalizeProfileUrl(
      freelancerInfo.platformProfileUrl,
    );

    const field =
      entityType === "vacancy" ? "platformProfileUrl" : "candidateId";

    return await db
      .select()
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityType, entityType),
          eq(responseTable.entityId, entityId),
          eq(responseTable[field], normalizedProfileUrl),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]);
  }

  // Для откликов из hh.ru ищем по имени и entityId
  const responses = await db
    .select()
    .from(responseTable)
    .where(
      and(
        eq(responseTable.entityType, entityType),
        eq(responseTable.entityId, entityId),
        eq(responseTable.candidateName, freelancerInfo.name),
      ),
    )
    .limit(5);

  // Если есть email, фильтруем по нему
  if (freelancerInfo.email && responses.length > 0) {
    return responses.find((r) => r.email === freelancerInfo.email);
  }

  return responses[0];
}
