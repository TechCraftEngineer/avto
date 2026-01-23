import { vacancyPublication } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "@qbs-autonaim/db";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

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

const updatePublicationInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  publicationId: z.string().uuid(),
  identifier: z.string().max(200).optional().or(z.literal("")),
});

export const updatePublication = protectedProcedure
  .input(updatePublicationInputSchema)
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

    // Проверяем существование публикации и получаем связанную вакансию
    const publication = await ctx.db.query.vacancyPublication.findFirst({
      where: (table, { eq: eqFn }) => eqFn(table.id, input.publicationId),
      with: {
        vacancy: {
          columns: {
            workspaceId: true,
          },
        },
      },
    });

    if (!publication) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Публикация не найдена",
      });
    }

    // Проверяем, что публикация принадлежит к workspace
    if (publication.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этой публикации",
      });
    }

    // Парсим идентификатор
    const parsed = parseIdentifier(input.identifier || "");

    // Обновляем публикацию
    const [updatedPublication] = await ctx.db
      .update(vacancyPublication)
      .set({
        externalId: parsed.externalId,
        url: parsed.url,
        updatedAt: new Date(),
      })
      .where(eq(vacancyPublication.id, input.publicationId))
      .returning();

    if (!updatedPublication) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Не удалось обновить публикацию",
      });
    }

    return {
      publication: updatedPublication,
    };
  });
