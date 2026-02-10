import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).optional(),

    // Vercel
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),

    // Database
    POSTGRES_URL: z.url().optional(),

    // Email
    RESEND_API_KEY: z.string().optional(),
    EMAIL_SANDBOX_ENABLED: z.coerce.boolean().optional().default(false),
    EMAIL_SANDBOX_HOST: z.string().default("localhost"),
    EMAIL_FROM: z.string().default("QBS Автонайм <onboarding@resend.dev>"),

    // Auth
    AUTH_SECRET: z.string().optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),

    // AWS S3
    AWS_S3_ENDPOINT: z.string().optional(),
    AWS_S3_FORCE_PATH_STYLE: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AWS_REGION: z.string().default("us-east-1"),
    AWS_S3_BUCKET: z.string().default("acme-bucket"),

    // AI Services
    AI_PROVIDER: z
      .enum(["openai", "deepseek", "openrouter", "local"])
      .default("deepseek"),
    AI_MODEL: z.string().optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    DEEPSEEK_API_KEY: z.string().min(1).optional(),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    LOCAL_API_KEY: z.string().min(1).optional(),
    LOCAL_API_URL: z.url().optional(),
    LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
    LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
    LANGFUSE_BASE_URL: z.url().optional(),
    AI_PROXY_URL: z.url().optional(),

    // Jobs
    PORT: z.string().optional().default("8000").transform(Number),
    USER_ID: z.string().optional(),

    // Telegram
    TELEGRAM_API_ID: z.string().min(1).optional(),
    TELEGRAM_API_HASH: z.string().min(1).optional(),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
    TG_CLIENT_URL: z.url().optional().default("http://localhost:8001"),

    // Inngest
    INNGEST_EVENT_KEY: z.string().min(1).optional(),
    INNGEST_SIGNING_KEY: z.string().min(1).optional(),
    INNGEST_EVENT_API_BASE_URL: z.url().optional().default("https://inn.gs"),

    // App URL
    APP_URL: z.url().optional().default("http://localhost:3000"),
    APP_NAME: z.string().optional().default("QBS Автонайм"),
    CUSTOM_DOMAIN_TARGET: z.string().optional().default("cname.qbs.ru"),

    // Interview Buffer Configuration
    INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT: z
      .string()
      .optional()
      .default("120")
      .transform(Number),
    INTERVIEW_TYPING_DEBOUNCE_TIMEOUT: z
      .string()
      .optional()
      .default("30")
      .transform(Number),
    INTERVIEW_BUFFER_ENABLED: z
      .string()
      .optional()
      .default("true")
      .transform((val) => val === "true"),

    // Docling
    // Note: DOCLING_API_URL uses port 8080 to avoid conflict with PORT (default 8000)
    DOCLING_API_URL: z.url().optional().default("http://localhost:8080"),
    DOCLING_API_KEY: z.string().optional().default(""),

    // Embedding Service Configuration
    EMBEDDING_PROVIDER: z
      .enum(["openai", "anthropic", "local"])
      .optional()
      .default("openai"),
    EMBEDDING_MODEL: z.string().optional().default("text-embedding-3-small"),
    EMBEDDING_CHUNK_SIZE: z
      .string()
      .optional()
      .default("512")
      .transform(Number),
    EMBEDDING_CHUNK_OVERLAP: z
      .string()
      .optional()
      .default("50")
      .transform(Number),
    EMBEDDING_DIMENSIONS: z
      .string()
      .optional()
      .default("1536")
      .transform(Number),

    // Qdrant Configuration
    QDRANT_URL: z.url().optional().default("http://localhost:6333"),
    QDRANT_API_KEY: z.string().optional(),
    QDRANT_COLLECTION_NAME: z
      .string()
      .optional()
      .default("document_embeddings"),

    ENCRYPTION_KEY: z
      .string()
      .length(64, "ENCRYPTION_KEY должен быть 64 символа (32 байта в hex)")
      .optional(),
    TG_CLIENT_PORT: z.string().optional().default("8001").transform(Number),

    // YooKassa Payment Integration
    YOOKASSA_SHOP_ID: z.string().min(1).optional(),
    YOOKASSA_SECRET_KEY: z.string().min(1).optional(),
    YOOKASSA_API_URL: z.url().optional().default("https://api.yookassa.ru/v3"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().optional().default("http://localhost:3000"),
    NEXT_PUBLIC_APP_NAME: z.string().optional().default("QBS Автонайм"),
    NEXT_PUBLIC_INTERVIEW_URL: z
      .url()
      .optional()
      .default("http://localhost:3001"),
    NEXT_PUBLIC_IS_DEMO: z.coerce.boolean().optional().default(false),
  },
  clientPrefix: "NEXT_PUBLIC_",
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_SANDBOX_ENABLED: process.env.EMAIL_SANDBOX_ENABLED === "true",
    EMAIL_SANDBOX_HOST: process.env.EMAIL_SANDBOX_HOST,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    LOCAL_API_KEY: process.env.LOCAL_API_KEY,
    LOCAL_API_URL: process.env.LOCAL_API_URL,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
    AI_PROXY_URL: process.env.AI_PROXY_URL,
    PORT: process.env.PORT,
    USER_ID: process.env.USER_ID,
    TELEGRAM_API_ID: process.env.TELEGRAM_API_ID,
    TELEGRAM_API_HASH: process.env.TELEGRAM_API_HASH,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME,
    TG_CLIENT_URL: process.env.TG_CLIENT_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_EVENT_API_BASE_URL: process.env.INNGEST_EVENT_API_BASE_URL,
    APP_URL: process.env.APP_URL,
    APP_NAME: process.env.APP_NAME,
    CUSTOM_DOMAIN_TARGET: process.env.CUSTOM_DOMAIN_TARGET,
    INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT:
      process.env.INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT,
    INTERVIEW_TYPING_DEBOUNCE_TIMEOUT:
      process.env.INTERVIEW_TYPING_DEBOUNCE_TIMEOUT,
    INTERVIEW_BUFFER_ENABLED: process.env.INTERVIEW_BUFFER_ENABLED,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_INTERVIEW_URL: process.env.NEXT_PUBLIC_INTERVIEW_URL,
    NEXT_PUBLIC_IS_DEMO: process.env.NEXT_PUBLIC_IS_DEMO,
    DOCLING_API_URL: process.env.DOCLING_API_URL,
    DOCLING_API_KEY: process.env.DOCLING_API_KEY,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER,
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL,
    EMBEDDING_CHUNK_SIZE: process.env.EMBEDDING_CHUNK_SIZE,
    EMBEDDING_CHUNK_OVERLAP: process.env.EMBEDDING_CHUNK_OVERLAP,
    EMBEDDING_DIMENSIONS: process.env.EMBEDDING_DIMENSIONS,
    QDRANT_URL: process.env.QDRANT_URL,
    QDRANT_API_KEY: process.env.QDRANT_API_KEY,
    QDRANT_COLLECTION_NAME: process.env.QDRANT_COLLECTION_NAME,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    TG_CLIENT_PORT: process.env.TG_CLIENT_PORT,
    YOOKASSA_SHOP_ID: process.env.YOOKASSA_SHOP_ID,
    YOOKASSA_SECRET_KEY: process.env.YOOKASSA_SECRET_KEY,
    YOOKASSA_API_URL: process.env.YOOKASSA_API_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
