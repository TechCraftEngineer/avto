import { getSubscriptionToken } from "@inngest/realtime";
import {
  fetchArchivedListChannel,
  importArchivedVacanciesChannel,
  importNewVacanciesChannel,
  importVacancyByUrlChannel,
} from "@qbs-autonaim/jobs/channels";
import { inngest } from "@qbs-autonaim/jobs/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("new"),
    workspaceId: z.string(),
    runId: z.string(),
  }),
  z.object({
    type: z.literal("archived"),
    workspaceId: z.string(),
    runId: z.string(),
  }),
  z.object({
    type: z.literal("by-url"),
    workspaceId: z.string(),
    runId: z.string(),
  }),
  z.object({
    type: z.literal("fetch-archived-list"),
    workspaceId: z.string(),
    requestId: z.string(),
  }),
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Некорректные параметры запроса" },
        { status: 400 },
      );
    }

    const data = validationResult.data;

    let token: Awaited<ReturnType<typeof getSubscriptionToken>>;

    switch (data.type) {
      case "new":
        token = await getSubscriptionToken(inngest, {
          channel: importNewVacanciesChannel(data.workspaceId),
          topics: ["progress", "result"],
        });
        break;

      case "archived":
        token = await getSubscriptionToken(inngest, {
          channel: importArchivedVacanciesChannel(data.workspaceId),
          topics: ["progress", "result"],
        });
        break;

      case "by-url":
        token = await getSubscriptionToken(inngest, {
          channel: importVacancyByUrlChannel(data.workspaceId, data.runId),
          topics: ["progress", "result"],
        });
        break;

      case "fetch-archived-list":
        token = await getSubscriptionToken(inngest, {
          channel: fetchArchivedListChannel(data.workspaceId, data.requestId),
          topics: ["progress", "result"],
        });
        break;

      default:
        return NextResponse.json(
          { error: "Неизвестный тип запроса" },
          { status: 400 },
        );
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error("Ошибка получения токена Realtime:", error);
    return NextResponse.json(
      { error: "Не удалось получить токен подписки" },
      { status: 500 },
    );
  }
}
