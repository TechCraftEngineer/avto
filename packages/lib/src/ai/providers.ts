import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
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

// Создаём OpenAI провайдер с прокси только если есть API ключ
const proxyBaseUrl = env.AI_PROXY_URL;
export const openaiProvider = env.OPENAI_API_KEY
  ? createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: proxyBaseUrl,
    })
  : null;

// Создаём OpenRouter провайдер только если есть API ключ
export const openrouterProvider = env.OPENROUTER_API_KEY
  ? createOpenRouter({
      apiKey: env.OPENROUTER_API_KEY,
    })
  : null;
