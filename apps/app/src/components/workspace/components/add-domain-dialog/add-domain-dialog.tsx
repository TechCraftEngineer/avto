"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";

const formSchema = z.object({
  domain: z
    .string()
    .min(3, "Домен должен содержать минимум 3 символа")
    .max(255, "Домен слишком длинный")
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      "Некорректный формат домена",
    )
    .transform((val) => val.toLowerCase().trim()),
  type: z.enum(["interview", "prequalification"]),
});

type FormValues = z.infer<typeof formSchema>;

type DomainStatus = "idle" | "checking" | "available" | "conflict" | "has-site";

const STATUS_CONFIG: Record<
  DomainStatus,
  {
    prefix?: string;
    useStrong?: boolean;
    suffix?: string;
    icon?: React.ElementType;
    className?: string;
    message?: string;
  }
> = {
  idle: {
    message: "Введите домен для проверки доступности",
    className: "bg-neutral-100 text-neutral-600",
  },
  checking: {
    prefix: "Проверка доступности",
    useStrong: true,
    suffix: "…",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700",
  },
  available: {
    useStrong: true,
    suffix: "готов к подключению",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700",
  },
  conflict: {
    useStrong: true,
    suffix: "уже используется",
    icon: AlertCircle,
    className: "bg-red-50 text-red-700",
  },
  "has-site": {
    useStrong: true,
    suffix:
      "указывает на существующий сайт. Продолжайте только если уверены, что хотите использовать этот домен",
    icon: AlertCircle,
    className: "bg-blue-100 text-blue-800",
  },
};

interface AddDomainDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "interview" | "prequalification";
}

const isValidDomain = (domain: string) => {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(
    domain,
  );
};

export function AddDomainDialog({
  workspaceId,
  open,
  onOpenChange,
  defaultType = "interview",
}: AddDomainDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("idle");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      domain: "",
      type: defaultType,
    },
  });

  const domain = form.watch("domain");

  const validateDomain = useDebouncedCallback(async (value: string) => {
    if (!isValidDomain(value)) {
      setDomainStatus("idle");
      return;
    }

    setDomainStatus("checking");

    try {
      const result = await queryClient.fetchQuery(
        trpc.customDomain.checkAvailability.queryOptions({
          workspaceId,
          domain: value,
        }),
      );

      if (result.conflict) {
        setDomainStatus("conflict");
      } else if (result.hasSite) {
        setDomainStatus("has-site");
      } else {
        setDomainStatus("available");
      }
    } catch (error) {
      console.error("Ошибка проверки доступности домена:", error);
      toast.error("Не удалось проверить доступность домена");
      setDomainStatus("idle");
    }
  }, 500);

  useEffect(() => {
    if (domain) {
      validateDomain(domain);
    } else {
      setDomainStatus("idle");
    }
  }, [domain, validateDomain]);

  const createMutation = useMutation(
    trpc.customDomain.create.mutationOptions({
      onSuccess: () => {
        toast.success("Домен добавлен", {
          description: "Теперь настройте DNS записи для верификации",
        });
        queryClient.invalidateQueries({
          queryKey: trpc.customDomain.list.queryKey({ workspaceId }),
        });
        form.reset({ domain: "", type: defaultType });
        setDomainStatus("idle");
        onOpenChange(false);
      },
      onError: (error) => {
        if (error.message.includes("already exists")) {
          setDomainStatus("conflict");
        }
        toast.error("Ошибка", {
          description: error.message,
        });
      },
    }),
  );

  const onSubmit = (values: FormValues) => {
    createMutation.mutate({
      workspaceId,
      domain: values.domain,
      type: values.type,
    });
  };

  const saveDisabled =
    !["available", "has-site"].includes(domainStatus) ||
    createMutation.isPending;

  const currentStatus = STATUS_CONFIG[domainStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Добавить домен</DialogTitle>
          <DialogDescription>
            Добавьте свой домен для использования в ссылках
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип домена</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип домена" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="interview">Интервью</SelectItem>
                      <SelectItem value="prequalification">
                        Предквалификация
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Для чего будет использоваться домен
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш домен</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div
                        className={`rounded-lg p-1 transition-colors ${currentStatus.className}`}
                      >
                        <Input
                          {...field}
                          placeholder="interview.company.ru…"
                          autoComplete="off"
                          spellCheck={false}
                          className="border-neutral-300 font-mono shadow-sm"
                          style={{ fontSize: "16px" }}
                          onChange={(e) => {
                            field.onChange(e);
                            setDomainStatus("idle");
                          }}
                        />
                        {domain && (
                          <output
                            className="flex items-center gap-2 px-2 py-2 text-sm"
                            aria-live={
                              domainStatus === "checking"
                                ? "assertive"
                                : "polite"
                            }
                            aria-atomic="true"
                          >
                            <p className="flex-1">
                              {currentStatus.message ? (
                                currentStatus.message
                              ) : (
                                <>
                                  {currentStatus.prefix && (
                                    <>{currentStatus.prefix} </>
                                  )}
                                  {currentStatus.useStrong ? (
                                    <strong>{domain}</strong>
                                  ) : (
                                    domain
                                  )}
                                  {currentStatus.suffix && (
                                    <> {currentStatus.suffix}</>
                                  )}
                                </>
                              )}
                            </p>
                            {StatusIcon && (
                              <StatusIcon
                                className={`h-5 w-5 shrink-0 ${
                                  domainStatus === "checking"
                                    ? "animate-spin"
                                    : ""
                                }`}
                                aria-hidden="true"
                              />
                            )}
                          </output>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Введите домен без протокола (https://)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={saveDisabled}>
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Добавить домен
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
