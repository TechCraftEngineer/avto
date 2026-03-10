import type { Config } from "drizzle-kit";

const url = process.env.CVSCORE_POSTGRES_URL ?? process.env.POSTGRES_URL;

if (!url) {
  throw new Error("CVScore DB: укажите CVSCORE_POSTGRES_URL или POSTGRES_URL");
}

/** Для PgBouncer (transaction mode) используем порт 6543; для миграций — 5432 */
const nonPoolingUrl = String(url).replace(":6543", ":5432");

export default {
  schema: "./src/schema/cvscore/index.ts",
  out: "./drizzle-cvscore",
  dialect: "postgresql",
  dbCredentials: { url: nonPoolingUrl },
  casing: "snake_case",
} satisfies Config;
