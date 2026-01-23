/**
 * Публичный endpoint для загрузки голосовых сообщений в интервью
 * Доступен без авторизации, но защищён проверкой sessionId
 * Только для WEB интервью (lastChannel = 'web')
 */

import { hasInterviewAccess, validateInterviewToken } from "@qbs-autonaim/api";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { file, interviewMessage } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { uploadFile } from "@qbs-autonaim/lib/s3";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  sessionId: z.string().uuid(),
  interviewToken: z.string().optional(),
  audioFile: z.string(), // base64
  fileName: z.string(),
  mimeType: z.string(),
  duration: z.number().optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const {
      sessionId,
      interviewToken,
      audioFile,
      fileName,
      mimeType,
      duration,
    } = requestSchema.parse(json);

    // Валидируем токен из input
    let validatedToken = null;
    if (interviewToken) {
      try {
        validatedToken = await validateInterviewToken(interviewToken, db);
      } catch (error) {
        console.error("Failed to validate interview token:", error);
      }
    }

    // Проверяем доступ к interview session
    const hasAccess = await hasInterviewAccess(
      sessionId,
      validatedToken,
      null, // нет авторизованного пользователя
      db,
    );

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Проверяем что interview session существует и это WEB интервью
    const session = await db.query.interviewSession.findFirst({
      where: (s, { and }) => and(eq(s.id, sessionId), eq(s.lastChannel, "web")),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Interview is not active" },
        { status: 403 },
      );
    }

    // Декодируем base64
    const base64Data = audioFile.replace(/^data:audio\/\w+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Проверяем размер (макс 25MB)
    if (fileBuffer.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB" },
        { status: 400 },
      );
    }

    // Загружаем в S3
    const key = await uploadFile(fileBuffer, fileName, mimeType, "voice");

    // Создаем запись файла в БД
    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType,
        fileSize: fileBuffer.length.toString(),
      })
      .returning();

    if (!fileRecord) {
      throw new Error("Failed to create file record");
    }

    // Длительность в секундах (как в схеме interviewMessage.voiceDuration)
    const voiceDuration =
      duration !== undefined ? Math.round(duration) : undefined;

    // Создаем сообщение в БД
    const [message] = await db
      .insert(interviewMessage)
      .values({
        sessionId,
        role: "user",
        type: "voice",
        channel: "web",
        content: "", // Будет заполнено после транскрибации
        fileId: fileRecord.id,
        voiceDuration,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    // Отправляем событие на транскрибацию
    try {
      await inngest.send({
        name: "telegram/voice.transcribe",
        data: {
          messageId: message.id,
          fileId: fileRecord.id,
        },
      });
    } catch (error) {
      console.error("Failed to send transcription event:", error);
      // Не падаем, если Inngest недоступен
    }

    return NextResponse.json({
      success: true,
      messageId: message.id,
      fileId: fileRecord.id,
    });
  } catch (error) {
    console.error("[Interview Upload Voice] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
