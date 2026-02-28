import { db } from "@qbs-autonaim/db";
import {
  type interactionChannelValues,
  type interactionTypeValues,
  responseInteractionLog,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";

type InteractionType = (typeof interactionTypeValues)[number];
type InteractionChannel = (typeof interactionChannelValues)[number];

const loadResponseInteractionsInputSchema = z.object({
  responses: z.array(
    z.object({
      id: z.string().uuid(),
      respondedAt: z.date().nullable(),
    }),
  ),
  recruiterId: z.string().min(1, "recruiterId обязателен"),
});

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
  responses: Array<{ id: string; respondedAt: Date | null }>,
  recruiterId: string,
): Promise<number> {
  const parsed = loadResponseInteractionsInputSchema.safeParse({
    responses,
    recruiterId,
  });
  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => e.message).join("; ");
    throw new Error(`loadResponseInteractions: неверные аргументы — ${msg}`);
  }

  const { responses: validResponses, recruiterId: validRecruiterId } =
    parsed.data;

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

  for (let i = 0; i < validResponses.length; i++) {
    const resp = validResponses[i];
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
        createdByUserId: demo.source === "manual" ? validRecruiterId : null,
        channel: demo.channel ?? null,
        note: demo.note ?? null,
      });
    }

    if (i % 3 === 0) {
      const extra =
        EXTRA_INTERACTIONS[Math.floor(i / 3) % EXTRA_INTERACTIONS.length];
      if (extra) {
        const happenedAt = addDays(respondedAt, extra.daysOffset);
        if (happenedAt <= new Date()) {
          toInsert.push({
            responseId: resp.id,
            interactionType: extra.type,
            source: extra.source,
            happenedAt,
            createdByUserId:
              extra.source === "manual" ? validRecruiterId : null,
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

  try {
    await db.insert(responseInteractionLog).values(toInsert);
  } catch (err) {
    console.error(
      "[loadResponseInteractions] Ошибка записи в responseInteractionLog:",
      err,
      { toInsertCount: toInsert.length, operation: "insert" },
    );
    throw err;
  }

  console.log(
    `✅ Загружено ${toInsert.length} записей хронологии взаимодействий`,
  );

  return toInsert.length;
}
