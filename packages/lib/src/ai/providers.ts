import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import { Langfuse } from "langfuse";

// Инициализируем Langfuse только если есть все необходимые переменные окружения
let langfuse: Langfuse | undefined;

if (
  env.LANGFUSE_SECRET_KEY &&
  env.LANGFUSE_PUBLIC_KEY &&
  env.LANGFUSE_BASE_URL
) {
  langfuse = new Langfuse({
    secretKey: env.LANGFUSE_SECRET_KEY,
    publicKey: env.LANGFUSE_PUBLIC_KEY,
    baseUrl: env.LANGFUSE_BASE_URL,
  });
}

export { langfuse };

// Проверяем переменные окружения OpenAI
if (!env.OPENAI_API_KEY) {
  throw new Error(
    "Отсутствует обязательная переменная окружения OpenAI: OPENAI_API_KEY",
  );
}

// Создаём OpenAI провайдер с прокси
const proxyBaseUrl = env.AI_PROXY_URL;
export const openaiProvider = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: proxyBaseUrl,
});
