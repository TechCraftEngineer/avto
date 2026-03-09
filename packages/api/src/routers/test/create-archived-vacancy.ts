import { ORPCError } from "@orpc/server";
import { db } from "@qbs-autonaim/db";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { publicProcedure } from "../../orpc";

const isTestMode =
  process.env.NODE_ENV === "test" ||
  process.env.NODE_ENV === "development" ||
  process.env.E2E_TEST_ENABLED === "1";

function validateTestSecret(headers: Headers): void {
  const secret = process.env.TEST_SHARED_SECRET;
  if (!secret) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message:
        "Тестовые эндпоинты отключены: TEST_SHARED_SECRET не задан в окружении",
    });
  }
  const provided = headers.get("x-e2e-test-secret");
  if (provided !== secret) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Неверный или отсутствующий x-e2e-test-secret",
    });
  }
}

export const createArchivedVacancy = publicProcedure
  .input(
    z.object({
      workspaceId: z.string().min(1, "workspaceId обязателен"),
      createdBy: z.string().min(1, "createdBy обязателен"),
      title: z
        .string()
        .optional()
        .default("Няня для двух девочек 4 и 6 лет (м. Бутырская)"),
    }),
  )
  .handler(async ({ input, context }) => {
    if (!isTestMode) {
      throw new ORPCError("FORBIDDEN", {
        message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }
    validateTestSecret(context.headers);

    const [newVacancy] = await db
      .insert(vacancy)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: "Тестовое описание для E2E",
        source: "HH",
        createdBy: input.createdBy,
        isActive: true,
      })
      .returning();

    if (!newVacancy) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Не удалось создать вакансию",
      });
    }

    await db.insert(vacancyPublication).values({
      vacancyId: newVacancy.id,
      platform: "HH",
      externalId: "128580152",
      isActive: false,
    });

    return {
      vacancyId: newVacancy.id,
      title: newVacancy.title,
    };
  });
