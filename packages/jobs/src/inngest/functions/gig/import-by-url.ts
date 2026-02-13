import { and, db, eq } from "@qbs-autonaim/db";
import { gig } from "@qbs-autonaim/db/schema";
import { getWant, type KworkWantPayer } from "@qbs-autonaim/integration-clients";
import { GigImportByUrlSchema } from "@qbs-autonaim/validators";
import { executeWithKworkTokenRefresh } from "../../../services/kwork";
import { importGigByUrlChannel } from "../../channels/client";
import { inngest } from "../../client";

export const importGigByUrlFunction = inngest.createFunction(
  {
    id: "import-gig-by-url",
    name: "Импорт gig по ссылке",
    retries: 1,
    concurrency: 5,
  },
  { event: "gig/import.by-url" },
  async ({ event, step, publish }) => {
    const { workspaceId, url, requestId } = event.data;

    await publish(
      importGigByUrlChannel(workspaceId, requestId).progress({
        workspaceId,
        requestId,
        status: "started",
        message: "Начинаем импорт проекта",
      }),
    );

    const result = await step.run("import-gig-by-url", async () => {
      try {
        await publish(
          importGigByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "validating",
            message: "Проверяем ссылку",
          }),
        );

        const validationResult = GigImportByUrlSchema.safeParse({ url });
        if (!validationResult.success) {
          const errorMessage =
            validationResult.error.issues[0]?.message ||
            "Введите корректную ссылку на проект с kwork.ru";

          await publish(
            importGigByUrlChannel(workspaceId, requestId).progress({
              workspaceId,
              requestId,
              status: "error",
              message: errorMessage,
            }),
          );

          await publish(
            importGigByUrlChannel(workspaceId, requestId).result({
              workspaceId,
              requestId,
              success: false,
              error: errorMessage,
            }),
          );

          return { success: false, error: errorMessage };
        }

        const match = url.match(/kwork\.ru\/project\/(\d+)/);
        const externalId = match?.[1];
        if (!externalId) {
          const errorMessage = "Не удалось извлечь ID проекта из ссылки";
          await publish(
            importGigByUrlChannel(workspaceId, requestId).progress({
              workspaceId,
              requestId,
              status: "error",
              message: errorMessage,
            }),
          );
          await publish(
            importGigByUrlChannel(workspaceId, requestId).result({
              workspaceId,
              requestId,
              success: false,
              error: errorMessage,
            }),
          );
          return { success: false, error: errorMessage };
        }

        const projectId = Number(externalId);
        if (!Number.isFinite(projectId)) {
          throw new Error("Некорректный ID проекта");
        }

        await publish(
          importGigByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "fetching",
            message: "Получаем данные проекта",
          }),
        );

        const apiResult = await executeWithKworkTokenRefresh(
          db,
          workspaceId,
          (token) => getWant(token, projectId),
          { publish },
        );

        if (!apiResult.success || !apiResult.response?.length) {
          const msg =
            apiResult.error?.message ?? "Не удалось получить данные проекта";
          throw new Error(msg);
        }

        const want = apiResult.response[0] as KworkWantPayer;
        const priceLimit = want.price_limit;

        await publish(
          importGigByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "saving",
            message: "Сохраняем проект",
          }),
        );

        const gigData = {
          workspaceId,
          title: want.title ?? "Проект без названия",
          description: want.description ?? undefined,
          budgetMin: priceLimit ?? undefined,
          budgetMax: priceLimit ?? undefined,
          deadline: want.date_expire
            ? new Date(want.date_expire * 1000)
            : undefined,
          source: "KWORK" as const,
          externalId: String(want.id),
          url: `https://kwork.ru/project/${want.id}`,
          views: want.views ?? 0,
          responses: want.offers ?? 0,
        };

        const existing = await db.query.gig.findFirst({
          where: and(
            eq(gig.workspaceId, workspaceId),
            eq(gig.source, "KWORK"),
            eq(gig.externalId, gigData.externalId),
          ),
        });

        let gigId: string;

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
          gigId = existing.id;
        } else {
          const [inserted] = await db
            .insert(gig)
            .values({
              ...gigData,
              type: "OTHER",
            })
            .returning({ id: gig.id });
          if (!inserted) throw new Error("Failed to create gig");
          gigId = inserted.id;
        }

        await publish(
          importGigByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "completed",
            message: "Проект импортирован",
          }),
        );

        await publish(
          importGigByUrlChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: true,
            gigId,
          }),
        );

        return { success: true, gigId };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Не удалось импортировать проект";

        await publish(
          importGigByUrlChannel(workspaceId, requestId).progress({
            workspaceId,
            requestId,
            status: "error",
            message: errorMessage,
          }),
        );

        await publish(
          importGigByUrlChannel(workspaceId, requestId).result({
            workspaceId,
            requestId,
            success: false,
            error: errorMessage,
          }),
        );

        throw error;
      }
    });

    return result;
  },
);
