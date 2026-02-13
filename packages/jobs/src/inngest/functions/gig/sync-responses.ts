import {
  and,
  count,
  db,
  eq,
  getIntegrationCredentials,
  sql,
} from "@qbs-autonaim/db";
import { gig, response } from "@qbs-autonaim/db/schema";
import { getOffers, type KworkOffer } from "@qbs-autonaim/integration-clients";
import { executeWithKworkTokenRefresh } from "../../../services/kwork";
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
          return await syncFlRuResponses(gigRecord.externalId);
        case "FREELANCE_RU":
          return await syncFreelanceRuResponses(gigRecord.externalId);
        default:
          return {
            success: false,
            message: `Unsupported platform: ${gigRecord.source}`,
            syncedCount: 0,
          };
      }
    });

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
 * Синхронизация откликов с KWork
 */
async function syncKworkResponses(
  workspaceId: string,
  gigId: string,
  projectId: string,
  publish: (event: object) => Promise<void>,
) {
  const credentials = await getIntegrationCredentials(db, "kwork", workspaceId);
  if (!credentials?.token) {
    return {
      success: false,
      message: "Kwork integration not configured or token missing",
      syncedCount: 0,
    };
  }

  const wantId = Number(projectId);
  if (!Number.isFinite(wantId)) {
    return {
      success: false,
      message: "Invalid Kwork project ID",
      syncedCount: 0,
    };
  }

  const allOffers: KworkOffer[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore) {
      const result = await executeWithKworkTokenRefresh(
        db,
        workspaceId,
        (token) => getOffers(token, { page }),
        { publish },
      );
      if (!result.success || !result.response) {
        return {
          success: false,
          message: result.error?.message ?? "Failed to fetch Kwork offers",
          syncedCount: 0,
        };
      }
      const offers = result.response as KworkOffer[];
      allOffers.push(...offers);
      const paging = result.paging;
      const totalPages = paging?.pages ?? 1;
      hasMore =
        offers.length > 0 && (paging?.pages == null || page < totalPages);
      page += 1;
    }
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Ошибка синхронизации Kwork";
    return { success: false, message: msg, syncedCount: 0 };
  }

  const offersForProject = allOffers.filter(
    (o) => o.want_id != null && o.want_id === wantId,
  );

  if (offersForProject.length === 0) {
    return {
      success: true,
      message: "No offers found for this project",
      syncedCount: 0,
    };
  }

  const values = offersForProject.map((offer) => {
    const workerId =
      offer.user_id ??
      offer.worker_id ??
      (offer.project as { user_id?: number })?.user_id;
    const username =
      offer.username ??
      (offer.project as { username?: string })?.username;
    const candidateId = workerId != null
      ? `kwork_${workerId}`
      : username
        ? `kwork_user_${username}`
        : `kwork_offer_${offer.id}`;
    const profileUrl =
      username != null ? `https://kwork.ru/user/${username}` : undefined;

    return {
      entityType: "gig" as const,
      entityId: gigId,
      candidateId,
      candidateName: offer.title ?? "Кандидат Kwork",
      profileUrl,
      platformProfileUrl: profileUrl,
      coverLetter: offer.comment ?? undefined,
      proposedPrice: offer.price ?? undefined,
      proposedDeliveryDays: offer.duration ?? undefined,
      importSource: "KWORK" as const,
      respondedAt: offer.date_create
        ? new Date(offer.date_create * 1000)
        : new Date(),
      profileData: {
        kworkOfferId: offer.id,
        kworkWantId: offer.want_id,
        ...(workerId != null && { kworkWorkerId: workerId }),
        ...(username != null && { kworkUsername: username }),
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

  return {
    success: true,
    message: `Synced ${inserted.length} Kwork offers`,
    syncedCount: inserted.length,
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
