import { and, desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { integration, response, vacancy } from "@qbs-autonaim/db/schema";
import { getResponsesLimitByOrganizationPlan } from "@qbs-autonaim/jobs-shared";
import axios from "axios";
import { z } from "zod";

interface ChatItem {
  id: string;
  resources: {
    RESUME: string[];
    NEGOTIATION_TOPIC: string[];
    VACANCY: string[];
  };
  lastMessage?: {
    text: string;
    type: string;
    resources?: {
      RESPONSE_LETTER?: string[];
    };
  };
}

interface ChatsResponse {
  chats: {
    items: ChatItem[];
    page: number;
    perPage: number;
    pages: number;
    found: number;
    hasNextPage: boolean;
  };
}

function extractResumeIdFromUrl(resumeUrl: string): string | null {
  try {
    const url = new URL(resumeUrl);
    return url.searchParams.get("resumeId");
  } catch (error) {
    console.error("Ошибка парсинга resume_url:", error);
    return null;
  }
}

function extractCoverLetter(chat: ChatItem): string | null {
  if (!chat.lastMessage) return null;
  const hasResponseLetter =
    chat.lastMessage.resources?.RESPONSE_LETTER &&
    chat.lastMessage.resources.RESPONSE_LETTER.length > 0;
  return hasResponseLetter && chat.lastMessage.text ? chat.lastMessage.text : null;
}

export interface CollectChatIdsOptions {
  /** При true возвращает { success: true, updatedCount: 0 } вместо throw при отсутствии данных */
  silent?: boolean;
}

export interface CollectChatIdsResult {
  success: boolean;
  updatedCount: number;
}

/**
 * Собирает chat_id и сопроводительные письма для всех откликов вакансии через HH Chat API.
 * Используется в collect-chat-ids и sync-archived-responses.
 */
const vacancyIdSchema = z.string().min(1);

export async function collectChatIdsForVacancy(
  vacancyId: string,
  options: CollectChatIdsOptions = {},
): Promise<CollectChatIdsResult> {
  const { silent = false } = options;

  const parsed = vacancyIdSchema.safeParse(vacancyId);
  if (!parsed.success) {
    if (silent) return { success: true, updatedCount: 0 };
    throw new Error("Некорректный идентификатор вакансии");
  }
  const validatedVacancyId = parsed.data;

  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, validatedVacancyId),
    with: { workspace: { with: { organization: { columns: { plan: true } } } } },
  });

    if (!vacancyData) {
    if (silent) return { success: true, updatedCount: 0 };
    throw new Error(`Вакансия ${validatedVacancyId} не найдена`);
  }

  const externalId =
    vacancyData.externalId ??
    (
      await db.query.vacancyPublication.findFirst({
        where: (pub, { and, eq }) =>
          and(eq(pub.vacancyId, validatedVacancyId), eq(pub.platform, "HH")),
        columns: { externalId: true },
      })
    )?.externalId;

  if (!externalId) {
    if (silent) return { success: true, updatedCount: 0 };
    throw new Error(`У вакансии ${validatedVacancyId} отсутствует externalId`);
  }

  const hhIntegration = await db.query.integration.findFirst({
    where: (fields, { and }) =>
      and(
        eq(fields.workspaceId, vacancyData.workspaceId),
        eq(fields.type, "hh"),
        eq(fields.isActive, true),
      ),
  });

  if (!hhIntegration) {
    if (silent) return { success: true, updatedCount: 0 };
    throw new Error("Интеграция HH не найдена или неактивна");
  }

  if (!hhIntegration.cookies || hhIntegration.cookies.length === 0) {
    if (silent) return { success: true, updatedCount: 0 };
    throw new Error("Cookies для HH не найдены");
  }

  const cookieHeader = hhIntegration.cookies
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const allChats: ChatItem[] = [];
  let currentPage = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const chatsRes = await axios.get<ChatsResponse>(
      "https://chatik.hh.ru/chatik/api/chats",
      {
        timeout: 15_000,
        params: {
          vacancyIds: externalId,
          filterUnread: false,
          do_not_track_session_events: true,
          page: currentPage,
        },
        headers: {
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
          Cookie: cookieHeader,
          Origin: "https://hh.ru",
          Referer: "https://hh.ru/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      },
    );

    if (!chatsRes.data?.chats?.items) break;
    const { items, hasNextPage: hasNext } = chatsRes.data.chats;
    allChats.push(...items);
    hasNextPage = hasNext;
    currentPage++;
  }

  if (allChats.length === 0) return { success: true, updatedCount: 0 };

  const organizationPlan =
    vacancyData.workspace?.organization?.plan ?? "free";
  const responsesLimit =
    getResponsesLimitByOrganizationPlan(organizationPlan);
  const hasLimit = responsesLimit > 0;

  const baseQuery = db
    .select()
    .from(response)
    .where(
      and(
        eq(response.entityType, "vacancy"),
        eq(response.entityId, validatedVacancyId),
      ),
    )
    .orderBy(desc(response.respondedAt));

  const responses = hasLimit
    ? await baseQuery.limit(responsesLimit)
    : await baseQuery;

  let updatedCount = 0;
  for (const resp of responses) {
    const resumeId = resp.resumeUrl
      ? extractResumeIdFromUrl(resp.resumeUrl)
      : null;
    const chat = allChats.find((c) =>
      (c.resources?.RESUME || []).includes(resumeId || ""),
    );
    if (chat) {
      const coverLetter = extractCoverLetter(chat);
      await db
        .update(response)
        .set({
          chatId: chat.id,
          coverLetter: coverLetter ?? undefined,
        })
        .where(eq(response.id, resp.id));
      updatedCount++;
    }
  }

  await db
    .update(integration)
    .set({ lastUsedAt: new Date() })
    .where(eq(integration.id, hhIntegration.id));

  return { success: true, updatedCount };
}
