"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@qbs-autonaim/ui/components/form";
import { Textarea } from "@qbs-autonaim/ui/components/textarea";
import type { CreateGlobalCandidateFormValues } from "@qbs-autonaim/validators";
import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { EducationSection } from "./education-section";
import { ExperienceSection } from "./experience-section";
import {
  BasicInfoSection,
  ContactsSection,
  ProfileSection,
} from "./form-sections";

interface CandidateFormProps {
  form: UseFormReturn<CreateGlobalCandidateFormValues>;
  onSubmit: (values: CreateGlobalCandidateFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  isSubmitting?: boolean;
}

export function CandidateForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  isSubmitting = false,
}: CandidateFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <BasicInfoSection form={form} />
        <ContactsSection form={form} />
        <ProfileSection form={form} />
        <ExperienceSection form={form} />
        <EducationSection form={form} />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Заметки</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Дополнительная информация о кандидате…"
                  className="resize-none"
                  rows={2}
                  {...field}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      (event.ctrlKey || event.metaKey)
                    ) {
                      event.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-10 sm:h-11"
            onClick={onCancel}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            className="flex-1 h-10 sm:h-11"
            disabled={isPending || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Добавить кандидата
          </Button>
        </div>
      </form>
    </Form>
  );
}
