import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import { Langfuse } from "langfuse";

export const langfuse = new Langfuse({
  secretKey: env.LANGFUSE_SECRET_KEY,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

// Создаём OpenAI провайдер с прокси
const proxyBaseUrl = env.AI_PROXY_URL;
export const openaiProvider = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: proxyBaseUrl,
});
