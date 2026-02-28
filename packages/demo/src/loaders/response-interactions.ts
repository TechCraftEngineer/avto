import { db } from "@qbs-autonaim/db";
import {
  type interactionChannelValues,
  type interactionTypeValues,
  responseInteractionLog,
} from "@qbs-autonaim/db/schema";

type InteractionType = (typeof interactionTypeValues)[number];
type InteractionChannel = (typeof interactionChannelValues)[number];

interface ResponseForInteractions {
  id: string;
  respondedAt: Date | null;
}

const DEMO_INTERACTIONS: Array<{
  type: InteractionType;
  source: "auto" | "manual";
  channel?: InteractionChannel | null;
  note?: string | null;
  daysOffset: number; // дней от respondedAt
}> = [
  { type: "welcome_sent", source: "auto", daysOffset: 0 },
  {
    type: "message_sent",
    source: "manual",
    channel: "telegram",
    daysOffset: 1,
  },
  {
    type: "note",
    source: "manual",
    note: "Обсудили условия и сроки. Кандидат заинтересован.",
    daysOffset: 2,
  },
];

const EXTRA_INTERACTIONS: Array<{
  type: InteractionType;
  source: "auto" | "manual";
  channel?: InteractionChannel | null;
  note?: string | null;
  daysOffset: number;
}> = [
  { type: "call", source: "manual", channel: "phone", daysOffset: 3 },
  {
    type: "interview_scheduled",
    source: "manual",
    channel: "web_chat",
    daysOffset: 4,
  },
  { type: "offer_sent", source: "auto", daysOffset: 7 },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function loadResponseInteractions(
  responses: ResponseForInteractions[],
  recruiterId: string,
): Promise<number> {
  console.log("\n📋 Загружаем хронологию взаимодействий для откликов...");

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 14);

  const toInsert: Array<{
    responseId: string;
    interactionType: InteractionType;
    source: "auto" | "manual";
    happenedAt: Date;
    createdByUserId: string | null;
    channel: InteractionChannel | null;
    note: string | null;
  }> = [];

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];
    if (!resp) continue;
    const respondedAt = resp.respondedAt ?? baseDate;

    for (const demo of DEMO_INTERACTIONS) {
      const happenedAt = addDays(respondedAt, demo.daysOffset);
      if (happenedAt > new Date()) continue;

      toInsert.push({
        responseId: resp.id,
        interactionType: demo.type,
        source: demo.source,
        happenedAt,
        createdByUserId: demo.source === "manual" ? recruiterId : null,
        channel: demo.channel ?? null,
        note: demo.note ?? null,
      });
    }

    if (i % 3 === 0) {
      const extra = EXTRA_INTERACTIONS[i % EXTRA_INTERACTIONS.length];
      if (extra) {
        const happenedAt = addDays(respondedAt, extra.daysOffset);
        if (happenedAt <= new Date()) {
          toInsert.push({
            responseId: resp.id,
            interactionType: extra.type,
            source: extra.source,
            happenedAt,
            createdByUserId: extra.source === "manual" ? recruiterId : null,
            channel: (extra.channel ?? null) as InteractionChannel | null,
            note: extra.note ?? null,
          });
        }
      }
    }
  }

  if (toInsert.length === 0) {
    console.log("⚠️ Нет взаимодействий для загрузки (даты в будущем)");
    return 0;
  }

  await db.insert(responseInteractionLog).values(toInsert);

  console.log(
    `✅ Загружено ${toInsert.length} записей хронологии взаимодействий`,
  );

  return toInsert.length;
}
