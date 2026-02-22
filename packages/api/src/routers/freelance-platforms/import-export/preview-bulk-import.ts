import { z } from "zod";
import {
  type ParsedResponse,
  ResponseParser,
  type ValidationResult,
} from "../../../services/response-parser";
import { publicProcedure } from "../../../orpc";

const previewBulkImportInputSchema = z.object({
  rawText: z.string().min(1),
});

export interface PreviewItem {
  freelancerName: string | null;
  contactInfo: {
    email?: string;
    phone?: string;
    telegram?: string;
    platformProfile?: string;
  };
  responseText: string;
  confidence: number;
  validation: ValidationResult;
}

export const previewBulkImport = publicProcedure
  .input(previewBulkImportInputSchema)
  .handler(async ({ input }) => {
    // Парсим текст
    const parser = new ResponseParser();
    const parsedResponses = parser.parseBulk(input.rawText);

    // Валидируем каждый распарсенный отклик
    const preview: PreviewItem[] = parsedResponses.map(
      (parsed: ParsedResponse) => {
        const validation = parser.validateParsedData(parsed);

        return {
          freelancerName: parsed.freelancerName,
          contactInfo: parsed.contactInfo,
          responseText: parsed.responseText,
          confidence: parsed.confidence,
          validation,
        };
      },
    );

    return {
      preview,
      summary: {
        total: parsedResponses.length,
        valid: preview.filter((p) => p.validation.isValid).length,
        invalid: preview.filter((p) => !p.validation.isValid).length,
        lowConfidence: preview.filter((p) => p.confidence < 0.7).length,
      },
    };
  });
