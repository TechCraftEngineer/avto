/**
 * Получение данных проекта Kwork для связки с gig
 * Использует Kwork Mobile API: https://api.kwork.ru/
 */
import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

const KWORK_API_URL = "https://api.kwork.ru";
const KWORK_AUTH_HEADER = "Basic bW9iaWxlX2FwaTpxRnZmUmw3dw==";

/** Проект Kwork (want_worker) - запрос покупателя */
interface KworkProject {
  id: number;
  status?: string;
  price?: number;
  title?: string;
  description?: string;
  offers?: number;
  time_left?: number;
  category_id?: number;
  parent_category_id?: number;
}

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

    const body = new URLSearchParams({
      id: String(input.projectId),
      token: credentials.token,
    });

    const response = await fetch(`${KWORK_API_URL}/project`, {
      method: "POST",
      headers: {
        Authorization: KWORK_AUTH_HEADER,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = (await response.json()) as {
      success?: boolean;
      response?: KworkProject;
      code?: number;
      message?: string;
    };

    if (data?.code) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          data.message ??
          "Не удалось получить проект с Kwork. Проверьте, что интеграция активна.",
      });
    }

    if (!data?.success || !data?.response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Проект не найден на Kwork",
      });
    }

    const project = data.response;

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
