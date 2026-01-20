import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@qbs-autonaim/db";
import type { ResponseMapping } from "../types";

interface InterviewSessionData {
  responseId: string;
  startedAt?: string | null;
  completedAt?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

interface InterviewMessageData {
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

interface InsertedSession {
  id: string;
  status: string;
}

interface InsertedMessage {
  id: string;
  role: string;
}

export interface SessionMapping {
  [oldId: string]: string;
}

function readJsonSafe<T>(path: string, fallback: T): T {
  try {
    const content = readFileSync(path, "utf-8").trim();
    return content ? JSON.parse(content) : fallback;
  } catch {
    return fallback;
  }
}

export async function loadInterviewSessions(
  responseMapping: ResponseMapping,
  fallbackResponseId: string,
): Promise<{ sessions: InsertedSession[]; sessionMapping: SessionMapping }> {
  console.log("\n🎤 Загружаем интервью-сессии...");

  const { interviewSession, interviewMessage } = await import(
    "@qbs-autonaim/db/schema"
  );

  // Очищаем существующие данные
  console.log("🗑️  Очищаем существующие интервью-сессии и сообщения...");
  await db.delete(interviewMessage);
  await db.delete(interviewSession);
  console.log("✅ Существующие данные очищены");

  const sessionsPath = join(__dirname, "../../data/interview-sessions.json");
  const sessionsData = readJsonSafe<InterviewSessionData[]>(sessionsPath, []);

  console.log(`🎤 Найдено ${sessionsData.length} интервью-сессий`);

  if (sessionsData.length === 0) {
    console.log("⚠️  Нет данных интервью-сессий для загрузки");
    return { sessions: [], sessionMapping: {} };
  }

  const updatedSessions = sessionsData
    .map((session) => ({
      ...session,
      responseId: responseMapping[session.responseId] || fallbackResponseId,
      startedAt: session.startedAt ? new Date(session.startedAt) : null,
      completedAt: session.completedAt ? new Date(session.completedAt) : null,
      lastMessageAt: session.lastMessageAt
        ? new Date(session.lastMessageAt)
        : null,
      createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
      updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
    }))
    .filter((s) => s.responseId);

  if (updatedSessions.length === 0) {
    console.log("⚠️  Нет валидных интервью-сессий для загрузки");
    return { sessions: [], sessionMapping: {} };
  }

  const sessions = await db
    .insert(interviewSession)
    .values(updatedSessions)
    .returning({ id: interviewSession.id, status: interviewSession.status });

  console.log("✅ Интервью-сессии загружены:");
  for (const s of sessions) {
    console.log(`  - Сессия ${s.id} (${s.status})`);
  }

  const sessionMapping: SessionMapping = {};
  if (sessions.length > 0) {
    sessionMapping.session_001 = sessions[0]?.id || "";
    sessionMapping.session_002 = sessions[1]?.id || "";
    sessionMapping.session_003 = sessions[2]?.id || "";
  }

  return { sessions, sessionMapping };
}

export async function loadInterviewMessages(
  sessionMapping: SessionMapping,
  fallbackSessionId: string,
): Promise<InsertedMessage[]> {
  console.log("\n💬 Загружаем сообщения интервью...");

  const { interviewMessage } = await import("@qbs-autonaim/db/schema");

  const messagesPath = join(__dirname, "../../data/interview-messages.json");
  const messagesData = readJsonSafe<InterviewMessageData[]>(messagesPath, []);

  console.log(`💬 Найдено ${messagesData.length} сообщений интервью`);

  if (messagesData.length === 0 || !fallbackSessionId) {
    console.log("⚠️  Нет данных сообщений интервью для загрузки");
    return [];
  }

  const updatedMessages = messagesData
    .map((msg) => {
      const mappedSessionId =
        sessionMapping[msg.sessionId] || fallbackSessionId;
      if (!mappedSessionId) return null;

      return {
        ...msg,
        sessionId: mappedSessionId,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
        updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  if (updatedMessages.length === 0) {
    console.log("⚠️  Нет валидных сообщений интервью для загрузки");
    return [];
  }

  const messages = await db
    .insert(interviewMessage)
    .values(updatedMessages)
    .returning({ id: interviewMessage.id, role: interviewMessage.role });

  console.log(`✅ Загружено ${messages.length} сообщений интервью`);

  return messages;
}
