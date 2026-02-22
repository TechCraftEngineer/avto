import { ORPCError } from "@orpc/server";
import { eq } from "@qbs-autonaim/db";
import { vacancyPublication } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const validatePublicationInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  publicationId: z.string().uuid(),
});

export const validatePublication = protectedProcedure
  .input(validatePublicationInputSchema)
  .handler(async ({ input, context }) => {
    // Проверка доступа к workspace
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    // Получаем публикацию
    const publication = await context.db.query.vacancyPublication.findFirst({
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
      throw new ORPCError("NOT_FOUND", { message: "Публикация не найдена" });
    }

    // Проверяем, что публикация принадлежит к workspace
    if (publication.vacancy.workspaceId !== input.workspaceId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этой публикации",
      });
    }

    // Валидация в зависимости от платформы
    let isValid = false;
    let validationMessage = "";

    try {
      switch (publication.platform) {
        case "HH":
        case "AVITO":
        case "SUPERJOB":
        case "HABR":
          // Для этих платформ проверяем URL
          if (publication.url) {
            const urlPattern = /^https?:\/\/.+/i;
            isValid = urlPattern.test(publication.url);

            if (!isValid) {
              validationMessage = "Некорректный формат URL";
            } else {
              // Можно добавить дополнительную проверку доступности URL
              // Пока что просто считаем валидным если URL правильного формата
              validationMessage = "URL валиден";
            }
          } else if (publication.externalId) {
            // Проверяем externalId
            isValid = publication.externalId.length >= 3;
            validationMessage = isValid
              ? "Внешний ID валиден"
              : "Внешний ID слишком короткий";
          } else {
            validationMessage = "Необходимо указать URL или внешний ID";
          }
          break;

        default:
          // Для неизвестных платформ просто проверяем наличие хотя бы одного поля
          isValid = !!(publication.url || publication.externalId);
          validationMessage = isValid
            ? "Публикация настроена"
            : "Необходимо указать URL или внешний ID";
      }
    } catch {
      validationMessage = "Ошибка при валидации";
      isValid = false;
    }

    // Обновляем статус публикации
    await context.db
      .update(vacancyPublication)
      .set({
        isActive: isValid,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vacancyPublication.id, input.publicationId));

    return {
      isValid,
      message: validationMessage,
      platform: publication.platform,
      url: publication.url,
      externalId: publication.externalId,
    };
  });
