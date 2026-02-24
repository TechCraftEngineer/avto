import { Hono } from "hono";
import { handleCheckVacancy } from "./handlers/check-vacancy";
import { handleImportResponses } from "./handlers/import-responses";
import { handleImportVacancies } from "./handlers/import-vacancies";
import { handleParseVacancyHtml } from "./handlers/parse-vacancy-html";
import { handleUploadResumePdf } from "./handlers/upload-resume-pdf";

export const hhImportRouter = new Hono<{
  Variables: { userId: string };
}>();

hhImportRouter.post("/check-vacancy", handleCheckVacancy);
hhImportRouter.post("/parse-vacancy-html", handleParseVacancyHtml);
hhImportRouter.post("/vacancies", handleImportVacancies);
hhImportRouter.post("/responses", handleImportResponses);
hhImportRouter.post("/upload-resume-pdf", handleUploadResumePdf);
