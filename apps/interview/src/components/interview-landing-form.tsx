"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@qbs-autonaim/ui/components/field";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Loader2 } from "lucide-react";
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
});

type FreelancerInfo = z.infer<typeof freelancerInfoSchema>;

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FreelancerInfo>({
    resolver: zodResolver(freelancerInfoSchema),
    mode: "onSubmit",
  });

  const handleFormSubmit = async (data: FreelancerInfo) => {
    setIsSubmitting(true);

    const trimmedData = {
      name: data.name.trim(),
      platformProfileUrl: data.platformProfileUrl.trim(),
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
      const result = await onSubmit(trimmedData);
      if (result.interviewSessionId) {
        router.push(
          `/interview/${token}/chat?sessionId=${result.interviewSessionId}`,
        );
      } else {
        setIsSubmitting(false);
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
