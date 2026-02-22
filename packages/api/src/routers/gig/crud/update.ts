import { ORPCError } from "@orpc/server";
import { and, eq } from "@qbs-autonaim/db";
import {
  customDomain,
  gig,
  gigInterviewMedia,
  UpdateGigSettingsSchema,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const update = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      settings: UpdateGigSettingsSchema.extend({
        interviewMediaFileIds: z.array(z.string().uuid()).nullish(),
      }),
    }),
  )
  .handler(async ({ context, input }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к этому workspace",
      });
    }

    const existingGig = await context.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
    }

    const patch: {
      title?: string;
      description?: string | null;
      customBotInstructions?: string | null;
      customScreeningPrompt?: string | null;
      customInterviewQuestions?: string | null;
      customOrganizationalQuestions?: string | null;
      customDomainId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.settings.title !== undefined) {
      patch.title = input.settings.title.trim();
    }
    if (input.settings.description !== undefined) {
      patch.description = input.settings.description?.trim() || null;
    }
    if (input.settings.customBotInstructions !== undefined) {
      patch.customBotInstructions = input.settings.customBotInstructions;
    }
    if (input.settings.customScreeningPrompt !== undefined) {
      patch.customScreeningPrompt = input.settings.customScreeningPrompt;
    }
    if (input.settings.customInterviewQuestions !== undefined) {
      patch.customInterviewQuestions = input.settings.customInterviewQuestions;
    }
    if (input.settings.customOrganizationalQuestions !== undefined) {
      patch.customOrganizationalQuestions =
        input.settings.customOrganizationalQuestions;
    }
    if (input.settings.customDomainId !== undefined) {
      // Validate customDomainId if provided
      if (input.settings.customDomainId !== null) {
        // Проверяем домен в БД (включая пресеты)
        const domain = await context.db.query.customDomain.findFirst({
          where: eq(customDomain.id, input.settings.customDomainId),
        });

        if (!domain) {
          throw new ORPCError("BAD_REQUEST", { message: "Домен не найден" });
        }

        if (!domain.isVerified) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Домен не верифицирован",
          });
        }

        if (domain.type !== "interview") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Домен должен иметь тип 'interview'",
          });
        }

        // Проверяем права доступа только для не-пресетных доменов
        if (!domain.isPreset && domain.workspaceId !== input.workspaceId) {
          throw new ORPCError("FORBIDDEN", {
            message: "Домен не принадлежит этому workspace",
          });
        }
      }

      patch.customDomainId = input.settings.customDomainId;
    }

    // Handle interview media files through join table
    if (input.settings.interviewMediaFileIds !== undefined) {
      await context.db.transaction(async (tx) => {
        // Delete existing associations
        await tx
          .delete(gigInterviewMedia)
          .where(eq(gigInterviewMedia.gigId, input.gigId));

        // Insert new associations
        if (
          input.settings.interviewMediaFileIds &&
          input.settings.interviewMediaFileIds.length > 0
        ) {
          await tx.insert(gigInterviewMedia).values(
            input.settings.interviewMediaFileIds.map((fileId) => ({
              gigId: input.gigId,
              fileId,
            })),
          );
        }
      });
    }

    const result = await context.db
      .update(gig)
      .set(patch)
      .where(
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      )
      .returning();

    if (!result[0]) {
      throw new ORPCError("NOT_FOUND", { message: "Задание не найдено" });
    }

    return result[0];
  });
