import { db } from "@qbs-autonaim/db";
import { vacancy, vacancyPublication } from "@qbs-autonaim/db/schema";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { publicProcedure } from "../../orpc";

const isTestMode =
  process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

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
  .mutation(async ({ input }) => {
    if (!isTestMode) {
      throw new ORPCError("FORBIDDEN", { message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }

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
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось создать вакансию",
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
