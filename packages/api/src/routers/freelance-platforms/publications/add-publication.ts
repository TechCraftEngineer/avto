import {
  platformSourceValues,
  vacancyPublication,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

// Функция для парсинга идентификатора из URL или ID
function parseIdentifier(identifier: string): {
  externalId: string | null;
  url: string | null;
} {
  if (!identifier.trim()) {
    return { externalId: null, url: null };
  }

  // Проверяем, является ли строка URL
  try {
    const url = new URL(identifier);

    // Для HH.ru извлекаем ID из пути /vacancy/{id}
    if (
      (url.hostname === "hh.ru" || url.hostname.endsWith(".hh.ru")) &&
      url.pathname.startsWith("/vacancy/")
    ) {
      const vacancyId = url.pathname.split("/vacancy/")[1];
      if (vacancyId?.match(/^\d+$/)) {
        return { externalId: vacancyId, url: identifier };
      }
    }

    // Для других платформ можно добавить аналогичную логику
    // Пока возвращаем как URL без ID
    return { externalId: null, url: identifier };
  } catch {
    // Если это не URL, считаем что это ID
    return { externalId: identifier, url: null };
  }
}

const addPublicationInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  vacancyId: z.string().uuid(),
  platform: z.enum(platformSourceValues),
  identifier: z.string().max(200).optional(),
});

export const addPublication = protectedProcedure
  .input(addPublicationInputSchema)
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверка существования вакансии и принадлежности к workspace
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.vacancyId),
          eq(table.workspaceId, input.workspaceId),
        ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Парсим идентификатор
    const parsed = parseIdentifier(input.identifier || "");

    // Создаем публикацию
    const [createdPublication] = await ctx.db
      .insert(vacancyPublication)
      .values({
        vacancyId: input.vacancyId,
        platform: input.platform,
        externalId: parsed.externalId,
        url: parsed.url,
        isActive: true,
      })
      .returning();

    return {
      publication: createdPublication,
    };
  });
