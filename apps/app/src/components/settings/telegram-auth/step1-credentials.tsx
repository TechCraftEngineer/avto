"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { DialogFooter } from "@qbs-autonaim/ui/components/dialog";
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
import { Hash, Key, Phone, Send } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { Step1Values } from "./types";

interface Step1CredentialsProps {
  form: UseFormReturn<Step1Values>;
  onSubmit: (data: Step1Values) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function Step1Credentials({
  form,
  onSubmit,
  onCancel,
  isLoading,
}: Step1CredentialsProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-3">
          <p className="font-medium text-foreground">
            Инструкция по созданию приложения:
          </p>
          <ol className="space-y-2 list-decimal list-inside">
            <li>
              Откройте{" "}
              <a
                href="https://my.telegram.org/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                my.telegram.org/apps
              </a>{" "}
              <span className="font-medium text-amber-600 dark:text-amber-500">
                без VPN и прокси
              </span>
            </li>
            <li>Войдите с номером телефона вашего Telegram аккаунта</li>
            <li>
              Нажмите "Create new application" и заполните форму:
              <ul className="mt-1.5 ml-6 space-y-1 list-disc list-inside text-xs">
                <li>
                  <span className="font-medium">App title:</span> только
                  латинские буквы и цифры, 5-32 символа
                </li>
                <li>
                  <span className="font-medium">Short name:</span> только
                  латинские буквы и цифры, 5-32 символа
                </li>
                <li>
                  <span className="font-medium">Platform:</span> выберите
                  "Desktop"
                </li>
                <li>
                  <span className="font-medium">Description:</span> любое
                  описание (необязательно)
                </li>
              </ul>
            </li>
            <li>После создания скопируйте API ID и API Hash</li>
          </ol>
        </div>

        <FormField
          control={form.control}
          name="apiId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                API ID
              </FormLabel>
              <FormControl>
                <Input placeholder="123456" className="h-11" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="apiHash"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                API Hash
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="0123456789abcdef0123456789abcdef"
                  className="h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Номер телефона
              </FormLabel>
              <FormControl>
                <Input placeholder="+79991234567" className="h-11" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Введите номер в международном формате
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11"
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading} className="h-11">
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Отправка..." : "Отправить код"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
