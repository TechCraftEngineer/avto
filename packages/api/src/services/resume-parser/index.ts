/**
 * Resume Parser Service
 *
 * Сервис для парсинга резюме из различных форматов (PDF, DOCX).
 * Извлекает текст и структурирует данные с помощью AI.
 */

import { randomUUID } from "node:crypto";
import { AgentFactory, type ResumeStructurerOutput } from "@qbs-autonaim/ai";
import { env } from "@qbs-autonaim/config";
import type { ParsedResume, StructuredResume } from "@qbs-autonaim/db";
import {
  DoclingProcessor,
  DocumentIndexer,
  type IndexerConfig,
} from "@qbs-autonaim/document-processor";
import type { LanguageModel } from "ai";
import type { Langfuse } from "langfuse";
import {
  DEFAULT_PARSER_CONFIG,
  type FormatValidationResult,
  type ResumeFileType,
  type ResumeInput,
  type ResumeParserConfig,
  ResumeParserError,
} from "./types";

// Re-export types for convenience
// Resume parser types
export * from "./types";

/**
 * Structured logger for resume parser operations
 */
class ResumeParserLogger {
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  private log(
    level: "info" | "warn" | "error",
    message: string,
    data?: Record<string, unknown>,
  ) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...data,
    };

    const logMethod = level === "error" ? console.error : console.log;
    logMethod(JSON.stringify(logEntry));
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log("error", message, data);
  }

  withContext(additionalContext: Record<string, unknown>): ResumeParserLogger {
    return new ResumeParserLogger({ ...this.context, ...additionalContext });
  }
}

/**
 * Metrics collector for resume parser operations
 */
const metricsStore = new Map<
  string,
  { count: number; totalDuration: number; errors: number }
>();

function recordMetric(
  operation: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, unknown>,
) {
  const key = operation;
  const current = metricsStore.get(key) || {
    count: 0,
    totalDuration: 0,
    errors: 0,
  };

  current.count++;
  current.totalDuration += duration;
  if (!success) {
    current.errors++;
  }

  metricsStore.set(key, current);

  // Log metric
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      type: "metric",
      operation,
      duration,
      success,
      successRate:
        current.count > 0
          ? ((current.count - current.errors) / current.count) * 100
          : 0,
      avgDuration:
        current.count > 0 ? current.totalDuration / current.count : 0,
      ...metadata,
    }),
  );
}

export function getMetrics() {
  return Object.fromEntries(metricsStore);
}

/**
 * Поддерживаемые расширения файлов
 */
const SUPPORTED_EXTENSIONS: Record<string, ResumeFileType> = {
  ".pdf": "pdf",
  ".docx": "docx",
  ".doc": "doc",
  ".txt": "txt",
  ".rtf": "rtf",
  ".odt": "odt",
};

/**
 * Сервис для парсинга резюме
 */
export class ResumeParserService {
  private readonly parser: DoclingProcessor;
  private readonly indexer?: DocumentIndexer;
  private readonly config: ResumeParserConfig;
  private readonly model: LanguageModel;
  private readonly langfuse?: Langfuse;

  constructor(options: {
    model: LanguageModel;
    langfuse?: Langfuse;
    config?: Partial<ResumeParserConfig>;
    doclingApiUrl?: string;
    doclingApiKey?: string;
    enableIndexing?: boolean;
  }) {
    this.parser = new DoclingProcessor({
      apiUrl: options.doclingApiUrl,
      apiKey: options.doclingApiKey,
      timeout: options.config?.aiTimeoutMs || DEFAULT_PARSER_CONFIG.aiTimeoutMs,
    });

    this.config = { ...DEFAULT_PARSER_CONFIG, ...options.config };
    this.model = options.model;
    this.langfuse = options.langfuse;

    // Initialize DocumentIndexer if indexing is enabled
    if (options.enableIndexing) {
      const indexerConfig: IndexerConfig = {
        embedding: {
          provider: env.EMBEDDING_PROVIDER,
          model: env.EMBEDDING_MODEL,
          chunkSize: env.EMBEDDING_CHUNK_SIZE,
          chunkOverlap: env.EMBEDDING_CHUNK_OVERLAP,
          dimensions: env.EMBEDDING_DIMENSIONS,
        },
        vectorStore: {
          url: env.QDRANT_URL,
          collectionName: env.QDRANT_COLLECTION_NAME,
          dimensions: env.EMBEDDING_DIMENSIONS,
        },
      };

      this.indexer = new DocumentIndexer(indexerConfig);
    }
  }

  /**
   * Валидирует формат файла по имени
   *
   * @param filename - Имя файла с расширением
   * @returns Результат валидации с определённым типом файла
   */
  validateFormat(filename: string): FormatValidationResult {
    const supportedFormats = Object.values(SUPPORTED_EXTENSIONS);

    // Извлекаем расширение
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return {
        isValid: false,
        error: "Файл не имеет расширения",
        supportedFormats,
      };
    }

    const extension = filename.slice(lastDotIndex).toLowerCase();
    const fileType = SUPPORTED_EXTENSIONS[extension];

    if (!fileType) {
      return {
        isValid: false,
        error: `Неподдерживаемый формат файла: ${extension}. Поддерживаемые форматы: PDF, DOCX`,
        supportedFormats,
      };
    }

    return {
      isValid: true,
      fileType,
      supportedFormats,
    };
  }

  /**
   * Парсит резюме из файла
   *
   * @param input - Входные данные с типом и содержимым файла
   * @returns Распарсенное резюме со структурированными данными
   * @throws ResumeParserError при ошибках парсинга
   */
  async parse(input: ResumeInput): Promise<ParsedResume> {
    const traceId = randomUUID();
    const logger = new ResumeParserLogger({
      service: "ResumeParserService",
      operation: "parse",
      traceId,
      filename: input.filename,
      fileType: input.type,
      fileSize: input.content.length,
    });

    const startTime = Date.now();
    logger.info("Starting resume parsing");

    try {
      // Проверяем размер файла
      if (input.content.length > this.config.maxFileSizeBytes) {
        logger.warn("File size exceeds limit", {
          actualSize: input.content.length,
          maxSize: this.config.maxFileSizeBytes,
        });

        throw new ResumeParserError(
          "FILE_TOO_LARGE",
          `Максимальный размер файла: ${Math.round(this.config.maxFileSizeBytes / 1024 / 1024)} МБ`,
          {
            actualSize: input.content.length,
            maxSize: this.config.maxFileSizeBytes,
          },
        );
      }

      // Извлекаем текст в зависимости от типа файла
      let rawText: string;
      const extractStartTime = Date.now();

      try {
        rawText = await this.extractText(input);
        const extractDuration = Date.now() - extractStartTime;

        logger.info("Text extraction completed", {
          textLength: rawText.length,
          duration: extractDuration,
        });

        recordMetric("text_extraction", extractDuration, true, {
          traceId,
          fileType: input.type,
        });
      } catch (error) {
        const extractDuration = Date.now() - extractStartTime;

        logger.error("Text extraction failed", {
          error: error instanceof Error ? error.message : String(error),
          duration: extractDuration,
        });

        recordMetric("text_extraction", extractDuration, false, {
          traceId,
          fileType: input.type,
        });

        if (error instanceof ResumeParserError) {
          throw error;
        }
        throw new ResumeParserError(
          "PARSE_FAILED",
          "Не удалось извлечь текст из файла",
          {
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        );
      }

      // Проверяем минимальную длину текста
      if (rawText.length < this.config.minTextLength) {
        logger.warn("Text content too short", {
          textLength: rawText.length,
          minLength: this.config.minTextLength,
        });

        throw new ResumeParserError(
          "EMPTY_CONTENT",
          "Файл содержит слишком мало текста для анализа",
          { textLength: rawText.length, minLength: this.config.minTextLength },
        );
      }

      // Структурируем данные с помощью AI
      let structured: StructuredResume;
      let confidence: number;
      const structureStartTime = Date.now();

      try {
        const result = await this.structureWithAI(rawText);
        structured = result.structured;
        confidence = result.confidence;

        const structureDuration = Date.now() - structureStartTime;

        logger.info("AI structuring completed", {
          confidence,
          duration: structureDuration,
        });

        recordMetric("ai_structuring", structureDuration, true, {
          traceId,
          confidence,
        });
      } catch (error) {
        const structureDuration = Date.now() - structureStartTime;

        logger.error("AI structuring failed", {
          error: error instanceof Error ? error.message : String(error),
          duration: structureDuration,
        });

        recordMetric("ai_structuring", structureDuration, false, {
          traceId,
        });

        if (error instanceof ResumeParserError) {
          throw error;
        }
        throw new ResumeParserError(
          "AI_STRUCTURING_FAILED",
          "Не удалось структурировать данные резюме",
          {
            originalError:
              error instanceof Error ? error.message : String(error),
          },
        );
      }

      const totalDuration = Date.now() - startTime;

      logger.info("Resume parsing completed successfully", {
        totalDuration,
        confidence,
      });

      recordMetric("parse_resume", totalDuration, true, {
        traceId,
        confidence,
      });

      return {
        rawText,
        structured,
        confidence,
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;

      logger.error("Resume parsing failed", {
        error: error instanceof Error ? error.message : String(error),
        errorCode:
          error instanceof ResumeParserError ? error.code : "UNKNOWN_ERROR",
        totalDuration,
      });

      recordMetric("parse_resume", totalDuration, false, {
        traceId,
        errorCode:
          error instanceof ResumeParserError ? error.code : "UNKNOWN_ERROR",
      });

      throw error;
    }
  }

  /**
   * Індексирует резюме для семантического поиска
   *
   * @param input - Входные данные с типом и содержимым файла
   * @param documentId - Уникальный идентификатор документа
   * @param metadata - Дополнительные метаданные для хранения
   * @throws ResumeParserError если индексация недоступна или произошла ошибка
   */
  async indexResume(
    input: ResumeInput,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const traceId = randomUUID();
    const logger = new ResumeParserLogger({
      service: "ResumeParserService",
      operation: "indexResume",
      traceId,
      documentId,
      filename: input.filename,
    });

    if (!this.indexer) {
      logger.error("Indexing is disabled");
      throw new ResumeParserError(
        "INDEXING_DISABLED",
        "Індексація документів відключена",
      );
    }

    const startTime = Date.now();
    logger.info("Starting resume indexing");

    try {
      await this.indexer.index(input.content, documentId, metadata);

      const duration = Date.now() - startTime;
      logger.info("Resume indexing completed", { duration });

      recordMetric("index_resume", duration, true, {
        traceId,
        documentId,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Resume indexing failed", {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      recordMetric("index_resume", duration, false, {
        traceId,
        documentId,
      });

      throw new ResumeParserError(
        "INDEXING_FAILED",
        "Не удалось проиндексировать резюме",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Переиндексирует резюме (удаляет старые эмбеддинги и создаёт новые)
   *
   * @param input - Входные данные с типом и содержимым файла
   * @param documentId - Уникальный идентификатор документа
   * @param metadata - Дополнительные метаданные для хранения
   * @throws ResumeParserError если индексация недоступна или произошла ошибка
   */
  async reindexResume(
    input: ResumeInput,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const traceId = randomUUID();
    const logger = new ResumeParserLogger({
      service: "ResumeParserService",
      operation: "reindexResume",
      traceId,
      documentId,
      filename: input.filename,
    });

    if (!this.indexer) {
      logger.error("Indexing is disabled");
      throw new ResumeParserError(
        "INDEXING_DISABLED",
        "Индексация документов отключена",
      );
    }

    const startTime = Date.now();
    logger.info("Starting resume reindexing");

    try {
      await this.indexer.reindex(input.content, documentId, metadata);

      const duration = Date.now() - startTime;
      logger.info("Resume reindexing completed", { duration });

      recordMetric("reindex_resume", duration, true, {
        traceId,
        documentId,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Resume reindexing failed", {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      recordMetric("reindex_resume", duration, false, {
        traceId,
        documentId,
      });

      throw new ResumeParserError(
        "INDEXING_FAILED",
        "Не удалось переиндексировать резюме",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Удаляет резюме из индекса
   *
   * @param documentId - Уникальный идентификатор документа
   * @throws ResumeParserError если индексация недоступна или произошла ошибка
   */
  async removeFromIndex(documentId: string): Promise<void> {
    const traceId = randomUUID();
    const logger = new ResumeParserLogger({
      service: "ResumeParserService",
      operation: "removeFromIndex",
      traceId,
      documentId,
    });

    if (!this.indexer) {
      logger.error("Indexing is disabled");
      throw new ResumeParserError(
        "INDEXING_DISABLED",
        "Индексация документов отключена",
      );
    }

    const startTime = Date.now();
    logger.info("Starting resume removal from index");

    try {
      await this.indexer.remove(documentId);

      const duration = Date.now() - startTime;
      logger.info("Resume removed from index", { duration });

      recordMetric("remove_from_index", duration, true, {
        traceId,
        documentId,
      });
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Resume removal from index failed", {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      recordMetric("remove_from_index", duration, false, {
        traceId,
        documentId,
      });

      throw new ResumeParserError(
        "INDEXING_FAILED",
        "Не удалось удалить резюме из индекса",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Выполняет семантический поиск по резюме
   *
   * @param query - Поисковый запрос
   * @param options - Опции поиска (topK, threshold, фильтры)
   * @returns Результаты поиска с релевантными фрагментами резюме
   * @throws ResumeParserError если индексация недоступна или произошла ошибка
   */
  async searchResumes(
    query: string,
    options: {
      topK?: number;
      threshold?: number;
      filter?: {
        documentIds?: string[];
        candidateId?: string;
        dateFrom?: Date;
        dateTo?: Date;
      };
    } = {},
  ): Promise<
    Array<{
      documentId: string;
      chunkText: string;
      chunkIndex: number;
      similarity: number;
      metadata: Record<string, unknown>;
    }>
  > {
    const traceId = randomUUID();
    const logger = new ResumeParserLogger({
      service: "ResumeParserService",
      operation: "searchResumes",
      traceId,
      query,
      topK: options.topK ?? 10,
    });

    if (!this.indexer) {
      logger.error("Indexing is disabled");
      throw new ResumeParserError(
        "INDEXING_DISABLED",
        "Индексация документов отключена",
      );
    }

    const startTime = Date.now();
    logger.info("Starting semantic search");

    try {
      const results = await this.indexer.search(query, {
        topK: options.topK ?? 10,
        threshold: options.threshold,
        filter: options.filter,
      });

      const duration = Date.now() - startTime;
      logger.info("Semantic search completed", {
        duration,
        resultCount: results.length,
      });

      recordMetric("search_resumes", duration, true, {
        traceId,
        resultCount: results.length,
      });

      return results;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error("Semantic search failed", {
        error: error instanceof Error ? error.message : String(error),
        duration,
      });

      recordMetric("search_resumes", duration, false, {
        traceId,
      });

      throw new ResumeParserError(
        "SEARCH_FAILED",
        "Не удалось выполнить поиск по резюме",
        {
          originalError: error instanceof Error ? error.message : String(error),
        },
      );
    }
  }

  /**
   * Извлекает текст из файла через Docling
   */
  private async extractText(input: ResumeInput): Promise<string> {
    return this.parser.extractText(input.content, input.filename);
  }

  /** Макс. попыток AI-структурирования при "response did not match schema" */
  private static readonly AI_STRUCTURING_MAX_RETRIES = 2;

  /**
   * Структурирует текст резюме с помощью AI
   */
  private static readonly AI_INPUT_MAX_LENGTH = 2000;

  private async structureWithAI(
    rawText: string,
  ): Promise<{ structured: StructuredResume; confidence: number }> {
    const trimmedRawText = rawText.slice(
      0,
      ResumeParserService.AI_INPUT_MAX_LENGTH,
    );
    const factory = new AgentFactory({
      model: this.model,
    });

    const agent = factory.createResumeStructurer();
    let lastError: string | undefined;

    for (
      let attempt = 1;
      attempt <= ResumeParserService.AI_STRUCTURING_MAX_RETRIES;
      attempt++
    ) {
      try {
        const result = await agent.execute({ rawText: trimmedRawText }, {});

        if (result.success && result.data) {
          const structured = this.mapAgentOutputToStructuredResume(result.data);
          const confidence = this.calculateConfidence(structured);
          return { structured, confidence };
        }

        lastError = result.error;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const isRetryable =
          errMsg.includes("timeout") ||
          errMsg.includes("AbortError") ||
          errMsg.includes("ECONNRESET") ||
          errMsg.includes("ETIMEDOUT") ||
          errMsg.includes("rate limit") ||
          errMsg.includes("503");
        lastError = errMsg;

        if (
          attempt >= ResumeParserService.AI_STRUCTURING_MAX_RETRIES ||
          !isRetryable
        ) {
          break;
        }
        continue;
      }

      const isSchemaError =
        lastError?.includes("did not match schema") ||
        lastError?.includes("No object generated");

      if (
        attempt < ResumeParserService.AI_STRUCTURING_MAX_RETRIES &&
        isSchemaError
      ) {
        continue;
      }

      break;
    }

    throw new ResumeParserError(
      "AI_STRUCTURING_FAILED",
      lastError || "AI не смог структурировать резюме",
    );
  }

  /**
   * Преобразует выход AI агента в StructuredResume
   */
  private mapAgentOutputToStructuredResume(
    output: ResumeStructurerOutput,
  ): StructuredResume {
    const p = output.personalInfo ?? {};
    return {
      personalInfo: {
        name: p.name ?? undefined,
        email: p.email ?? undefined,
        phone: p.phone ?? undefined,
        location: p.location ?? undefined,
        gender:
          p.gender === "male" || p.gender === "female" ? p.gender : undefined,
      },
      experience: output.experience.map((exp) => ({
        company: exp.company ?? "",
        position: exp.position ?? "",
        startDate: exp.startDate ?? undefined,
        endDate: exp.endDate ?? undefined,
        description: exp.description ?? undefined,
        isCurrent: exp.isCurrent ?? false,
      })),
      education: output.education.map((edu) => ({
        institution: edu.institution ?? "",
        degree: edu.degree ?? undefined,
        field: edu.field ?? undefined,
        startDate: edu.startDate ?? undefined,
        endDate: edu.endDate ?? undefined,
      })),
      skills: output.skills ?? [],
      languages: output.languages.map((lang) => ({
        name: lang.name ?? "",
        level: lang.level ?? "",
      })),
      summary: output.summary ?? undefined,
    };
  }

  /**
   * Рассчитывает confidence на основе заполненности полей
   */
  private calculateConfidence(structured: StructuredResume): number {
    let score = 0;
    const maxScore = 10;

    // Личная информация (до 3 баллов)
    if (structured.personalInfo.name) score += 1;
    if (structured.personalInfo.email) score += 1;
    if (structured.personalInfo.phone) score += 0.5;
    if (structured.personalInfo.location) score += 0.5;

    // Опыт работы (до 3 баллов)
    if (structured.experience.length > 0) {
      score += Math.min(structured.experience.length, 3);
    }

    // Образование (до 1.5 баллов)
    if (structured.education.length > 0) {
      score += Math.min(structured.education.length * 0.5, 1.5);
    }

    // Навыки (до 1.5 баллов)
    if (structured.skills.length > 0) {
      score += Math.min(structured.skills.length * 0.15, 1.5);
    }

    // Языки (до 0.5 баллов)
    if (structured.languages.length > 0) {
      score += 0.5;
    }

    return Math.min(score / maxScore, 1);
  }
}
