import { chatMessage, chatSession, eq, gig, vacancy } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getAIModel, streamText } from "@qbs-autonaim/lib/ai";
import {
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { WebChatLinkGenerator } from "@qbs-autonaim/api/services";

const textPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(10000),
});

const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(textPartSchema),
});

const requestSchema = z.object({
  id: z.uuid().optional(),
  message: messageSchema.optional(),
  messages: z.array(messageSchema).optional(),
  chatSessionId: z.string().optional(),
  conversationId: z.string().optional(),
  token: z.string().optional(),
});

export const maxDuration = 60;

function generateUUID(): string {
  return crypto.randomUUID();
}

export async function POST(request: Request) {
  let requestBody: z.infer<typeof requestSchema>;

  try {
    const json = await request.json();
    requestBody = requestSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    const { message, messages, chatSessionId, conversationId, id, token } =
      requestBody;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    const linkGenerator = new WebChatLinkGenerator();
    const webChatLink = await linkGenerator.validateToken(token);

    if (!webChatLink) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    let resolvedChatSessionId = chatSessionId ?? conversationId ?? id;

    if (!resolvedChatSessionId) {
      const existingSession = await db.query.chatSession.findFirst({
        where: (cs, { and, eq }) =>
          and(
            eq(cs.entityType, webChatLink.entityType as any),
            eq(cs.entityId, webChatLink.entityId),
            eq(cs.metadata, { webChatLinkId: webChatLink.id }),
          ),
      });

      if (existingSession) {
        resolvedChatSessionId = existingSession.id;
      } else {
        const newSession = await db
          .insert(chatSession)
          .values({
            entityType: webChatLink.entityType as any,
            entityId: webChatLink.entityId,
            title: "Web Chat",
            metadata: { webChatLinkId: webChatLink.id },
          })
          .returning();

        if (newSession[0]) {
          resolvedChatSessionId = newSession[0].id;
        } else {
          throw new Error("Failed to create chat session");
        }
      }
    }

    let chatContext = "";

    if (resolvedChatSessionId) {
      const chat = await db.query.chatSession.findFirst({
        where: eq(chatSession.id, resolvedChatSessionId),
      });

      if (!chat) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (chat.entityType === "vacancy") {
        const vac = await db.query.vacancy.findFirst({
          where: eq(vacancy.id, chat.entityId),
        });

        if (vac) {
          chatContext = `Вакансия: ${vac.title}\nОписание: ${vac.description}\nТребования: ${vac.requirements}\nОбязанности: ${vac.responsibilities}\nУсловия: ${vac.conditions}`;
        }
      } else if (chat.entityType === "gig") {
        const foundGig = await db.query.gig.findFirst({
          where: eq(gig.id, chat.entityId),
        });

        if (foundGig) {
          chatContext = `Гиг: ${foundGig.title}\nОписание: ${foundGig.description}\nТребования: ${foundGig.requirements}`;
        }
      }
    }

    return NextResponse.json({ error: "Not implemented" }, { status: 501 });
  } catch (error) {
    console.error("[Web Chat Stream Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}