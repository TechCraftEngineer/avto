/**
 * Получение данных проекта Kwork для связки с gig
 * Использует Kwork Mobile API: https://api.kwork.ru/
 */
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { getProject } from "@qbs-autonaim/integration-clients";
import { executeWithKworkTokenRefresh } from "@qbs-autonaim/jobs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getKworkProject = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string().min(1),
      projectId: z.number().int().positive(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const credentials = await getIntegrationCredentials(
      ctx.db,
      "kwork",
      input.workspaceId,
    );

    if (!credentials?.token) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Kwork интеграция не настроена. Подключите Kwork в настройках workspace.",
      });
    }

    // biome-ignore lint/suspicious/noImplicitAnyLet: result assigned in try, typed by executeWithKworkTokenRefresh
    let result;
    try {
      result = await executeWithKworkTokenRefresh(
        ctx.db,
        input.workspaceId,
        (token) => getProject(token, input.projectId),
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Ошибка Kwork";
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message:
          msg.includes("авториз") || msg.includes("token")
            ? "Токен Kwork истёк. Требуется повторная авторизация в настройках интеграции."
            : msg,
      });
    }

    if (!result.success || !result.response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message:
          result.error?.message ??
          "Проект не найден на Kwork. Проверьте, что интеграция активна.",
      });
    }

    const project = result.response;
    if (!project) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Проект не найден на Kwork",
      });
    }

    return {
      id: project.id,
      title: project.title ?? "",
      description: project.description ?? "",
      price: project.price ?? null,
      offers: project.offers ?? 0,
      timeLeft: project.time_left ?? null,
      categoryId: project.category_id ?? null,
      status: project.status ?? null,
      /** URL для просмотра на Kwork */
      url: `https://kwork.ru/project/${project.id}`,
    };
  });
