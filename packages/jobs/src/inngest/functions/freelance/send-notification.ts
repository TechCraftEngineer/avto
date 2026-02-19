import { eq, inArray } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewScoring,
  response,
  user,
  workspaceMember,
} from "@qbs-autonaim/db/schema";
import { sendEmailHtml } from "@qbs-autonaim/emails/send";
import { inngest } from "../../client";

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes URLs to only allow http(s) protocols
 * Returns a safe placeholder if URL is invalid or uses unsafe protocol
 */
function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "#";

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
    return "#";
  } catch {
    // If URL parsing fails, return placeholder
    return "#";
  }
}

/**
 * Группировка уведомлений в пределах 5-минутного окна
 * Собирает все уведомления для workspace и отправляет их батчем
 */
export const sendFreelanceNotificationFunction = inngest.createFunction(
  {
    id: "freelance-notification-send",
    name: "Send Freelance Notification",
    retries: 2,
  },
  { event: "freelance/notification.send" },
  async ({ event, step }) => {
    const { responseId, gigResponseId, notificationType } = event.data;
    const error = (event.data as { error?: string }).error;

    // Пока поддерживаем только vacancy responses
    // TODO: Добавить поддержку gig responses
    if (!responseId) {
      console.log(
        "⏭️ Пропуск уведомления для gig response (пока не поддерживается)",
        {
          gigResponseId,
          notificationType,
        },
      );
      return {
        success: true,
        skipped: true,
        reason: "Gig responses not yet supported in notifications",
      };
    }

    console.log("📬 Обработка уведомления", {
      responseId,
      gigResponseId,
      notificationType,
    });

    // Определяем тип отклика
    const isGigResponse = !!gigResponseId;

    // Получаем данные отклика и кандидата
    const responseData = await step.run("get-response-data", async () => {
      if (isGigResponse && gigResponseId) {
        // Обработка gig response
        const responseRecord = await db.query.response.findFirst({
          where: eq(response.id, gigResponseId),
        });

        if (!responseRecord) {
          throw new Error(`Gig response ${gigResponseId} не найден`);
        }

        // Получаем gig отдельно через entityId
        const gig = await db.query.gig.findFirst({
          where: (g, { eq }) => eq(g.id, responseRecord.entityId),
          with: {
            workspace: true,
          },
        });

        // Получаем скоринг если есть
        const scoring = await db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.responseId, gigResponseId),
        });

        return {
          response: { ...responseRecord, gig },
          scoring,
          workspaceId: gig?.workspaceId,
          isGig: true as const,
        };
      }

      if (!responseId) {
        throw new Error("responseId или gigResponseId обязателен");
      }

      // Обработка vacancy response (responseId гарантированно string здесь)
      const responseRecord = await db.query.response.findFirst({
        where: eq(response.id, responseId as string),
      });

      if (!responseRecord) {
        throw new Error(`Response ${responseId} не найден`);
      }

      // Получаем vacancy отдельно через entityId
      const vacancy = await db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, responseRecord.entityId),
        with: {
          workspace: true,
        },
      });

      // Получаем скоринг если есть
      const scoring = await db.query.interviewScoring.findFirst({
        where: eq(interviewScoring.responseId, responseId as string),
      });

      return {
        response: { ...responseRecord, vacancy },
        scoring,
        workspaceId: vacancy?.workspaceId,
        isGig: false as const,
      };
    });

    // Получаем всех членов workspace для отправки уведомлений
    const workspaceMembers = await step.run(
      "get-workspace-members",
      async () => {
        if (!responseData.workspaceId) {
          console.warn("⚠️ Workspace ID не найден", {
            responseId,
            gigResponseId,
          });
          return [];
        }

        const members = await db.query.workspaceMember.findMany({
          where: eq(workspaceMember.workspaceId, responseData.workspaceId),
        });

        if (members.length === 0) {
          console.warn("⚠️ Нет членов workspace для уведомления", {
            workspaceId: responseData.workspaceId,
          });
          return [];
        }

        // Получаем данные пользователей
        const userIds = members.map((m) => m.userId);
        const users = await db.query.user.findMany({
          where: inArray(user.id, userIds),
        });

        return users;
      },
    );

    if (workspaceMembers.length === 0) {
      console.log("ℹ️ Нет получателей для уведомления");
      return { success: true, sent: 0 };
    }

    // Формируем сообщение уведомления
    const { htmlMessage, subject } = await step.run(
      "format-notification",
      async () => {
        const { response: responseRecord, scoring, isGig } = responseData;
        const candidateName =
          responseRecord.candidateName || "Кандидат без имени";

        // Type-safe access to title and profileUrl
        const title = isGig
          ? "gig" in responseRecord && responseRecord.gig
            ? responseRecord.gig.title
            : "Задание"
          : "vacancy" in responseRecord && responseRecord.vacancy
            ? responseRecord.vacancy.title
            : "Вакансия";

        const profileUrl = responseRecord.profileUrl ?? undefined;

        const errorMessage = String(error ?? "");

        // Sanitize all user-controlled values
        const safeCandidateName = escapeHtml(candidateName);
        const safeTitle = escapeHtml(title);
        const safeProfileUrl = sanitizeUrl(profileUrl);
        const safeErrorMessage = escapeHtml(errorMessage);
        const safeScore = scoring?.score
          ? escapeHtml(String(scoring.score))
          : null;

        let message = "";
        let htmlMessage = "";
        let subject = "";

        if (notificationType === "INTERVIEW_COMPLETED") {
          subject = `✅ Интервью завершено: ${candidateName}`;
          message = `✅ Интервью завершено\n\n`;
          message += `Кандидат: ${candidateName}\n`;
          message += `${isGig ? "Задание" : "Вакансия"}: ${title}\n`;

          htmlMessage = `<h2>✅ Интервью завершено</h2>`;
          htmlMessage += `<p><strong>Кандидат:</strong> ${safeCandidateName}</p>`;
          htmlMessage += `<p><strong>${isGig ? "Задание" : "Вакансия"}:</strong> ${safeTitle}</p>`;

          if (scoring && safeScore) {
            message += `Оценка: ${scoring.score}/100\n`;
            htmlMessage += `<p><strong>Оценка:</strong> ${safeScore}/100</p>`;
          }

          message += `\nПрофиль: ${profileUrl}`;
          htmlMessage += `<p><a href="${safeProfileUrl}">Открыть профиль</a></p>`;
        } else if (notificationType === "HIGH_SCORE_CANDIDATE") {
          subject = `🌟 Высокооценённый кандидат: ${candidateName}`;
          message = `🌟 Найден высокооценённый кандидат!\n\n`;
          message += `Кандидат: ${candidateName}\n`;
          message += `${isGig ? "Задание" : "Вакансия"}: ${title}\n`;

          htmlMessage = `<h2>🌟 Найден высокооценённый кандидат!</h2>`;
          htmlMessage += `<p><strong>Кандидат:</strong> ${safeCandidateName}</p>`;
          htmlMessage += `<p><strong>${isGig ? "Задание" : "Вакансия"}:</strong> ${safeTitle}</p>`;

          if (scoring && safeScore) {
            message += `Оценка: ${scoring.score}/100 ⭐\n`;
            htmlMessage += `<p><strong>Оценка:</strong> ${safeScore}/100 ⭐</p>`;
          }

          message += `\nПрофиль: ${profileUrl}`;
          htmlMessage += `<p><a href="${safeProfileUrl}">Открыть профиль</a></p>`;
        } else if (notificationType === "ANALYSIS_FAILED") {
          subject = `❌ Ошибка анализа: ${candidateName}`;
          message = `❌ Ошибка AI-анализа отклика\n\n`;
          message += `Кандидат: ${candidateName}\n`;
          message += `${isGig ? "Задание" : "Вакансия"}: ${title}\n`;
          message += `\nВсе попытки автоматического анализа исчерпаны.\n`;
          message += `Вы можете повторить анализ вручную в интерфейсе.\n`;

          htmlMessage = `<h2>❌ Ошибка AI-анализа отклика</h2>`;
          htmlMessage += `<p><strong>Кандидат:</strong> ${safeCandidateName}</p>`;
          htmlMessage += `<p><strong>${isGig ? "Задание" : "Вакансия"}:</strong> ${safeTitle}</p>`;
          htmlMessage += `<p>Все попытки автоматического анализа исчерпаны.</p>`;
          htmlMessage += `<p>Вы можете повторить анализ вручную в интерфейсе.</p>`;

          if (errorMessage) {
            message += `\nОшибка: ${errorMessage}`;
            htmlMessage += `<p><strong>Ошибка:</strong> ${safeErrorMessage}</p>`;
          }

          message += `\nПрофиль: ${profileUrl}`;
          htmlMessage += `<p><a href="${safeProfileUrl}">Открыть профиль</a></p>`;
        }

        return {
          message,
          htmlMessage,
          subject,
          profileUrl,
          candidateName,
          title,
          score: scoring?.score,
        };
      },
    );

    // Отправляем уведомления всем членам workspace
    const sendResults = await step.run("send-notifications", async () => {
      const results = [];

      for (const member of workspaceMembers) {
        // Email уведомление
        if (member.email) {
          try {
            await sendEmailHtml({
              to: [member.email],
              subject,
              html: htmlMessage,
            });

            console.log("📧 Email уведомление отправлено", {
              to: member.email,
              type: notificationType,
            });

            results.push({
              userId: member.id,
              channel: "EMAIL",
              success: true,
            });
          } catch (emailError) {
            console.error("❌ Ошибка отправки email", {
              to: member.email,
              error: emailError,
            });

            results.push({
              userId: member.id,
              channel: "EMAIL",
              success: false,
              error:
                emailError instanceof Error
                  ? emailError.message
                  : "Unknown error",
            });
          }
        }

        // TODO: In-app уведомление
        // Создать запись в таблице notifications для отображения в UI
        // await db.insert(notification).values({
        //   userId: member.id,
        //   workspaceId: responseData.workspaceId,
        //   type: notificationType,
        //   title: subject,
        //   message: message,
        //   link: `/responses/${responseId}`,
        //   read: false,
        // });

        // TODO: Telegram уведомление
        // Если у пользователя есть telegram username
        // await inngest.send({
        //   name: "telegram/message.send-by-username",
        //   data: {
        //     workspaceId: responseData.workspaceId,
        //     username: member.telegramUsername,
        //     content: message,
        //   },
        // });
      }

      return results;
    });

    console.log("✅ Уведомления отправлены", {
      workspaceId: responseData.workspaceId,
      sent: sendResults.filter((r) => r.success).length,
      failed: sendResults.filter((r) => !r.success).length,
      type: notificationType,
    });

    return {
      success: true,
      sent: sendResults.filter((r) => r.success).length,
      failed: sendResults.filter((r) => !r.success).length,
      notificationType,
    };
  },
);
