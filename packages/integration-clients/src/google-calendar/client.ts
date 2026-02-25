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
  updatedCredentials?: GoogleCalendarCredentials;
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
  // Проверяем наличие refresh_token
  if (!credentials.refresh_token) {
    throw new Error(
      "Отсутствует refresh_token. Переподключите Google Calendar в настройках аккаунта",
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    `${process.env.APP_URL}/api/auth/google-calendar/callback`,
  );

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  // Логируем для отладки (без чувствительных данных)
  console.log("[Google Calendar] Creating event with credentials:", {
    hasAccessToken: !!credentials.access_token,
    hasRefreshToken: !!credentials.refresh_token,
    expiryDate: credentials.expiry_date,
    isExpired: credentials.expiry_date
      ? credentials.expiry_date < Date.now()
      : "unknown",
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

  try {
    const response = await calendar.events.insert({
      calendarId: calendarId || "primary",
      requestBody: event,
    });

    const data = response.data;
    if (!data.id || !data.htmlLink) {
      throw new Error("Не удалось создать событие в календаре");
    }

    // Проверяем, обновились ли credentials после запроса
    const currentCredentials = oauth2Client.credentials;
    let updatedCredentials: GoogleCalendarCredentials | undefined;

    if (
      currentCredentials.access_token &&
      currentCredentials.access_token !== credentials.access_token
    ) {
      console.log("[Google Calendar] Token was refreshed successfully");
      updatedCredentials = {
        access_token: currentCredentials.access_token,
        refresh_token:
          currentCredentials.refresh_token ?? credentials.refresh_token,
        expiry_date: currentCredentials.expiry_date ?? undefined,
      };
    }

    return {
      id: data.id,
      htmlLink: data.htmlLink,
      start: data.start?.dateTime ?? "",
      end: data.end?.dateTime ?? "",
      updatedCredentials,
    };
  } catch (error: unknown) {
    console.error("[Google Calendar] Error creating event:", error);

    if (error && typeof error === "object" && "code" in error) {
      const code = (error as { code?: number }).code;
      if (code === 401 || code === 403) {
        throw new Error(
          "Токен доступа к Google Calendar истёк. Переподключите интеграцию в настройках аккаунта",
        );
      }
      if (code === 400) {
        throw new Error(
          "Ошибка обновления токена Google Calendar. Переподключите интеграцию в настройках аккаунта",
        );
      }
    }

    // Проверяем, является ли это ошибкой от Google API
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("invalid_request")
    ) {
      throw new Error(
        "Токен Google Calendar недействителен. Переподключите интеграцию в настройках аккаунта",
      );
    }

    throw error;
  }
}
