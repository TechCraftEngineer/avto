import { env } from "@qbs-autonaim/config";
import {
  type DoclingConfig,
  type DoclingResult,
  DocumentProcessingError,
  DocumentProcessingErrorCode,
  type FormatParser,
} from "../types";

/**
 * Configuration for Docling service
 */
interface DoclingServiceConfig extends DoclingConfig {
  /** URL Docling service API */
  apiUrl?: string;
  /** API ключ (если требуется) */
  apiKey?: string;
}

/**
 * Response from Docling v1 API (/v1/convert/file)
 * @see https://github.com/docling-project/docling-serve
 */
interface DoclingServiceResponse {
  document?: {
    text_content?: string;
    md_content?: string;
    html_content?: string;
  };
  status?: "success" | "partial_success" | "skipped" | "failure";
  errors?: string[];
}

/**
 * Document processor using Docling library
 * Provides high-quality parsing of PDF and DOCX files
 *
 * Requirements: 1.1, 1.2, 1.3, 6.1
 */
export class DoclingProcessor implements FormatParser {
  private readonly config: Required<DoclingServiceConfig>;

  constructor(config?: DoclingServiceConfig) {
    this.config = {
      // Docling-serve listens on 5001, Docker maps 8001:5001
      apiUrl: config?.apiUrl || env.DOCLING_API_URL || "http://localhost:8001",
      apiKey: config?.apiKey || env.DOCLING_API_KEY || "",
      timeout: config?.timeout || 30000,
      enableOcr: config?.enableOcr ?? true,
      ocrLanguage: config?.ocrLanguage || "auto",
    };
  }

  /**
   * Извлекает текст из документа (совместимость с FormatParser)
   *
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (используется для определения типа)
   * @returns Извлечённый текст
   * @throws DocumentProcessingError если файл не читается или сервис недоступен
   *
   * Requirements: 1.1, 1.2, 6.1
   */
  async extractText(content: Buffer, filename?: string): Promise<string> {
    const result = await this.extractStructured(content, filename);
    return result.text;
  }

  /**
   * Извлекает структурированный результат
   *
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (используется для определения типа)
   * @returns Структурированный результат парсинга
   * @throws DocumentProcessingError если файл не читается или сервис недоступен
   *
   * Requirements: 1.1, 1.2, 1.3
   */
  async extractStructured(
    content: Buffer,
    filename?: string,
  ): Promise<DoclingResult> {
    try {
      // Validate file format
      this.validateFormat(filename);

      // Prepare form data for docling-serve /v1/convert/file API
      const formData = new FormData();
      const uint8Array = new Uint8Array(content);
      const blob = new Blob([uint8Array], {
        type: this.getMimeType(filename),
      });
      formData.append("files", blob, filename || "document");

      // Docling-serve form parameters (см. POST /v1/convert/file в OpenAPI)
      formData.append("to_formats", "text"); // API принимает строку или массив, парсит в ["text"]
      formData.append("do_ocr", this.config.enableOcr ? "true" : "false");
      formData.append("ocr_engine", "easyocr");
      // ocr_lang: API ожидает массив языков ["en","ru"] или пустой. "auto" поддерживается только в Tesseract.
      // Для easyocr при "auto" не передаём — используется default (пустой массив).
      if (this.config.ocrLanguage && this.config.ocrLanguage !== "auto") {
        formData.append("ocr_lang", this.config.ocrLanguage);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      try {
        const headers: Record<string, string> = {};
        if (this.config.apiKey) {
          headers["X-Api-Key"] = this.config.apiKey;
        }
        const response = await fetch(
          `${this.config.apiUrl.replace(/\/$/, "")}/v1/convert/file`,
          {
            method: "POST",
            headers,
            body: formData,
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        const data = (await response.json()) as DoclingServiceResponse;

        const text =
          data.document?.text_content ??
          data.document?.md_content ??
          data.document?.html_content ??
          "";

        if (!text || text.trim().length === 0) {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.EMPTY_CONTENT,
            "Документ не содержит текста. Возможно, это отсканированный документ без текстового слоя.",
            { filename },
          );
        }

        if (data.status === "failure" && (data.errors?.length ?? 0) > 0) {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.CORRUPTED_FILE,
            data.errors!.join("; "),
            { filename },
          );
        }

        return this.convertResponse({ text, data });
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.PARSE_TIMEOUT,
            `Превышено время ожидания обработки документа (${this.config.timeout}ms)`,
            { timeout: this.config.timeout, filename },
          );
        }

        throw error;
      }
    } catch (error) {
      // Re-throw DocumentProcessingError as-is
      if (error instanceof DocumentProcessingError) {
        throw error;
      }

      // Handle network errors
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("Failed to fetch")
      ) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
          "Сервис Docling недоступен. Проверьте, что сервис запущен и доступен.",
          { originalError: errorMessage, apiUrl: this.config.apiUrl },
        );
      }

      // Generic error
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.CORRUPTED_FILE,
        "Не удалось обработать документ. Файл может быть повреждён.",
        { originalError: errorMessage, filename },
      );
    }
  }

  /**
   * Validates file format is supported
   *
   * Requirements: 1.5
   */
  private validateFormat(filename?: string): void {
    if (!filename) {
      return; // Allow files without names
    }

    const ext = filename.toLowerCase().split(".").pop();
    const supportedFormats = ["pdf", "docx", "doc"];

    if (!ext || !supportedFormats.includes(ext)) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.UNSUPPORTED_FORMAT,
        `Неподдерживаемый формат файла: ${ext}. Поддерживаются: ${supportedFormats.join(", ")}`,
        { filename, supportedFormats },
      );
    }
  }

  /**
   * Handles error responses from Docling service
   *
   * Requirements: 1.5
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const errorText = await response.text().catch(() => "");

    // Check for specific error patterns
    if (response.status === 400) {
      if (errorText.includes("password") || errorText.includes("encrypted")) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.PASSWORD_PROTECTED,
          "Документ защищён паролем. Пожалуйста, предоставьте незащищённую версию.",
        );
      }

      if (errorText.includes("corrupted") || errorText.includes("invalid")) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.CORRUPTED_FILE,
          "Документ повреждён или имеет неверный формат.",
        );
      }
    }

    if (response.status === 429) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.RATE_LIMITED,
        "Превышен лимит запросов к сервису обработки документов. Попробуйте позже.",
      );
    }

    // 404: обычно неверный DOCLING_API_URL или Docling не на том хосте
    if (response.status === 404) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
        "Docling API не найден (404). Проверьте DOCLING_API_URL: при запуске в Docker используйте http://docling:5001, локально — http://localhost:8001.",
        { status: 404, errorText, apiUrl: this.config.apiUrl },
      );
    }

    // Generic error
    throw new DocumentProcessingError(
      DocumentProcessingErrorCode.CORRUPTED_FILE,
      `Ошибка обработки документа: ${response.status} ${response.statusText}`,
      { status: response.status, errorText },
    );
  }

  /**
   * Converts Docling v1 API response to DoclingResult.
   * Docling /v1/convert/file returns flat text/md/html, not structured elements.
   */
  private convertResponse({
    text,
  }: {
    text: string;
    data: DoclingServiceResponse;
  }): DoclingResult {
    return {
      text,
      metadata: {},
      elements: [],
    };
  }

  /**
   * Determines MIME type from filename
   */
  private getMimeType(filename?: string): string {
    if (!filename) return "application/octet-stream";

    const ext = filename.toLowerCase().split(".").pop();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
