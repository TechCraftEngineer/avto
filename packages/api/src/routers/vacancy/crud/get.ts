import { ORPCError } from "@orpc/server";
import { and, count, eq, sql } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc";

export const get = protectedProcedure
  .input(z.object({ id: z.string(), workspaceId: workspaceIdSchema }))
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

    const vacancyRow = await context.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.id),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
      with: {
        publications: true,
      },
    });

    if (!vacancyRow) return null;

    const [counts] = await context.db
      .select({
        totalResponses: count(responseTable.id),
        newResponses: sql<number>`COUNT(*) FILTER (WHERE ${responseTable.status} = 'NEW')`,
      })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityId, vacancyRow.id),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return {
      ...vacancyRow,
      views: 0,
      responses: counts?.totalResponses ?? 0,
      newResponses: Number(counts?.newResponses ?? 0),
    };
  });
