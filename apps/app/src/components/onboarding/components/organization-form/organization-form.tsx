"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { APP_CONFIG } from "@qbs-autonaim/config";
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
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui/components/tooltip";
import { createOrganizationSchema } from "@qbs-autonaim/validators";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, HelpCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useORPC } from "~/orpc/react";

type OrganizationFormValues = z.infer<typeof createOrganizationSchema>;

interface OrganizationFormProps {
  onSuccess?: (organization: {
    id: string;
    slug: string;
    name: string;
  }) => void;
}

export function OrganizationForm({ onSuccess }: OrganizationFormProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const appDomain = new URL(APP_CONFIG.url).host;

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      website: "",
    },
  });

  const createMutation = useMutation(
    orpc.organization.create.mutationOptions({
      onSuccess: (organization) => {
        toast.success("Организация создана", {
          description: `Организация "${organization.name}" успешно создана`,
        });
        void queryClient.invalidateQueries({
          queryKey: orpc.organization.list.queryKey({ input: {} }),
        });
        onSuccess?.({
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
        });
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          form.setError("slug", {
            message:
              "Организация с таким слагом уже существует. Попробуйте другой слаг.",
          });
        } else {
          toast.error("Ошибка при создании организации", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", slugify(name));
    }
  };

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
          <Building2 className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold">Создайте организацию</h1>
        <p className="text-muted-foreground mt-2">
          Настройте организацию для управления командами и рабочими
          пространствами
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) =>
            createMutation.mutate(values),
          )}
          className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название организации</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Моя компания"
                    autoFocus
                    autoComplete="organization"
                    maxLength={100}
                    {...field}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-1.5">
                  <FormLabel>Слаг организации</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-muted-foreground inline-flex"
                          aria-label="Информация о слаге"
                        >
                          <HelpCircle className="size-4" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Слаг — это уникальный идентификатор для адреса.
                          Например, для организации &quot;Моя Компания&quot;
                          слаг может быть &quot;moya-kompaniya&quot;.
                          Используется только латиница, цифры и дефисы.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <FormControl>
                  <div className="flex items-stretch overflow-hidden rounded-md border">
                    <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
                      {appDomain}/orgs/
                    </div>
                    <Input
                      placeholder="пример-организации…"
                      maxLength={50}
                      pattern="[a-z0-9-]+"
                      title="Только строчные буквы, цифры и дефис"
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      autoComplete="off"
                      spellCheck={false}
                      {...field}
                      onChange={(e) =>
                        form.setValue("slug", e.target.value, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Вы сможете изменить это позже в настройках организации.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание (опционально)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Краткое описание организации…"
                    rows={3}
                    maxLength={500}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Веб-сайт (опционально)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://пример.рф…"
                    maxLength={200}
                    autoComplete="url"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              createMutation.isPending ||
              !form.watch("name") ||
              !form.watch("slug")
            }
            aria-busy={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
                Создание…
              </>
            ) : (
              "Создать организацию"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
}
