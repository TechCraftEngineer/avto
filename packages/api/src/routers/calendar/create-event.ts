import { ORPCError } from "@orpc/server";
import {
  getUserIntegration,
  getUserIntegrationCredentials,
  responseScheduledInterview,
  updateUserIntegrationCredentials,
  updateUserIntegrationLastUsed,
} from "@qbs-autonaim/db";
import { createCalendarEvent as createGoogleCalendarEvent } from "@qbs-autonaim/integration-clients/server";
import { createCalendarEventSchema } from "@qbs-autonaim/validators";
import { protectedProcedure } from "../../orpc";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  technical: "Техническое собеседование",
  hr: "HR собеседование",
  final: "Финальное собеседование",
  phone: "Собеседование по телефону",
  video: "Видео собеседование",
};

export const createEvent = protectedProcedure
  .input(createCalendarEventSchema)
  .handler(async ({ input, context }) => {
    const access = await context.workspaceRepository.checkAccess(
      input.workspaceId,
      context.session.user.id,
    );

    if (!access) {
      throw new ORPCError("FORBIDDEN", { message: "Нет доступа к workspace" });
    }

    const responseRow = await context.db.query.response.findFirst({
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
      throw new ORPCError("NOT_FOUND", { message: "Отклик не найден" });
    }

    const entityId = responseRow.entityId;

    if (responseRow.entityType === "vacancy") {
      const vacancyRow = await context.db.query.vacancy.findFirst({
        where: (v, { and, eq }) =>
          and(eq(v.id, entityId), eq(v.workspaceId, input.workspaceId)),
        columns: { id: true },
      });
      if (!vacancyRow) {
        throw new ORPCError("FORBIDDEN", {
          message: "Отклик не принадлежит этому workspace",
        });
      }
    } else if (responseRow.entityType === "gig") {
      const gigRow = await context.db.query.gig.findFirst({
        where: (g, { and, eq }) =>
          and(eq(g.id, entityId), eq(g.workspaceId, input.workspaceId)),
        columns: { id: true },
      });
      if (!gigRow) {
        throw new ORPCError("FORBIDDEN", {
          message: "Отклик не принадлежит этому workspace",
        });
      }
    } else {
      throw new ORPCError("BAD_REQUEST", {
        message: "Неподдерживаемый тип отклика для планирования",
      });
    }

    const credentials = await getUserIntegrationCredentials(
      context.db,
      context.session.user.id,
      "google_calendar",
    );

    if (!credentials?.access_token) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message:
          "Подключите Google Calendar в настройках аккаунта для планирования встреч",
      });
    }

    const endDate = new Date(input.scheduledAt);
    endDate.setMinutes(endDate.getMinutes() + input.durationMinutes);

    const typeLabel = INTERVIEW_TYPE_LABELS[input.type] ?? "Собеседование";
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
      context.db,
      context.session.user.id,
      "google_calendar",
    );
    const metadata = (userInt?.metadata as Record<string, unknown>) ?? {};
    const calendarId = (metadata.calendar_id as string) || "primary";

    let result: Awaited<ReturnType<typeof createGoogleCalendarEvent>>;
    try {
      result = await createGoogleCalendarEvent(
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
    } catch (error: unknown) {
      // Если ошибка связана с токеном, возвращаем понятное сообщение
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        throw new ORPCError("PRECONDITION_FAILED", {
          message: error.message,
        });
      }
      throw error;
    }

    // Если токен обновился, сохраняем новые credentials
    if (result.updatedCredentials) {
      await updateUserIntegrationCredentials(
        context.db,
        context.session.user.id,
        "google_calendar",
        {
          access_token: result.updatedCredentials.access_token,
          refresh_token: result.updatedCredentials.refresh_token ?? "",
          expiry_date: result.updatedCredentials.expiry_date
            ? String(result.updatedCredentials.expiry_date)
            : "",
        },
      );
    }

    await updateUserIntegrationLastUsed(
      context.db,
      context.session.user.id,
      "google_calendar",
    );

    // Сохраняем снимок в БД для отображения в приложении
    try {
      await context.db
        .insert(responseScheduledInterview)
        .values({
          responseId: input.responseId,
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          calendarEventId: result.id,
          calendarEventUrl: result.htmlLink,
        })
        .onConflictDoUpdate({
          target: responseScheduledInterview.responseId,
          set: {
            scheduledAt: input.scheduledAt,
            durationMinutes: input.durationMinutes,
            calendarEventId: result.id,
            calendarEventUrl: result.htmlLink,
          },
        });
    } catch (dbError) {
      console.error(
        "[calendar.createEvent] Не удалось сохранить снимок в БД:",
        {
          responseId: input.responseId,
          eventId: result.id,
          htmlLink: result.htmlLink,
        },
        dbError,
      );
      // Не пробрасываем — событие в Google Calendar уже создано
    }

    return {
      eventId: result.id,
      htmlLink: result.htmlLink,
    };
  });
