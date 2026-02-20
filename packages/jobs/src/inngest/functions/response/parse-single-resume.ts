import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import { getAIModel } from "@qbs-autonaim/lib/ai";
import { AgentFactory } from "@qbs-autonaim/ai/agents/core";
import { inngest } from "../../client";

/**
 * Inngest функция для парсинга одного резюме через ResumeStructurerAgent
 */
export const parseSingleResumeFunction = inngest.createFunction(
  {
    id: "parse-single-resume",
    name: "Parse Single Resume",
    retries: 2,
  },
  { event: "response/resume.parse-single" },
  async ({ event, step }) => {
    const { responseId } = event.data;

    console.log(`🚀 Запуск парсинга резюме для отклика: ${responseId}`);

    // Получаем отклик с текстом резюме
    const responseData = await step.run("fetch-response", async () => {
      const resp = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          id: true,
          profileData: true,
          candidateName: true,
        },
      });

      if (!resp) {
        throw new Error("Отклик не найден");
      }

      const resumeText = resp.profileData?.resumeText;
      if (!resumeText || typeof resumeText !== "string") {
        throw new Error("Текст резюме не найден в profileData");
      }

      return {
        id: resp.id,
        resumeText,
        candidateName: resp.candidateName,
        profileData: resp.profileData,
      };
    });

    // Парсим через ResumeStructurerAgent
    const parsedData = await step.run("parse-with-agent", async () => {
      const timeoutMs = 60_000;
      const abortSignal = AbortSignal.timeout(timeoutMs);

      try {
        const model = getAIModel();
        const factory = new AgentFactory({
          model,
          traceId: `parse-resume-${responseId}`,
        });

        const agent = factory.createResumeStructurer();
        const result = await agent.execute(
          { rawText: responseData.resumeText },
          { abortSignal },
        );

        if (!result.success || !result.data) {
          throw new Error("Агент не смог распарсить резюме");
        }

        console.log(`✅ Резюме распарсено для отклика: ${responseId}`);
        return result.data;
      } catch (error) {
        const isTimeout =
          error instanceof Error &&
          (error.name === "AbortError" ||
            error.name === "TimeoutError" ||
            error.message.includes("aborted") ||
            error.message.includes("timeout"));

        if (isTimeout) {
          console.error(`⏱️ Таймаут при парсинге резюме: ${responseId}`);
          throw new Error(
            `Таймаут при парсинге резюме для отклика ${responseId} после ${timeoutMs}ms`,
          );
        }

        console.error(`❌ Ошибка парсинга резюме: ${responseId}`, error);
        throw error;
      }
    });

    // Обновляем profileData с распарсенными данными
    await step.run("update-profile-data", async () => {
      await db
        .update(response)
        .set({
          profileData: {
            ...responseData.profileData,
            parsedResume: parsedData,
          },
        })
        .where(eq(response.id, responseId));

      console.log(`✅ Данные резюме сохранены для отклика: ${responseId}`);
    });

    return {
      success: true,
      responseId,
    };
  },
);
