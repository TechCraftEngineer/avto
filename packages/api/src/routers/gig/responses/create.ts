import { and, eq, sql } from "@qbs-autonaim/db";
import { CandidateRepository } from "@qbs-autonaim/db";
import {
  gig,
  importSourceValues,
  type Response,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CandidateService } from "../../../services/candidate.service";
import { protectedProcedure } from "../../../trpc";

const createResponseSchema = z.object({
  gigId: z.uuid(),
  workspaceId: workspaceIdSchema,
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.url().optional(),
  telegramUsername: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.email().max(255).optional(),
  proposedPrice: z.number().int().positive().optional(),

  proposedDeliveryDays: z.number().int().positive().optional(),
  coverLetter: z.string().optional(),
  portfolioLinks: z.array(z.url()).optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  resumeLanguage: z.string().max(10).default("ru"),
  importSource: z.enum(importSourceValues).default("MANUAL"),
});

export const create = protectedProcedure
  .input(createResponseSchema)
  .mutation(async ({ ctx, input }) => {
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

    // Проверяем что gig существует и принадлежит workspace
    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Получаем organizationId из workspace
    const workspaceData = await ctx.db.query.workspace.findFirst({
      where: (ws, { eq }) => eq(ws.id, input.workspaceId),
      columns: { organizationId: true },
    });

    if (!workspaceData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Workspace не найден",
      });
    }

    // Проверяем дубликат
    const existingResponse = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.entityType, "gig"),
        eq(responseTable.entityId, input.gigId),
        eq(responseTable.candidateId, input.candidateId),
      ),
    });

    if (existingResponse) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Отклик от этого кандидата уже существует",
      });
    }

    // Создаем или находим кандидата в базе
    let globalCandidateId: string | null = null;
    try {
      const candidateRepository = new CandidateRepository(ctx.db);
      const candidateService = new CandidateService();

      // Создаем временный объект response для извлечения данных
      const tempResponse: Partial<Response> = {
        candidateName: input.candidateName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        telegramUsername: input.telegramUsername ?? null,
        profileUrl: input.profileUrl ?? null,
        experience: input.experience ?? null,
        skills: input.skills ?? null,
        importSource: input.importSource,
        profileData: null,
        contacts: input.email || input.phone || input.telegramUsername
          ? {
              email: input.email,
              phone: input.phone,
              telegram: input.telegramUsername,
            }
          : null,
      };

      const candidateData = candidateService.extractCandidateDataFromResponse(
        tempResponse as Response,
        workspaceData.organizationId,
      );

      const normalizedData = candidateService.normalizeCandidateData(
        candidateData,
      );

      const candidate = await candidateRepository.findOrCreateCandidate(
        normalizedData,
      );

      globalCandidateId = candidate.id;
    } catch (error) {
      // Логируем ошибку, но не блокируем создание отклика
      console.error("Ошибка при создании/поиске кандидата:", error);
    }

    let newResponse: Response | undefined;
    try {
      const result = await ctx.db
        .insert(responseTable)
        .values({
          entityType: "gig",
          entityId: input.gigId,
          candidateId: input.candidateId,
          candidateName: input.candidateName,
          profileUrl: input.profileUrl,
          telegramUsername: input.telegramUsername,
          phone: input.phone,
          email: input.email,
          proposedPrice: input.proposedPrice,
          proposedDeliveryDays: input.proposedDeliveryDays,
          coverLetter: input.coverLetter,
          portfolioLinks: input.portfolioLinks,
          experience: input.experience,
          skills: input.skills,
          rating: input.rating,
          resumeLanguage: input.resumeLanguage,
          importSource: input.importSource,
          globalCandidateId,
          respondedAt: new Date(),
        })
        .returning();
      newResponse = result[0];
    } catch (error) {
      // Обработка race condition: параллельный запрос успел вставить дубликат
      if (
        error instanceof Error &&
        (error.message.includes("unique constraint") ||
          error.message.includes("duplicate key"))
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Отклик от этого кандидата уже существует",
        });
      }
      throw error;
    }

    if (!newResponse) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отклик",
      });
    }

    // Атомарно обновляем счётчик откликов
    await ctx.db
      .update(gig)
      .set({
        responses: sql`COALESCE(${gig.responses}, 0) + 1`,
        newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`,
      })
      .where(eq(gig.id, input.gigId));

    // Рейтинг будет пересчитан автоматически после завершения интервью

    return newResponse;
  });
