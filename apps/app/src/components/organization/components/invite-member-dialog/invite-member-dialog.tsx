"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
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
import { inviteToOrganizationSchema } from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, UserPlus } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { useTRPC } from "~/trpc/react";

type InviteFormValues = z.infer<typeof inviteToOrganizationSchema>;

interface InviteMemberDialogProps {
  organizationId: string;
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({
  organizationId,
  trigger,
}: InviteMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteToOrganizationSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const inviteMutation = useMutation(
    trpc.organization.createInvite.mutationOptions({
      onSuccess: () => {
        toast.success("Приглашение отправлено", {
          description: "Пользователь получит email с приглашением",
        });
        setOpen(false);
        form.reset();
        // Обновляем список приглашений
        queryClient.invalidateQueries({
          queryKey: [["organization", "listInvites"]],
        });
      },
      onError: (error) => {
        // Проверяем на дубликат приглашения
        if (
          error.message.includes("duplicate") ||
          error.message.includes("дубликат") ||
          error.message.includes("уже приглашен") ||
          error.message.includes("already invited")
        ) {
          form.setError("email", {
            message: "Пользователь с таким email уже приглашен в организацию",
          });
        } else {
          form.setError("email", {
            message: error.message || "Ошибка при отправке приглашения",
          });
        }
      },
    }),
  );

  const handleSubmit = async (values: InviteFormValues) => {
    inviteMutation.mutate({
      organizationId,
      email: values.email,
      role: values.role,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Пригласить участника
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Пригласить участника</DialogTitle>
          <DialogDescription>
            Отправьте приглашение по email. Пользователь получит ссылку для
            присоединения к организации.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email адрес</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль в организации</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Участник</span>
                          <span className="text-xs text-muted-foreground">
                            Доступ к назначенным рабочим пространствам
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Администратор</span>
                          <span className="text-xs text-muted-foreground">
                            Управление участниками и рабочими пространствами
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="owner">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Владелец</span>
                          <span className="text-xs text-muted-foreground">
                            Полный доступ к организации
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={inviteMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending
                  ? "Отправка…"
                  : "Отправить приглашение"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
