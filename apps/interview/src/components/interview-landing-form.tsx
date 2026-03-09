"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@qbs-autonaim/ui/components/collapsible";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@qbs-autonaim/ui/components/field";
import { Input } from "@qbs-autonaim/ui/components/input";
import { phoneSchema } from "@qbs-autonaim/validators";
import { ChevronDown, Loader2, Mail, Phone, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ALLOWED_HOSTNAMES = [
  "kwork.ru",
  "fl.ru",
  "freelance.ru",
  "hh.ru",
] as const;

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .refine((val) => {
    try {
      const url = new URL(val);
      const hostname = url.hostname.toLowerCase();
      return ALLOWED_HOSTNAMES.some(
        (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
      );
    } catch {
      return false;
    }
  }, "Некорректный URL профиля платформы");

const freelancerInfoSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(500, "Имя слишком длинное"),
  platformProfileUrl: platformProfileUrlSchema,
  // Контакты — необязательные, для быстрой связи работодателя с кандидатом
  phone: phoneSchema,
  email: z
    .string()
    .max(255)
    .optional()
    .refine((val) => {
      const trimmed = val?.trim() ?? "";
      return !trimmed || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    }, "Некорректный email")
    .transform((val) => val?.trim() || undefined),
  telegram: z
    .string()
    .max(100)
    .optional()
    .transform((val) => (val?.trim() ? val.replace(/^@/, "") : undefined)),
});

type FreelancerInfo = z.infer<typeof freelancerInfoSchema>;

/** Form values: все поля строки (включая пустые для опциональных контактов) */
type FreelancerInfoFormValues = {
  name: string;
  platformProfileUrl: string;
  phone: string;
  email: string;
  telegram: string;
};

interface InterviewLandingFormProps {
  token: string;
  entityId: string;
  entityType: "vacancy" | "gig";
  platformSource: string;
  onSubmit: (data: FreelancerInfo) => Promise<{ interviewSessionId: string }>;
  onCheckDuplicate?: (
    vacancyId: string,
    platformProfileUrl: string,
  ) => Promise<{ isDuplicate: boolean }>;
}

const getPlatformPlaceholder = (source: string): string => {
  switch (source.toLowerCase()) {
    case "kwork":
      return "https://kwork.ru/user/username…";
    case "fl":
      return "https://fl.ru/users/username/…";
    case "freelance":
      return "https://freelance.ru/users/username/…";
    case "hh":
      return "https://hh.ru/resume/…";
    default:
      return "https://kwork.ru/user/username…";
  }
};

export function InterviewLandingForm({
  token,
  entityId,
  entityType,
  platformSource,
  onSubmit,
  onCheckDuplicate,
}: InterviewLandingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FreelancerInfoFormValues>({
    resolver: zodResolver(freelancerInfoSchema) as never,
    mode: "onSubmit",
    defaultValues: {
      name: "",
      platformProfileUrl: "",
      phone: "",
      email: "",
      telegram: "",
    },
  });

  const handleFormSubmit = async (data: FreelancerInfo) => {
    setIsSubmitting(true);

    const trimmedData = {
      name: data.name.trim(),
      platformProfileUrl: data.platformProfileUrl.trim(),
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      telegram: data.telegram?.trim()?.replace(/^@/, "") || undefined,
    };

    // Проверка дубликатов только для вакансий
    if (entityType === "vacancy" && onCheckDuplicate) {
      try {
        const duplicateCheck = await onCheckDuplicate(
          entityId,
          trimmedData.platformProfileUrl,
        );
        if (duplicateCheck.isDuplicate) {
          setError("platformProfileUrl", {
            type: "manual",
            message: "Вы уже откликнулись на эту вакансию",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
      }
    }

    try {
      const result = await onSubmit({
        ...trimmedData,
        platformProfileUrl: trimmedData.platformProfileUrl,
      });
      if (result.interviewSessionId) {
        router.push(
          `/interview/${token}/chat?sessionId=${result.interviewSessionId}`,
        );
      } else {
        setIsSubmitting(false);
        // Без sessionId (напр. вакансия закрыта) — страница обновится после invalidateQueries
      }
    } catch (error: unknown) {
      setIsSubmitting(false);
      const duplicateMessage =
        entityType === "vacancy"
          ? "Вы уже откликнулись на эту вакансию"
          : "Вы уже откликнулись на это задание";

      const errorMessage =
        error instanceof Error ? error.message : "Произошла ошибка";

      if (errorMessage.includes("откликнулись")) {
        setError("platformProfileUrl", {
          type: "manual",
          message: duplicateMessage,
        });
      } else {
        setError("root", {
          type: "manual",
          message: errorMessage || "Произошла ошибка. Попробуйте снова.",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {errors.root && (
        <div
          className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {errors.root.message}
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="name">Ваше имя</FieldLabel>
        <FieldContent>
          <Input
            {...register("name")}
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Иван Иванов"
            disabled={isSubmitting}
            aria-invalid={!!errors.name}
            className="h-10"
          />
          <FieldError errors={errors.name ? [errors.name] : []} />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="platformProfileUrl">Ссылка на профиль</FieldLabel>
        <FieldContent>
          <Input
            {...register("platformProfileUrl")}
            id="platformProfileUrl"
            type="url"
            autoComplete="url"
            inputMode="url"
            spellCheck={false}
            placeholder={getPlatformPlaceholder(platformSource)}
            disabled={isSubmitting}
            aria-invalid={!!errors.platformProfileUrl}
            className="h-10"
          />
          <FieldDescription>Ваш профиль на фриланс-платформе</FieldDescription>
          <FieldError
            errors={
              errors.platformProfileUrl ? [errors.platformProfileUrl] : []
            }
          />
        </FieldContent>
      </Field>

      {/* Контакты для связи — необязательно */}
      <Collapsible open={contactsOpen} onOpenChange={setContactsOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <span>Контакты для связи</span>
            <span className="text-muted-foreground shrink-0 text-xs font-normal">
              Телефон, Telegram, email
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${contactsOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-muted-foreground text-xs">
              Укажите, как работодатель может с вами связаться. Это ускорит
              обратную связь.
            </p>

            <Field>
              <FieldLabel htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                Телефон
              </FieldLabel>
              <FieldContent>
                <Input
                  {...register("phone")}
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+7 999 123-45-67"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.phone}
                  className="h-10"
                />
                <FieldError errors={errors.phone ? [errors.phone] : []} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel
                htmlFor="telegram"
                className="flex items-center gap-2"
              >
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                Telegram
              </FieldLabel>
              <FieldContent>
                <Input
                  {...register("telegram")}
                  id="telegram"
                  type="text"
                  autoComplete="off"
                  placeholder="@username или username"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.telegram}
                  className="h-10"
                />
                <FieldDescription>
                  Можно указать @username или просто username
                </FieldDescription>
                <FieldError errors={errors.telegram ? [errors.telegram] : []} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email
              </FieldLabel>
              <FieldContent>
                <Input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="example@mail.ru"
                  disabled={isSubmitting}
                  aria-invalid={!!errors.email}
                  className="h-10"
                />
                <FieldError errors={errors.email ? [errors.email] : []} />
              </FieldContent>
            </Field>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex h-11 w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      >
        {isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? "Загрузка…" : "Начать интервью"}
      </button>
    </form>
  );
}
