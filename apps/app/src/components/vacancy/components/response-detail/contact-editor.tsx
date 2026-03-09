"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@qbs-autonaim/ui/components/collapsible";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@qbs-autonaim/ui/components/field";
import { Input } from "@qbs-autonaim/ui/components/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useORPC } from "~/orpc/react";
import { ContactItem } from "./contact-item";
import type { VacancyResponse } from "./types";

const contactFormSchema = z.object({
  phone: z.string().max(50).optional(),
  email: z
    .string()
    .max(255)
    .optional()
    .refine(
      (v) => !v || v.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      "Некорректный email",
    ),
  telegramUsername: z.string().max(100).optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactEditorProps {
  response: VacancyResponse;
  workspaceId: string;
}

export function ContactEditor({ response, workspaceId }: ContactEditorProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const hasContacts = !!(
    response.phone ||
    response.email ||
    response.telegramUsername
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      phone: response.phone ?? "",
      email: response.email ?? "",
      telegramUsername: response.telegramUsername ?? "",
    },
    values: {
      phone: response.phone ?? "",
      email: response.email ?? "",
      telegramUsername: response.telegramUsername ?? "",
    },
  });

  const updateMutation = useMutation(
    orpc.vacancy.responses.updateContacts.mutationOptions({
      onSuccess: () => {
        toast.success("Контакты обновлены");
        setOpen(false);
        queryClient.invalidateQueries({
          queryKey: orpc.vacancy.responses.get.queryKey({
            input: { id: response.id, workspaceId },
          }),
        });
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Не удалось обновить контакты",
        );
      },
    }),
  );

  const onSubmit = (data: ContactFormValues) => {
    updateMutation.mutate({
      responseId: response.id,
      workspaceId,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      telegramUsername: data.telegramUsername?.trim() || undefined,
    });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {response.phone && <ContactItem type="phone" value={response.phone} />}
        {response.telegramUsername && (
          <ContactItem type="telegram" value={response.telegramUsername} />
        )}
        {response.email && <ContactItem type="email" value={response.email} />}

        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {hasContacts ? (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Изменить
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Добавить контакты
              </>
            )}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-3 space-y-4 rounded-lg border border-border bg-muted/20 p-4"
        >
          <p className="text-muted-foreground text-sm">
            Укажите контактные данные кандидата для связи
          </p>

          <Field>
            <FieldLabel
              htmlFor="contact-phone"
              className="flex items-center gap-2"
            >
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              Телефон
            </FieldLabel>
            <FieldContent>
              <Input
                {...form.register("phone")}
                id="contact-phone"
                type="tel"
                placeholder="+7 999 123-45-67"
                className="h-9"
                disabled={updateMutation.isPending}
              />
              <FieldError
                errors={
                  form.formState.errors.phone
                    ? [form.formState.errors.phone]
                    : []
                }
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel
              htmlFor="contact-telegram"
              className="flex items-center gap-2"
            >
              <Send className="h-3.5 w-3.5 text-muted-foreground" />
              Telegram
            </FieldLabel>
            <FieldContent>
              <Input
                {...form.register("telegramUsername")}
                id="contact-telegram"
                type="text"
                placeholder="@username"
                className="h-9"
                disabled={updateMutation.isPending}
              />
              <FieldError
                errors={
                  form.formState.errors.telegramUsername
                    ? [form.formState.errors.telegramUsername]
                    : []
                }
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel
              htmlFor="contact-email"
              className="flex items-center gap-2"
            >
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              Email
            </FieldLabel>
            <FieldContent>
              <Input
                {...form.register("email")}
                id="contact-email"
                type="email"
                placeholder="example@mail.ru"
                className="h-9"
                disabled={updateMutation.isPending}
              />
              <FieldError
                errors={
                  form.formState.errors.email
                    ? [form.formState.errors.email]
                    : []
                }
              />
            </FieldContent>
          </Field>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Сохранить
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!updateMutation.isPending) setOpen(false);
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}
