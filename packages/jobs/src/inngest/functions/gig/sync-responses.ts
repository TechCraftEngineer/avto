import { and, count, db, eq, sql } from "@qbs-autonaim/db";
import { gig, response } from "@qbs-autonaim/db/schema";
import { getProjectOffersFromWebWithCache } from "../../../services/kwork/get-kwork-project-offers";
import { inngest } from "../../client";

/**
 * Синхронизация откликов для gig с фриланс-платформ
 */
export const syncGigResponses = inngest.createFunction(
  {
    id: "sync-gig-responses",
    name: "Sync Gig Responses from Freelance Platforms",
  },
  { event: "gig/sync-responses" },
  async ({ event, step, publish }) => {
    const { gigId } = event.data;

    // Получаем gig
    const gigRecord = await step.run("get-gig", async () => {
      return await db.query.gig.findFirst({
        where: eq(gig.id, gigId),
      });
    });

    if (!gigRecord) {
      throw new Error(`Gig ${gigId} not found`);
    }

    // Проверяем, что у gig есть внешняя ссылка
    if (!gigRecord.url || !gigRecord.externalId) {
      return {
        success: false,
        message: "Gig has no external platform link",
        syncedCount: 0,
      };
    }

    // Синхронизируем в зависимости от платформы
    const syncResult = await step.run("sync-platform-responses", async () => {
      // Проверяем наличие externalId
      if (!gigRecord.externalId) {
        return {
          success: false,
          message: "Gig has no external ID",
          syncedCount: 0,
          responseIdsForChatImport: [] as string[],
        };
      }

      switch (gigRecord.source) {
        case "KWORK":
          return await syncKworkResponses(
            gigRecord.workspaceId,
            gigRecord.id,
            gigRecord.externalId,
            publish as (event: object) => Promise<void>,
          );
        case "FL_RU":
          return {
            ...(await syncFlRuResponses(gigRecord.externalId)),
            responseIdsForChatImport: [],
          };
        case "FREELANCE_RU":
          return {
            ...(await syncFreelanceRuResponses(gigRecord.externalId)),
            responseIdsForChatImport: [],
          };
        default:
          return {
            success: false,
            message: `Unsupported platform: ${gigRecord.source}`,
            syncedCount: 0,
            responseIdsForChatImport: [],
          };
      }
    });

    // Запуск импорта истории чатов для откликов Kwork с kworkWorkerId
    const responseIds = syncResult.responseIdsForChatImport ?? [];
    if (
      syncResult.success &&
      responseIds.length > 0 &&
      gigRecord.source === "KWORK"
    ) {
      await step.run("trigger-chat-import", async () => {
        await inngest.send(
          responseIds.map((responseId) => ({
            name: "kwork-chat/import-history" as const,
            data: { responseId, workspaceId: gigRecord.workspaceId },
          })),
        );
        return { triggered: responseIds.length };
      });
    }

    return {
      success: syncResult.success,
      message: syncResult.message,
      platform: gigRecord.source,
      externalId: gigRecord.externalId,
      syncedCount: syncResult.syncedCount,
    };
  },
);

/**
 * Синхронизация откликов с KWork через веб (парсинг страницы проекта).
 * API offers не работает, поэтому используется getProjectOffersFromWeb.
 */
async function syncKworkResponses(
  workspaceId: string,
  gigId: string,
  projectId: string,
  publish: (event: object) => Promise<void>,
) {
  const wantId = Number(projectId);
  if (!Number.isFinite(wantId)) {
    return {
      success: false,
      message: "Invalid Kwork project ID",
      syncedCount: 0,
      responseIdsForChatImport: [],
    };
  }

  const webResult = await getProjectOffersFromWebWithCache(
    db,
    workspaceId,
    wantId,
    { publish },
  );

  if (!webResult.success) {
    return {
      success: false,
      message: webResult.errorMessage ?? "Failed to fetch Kwork offers",
      syncedCount: 0,
      responseIdsForChatImport: [],
    };
  }

  const offers = webResult.offers ?? [];
  if (offers.length === 0) {
    return {
      success: true,
      message: "No offers found for this project",
      syncedCount: 0,
      responseIdsForChatImport: [],
    };
  }

  const parseDurationDays = (s: string): number | undefined => {
    const num = Number.parseInt(s.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  };

  const values = offers.map((offer) => {
    const { workerId, username, offerId, profileUrl: rawProfileUrl } = offer;
    const candidateId =
      workerId != null && workerId > 0
        ? `kwork_${workerId}`
        : username
          ? `kwork_user_${username}`
          : `kwork_offer_${offerId}`;
    const profileUrl =
      rawProfileUrl?.startsWith("http")
        ? rawProfileUrl
        : rawProfileUrl
          ? `https://kwork.ru${rawProfileUrl.startsWith("/") ? "" : "/"}${rawProfileUrl}`
          : username
            ? `https://kwork.ru/user/${username}`
            : undefined;

    return {
      entityType: "gig" as const,
      entityId: gigId,
      candidateId,
      candidateName: offer.username || "Кандидат Kwork",
      profileUrl,
      platformProfileUrl: profileUrl,
      coverLetter: offer.description || undefined,
      proposedPrice: offer.price > 0 ? offer.price : undefined,
      proposedDeliveryDays: offer.duration
        ? parseDurationDays(offer.duration)
        : undefined,
      importSource: "KWORK" as const,
      respondedAt: new Date(),
      profileData: {
        kworkOfferId: offerId,
        kworkWantId: offer.projectId,
        ...(workerId != null && workerId > 0 && { kworkWorkerId: workerId }),
        ...(username && { kworkUsername: username }),
      },
    };
  });

  const inserted = await db
    .insert(response)
    .values(values)
    .onConflictDoUpdate({
      target: [response.entityType, response.entityId, response.candidateId],
      set: {
        candidateName: sql`excluded.candidate_name`,
        profileUrl: sql`excluded.profile_url`,
        platformProfileUrl: sql`excluded.platform_profile_url`,
        coverLetter: sql`excluded.cover_letter`,
        proposedPrice: sql`excluded.proposed_price`,
        proposedDeliveryDays: sql`excluded.proposed_delivery_days`,
        profileData: sql`excluded.profile_data`,
        respondedAt: sql`excluded.responded_at`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: response.id });

  const countsResult = await db
    .select({
      total: count(),
      newCount: sql<number>`count(case when ${response.status} = 'NEW' then 1 end)`,
    })
    .from(response)
    .where(and(eq(response.entityType, "gig"), eq(response.entityId, gigId)));
  const counts = countsResult[0] ?? { total: 0, newCount: 0 };

  await db
    .update(gig)
    .set({ responses: counts.total, newResponses: counts.newCount })
    .where(eq(gig.id, gigId));

  const responseIdsForChatImport = inserted
    .map((row, i) => {
      const val = values[i];
      if (!val) return null;
      const workerId = (val.profileData as { kworkWorkerId?: number })
        ?.kworkWorkerId;
      return workerId != null ? row.id : null;
    })
    .filter((id): id is string => id != null);

  return {
    success: true,
    message: `Synced ${inserted.length} Kwork offers`,
    syncedCount: inserted.length,
    responseIdsForChatImport,
  };
}

/**
 * Синхронизация откликов с FL.ru
 */
async function syncFlRuResponses(externalId: string) {
  // TODO: Реализовать API интеграцию с FL.ru
  console.log(
    `[sync-gig-responses] Syncing FL.ru responses for project ${externalId}`,
  );

  return {
    success: true,
    message: "FL.ru sync completed (stub)",
    syncedCount: 0,
  };
}

/**
 * Синхронизация откликов с Freelance.ru
 */
async function syncFreelanceRuResponses(externalId: string) {
  // TODO: Реализовать API интеграцию с Freelance.ru
  console.log(
    `[sync-gig-responses] Syncing Freelance.ru responses for project ${externalId}`,
  );

  return {
    success: true,
    message: "Freelance.ru sync completed (stub)",
    syncedCount: 0,
  };
}
