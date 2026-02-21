import { and, eq } from "@qbs-autonaim/db";
import { response as responseTable } from "@qbs-autonaim/db/schema";
import type { Database } from "../../../../types/database";
import { normalizeProfileUrl } from "./normalize-profile-url";

import type { FreelancerInfo } from "../types";

export async function findExistingResponse(
  db: Database,
  entityType: "vacancy" | "gig",
  entityId: string,
  freelancerInfo: FreelancerInfo,
) {
  console.log("[findExistingResponse] Поиск отклика:", {
    entityType,
    entityId,
    name: freelancerInfo.name,
    email: freelancerInfo.email,
    platformProfileUrl: freelancerInfo.platformProfileUrl,
  });

  if (freelancerInfo.platformProfileUrl) {
    const normalizedProfileUrl = normalizeProfileUrl(
      freelancerInfo.platformProfileUrl,
    );

    const field = entityType === "vacancy" ? "profileUrl" : "candidateId";

    const result = await db
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

    console.log("[findExistingResponse] Результат поиска по URL:", {
      found: !!result,
      responseId: result?.id,
    });

    return result;
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

  console.log("[findExistingResponse] Найдено откликов по имени:", {
    count: responses.length,
    responseIds: responses.map((r) => r.id),
  });

  // Если есть email, фильтруем по нему
  if (freelancerInfo.email && responses.length > 0) {
    const result = responses.find((r) => r.email === freelancerInfo.email);
    console.log("[findExistingResponse] Результат фильтрации по email:", {
      found: !!result,
      responseId: result?.id,
    });
    return result;
  }

  const result = responses[0];
  console.log("[findExistingResponse] Возвращаем первый отклик:", {
    found: !!result,
    responseId: result?.id,
  });

  return result;
}
