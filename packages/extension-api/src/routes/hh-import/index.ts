import { Hono } from "hono";
import { handleParseVacancyHtml } from "./handlers/parse-vacancy-html";
import { handleImportVacancies } from "./handlers/import-vacancies";
import { handleImportResponses } from "./handlers/import-responses";

export const hhImportRouter = new Hono<{
  Variables: { userId: string };
}>();

hhImportRouter.post("/parse-vacancy-html", handleParseVacancyHtml);
hhImportRouter.post("/vacancies", handleImportVacancies);
hhImportRouter.post("/responses", handleImportResponses);
