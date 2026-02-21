import {
  getUserIntegration,
  getUserIntegrationCredentials,
  updateUserIntegrationLastUsed,
} from "@qbs-autonaim/db";
import {
  createCalendarEvent as createGoogleCalendarEvent,
} from "@qbs-autonaim/integration-clients/server";
import { createCalendarEventSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Техническое собеседование",
  hr: "HR собеседование",
  final: "Финальное собеседование",
  phone: "Собеседование по телефону",
  video: "Видео собеседование",
};

export const createEvent = protectedProcedure
  .input(createCalendarEventSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const responseRow = await ctx.db.query.response.findFirst({
      where: (r, { eq }) => eq(r.id, input.responseId),
      columns: {
        id: true,
        entityId: true,
        entityType: true,
        candidateName: true,
        email: true,
      },
    });

    if (!responseRow) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const entityId = responseRow.entityId;

    if (responseRow.entityType === "vacancy") {
      const vacancyRow = await ctx.db.query.vacancy.findFirst({
        where: (v, { and, eq }) =>
          and(eq(v.id, entityId), eq(v.workspaceId, input.workspaceId)),
        columns: { id: true },
      });
      if (!vacancyRow) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Отклик не принадлежит этому workspace",
        });
      }
    } else if (responseRow.entityType === "gig") {
      const gigRow = await ctx.db.query.gig.findFirst({
        where: (g, { and, eq }) =>
          and(eq(g.id, entityId), eq(g.workspaceId, input.workspaceId)),
        columns: { id: true },
      });
      if (!gigRow) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Отклик не принадлежит этому workspace",
        });
      }
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неподдерживаемый тип отклика для планирования",
      });
    }

    const credentials = await getUserIntegrationCredentials(
      ctx.db,
      ctx.session.user.id,
      "google_calendar",
    );

    if (!credentials?.access_token) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "Подключите Google Calendar в настройках аккаунта для планирования встреч",
      });
    }

    const endDate = new Date(input.scheduledAt);
    endDate.setMinutes(endDate.getMinutes() + input.durationMinutes);

    const typeLabel =
      INTERVIEW_TYPE_LABELS[input.type] ?? "Собеседование";
    const candidateName = responseRow.candidateName ?? "Кандидат";
    const summary = `${typeLabel}: ${candidateName}`;

    let description = input.description ?? "";
    if (responseRow.email) {
      description += `\n\nКандидат: ${responseRow.email}`;
    }
    if (input.meetingUrl) {
      description += `\nСсылка на встречу: ${input.meetingUrl}`;
    }

    const attendees: string[] = [];
    if (responseRow.email) {
      attendees.push(responseRow.email);
    }

    const userInt = await getUserIntegration(
      ctx.db,
      ctx.session.user.id,
      "google_calendar",
    );
    const metadata = (userInt?.metadata as Record<string, unknown>) ?? {};
    const calendarId =
      (metadata.calendar_id as string) || "primary";

    const result = await createGoogleCalendarEvent(
      {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.expiry_date
          ? Number(credentials.expiry_date)
          : undefined,
      },
      calendarId,
      {
        summary,
        description: description.trim() || undefined,
        start: input.scheduledAt,
        end: endDate,
        attendees: attendees.length > 0 ? attendees : undefined,
      },
    );

    await updateUserIntegrationLastUsed(
      ctx.db,
      ctx.session.user.id,
      "google_calendar",
    );

    return {
      eventId: result.id,
      htmlLink: result.htmlLink,
    };
  });
