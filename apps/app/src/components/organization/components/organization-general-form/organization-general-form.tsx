"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
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
import {
  type UpdateOrganizationInput,
  updateOrganizationSchema,
} from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DeleteOrganizationDialog } from "~/components/organization";
import { useTRPC } from "~/trpc/react";

type OrganizationFormValues = UpdateOrganizationInput;

export function OrganizationGeneralForm({
  initialData,
  organizationId,
  userRole,
}: {
  initialData?: Partial<OrganizationFormValues>;
  organizationId: string;
  userRole?: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo || null,
  );
  const [initialSlug] = useState(initialData?.slug);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canEdit = userRole === "owner" || userRole === "admin";
  const canDelete = userRole === "owner";

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: initialData || {
      name: "",
      slug: "",
      description: "",
      website: "",
      logo: "",
    },
  });

  const updateOrganization = useMutation(
    trpc.organization.update.mutationOptions({
      onSuccess: async (
        _data: unknown,
        variables: { data: { slug?: string } },
      ) => {
        toast.success("Организация успешно обновлена");
        await queryClient.invalidateQueries(trpc.organization.pathFilter());
        if (variables.data.slug && variables.data.slug !== initialSlug) {
          router.push(`/orgs/${variables.data.slug}/settings`);
        }
      },
      onError: (err) => {
        const message =
          err instanceof Error
            ? err.message
            : "Не удалось обновить организацию";
        toast.error(message);
      },
    }),
  );

  const deleteOrganization = useMutation(
    trpc.organization.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Организация успешно удалена");
        router.push("/");
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Не удалось удалить организацию";
        toast.error(message);
      },
    }),
  );

  function onSubmit(data: OrganizationFormValues) {
    updateOrganization.mutate({
      id: organizationId,
      data: {
        ...data,
        logo: data.logo || undefined,
        website: data.website || undefined,
        description: data.description || undefined,
      },
    });
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        form.setValue("logo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    form.setValue("logo", null as unknown as string);
    // Reset file input to allow re-uploading the same file
    const fileInput = document.getElementById(
      "logo-upload",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDeleteOrganization = () => {
    deleteOrganization.mutate({ id: organizationId });
  };

  if (!canEdit) {
    return (
      <div className="rounded-lg border border-muted p-6">
        <p className="text-muted-foreground">
          У вас нет прав для изменения настроек организации. Обратитесь к
          администратору.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Общие настройки</CardTitle>
          <CardDescription>
            Управление основной информацией об организации
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Organization Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Название организации
                    </FormLabel>
                    <Input placeholder="Моя компания" {...field} />
                    <p className="text-sm text-muted-foreground">
                      Это название вашей организации.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-foreground font-medium">
                        Адрес организации
                      </FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            className="max-w-xs"
                            data-testid="slug-help-tooltip"
                          >
                            <p>
                              Уникальный адрес для доступа к вашей организации.
                              Используется в URL (например,{" "}
                              <span className="font-mono text-xs">
                                /orgs/my-company
                              </span>
                              ). После изменения все ссылки на старый адрес
                              перестанут работать.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input placeholder="my-company" {...field} />
                    <p className="text-sm text-muted-foreground">
                      Только строчные буквы, цифры и дефисы. От 3 до 50
                      символов.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Описание
                    </FormLabel>
                    <Textarea
                      placeholder="Краткое описание вашей организации"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                    <p className="text-sm text-muted-foreground">
                      Необязательное описание организации. Максимум 500
                      символов.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Website */}
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Веб-сайт
                    </FormLabel>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                    <p className="text-sm text-muted-foreground">
                      Необязательная ссылка на веб-сайт организации.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Logo */}
              <FormField
                control={form.control}
                name="logo"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">
                      Логотип организации
                    </FormLabel>
                    <div className="flex items-start gap-4">
                      {logoPreview && (
                        <div className="relative h-20 w-20 rounded-lg overflow-hidden border">
                          {/* biome-ignore lint/performance/noImgElement: preview from FileReader */}
                          <img
                            src={logoPreview}
                            alt="Логотип организации"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <label
                            htmlFor="logo-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Загрузить логотип</span>
                          </label>
                          <input
                            id="logo-upload"
                            type="file"
                            accept=".png,.jpg,.jpeg"
                            className="hidden"
                            onChange={handleLogoChange}
                          />
                          {logoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              onClick={handleRemoveLogo}
                              className="inline-flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="text-sm">Удалить</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Рекомендуется квадратное изображение. Допустимые форматы:
                      .png, .jpg, .jpeg. Максимальный размер: 2MB.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90"
                disabled={updateOrganization.isPending}
              >
                {updateOrganization.isPending
                  ? "Сохранение…"
                  : "Сохранить изменения"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Delete Organization Section */}
      {canDelete && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">
              Удалить организацию
            </CardTitle>
            <CardDescription>
              Внимание: Это безвозвратно удалит вашу организацию, все рабочие
              пространства, интеграции, вакансии и отклики кандидатов.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteOrganization.isPending}
            >
              Удалить организацию
            </Button>
          </CardContent>
        </Card>
      )}

      <DeleteOrganizationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        organizationName={initialData?.name || ""}
        onConfirm={handleDeleteOrganization}
        isDeleting={deleteOrganization.isPending}
      />
    </div>
  );
}
