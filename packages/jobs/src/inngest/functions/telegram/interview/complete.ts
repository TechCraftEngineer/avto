import { AgentFactory } from "@qbs-autonaim/ai";
import { and, desc, eq, logResponseEvent, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewScoring,
  interviewSession,
  response,
} from "@qbs-autonaim/db/schema";
import {
  formatProfileDataForStorage,
  parseFreelancerProfile,
  type StoredProfileData,
} from "@qbs-autonaim/jobs-parsers";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import {
  createInterviewScoring,
  getInterviewContext,
  saveQuestionAnswer,
} from "../../../../services/interview";
import { inngest } from "../../../client";

/**
 * Функция для завершения интервью и создания скоринга
 * Может быть запущена независимо
 */
export const completeInterviewFunction = inngest.createFunction(
  {
    id: "complete-interview",
    name: "Complete Interview and Create Scoring",
    retries: 3,
  },
  { event: "telegram/interview.complete" },
  async ({ event, step }) => {
    const { chatSessionId, transcription, questionNumber, responseId } =
      event.data;

    await step.run("save-last-qa", async () => {
      const lastBotMessages = await db
        .select()
        .from(interviewMessage)
        .where(
          and(
            eq(interviewMessage.sessionId, chatSessionId),
            eq(interviewMessage.role, "assistant"),
          ),
        )
        .orderBy(desc(interviewMessage.createdAt))
        .limit(1);

      const lastQuestion = lastBotMessages[0]?.content || "Первый вопрос";

      await saveQuestionAnswer(chatSessionId, lastQuestion, transcription);
    });

    if (responseId) {
      const scoringResult = await step.run("create-scoring", async () => {
        const updatedContext = await getInterviewContext(chatSessionId);

        if (!updatedContext) {
          throw new Error("Не удалось получить обновленный контекст");
        }

        const scoring = await createInterviewScoring(updatedContext);

        await db
          .insert(interviewScoring)
          .values({
            interviewSessionId: chatSessionId,
            responseId,
            score: scoring.detailedScore,
            rating: scoring.score,
            analysis: scoring.analysis,
            botUsageDetected: scoring.botUsageDetected,
          })
          .onConflictDoUpdate({
            target: interviewScoring.interviewSessionId,
            set: {
              score: sql`excluded.score`,
              analysis: sql`excluded.analysis`,
              botUsageDetected: sql`excluded.bot_usage_detected`,
            },
          });

        return scoring;
      });

      await step.run("finalize-response-status", async () => {
        const hrSelectionStatus =
          scoringResult.score >= 70 ? "RECOMMENDED" : "NOT_RECOMMENDED";

        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, responseId),
        });

        const updateData: {
          status: "COMPLETED";
          hrSelectionStatus: "RECOMMENDED" | "NOT_RECOMMENDED";
          profileData?: StoredProfileData;
        } = {
          status: "COMPLETED",
          hrSelectionStatus,
        };

        if (responseRecord?.platformProfileUrl) {
          try {
            const profile = await parseFreelancerProfile(
              responseRecord.platformProfileUrl,
            );

            if (!profile.error) {
              updateData.profileData = formatProfileDataForStorage(profile);
            }
          } catch (error) {
            console.error("❌ Ошибка парсинга профиля (Telegram):", error);
          }
        }

        await db
          .update(response)
          .set({
            status: updateData.status,
            hrSelectionStatus: updateData.hrSelectionStatus,
            profileData: updateData.profileData as
              | Record<string, unknown>
              | undefined,
          })
          .where(eq(response.id, responseId));
      });

      await step.run("send-completion-notification", async () => {
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, responseId),
        });

        if (!responseRecord) return;

        // Загружаем vacancy или gig для получения workspaceId
        let workspaceId: string | undefined;
        let entityId: string | undefined;

        if (responseRecord.entityType === "vacancy") {
          const vacancy = await db.query.vacancy.findFirst({
            where: (v, { eq }) => eq(v.id, responseRecord.entityId),
          });
          workspaceId = vacancy?.workspaceId;
          entityId = vacancy?.id;
        } else if (responseRecord.entityType === "gig") {
          const gig = await db.query.gig.findFirst({
            where: (g, { eq }) => eq(g.id, responseRecord.entityId),
          });
          workspaceId = gig?.workspaceId;
          entityId = gig?.id;
        }

        if (!workspaceId || !entityId) return;

        await inngest.send({
          name: "freelance/notification.send",
          data: {
            workspaceId,
            vacancyId:
              responseRecord.entityType === "vacancy" ? entityId : undefined,
            responseId,
            notificationType: "INTERVIEW_COMPLETED",
            candidateName: responseRecord.candidateName ?? undefined,
            score: scoringResult.score,
            profileUrl:
              responseRecord.platformProfileUrl ??
              responseRecord.resumeUrl ??
              undefined,
          },
        });

        if (scoringResult.score >= 85) {
          await inngest.send({
            name: "freelance/notification.send",
            data: {
              workspaceId,
              vacancyId:
                responseRecord.entityType === "vacancy" ? entityId : undefined,
              responseId,
              notificationType: "HIGH_SCORE_CANDIDATE",
              candidateName: responseRecord.candidateName ?? undefined,
              score: scoringResult.score,
              profileUrl:
                responseRecord.platformProfileUrl ??
                responseRecord.resumeUrl ??
                undefined,
            },
          });
        }
      });

      await step.run("extract-salary-expectations", async () => {
        const session = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.id, chatSessionId),
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
          },
        });

        if (!session?.messages) return;

        const conversationHistory = session.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
              | "CANDIDATE"
              | "BOT",
            content:
              msg.type === "voice" && msg.voiceTranscription
                ? msg.voiceTranscription
                : (msg.content ?? ""),
          }));

        const model = getAIModel();
        const factory = new AgentFactory({ model });
        const agent = factory.createSalaryExtraction();

        const result = await agent.execute(
          { conversationHistory },
          {
            candidateName: undefined,
            vacancyTitle: undefined,
            vacancyDescription: undefined,
            conversationHistory,
          },
        );

        if (!result.success || !result.data) return;

        const trimmedSalary = result.data.salaryExpectations.trim();

        if (trimmedSalary) {
          const current = await db.query.response.findFirst({
            where: eq(response.id, responseId),
          });

          await db
            .update(response)
            .set({ salaryExpectationsComment: trimmedSalary })
            .where(eq(response.id, responseId));

          await logResponseEvent({
            db,
            responseId,
            eventType: "SALARY_UPDATED",
            oldValue: current?.salaryExpectationsComment,
            newValue: trimmedSalary,
          });
        }
      });

      await step.run("trigger-recommendation-generation", async () => {
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, responseId),
        });

        if (!responseRecord) {
          console.warn("⚠️ Response не найден для генерации рекомендации");
          return;
        }

        // Генерируем рекомендацию после интервью, когда есть полные данные
        const eventName =
          responseRecord.entityType === "vacancy"
            ? "response/vacancy-recommendation.generate"
            : responseRecord.entityType === "gig"
              ? "response/gig-recommendation.generate"
              : "response/recommendation.generate";

        console.log("🎯 Запуск генерации рекомендации после интервью", {
          responseId,
          entityType: responseRecord.entityType,
        });

        await inngest.send({
          name: eventName,
          data: {
            responseId,
          },
        });

        console.log("✅ Событие генерации рекомендации отправлено", {
          responseId,
        });
      });

      await step.run("trigger-ranking-for-gig", async () => {
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, responseId),
        });

        if (!responseRecord || responseRecord.entityType !== "gig") {
          console.log(
            "⚠️ Response не является gig, пропускаем пересчет рейтинга",
          );
          return;
        }

        const gig = await db.query.gig.findFirst({
          where: (g, { eq }) => eq(g.id, responseRecord.entityId),
        });

        if (!gig?.workspaceId) {
          console.warn(
            "⚠️ Не удалось получить workspaceId для пересчета рейтинга",
          );
          return;
        }

        console.log("🎯 Запуск пересчета рейтинга после интервью (Telegram)", {
          gigId: gig.id,
          workspaceId: gig.workspaceId,
        });

        await inngest.send({
          name: "gig/ranking.recalculate",
          data: {
            gigId: gig.id,
            workspaceId: gig.workspaceId,
            triggeredBy: "interview.completed",
          },
        });

        console.log("✅ Событие пересчета рейтинга отправлено (Telegram)", {
          gigId: gig.id,
        });
      });
    }

    const chatId = await step.run("get-chat-id", async () => {
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
      });

      if (!session) throw new Error("InterviewSession не найден");

      const responseRecord = await db.query.response.findFirst({
        where: eq(response.id, session.responseId),
      });

      if (!responseRecord?.chatId)
        throw new Error("ChatId не найден в response");
      return responseRecord.chatId;
    });

    await step.run("send-final-message", async () => {
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
          },
        },
      });

      let candidateName: string | undefined;
      let vacancyTitle: string | undefined;
      let score: number | undefined;
      let resumeLanguage: string | undefined;

      if (session?.responseId) {
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, session.responseId),
        });
        candidateName = responseRecord?.candidateName ?? undefined;
        resumeLanguage = responseRecord?.resumeLanguage ?? "ru";

        // Загружаем vacancy или gig для получения title
        if (responseRecord?.entityType === "vacancy") {
          const vacancy = await db.query.vacancy.findFirst({
            where: (v, { eq }) => eq(v.id, responseRecord.entityId),
          });
          vacancyTitle = vacancy?.title ?? undefined;
        } else if (responseRecord?.entityType === "gig") {
          const gig = await db.query.gig.findFirst({
            where: (g, { eq }) => eq(g.id, responseRecord.entityId),
          });
          vacancyTitle = gig?.title ?? undefined;
        }

        const scoring = await db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.interviewSessionId, chatSessionId),
        });
        score = scoring?.score ?? undefined;
      }

      const conversationHistory =
        session?.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
              | "CANDIDATE"
              | "BOT",
            content:
              msg.type === "voice" && msg.voiceTranscription
                ? msg.voiceTranscription
                : (msg.content ?? ""),
            contentType: msg.type,
          })) ?? [];

      const model = getAIModel();
      const factory = new AgentFactory({ model });
      const agent = factory.createInterviewCompletion();

      const result = await agent.execute(
        {
          questionCount: questionNumber,
          score,
          resumeLanguage: resumeLanguage || "ru",
        },
        {
          candidateName,
          vacancyTitle,
          vacancyDescription: undefined,
          conversationHistory,
        },
      );

      const finalMessage =
        result.success && result.data
          ? result.data.finalMessage
          : "Спасибо за беседу! Обработаю информацию и вернусь с обратной связью.";

      const [newMessage] = await db
        .insert(interviewMessage)
        .values({
          sessionId: chatSessionId,
          role: "assistant",
          type: "text",
          content: finalMessage.trim(),
          channel: "telegram",
        })
        .returning();

      if (!newMessage) throw new Error("Не удалось создать запись сообщения");

      await inngest.send({
        name: "telegram/message.send",
        data: {
          messageId: newMessage.id,
          chatId,
          content: finalMessage.trim(),
        },
      });
    });

    return {
      success: true,
      chatSessionId,
      totalQuestions: questionNumber,
    };
  },
);
