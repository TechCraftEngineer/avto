"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { APP_CONFIG } from "@qbs-autonaim/config";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
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
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { createOrganizationSchema } from "@qbs-autonaim/validators";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { CreateWorkspaceDialog } from "../workspace/create-workspace-dialog";

type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [createdOrganization, setCreatedOrganization] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);

  // Извлекаем домен из URL
  const appDomain = new URL(APP_CONFIG.url).host;

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      website: "",
    },
  });

  const createMutation = useMutation(
    trpc.organization.create.mutationOptions({
      onSuccess: async (organization) => {
        toast.success("Организация создана", {
          description: `Организация "${organization.name}" успешно создана`,
        });

        // Инвалидируем кеш организаций
        await queryClient.invalidateQueries(
          trpc.organization.list.pathFilter(),
        );

        onOpenChange(false);
        form.reset();
        setCreatedOrganization({
          id: organization.id,
          slug: organization.slug,
        });
        setShowWorkspaceDialog(true);
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          form.setError("slug", {
            message: "Организация с таким slug уже существует",
          });
        } else {
          toast.error("Ошибка при создании организации", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleSubmit = async (values: CreateOrganizationFormValues) => {
    createMutation.mutate(values);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const handleNameChange = (name: string) => {
    form.setValue("name", name);
    if (!form.formState.dirtyFields.slug) {
      const slug = slugify(name);
      form.setValue("slug", slug);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="size-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Создать организацию</DialogTitle>
            <DialogDescription>
              Создайте новую организацию для управления командами и проектами
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
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
                      <FormLabel>Slug организации</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="text-muted-foreground size-4 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              Slug — это уникальный идентификатор для URL.
                              Например, для организации "Моя Компания" slug
                              может быть "moya-kompaniya". Используется только
                              латиница, цифры и дефисы.
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
                          placeholder="acme"
                          {...field}
                          onChange={(e) => {
                            form.setValue("slug", e.target.value, {
                              shouldDirty: true,
                            });
                          }}
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                        className="resize-none"
                        rows={3}
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
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenChange(false)}
                  disabled={createMutation.isPending}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending
                    ? "Создание…"
                    : "Создать организацию"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {createdOrganization && (
        <CreateWorkspaceDialog
          organizationId={createdOrganization.id}
          organizationSlug={createdOrganization.slug}
          open={showWorkspaceDialog}
          onOpenChange={setShowWorkspaceDialog}
        />
      )}
    </>
  );
}
