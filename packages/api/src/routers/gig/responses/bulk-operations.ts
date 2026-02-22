import { ORPCError } from "@orpc/server";
import { and, eq, inArray } from "@qbs-autonaim/db";
import {
  RESPONSE_STATUS,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import type { Context } from "../../../orpc";
import { protectedProcedure } from "../../../orpc";

type BulkUpdateInput = {
  responseIds: string[];
  workspaceId: string;
};

async function bulkUpdateStatus(
  context: Context,
  input: BulkUpdateInput,
  targetStatus:
    | typeof RESPONSE_STATUS.COMPLETED
    | typeof RESPONSE_STATUS.SKIPPED,
): Promise<{ success: boolean; updatedCount: number }> {
  const session = context.session;
  if (!session) {
    throw new ORPCError("UNAUTHORIZED", { message: "Требуется авторизация" });
  }
  const userId = session.user.id;

  const access = await context.workspaceRepository.checkAccess(
    input.workspaceId,
    userId,
  );

  if (!access) {
    throw new ORPCError("FORBIDDEN", {
      message: "Нет доступа к этому workspace",
    });
  }

  const responses = await context.db.query.response.findMany({
    where: inArray(responseTable.id, input.responseIds),
    with: {
      gig: {
        columns: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (responses.length !== input.responseIds.length) {
    throw new ORPCError("NOT_FOUND", {
      message: "Некоторые отклики не найдены",
    });
  }

  const invalidResponses = responses.filter(
    (r) => !r.gig || r.gig.workspaceId !== input.workspaceId,
  );

  if (invalidResponses.length > 0) {
    throw new ORPCError("FORBIDDEN", {
      message: "Некоторые отклики не принадлежат этому workspace",
    });
  }

  const updateResult = await context.db
    .update(responseTable)
    .set({
      status: targetStatus,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(responseTable.id, input.responseIds),
        eq(responseTable.status, RESPONSE_STATUS.NEW),
      ),
    );

  return {
    success: true,
    updatedCount: updateResult.rowCount ?? 0,
  };
}

export const acceptMultiple = protectedProcedure
  .input(
    z.object({
      responseIds: z.array(z.uuid()).min(1).max(50),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    return bulkUpdateStatus(context, input, RESPONSE_STATUS.COMPLETED);
  });

export const rejectMultiple = protectedProcedure
  .input(
    z.object({
      responseIds: z.array(z.uuid()).min(1).max(50),
      workspaceId: workspaceIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    return bulkUpdateStatus(context, input, RESPONSE_STATUS.SKIPPED);
  });
