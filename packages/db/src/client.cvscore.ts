import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/cvscore";

const cvscoreUrl = process.env.CVSCORE_POSTGRES_URL ?? process.env.POSTGRES_URL;

if (!cvscoreUrl) {
  throw new Error(
    "CVScore DB: укажите CVSCORE_POSTGRES_URL или POSTGRES_URL в .env",
  );
}

export const cvscorePool = new Pool({
  connectionString: cvscoreUrl,
});

/** Клиент для отдельной БД CVScore (анонимные результаты скрининга) */
export const cvscoreDb: NodePgDatabase<typeof schema> = drizzle({
  client: cvscorePool,
  schema,
  casing: "snake_case",
});
