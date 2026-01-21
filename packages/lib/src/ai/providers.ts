import { createOpenAI } from "@ai-sdk/openai";
import { env } from "@qbs-autonaim/config";
import { Langfuse } from "langfuse";

// Validate Langfuse environment variables
if (!env.LANGFUSE_SECRET_KEY || !env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_BASE_URL) {
  throw new Error("Missing required Langfuse environment variables: LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL");
}

export const langfuse = new Langfuse({
  secretKey: env.LANGFUSE_SECRET_KEY,
  publicKey: env.LANGFUSE_PUBLIC_KEY,
  baseUrl: env.LANGFUSE_BASE_URL,
});

// Validate OpenAI environment variables
if (!env.OPENAI_API_KEY) {
  throw new Error("Missing required OpenAI environment variable: OPENAI_API_KEY");
}

// Создаём OpenAI провайдер с прокси
const proxyBaseUrl = env.AI_PROXY_URL;
export const openaiProvider = createOpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: proxyBaseUrl,
});
