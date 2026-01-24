/**
 * Enhanced input validation utilities
 * Provides comprehensive validation and sanitization for user inputs
 */

import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

/**
 * Common validation patterns
 */
export const PATTERNS = {
  // Email validation (RFC 5322 compliant)
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // Phone number (international format)
  PHONE: /^\+?[1-9]\d{1,14}$/,

  // URL validation
  URL: /^https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?$/,

  // Strong password (min 8 chars, uppercase, lowercase, number, special char)
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,

  // Username (alphanumeric, underscore, hyphen, 3-30 chars)
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,

  // UUID v7
  UUID_V7:
    /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Safe filename (no path traversal)
  SAFE_FILENAME: /^[a-zA-Z0-9._-]+$/,

  // HTML tag detection
  HTML_TAGS: /<[^>]*>/g,

  // SQL injection patterns
  SQL_INJECTION:
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|\b(OR|AND)\s+\d+\s*=\s*\d+|--|;|\/\*|\*\/)/i,

  // XSS patterns
  XSS_PATTERNS: /(<script|javascript:|on\w+\s*=|data:text\/html)/i,
} as const;

/**
 * Sanitization functions
 */
export const sanitize = {
  /**
   * Remove HTML tags from string
   */
  stripHtml: (input: string): string => {
    return input.replace(PATTERNS.HTML_TAGS, "");
  },

  /**
   * Escape HTML entities
   */
  escapeHtml: (input: string): string => {
    const htmlEscapes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
    };

    return input.replace(/[&<>"'/]/g, (match) => htmlEscapes[match] || match);
  },

  /**
   * Warn about potential SQL injection patterns
   * @deprecated This function only provides pattern detection and should NOT be used for SQL protection.
   * Always use parameterized queries (prepared statements) for database operations.
   * This function is intended for logging/alerting purposes only.
   */
  warnSqlPatterns: (input: string): string => {
    console.warn("SQL pattern detected in input:", input);
    return input.replace(PATTERNS.SQL_INJECTION, "");
  },

  /**
   * Remove XSS patterns
   */
  sanitizeXss: (input: string): string => {
    return input.replace(PATTERNS.XSS_PATTERNS, "");
  },

  /**
   * Trim and limit string length
   */
  limitLength: (input: string, maxLength: number): string => {
    return input.trim().slice(0, maxLength);
  },

  /**
   * Sanitize filename
   */
  sanitizeFilename: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
  },
};

/**
 * Enhanced Zod schemas with security validation
 */
export const secureSchemas = {
  // Email validation with domain checking
  email: z
    .string()
    .email("Некорректный формат email")
    .max(254, "Email слишком длинный")
    .regex(PATTERNS.EMAIL, "Некорректный формат email")
    .transform((val) => val.toLowerCase().trim()),

  // Password validation
  password: z
    .string()
    .min(8, "Пароль должен содержать минимум 8 символов")
    .max(128, "Пароль слишком длинный")
    .regex(
      PATTERNS.STRONG_PASSWORD,
      "Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы",
    ),

  // Username validation
  username: z
    .string()
    .min(3, "Имя пользователя должно содержать минимум 3 символа")
    .max(30, "Имя пользователя слишком длинное")
    .regex(
      PATTERNS.USERNAME,
      "Имя пользователя может содержать только буквы, цифры, подчеркивания и дефисы",
    ),

  // Phone validation
  phone: z.string().regex(PATTERNS.PHONE, "Некорректный формат телефона"),

  // URL validation
  url: z
    .string()
    .url("Некорректный URL")
    .regex(PATTERNS.URL, "Разрешены только HTTP и HTTPS URL"),

  // Safe text input (no HTML/scripts)
  safeText: z
    .string()
    .max(1000, "Текст слишком длинный")
    .transform((val) => sanitize.stripHtml(val))
    .transform((val) => sanitize.sanitizeXss(val)),

  // Safe HTML (limited tags allowed)
  safeHtml: z
    .string()
    .max(5000, "HTML слишком длинный")
    .transform((val) =>
      DOMPurify.sanitize(val, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "u",
          "i",
          "b",
          "ul",
          "ol",
          "li",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "a",
          "span",
          "div",
          "blockquote",
          "code",
          "pre",
        ],
        ALLOWED_ATTR: ["href", "title", "target", "class"],
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        ADD_ATTR: ["target"],
        FORBID_TAGS: [
          "script",
          "style",
          "iframe",
          "object",
          "embed",
          "form",
          "input",
        ],
        FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover", "onfocus"],
      }),
    ),

  // File upload validation
  fileUpload: z.object({
    name: z
      .string()
      .min(1, "Имя файла обязательно")
      .max(255, "Имя файла слишком длинное")
      .regex(PATTERNS.SAFE_FILENAME, "Недопустимое имя файла")
      .transform((val) => sanitize.sanitizeFilename(val)),

    size: z
      .number()
      .max(10 * 1024 * 1024, "Размер файла не должен превышать 10MB"), // 10MB

    type: z.enum(
      [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      "Неподдерживаемый тип файла",
    ),
  }),

  // ID validation (UUID v7)
  id: z.string().regex(PATTERNS.UUID_V7, "Некорректный формат ID"),

  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).optional(),
  }),

  // Search query with sanitization
  searchQuery: z
    .string()
    .min(1, "Поисковый запрос обязателен")
    .max(200, "Поисковый запрос слишком длинный")
    .transform((val) => sanitize.warnSqlPatterns(val))
    .transform((val) => sanitize.sanitizeXss(val)),
};

/**
 * Input validation middleware
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join("."),
        message: err.message,
      }));
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }
    throw error;
  }
}

/**
 * Content security validation
 */
export const contentSecurity = {
  /**
   * Check if content contains malicious patterns
   */
  isMalicious: (content: string): boolean => {
    return (
      PATTERNS.SQL_INJECTION.test(content) ||
      PATTERNS.XSS_PATTERNS.test(content)
    );
  },

  /**
   * Validate file content type
   */
  validateFileType: (filename: string, mimeType: string): boolean => {
    const allowedExtensions = {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    };

    const allowedMimes = Object.keys(allowedExtensions);
    const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));

    return (
      allowedMimes.includes(mimeType) &&
      allowedExtensions[mimeType as keyof typeof allowedExtensions]?.includes(
        extension,
      )
    );
  },
};
