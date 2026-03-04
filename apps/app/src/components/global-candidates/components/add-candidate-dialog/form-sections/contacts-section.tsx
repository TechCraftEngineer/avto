"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Input } from "@qbs-autonaim/ui/components/input";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import type { UseFormReturn } from "react-hook-form";

interface ContactsSectionProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
}

export function ContactsSection({ form }: ContactsSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
      <p className="text-sm font-medium text-muted-foreground lg:col-span-2">
        Контакты
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-2 gap-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@example.com"
                  {...field}
                  type="email"
                  autoComplete="email"
                  spellCheck={false}
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
              <FormLabel>Телефон</FormLabel>
              <FormControl>
                <Input
                  placeholder="+7 (999) 123-45-67"
                  {...field}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  spellCheck={false}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="telegramUsername"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Telegram</FormLabel>
            <FormControl>
              <Input
                placeholder="@username"
                {...field}
                type="text"
                autoComplete="username"
                spellCheck={false}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
