import { google } from "googleapis";

export interface GoogleCalendarCredentials {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}

export interface CreateEventParams {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: string };
    };
  };
}

export interface CreateEventResult {
  id: string;
  htmlLink: string;
  start: string;
  end: string;
}

/**
 * Создать событие в Google Calendar
 * @param credentials - OAuth2 credentials (access_token, refresh_token, expiry_date)
 * @param calendarId - ID календаря ('primary' для основного)
 */
export async function createCalendarEvent(
  credentials: GoogleCalendarCredentials,
  calendarId: string,
  params: CreateEventParams,
): Promise<CreateEventResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: params.summary,
    description: params.description ?? undefined,
    location: params.location ?? undefined,
    attendees: params.attendees?.map((email) => ({ email })),
    start: {
      dateTime: params.start.toISOString(),
      timeZone: "Europe/Moscow",
    },
    end: {
      dateTime: params.end.toISOString(),
      timeZone: "Europe/Moscow",
    },
    ...(params.conferenceData && { conferenceData: params.conferenceData }),
  };

  const response = await calendar.events.insert({
    calendarId: calendarId || "primary",
    requestBody: event,
  });

  const data = response.data;
  if (!data.id || !data.htmlLink) {
    throw new Error("Не удалось создать событие в календаре");
  }

  return {
    id: data.id,
    htmlLink: data.htmlLink,
    start: data.start?.dateTime ?? "",
    end: data.end?.dateTime ?? "",
  };
}
