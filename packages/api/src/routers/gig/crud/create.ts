import {
  gig,
  gigTypeValues,
  platformSourceValues,
} from "@qbs-autonaim/db/schema";
import { parsePlatformLink } from "@qbs-autonaim/shared";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

const createGigSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(gigTypeValues).default("OTHER"),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),

  deadline: z.coerce.date().optional(),
  estimatedDuration: z.string().max(100).optional(),
  deliverables: z.string().optional(),
  requiredSkills: z.string().optional(),

  // Ссылка на фриланс-платформу
  platformSource: z.enum(platformSourceValues).optional(),
  platformUrl: z.string().url().optional(),
});

export const create = protectedProcedure
  .input(createGigSchema)
  .handler(async ({ input, context }) => {
    const hasAccess = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace", });
    }

    // Формируем description из всех полей
    const fullDescription = [
      input.description,
      input.deliverables ? `\n\nЧто нужно сделать:\n${input.deliverables}` : "",
      input.requiredSkills
        ? `\n\nТребуемые навыки:\n${input.requiredSkills}`
        : "",
    ]
      .filter(Boolean)
      .join("")
      .trimStart();

    // Парсим ссылку на фриланс-платформу
    let platformSource = input.platformSource || "MANUAL";
    let platformUrl = input.platformUrl || null;
    let externalId = null;

    if (input.platformUrl) {
      const parsed = parsePlatformLink(input.platformUrl);
      if (parsed) {
        platformSource = parsed.source;
        platformUrl = parsed.url;
        externalId = parsed.externalId;
      }
    }

    const [newGig] = await context.db
      .insert(gig)
      .values({
        workspaceId: input.workspaceId,
        title: input.title,
        description: fullDescription || null,
        type: input.type,
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,

        deadline: input.deadline ? new Date(input.deadline) : null,
        estimatedDuration: input.estimatedDuration,
        source: platformSource,
        externalId,
        url: platformUrl,
        isActive: true,
      })
      .returning();

    if (!newGig) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Не удалось создать задание", });
    }

    return newGig;
  });
