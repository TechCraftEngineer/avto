"use client";

import {
  Button,
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
import { Briefcase, Eye, EyeOff, LogIn, Mail } from "lucide-react";
import type { Control } from "react-hook-form";
import type { IntegrationFormValues } from "./integration-form-schema";
import { INTEGRATION_TYPES } from "./integration-form-schema";

interface IntegrationFormFieldsProps {
  control: Control<IntegrationFormValues>;
  integrationType: (typeof INTEGRATION_TYPES)[number] | undefined;
  showPassword: boolean;
  onTogglePassword: () => void;
  isEditing: boolean;
}

export function IntegrationFormFields({
  control,
  integrationType,
  showPassword,
  onTogglePassword,
  isEditing,
}: IntegrationFormFieldsProps) {
  return (
    <>
      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground space-y-2">
        <p>
          {integrationType?.value === "kwork"
            ? "Для Kwork используйте логин и пароль от аккаунта"
            : "Для подключения HeadHunter используйте учетные данные вашего аккаунта работодателя"}
        </p>
        <p className="text-xs">
          {integrationType?.value === "hh"
            ? "Проверка данных может занять до 2 минут"
            : integrationType?.value === "kwork"
              ? "Проверка данных Kwork…"
              : null}
        </p>
      </div>

      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium">
              Тип интеграции
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isEditing}
            >
              <FormControl>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {INTEGRATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Название (опционально)
            </FormLabel>
            <FormControl>
              <Input
                placeholder={integrationType?.label}
                className="h-11"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Используется для идентификации интеграции
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {integrationType?.value === "kwork" ? (
        <FormField
          control={control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <LogIn className="h-4 w-4 text-muted-foreground" />
                Логин
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ваш логин Kwork"
                  className="h-11"
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="ваш@email.com"
                  className="h-11"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              Пароль
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={onTogglePassword}
                  aria-label={
                    showPassword ? "Скрыть пароль" : "Показать пароль"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormDescription className="text-xs">
              Пароль хранится в зашифрованном виде
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
