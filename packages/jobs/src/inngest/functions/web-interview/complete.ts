import {
  and,
  desc,
  eq,
  interviewMessage,
  interviewScoring,
  interviewSession,
  response,
  sql,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  formatProfileDataForStorage,
  type ProfileData,
  parseFreelancerProfile,
  type StoredProfileData,
} from "@qbs-autonaim/jobs-parsers";
import {
  createInterviewScoring,
  getInterviewContext,
  saveQuestionAnswer,
} from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция завершения интервью в веб-чате
 * Создает скоринг и обновляет статус
 */
export const webCompleteInterviewFunction = inngest.createFunction(
  {
    id: "web-interview-complete",
    name: "Web Interview Complete",
    retries: 3,
  },
  { event: "web/interview.complete" },
  async ({ event, step }) => {
    const {
      chatSessionId,
      transcription,
      reason,
      questionNumber,
      responseId,
      gigResponseId,
    } = event.data;

    console.log("🏁 Completing web interview", {
      chatSessionId,
      questionNumber,
      reason,
    });

    // Получаем контекст интервью
    await step.run("get-interview-context", async () => {
      const ctx = await getInterviewContext(chatSessionId);

      if (!ctx) {
        throw new Error(`Interview context not found for ${chatSessionId}`);
      }

      return ctx;
    });

    // Сохраняем последний ответ если есть
    if (transcription && questionNumber) {
      await step.run("save-final-answer", async () => {
        // Получаем последний вопрос от бота
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

        console.log("✅ Final answer saved", {
          chatSessionId,
          questionNumber,
        });
      });

      // Обновляем контекст с последним ответом
      const updatedContext = await step.run("get-updated-context", async () => {
        const ctx = await getInterviewContext(chatSessionId);
        if (!ctx) {
          throw new Error(`Interview context not found for ${chatSessionId}`);
        }
        return ctx;
      });

      // Создаем скоринг
      await step.run("create-scoring", async () => {
        const result = await createInterviewScoring(updatedContext);

        console.log("✅ Scoring created", {
          chatSessionId,
          score: result.score,
        });

        await db
          .insert(interviewScoring)
          .values({
            interviewSessionId: chatSessionId,
            responseId: responseId ?? undefined,
            score: result.detailedScore,
            rating: result.score,
            analysis: result.analysis,
            botUsageDetected: result.botUsageDetected,
          })
          .onConflictDoUpdate({
            target: interviewScoring.interviewSessionId,
            set: {
              score: sql`excluded.score`,
              analysis: sql`excluded.analysis`,
              botUsageDetected: sql`excluded.bot_usage_detected`,
            },
          });

        return result;
      });

      // Обновляем статус interviewSession
      await step.run("update-interview-session-status", async () => {
        await db
          .update(interviewSession)
          .set({ status: "completed" })
          .where(eq(interviewSession.id, chatSessionId));

        console.log("✅ InterviewSession status updated to completed", {
          chatSessionId,
        });
      });

      // Обновляем статус vacancy_response
      if (responseId) {
        // Парсим профиль фрилансера перед обновлением статуса
        const profileData = await step.run(
          "parse-profile",
          async (): Promise<ProfileData | null> => {
            const responseRecord = await db.query.response.findFirst({
              where: (r, { eq }) => eq(r.id, responseId),
            });

            if (!responseRecord?.platformProfileUrl) {
              console.log(
                "⚠️ platformProfileUrl отсутствует, пропускаем парсинг профиля",
              );
              return null;
            }

            try {
              const profile = await parseFreelancerProfile(
                responseRecord.platformProfileUrl,
              );

              console.log("✅ Профиль распарсен", {
                platform: profile.platform,
                username: profile.username,
                error: profile.error,
              });

              return profile;
            } catch (error) {
              console.error("❌ Ошибка парсинга профиля:", error);
              return null;
            }
          },
        );

        await step.run("update-response-status", async () => {
          const updateData: {
            status: "COMPLETED";
            profileData?: StoredProfileData;
          } = {
            status: "COMPLETED",
          };

          // Сохраняем данные профиля в поле profileData
          if (profileData && !profileData.error) {
            updateData.profileData = formatProfileDataForStorage(profileData);
          }

          await db
            .update(response)
            .set({
              status: updateData.status,
              profileData: updateData.profileData as
                | Record<string, unknown>
                | undefined,
            })
            .where(eq(response.id, responseId));

          console.log("✅ Response status updated to COMPLETED", {
            responseId,
            profileParsed: !!profileData,
          });
        });

        // Отправляем уведомления
        await step.run("send-notifications", async () => {
          const responseRecord = await db.query.response.findFirst({
            where: (r, { eq }) => eq(r.id, responseId),
          });

          if (!responseRecord) {
            console.warn("⚠️ Response не найден для уведомления");
            return;
          }

          // Получаем workspaceId из vacancy или gig
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

          if (!workspaceId || !entityId) {
            console.warn("⚠️ Не удалось получить workspaceId для уведомления");
            return;
          }

          // Получаем скоринг
          const scoring = await db.query.interviewScoring.findFirst({
            where: (s, { eq }) => eq(s.responseId, responseId),
          });

          if (!scoring) {
            console.warn("⚠️ Скоринг не найден для уведомления");
            return;
          }

          // Отправляем уведомление о завершении интервью
          await inngest.send({
            name: "freelance/notification.send",
            data: {
              workspaceId,
              vacancyId:
                responseRecord.entityType === "vacancy" ? entityId : undefined,
              responseId,
              notificationType: "INTERVIEW_COMPLETED",
              candidateName: responseRecord.candidateName ?? undefined,
              score: scoring.score,
              profileUrl:
                responseRecord.platformProfileUrl ??
                responseRecord.resumeUrl ??
                undefined,
            },
          });

          // Если кандидат высокооценённый (85+), отправляем приоритетное уведомление
          if (scoring.score >= 85) {
            await inngest.send({
              name: "freelance/notification.send",
              data: {
                workspaceId,
                vacancyId:
                  responseRecord.entityType === "vacancy"
                    ? entityId
                    : undefined,
                responseId,
                notificationType: "HIGH_SCORE_CANDIDATE",
                candidateName: responseRecord.candidateName ?? undefined,
                score: scoring.score,
                profileUrl:
                  responseRecord.platformProfileUrl ??
                  responseRecord.resumeUrl ??
                  undefined,
              },
            });
          }

          console.log("✅ Уведомления отправлены", {
            responseId,
            score: scoring.score,
            isHighScore: scoring.score >= 85,
          });
        });
      }

      // Обновляем статус gig_response
      if (gigResponseId) {
        // Парсим профиль фрилансера перед обновлением статуса
        const gigProfileData = await step.run(
          "parse-gig-profile",
          async (): Promise<ProfileData | null> => {
            const responseRecord = await db.query.response.findFirst({
              where: (r, { eq }) => eq(r.id, gigResponseId),
            });

            if (!responseRecord?.profileUrl) {
              console.log(
                "⚠️ profileUrl отсутствует, пропускаем парсинг профиля",
              );
              return null;
            }

            try {
              const profile = await parseFreelancerProfile(
                responseRecord.profileUrl,
              );

              console.log("✅ Профиль gig распарсен", {
                platform: profile.platform,
                username: profile.username,
                error: profile.error,
              });

              return profile;
            } catch (error) {
              console.error("❌ Ошибка парсинга профиля gig:", error);
              return null;
            }
          },
        );

        await step.run("update-gig-response-status", async () => {
          const updateData: {
            status: "INTERVIEW";
            profileData?: StoredProfileData;
          } = {
            status: "INTERVIEW",
          };

          // Сохраняем данные профиля в поле profileData
          if (gigProfileData && !gigProfileData.error) {
            updateData.profileData =
              formatProfileDataForStorage(gigProfileData);
          }

          await db
            .update(response)
            .set({
              status: updateData.status,
              profileData: updateData.profileData as
                | Record<string, unknown>
                | undefined,
            })
            .where(eq(response.id, gigResponseId));

          console.log("✅ Gig response status updated to INTERVIEW", {
            gigResponseId,
            profileParsed: !!gigProfileData,
          });
        });

        // Отправляем уведомления для gig
        await step.run("send-gig-notifications", async () => {
          const responseRecord = await db.query.response.findFirst({
            where: (r, { eq }) => eq(r.id, gigResponseId),
          });

          if (!responseRecord) {
            console.warn("⚠️ Response не найден для уведомления gig");
            return;
          }

          // Получаем workspaceId из gig
          const gig = await db.query.gig.findFirst({
            where: (g, { eq }) => eq(g.id, responseRecord.entityId),
          });

          if (!gig?.workspaceId) {
            console.warn(
              "⚠️ Не удалось получить workspaceId для уведомления gig",
            );
            return;
          }

          // Получаем скоринг
          const scoring = await db.query.interviewScoring.findFirst({
            where: (s, { eq }) => eq(s.responseId, gigResponseId),
          });

          if (!scoring) {
            console.warn("⚠️ Скоринг не найден для уведомления gig");
            return;
          }

          // Отправляем уведомление о завершении интервью
          await inngest.send({
            name: "freelance/notification.send",
            data: {
              workspaceId: gig.workspaceId,
              gigId: gig.id,
              gigResponseId,
              notificationType: "INTERVIEW_COMPLETED",
              candidateName: responseRecord.candidateName ?? undefined,
              score: scoring.score,
              profileUrl: responseRecord.profileUrl ?? undefined,
            },
          });

          // Если кандидат высокооценённый (85+), отправляем приоритетное уведомление
          if (scoring.score >= 85) {
            await inngest.send({
              name: "freelance/notification.send",
              data: {
                workspaceId: gig.workspaceId,
                gigId: gig.id,
                gigResponseId,
                notificationType: "HIGH_SCORE_CANDIDATE",
                candidateName: responseRecord.candidateName ?? undefined,
                score: scoring.score,
                profileUrl: responseRecord.profileUrl ?? undefined,
              },
            });
          }

          console.log("✅ Уведомления для gig отправлены", {
            gigResponseId,
            score: scoring.score,
            isHighScore: scoring.score >= 85,
          });
        });

        // Запускаем пересчет рейтинга после завершения интервью
        await step.run("trigger-ranking-recalculation", async () => {
          const responseRecord = await db.query.response.findFirst({
            where: (r, { eq }) => eq(r.id, gigResponseId),
          });

          if (!responseRecord) {
            console.warn("⚠️ Response не найден для пересчета рейтинга");
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

          console.log("🎯 Запуск пересчета рейтинга после интервью", {
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

          console.log("✅ Событие пересчета рейтинга отправлено", {
            gigId: gig.id,
          });
        });
      }
    }

    // Отправляем финальное сообщение
    await step.run("send-completion-message", async () => {
      const completionMessage =
        reason ||
        "Спасибо за ваши ответы! Интервью завершено. Мы свяжемся с вами в ближайшее время.";

      // Получаем interviewSession для доступа к lastChannel
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
      });

      if (!session) {
        throw new Error(`InterviewSession ${chatSessionId} not found`);
      }

      await db.insert(interviewMessage).values({
        sessionId: chatSessionId,
        role: "assistant",
        type: "text",
        channel: session.lastChannel ?? "web",
        content: completionMessage,
      });

      console.log("✅ Completion message sent", {
        chatSessionId,
      });
    });

    console.log("✅ Web interview completed", {
      chatSessionId,
      questionNumber,
    });

    return {
      success: true,
      chatSessionId,
    };
  },
);
