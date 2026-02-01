"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@qbs-autonaim/ui";
import {
  type AccountFormValues,
  accountFormSchema,
} from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useTRPC } from "~/trpc/react";

export function AccountForm({
  initialData,
}: {
  initialData?: Partial<AccountFormValues>;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: initialData || {
      name: "",
    },
  });

  const updateAccount = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Аккаунт успешно обновлен");
        await queryClient.invalidateQueries(trpc.user.pathFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось обновить аккаунт");
      },
    }),
  );

  function onSubmit(data: AccountFormValues) {
    updateAccount.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">Имя</FormLabel>
              <Input placeholder="Ваше имя" {...field} />
              <p className="text-sm text-amber-700/70">
                Это имя будет отображаться в вашем профиле и в письмах.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-foreground text-background hover:bg-foreground/90"
          disabled={updateAccount.isPending}
        >
          {updateAccount.isPending ? "Обновление..." : "Обновить аккаунт"}
        </Button>
      </form>
    </Form>
  );
}
