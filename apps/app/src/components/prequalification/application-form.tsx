"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Progress } from "@qbs-autonaim/ui/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { usePostHog } from "~/hooks/use-posthog";
import { POSTHOG_EVENTS } from "~/lib/posthog-events";
import { useTRPC } from "~/trpc/react";

/** Progress steps for the application form */
const APPLICATION_STEPS = [
  { id: 1, label: "Контакты", description: "Укажите способ связи" },
  { id: 2, label: "О себе", description: "Расскажите о себе" },
  { id: 3, label: "Подтверждение", description: "Отправьте заявку" },
] as const;

interface ApplicationFormProps {
  sessionId: string;
  workspaceId: string;
  vacancyTitle: string;
  onSuccess?: (responseId: string) => void;
}

interface FormValues {
  email: string;
  phone: string;
  coverLetter: string;
  preferredContact: "email" | "phone" | "telegram";
  availableFrom: string;
}

/** Draft storage key */
const DRAFT_STORAGE_KEY = (sessionId: string) =>
  `application_draft_${sessionId}`;

/** Local storage draft interface */
interface DraftData {
  email: string;
  phone: string;
  coverLetter: string;
  preferredContact: string;
  availableFrom: string;
  savedAt: number;
}

export function ApplicationForm({
  sessionId,
  workspaceId,
  vacancyTitle,
  onSuccess,
}: ApplicationFormProps) {
  const trpc = useTRPC();
  const { capture } = usePostHog();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<FormValues>({
    defaultValues: {
      email: "",
      phone: "",
      coverLetter: "",
      preferredContact: "email",
      availableFrom: "",
    },
  });

  const { watch, setValue } = form;

  // Watch all form values
  const formValues = watch();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY(sessionId));
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        // Restore draft if less than 24 hours old
        if (Date.now() - draft.savedAt < 24 * 60 * 60 * 1000) {
          form.reset({
            email: draft.email || "",
            phone: draft.phone || "",
            coverLetter: draft.coverLetter || "",
            preferredContact:
              (draft.preferredContact as FormValues["preferredContact"]) ||
              "email",
            availableFrom: draft.availableFrom || "",
          });
          toast.info("Черновик заявки восстановлен");
          capture(POSTHOG_EVENTS.APPLICATION_DRAFT_SAVED, {
            vacancyTitle,
            hasEmail: !!draft.email,
            hasPhone: !!draft.phone,
            hasCoverLetter: !!draft.coverLetter,
          });
        }
      } catch {
        // Invalid draft, ignore
      }
    }

    // Track form viewed
    capture(POSTHOG_EVENTS.APPLICATION_FORM_VIEWED, {
      vacancyTitle,
      sessionId,
    });
  }, [sessionId, vacancyTitle, capture, form]);

  // Save draft to localStorage
  const saveDraft = useCallback(() => {
    const currentValues = form.getValues();
    const draft: DraftData = {
      ...currentValues,
      savedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY(sessionId), JSON.stringify(draft));
    capture(POSTHOG_EVENTS.APPLICATION_DRAFT_SAVED, {
      vacancyTitle,
      hasEmail: !!formValues.email,
      hasPhone: !!formValues.phone,
      hasCoverLetter: !!formValues.coverLetter,
    });
  }, [formValues, sessionId, vacancyTitle, capture, form.getValues]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [saveDraft]);

  const submitMutation = useMutation(
    trpc.prequalification.submitApplication.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);
        // Clear draft on success
        localStorage.removeItem(DRAFT_STORAGE_KEY(sessionId));
        // Track success
        capture(POSTHOG_EVENTS.APPLICATION_SUBMITTED, {
          vacancyTitle,
          sessionId,
          hasCoverLetter: !!formValues.coverLetter,
          preferredContact: formValues.preferredContact,
        });
        onSuccess?.(data.responseId);
      },
      onError: (error) => {
        toast.error(error.message);
        capture(POSTHOG_EVENTS.APPLICATION_ERROR, {
          vacancyTitle,
          sessionId,
          error: error.message,
        });
      },
    }),
  );

  // Track application started
  useEffect(() => {
    capture(POSTHOG_EVENTS.APPLICATION_STARTED, {
      vacancyTitle,
      sessionId,
    });
  }, [sessionId, vacancyTitle, capture]);

  const handleSubmit = (values: FormValues) => {
    submitMutation.mutate({
      sessionId,
      workspaceId,
      email: values.email || undefined,
      coverLetter: values.coverLetter || undefined,
      contactPreferences: {
        preferredContact: values.preferredContact,
        availableFrom: values.availableFrom || undefined,
      },
    });
  };

  const progressPercentage = (currentStep / APPLICATION_STEPS.length) * 100;

  const canProceedToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return formValues.email || formValues.phone;
    if (step === 3) return true;
    return false;
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || canProceedToStep(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between">
          {APPLICATION_STEPS.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(step.id)}
              disabled={step.id > currentStep && !canProceedToStep(step.id)}
              className={`text-xs sm:text-sm transition-colors ${
                step.id <= currentStep
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              } ${step.id <= currentStep ? "cursor-pointer" : "cursor-not-allowed"}`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Step 1: Contacts */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-semibold">Контактная информация</h2>
              <p className="text-sm text-muted-foreground">
                Укажите удобный способ связи с вами
              </p>

              <FormField
                name="email"
                render={() => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@mail.ru"
                        value={formValues.email}
                        onChange={(e) => setValue("email", e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Мы отправим уведомление о статусе вашей заявки
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="phone"
                render={() => (
                  <FormItem>
                    <FormLabel>Телефон (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={formValues.phone}
                        onChange={(e) => setValue("phone", e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="preferredContact"
                render={() => (
                  <FormItem>
                    <FormLabel>Предпочтительный способ связи</FormLabel>
                    <Select
                      value={formValues.preferredContact}
                      onValueChange={(value: FormValues["preferredContact"]) =>
                        setValue("preferredContact", value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите способ связи" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Телефон</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="availableFrom"
                render={() => (
                  <FormItem>
                    <FormLabel>
                      Когда вы готовы выйти на работу? (необязательно)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Например: через 2 недели"
                        {...form.register("availableFrom")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 2: Cover Letter */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-semibold">О себе</h2>
              <p className="text-sm text-muted-foreground">
                Расскажите, почему вас заинтересовала эта вакансия
              </p>

              <FormField
                name="coverLetter"
                render={() => (
                  <FormItem>
                    <FormLabel>Сопроводительное письмо</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Здравствуйте! 

Меня заинтересовала вакансия "${vacancyTitle}". 

В своём опыте я...

Почему я подхожу на эту позицию:
• ...
• ...
• ...

Буду рад(а) обсудить детали на собеседовании.`}
                        className="min-h-[200px] resize-y"
                        {...form.register("coverLetter")}
                      />
                    </FormControl>
                    <FormDescription>
                      Минимум 10 символов. Расскажите о своём опыте и навыках,
                      релевантных вакансии. Это повысит шансы на успех!
                    </FormDescription>
                    <div className="text-xs text-muted-foreground">
                      {formValues.coverLetter.length} / 5000 символов
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-lg font-semibold">Подтверждение заявки</h2>
              <p className="text-sm text-muted-foreground">
                Проверьте данные перед отправкой
              </p>

              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium">Вакансия:</span>
                  <p className="text-sm">{vacancyTitle}</p>
                </div>
                {formValues.email && (
                  <div>
                    <span className="text-sm font-medium">Email:</span>
                    <p className="text-sm">{formValues.email}</p>
                  </div>
                )}
                {formValues.phone && (
                  <div>
                    <span className="text-sm font-medium">Телефон:</span>
                    <p className="text-sm">{formValues.phone}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium">Способ связи:</span>
                  <p className="text-sm capitalize">
                    {formValues.preferredContact}
                  </p>
                </div>
                {formValues.coverLetter && (
                  <div>
                    <span className="text-sm font-medium">
                      Сопроводительное письмо:
                    </span>
                    <p className="text-sm line-clamp-3">
                      {formValues.coverLetter}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Назад
              </Button>
            )}

            {currentStep < APPLICATION_STEPS.length ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToStep(currentStep + 1)}
                className="flex-1"
              >
                Далее
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Сохранить черновик
                </Button>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {submitMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Отправить заявку
                </Button>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
