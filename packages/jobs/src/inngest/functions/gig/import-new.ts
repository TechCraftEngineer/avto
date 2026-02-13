import { and, db, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import {
  getMyWants,
  type KworkWantPayer,
} from "@qbs-autonaim/integration-clients";
import { z } from "zod";
import { executeWithKworkTokenRefresh } from "../../../services/kwork";
import {
  importNewGigsChannel,
  workspaceNotificationsChannel,
} from "../../channels/client";
import { inngest } from "../../client";

const ImportNewGigsEventSchema = z.object({
  workspaceId: z.string().min(1, "ID рабочего пространства обязателен"),
});

function mapKworkErrorToUserMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (
      message.includes("не настроена") ||
      message.includes("credentials") ||
      message.includes("токен")
    ) {
      return "Kwork интеграция не настроена или токен истёк";
    }
    if (
      message.includes("timeout") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ECONNREFUSED")
    ) {
      return "Не удалось подключиться к Kwork. Попробуйте позже";
    }
    if (message.length < 100 && !message.includes("Error:")) {
      return message;
    }
  }
  return "Не удалось импортировать проекты с Kwork";
}

function mapKworkWantToGig(want: KworkWantPayer, workspaceId: string) {
  const externalId = String(want.id);
  const priceLimit = want.price_limit;
  return {
    workspaceId,
    title: want.title ?? "Проект без названия",
    description: want.description ?? undefined,
    budgetMin: priceLimit ?? undefined,
    budgetMax: priceLimit ?? undefined,
    deadline: want.date_expire ? new Date(want.date_expire * 1000) : undefined,
    source: "KWORK" as const,
    externalId,
    url: `https://kwork.ru/project/${want.id}`,
    views: want.views ?? 0,
    responses: want.offers ?? 0,
  };
}

export const importNewGigsFunction = inngest.createFunction(
  {
    id: "import-new-gigs",
    name: "Импорт активных проектов Kwork",
    retries: 0,
    concurrency: 1,
  },
  { event: "gig/import.new" },
  async ({ event, step, publish }) => {
    const validationResult = ImportNewGigsEventSchema.safeParse(event.data);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message ||
        "Некорректные данные запроса";
      throw new Error(errorMessage);
    }

    const { workspaceId } = validationResult.data;

    await publish(
      importNewGigsChannel(workspaceId).progress({
        workspaceId,
        status: "started",
        message: "Начинаем импорт активных проектов",
      }),
    );

    const result = await step.run("import-new-gigs", async () => {
      let imported = 0;
      let updated = 0;
      let failed = 0;
      let page = 1;
      let hasMore = true;

      let totalPages = 1;

      try {
        while (hasMore) {
          await publish(
            importNewGigsChannel(workspaceId).progress({
              workspaceId,
              status: "processing",
              message: `Загрузка страницы ${page}...`,
              total: totalPages,
              processed: page - 1,
            }),
          );

          const apiResult = await executeWithKworkTokenRefresh(
            db,
            workspaceId,
            (token) => getMyWants(token, { page }),
            { publish },
          );

          if (!apiResult.success || !apiResult.response) {
            const msg =
              apiResult.error?.message ?? "Не удалось получить проекты";
            throw new Error(msg);
          }

          const wants = apiResult.response as KworkWantPayer[];

          for (const want of wants) {
            try {
              const gigData = mapKworkWantToGig(want, workspaceId);
              const existing = await db.query.gig.findFirst({
                where: and(
                  eq(gig.workspaceId, workspaceId),
                  eq(gig.source, "KWORK"),
                  eq(gig.externalId, gigData.externalId),
                ),
              });

              if (existing) {
                await db
                  .update(gig)
                  .set({
                    title: gigData.title,
                    description: gigData.description,
                    budgetMin: gigData.budgetMin,
                    budgetMax: gigData.budgetMax,
                    deadline: gigData.deadline,
                    url: gigData.url,
                    views: gigData.views,
                    responses: gigData.responses,
                    updatedAt: new Date(),
                  })
                  .where(eq(gig.id, existing.id));
                updated += 1;
              } else {
                await db.insert(gig).values({
                  ...gigData,
                  type: "OTHER",
                });
                imported += 1;
              }
            } catch (itemError) {
              console.error(
                `[import-new-gigs] Failed to import want ${want.id}:`,
                itemError,
              );
              failed += 1;
            }
          }

          const paging = apiResult.paging;
          totalPages = paging?.pages ?? totalPages;
          hasMore = wants.length > 0 && page < totalPages;
          page += 1;
        }

        await publish(
          importNewGigsChannel(workspaceId).progress({
            workspaceId,
            status: "completed",
            message: "Импорт завершён",
          }),
        );

        await publish(
          importNewGigsChannel(workspaceId).result({
            workspaceId,
            success: true,
            imported,
            updated,
            failed,
          }),
        );

        await publish(
          workspaceNotificationsChannel(workspaceId)["task-completed"]({
            workspaceId,
            taskType: "import",
            taskId: workspaceId,
            success: true,
            message: `Импортировано ${imported} новых проектов, обновлено ${updated}`,
            timestamp: new Date().toISOString(),
          }),
        );

        return { success: true, imported, updated, failed };
      } catch (error) {
        const userMessage = mapKworkErrorToUserMessage(error);

        await publish(
          importNewGigsChannel(workspaceId).progress({
            workspaceId,
            status: "error",
            message: userMessage,
          }),
        );

        await publish(
          importNewGigsChannel(workspaceId).result({
            workspaceId,
            success: false,
            imported,
            updated,
            failed,
            error: userMessage,
          }),
        );

        await publish(
          workspaceNotificationsChannel(workspaceId)["task-completed"]({
            workspaceId,
            taskType: "import",
            taskId: workspaceId,
            success: false,
            message: userMessage,
            timestamp: new Date().toISOString(),
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
