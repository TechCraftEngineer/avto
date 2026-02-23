"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import {
  type CompanyFormValues,
  type CompanyPartialValues,
  companyFormSchema,
} from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useORPC } from "~/orpc/react";

function useAutoSave(
  value: CompanyFormValues,
  onSave: (data: CompanyPartialValues) => Promise<void>,
  delay = 800,
) {
  const prevValue = useRef<CompanyFormValues>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const changedFields: CompanyPartialValues = {};
    let hasChanges = false;

    for (const key of Object.keys(value) as (keyof CompanyFormValues)[]) {
      if (value[key] !== prevValue.current[key]) {
        (changedFields as Record<string, unknown>)[key] = value[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onSave(changedFields)
          .then(() => {
            prevValue.current = value;
          })
          .catch(() => {
            // Error is already handled by mutation's onError
            // Don't update prevValue on failure
          });
      }, delay);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, onSave, delay]);
}

export function CompanyForm({
  initialData,
  workspaceId,
  userRole,
}: {
  initialData?: Partial<CompanyFormValues>;
  workspaceId: string;
  userRole?: string;
}) {
  const orpc = useORPC();
  const queryClient = useQueryClient();

  const canEdit = userRole === "owner" || userRole === "admin";

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: initialData || {
      name: "",
      website: "",
      description: "",
    },
  });

  const updateCompany = useMutation(
    orpc.bot.updatePartial.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: orpc.workspace.getBotSettings.queryKey({
            input: { workspaceId },
          }),
        });
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось сохранить");
      },
    }),
  );

  const handleAutoSave = useCallback(
    (changedData: CompanyPartialValues) => {
      return new Promise<void>((resolve, reject) => {
        updateCompany.mutate(
          {
            workspaceId,
            data: changedData,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          },
        );
      });
    },
    [updateCompany, workspaceId],
  );

  const watchedValues = form.watch();
  useAutoSave(watchedValues, handleAutoSave);

  if (!canEdit) {
    return (
      <div className="rounded-lg border border-muted p-6">
        <p className="text-muted-foreground">
          У вас нет прав для изменения настроек компании. Обратитесь к
          администратору.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">
                Название компании
              </FormLabel>
              <Input placeholder="ООО Рога и Копыта" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">
                Сайт
              </FormLabel>
              <Input placeholder="https://example.com" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">
                Описание
              </FormLabel>
              <Textarea
                placeholder="Расскажите о вашей компании..."
                className="min-h-[120px]"
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {updateCompany.isPending && (
          <p className="text-xs text-muted-foreground">Сохранение...</p>
        )}
      </form>
    </Form>
  );
}
