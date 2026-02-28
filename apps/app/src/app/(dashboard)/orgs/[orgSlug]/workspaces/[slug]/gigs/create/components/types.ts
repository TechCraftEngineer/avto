import { z } from "zod/v4";

export const gigTypeOptions = [
  { value: "DEVELOPMENT", label: "Разработка", emoji: "💻" },
  { value: "DESIGN", label: "Дизайн", emoji: "🎨" },
  { value: "COPYWRITING", label: "Копирайтинг", emoji: "✍️" },
  { value: "MARKETING", label: "Маркетинг", emoji: "📈" },
  { value: "TRANSLATION", label: "Перевод", emoji: "🌍" },
  { value: "VIDEO", label: "Видео", emoji: "🎬" },
  { value: "AUDIO", label: "Аудио", emoji: "🎵" },
  { value: "DATA_ENTRY", label: "Ввод данных", emoji: "📊" },
  { value: "RESEARCH", label: "Исследования", emoji: "🔬" },
  { value: "CONSULTING", label: "Консалтинг", emoji: "💼" },
  { value: "OTHER", label: "Другое", emoji: "📦" },
] as const;

export type GigType = (typeof gigTypeOptions)[number]["value"];

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  quickReplies?: string[];
}

export interface GigDraft {
  title: string;
  description: string;
  type: GigType;
  deliverables: string;
  requiredSkills: string;
  budgetMin: number | undefined;
  budgetMax: number | undefined;

  estimatedDuration: string;
}

// Remove the unused optionalPositiveInt schema

export const formSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(10, "Название должно содержать минимум 10 символов")
      .max(100, "Название не должно превышать 100 символов"),
    description: z
      .string()
      .trim()
      .min(50, "Описание должно содержать минимум 50 символов")
      .max(2000, "Описание не должно превышать 2000 символов"),
    type: z.enum([
      "DEVELOPMENT",
      "DESIGN",
      "COPYWRITING",
      "MARKETING",
      "TRANSLATION",
      "VIDEO",
      "AUDIO",
      "DATA_ENTRY",
      "RESEARCH",
      "CONSULTING",
      "OTHER",
    ]),
    budgetMin: z
      .number()
      .min(1000, "Минимальный бюджет от 1000 ₽")
      .max(1000000, "Максимальный бюджет до 1 000 000 ₽")
      .optional(),
    budgetMax: z
      .number()
      .min(1000, "Минимальный бюджет от 1000 ₽")
      .max(1000000, "Максимальный бюджет до 1 000 000 ₽")
      .optional(),

    deadline: z.string(),
    estimatedDuration: z
      .string()
      .trim()
      .refine((s) => {
        if (!s) return true;
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n >= 1 && n <= 365;
      }, "Укажите срок от 1 до 365 дней")
      .transform((s) => {
        if (!s) return "";
        const n = Number.parseInt(s, 10);
        return Number.isFinite(n) && n >= 1 && n <= 365 ? String(n) : s;
      }),
    deliverables: z
      .string()
      .trim()
      .transform((s) =>
        s
          ? s
              .split(/\n|,/)
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      )
      .pipe(
        z
          .array(
            z
              .string()
              .trim()
              .min(1, "Элемент не может быть пустым")
              .max(3000, "Элемент не должен превышать 3000 символов"),
          )
          .min(1, "Укажите хотя бы один результат")
          .max(20, "Не более 20 результатов"),
      )
      .transform((arr) => arr.join("\n")),
    requiredSkills: z
      .string()
      .trim()
      .transform((s) =>
        s
          ? s
              .split(/\n|,/)
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      )
      .pipe(
        z
          .array(
            z
              .string()
              .trim()
              .min(1, "Элемент не может быть пустым")
              .max(1000, "Элемент не должен превышать 1000 символов"),
          )
          .min(1, "Укажите хотя бы один навык")
          .max(10, "Не более 10 навыков"),
      )
      .transform((arr) => arr.join("\n")),

    // Ссылка на фриланс-платформу
    platformSource: z
      .enum([
        "MANUAL",
        "HH",
        "AVITO",
        "KWORK",
        "FL_RU",
        "FREELANCE_RU",
        "WEB_LINK",
      ])
      .optional(),
    platformUrl: z.url().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.budgetMin != null &&
      data.budgetMax != null &&
      data.budgetMin > data.budgetMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Минимальный бюджет не может быть больше максимального",
        path: ["budgetMin"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Минимальный бюджет не может быть больше максимального",
        path: ["budgetMax"],
      });
    }
  });

export type FormValues = z.infer<typeof formSchema>;

export const typeKeywords: Record<GigType, string[]> = {
  DEVELOPMENT: [
    "разработ",
    "программ",
    "код",
    "сайт",
    "приложен",
    "backend",
    "frontend",
    "api",
  ],
  DESIGN: ["дизайн", "макет", "figma", "ui", "ux", "логотип", "баннер"],
  COPYWRITING: ["текст", "статья", "копирайт", "контент", "описани"],
  MARKETING: ["маркетинг", "реклам", "продвижен", "smm", "таргет"],
  TRANSLATION: ["перевод", "локализац"],
  VIDEO: ["видео", "монтаж", "ролик", "анимац"],
  AUDIO: ["аудио", "звук", "музык", "подкаст"],
  DATA_ENTRY: ["данн", "ввод", "excel", "таблиц"],
  RESEARCH: ["исследован", "анализ", "аудит"],
  CONSULTING: ["консульт", "совет", "стратег"],
  OTHER: [],
};

export const generateId = () => Math.random().toString(36).substring(2, 9);
