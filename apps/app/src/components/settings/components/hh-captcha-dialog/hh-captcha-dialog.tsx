"use client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@qbs-autonaim/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const captchaSchema = z.object({
  captcha: z.string().min(1, "Введите символы с картинки"),
});

type CaptchaValues = z.infer<typeof captchaSchema>;

interface HHCaptchaDialogProps {
  open: boolean;
  onClose: () => void;
  captchaImageUrl: string | null;
  onSubmitCaptcha: (captcha: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export function HHCaptchaDialog({
  open,
  onClose,
  captchaImageUrl,
  onSubmitCaptcha,
  isLoading,
  error,
}: HHCaptchaDialogProps) {
  const [key, setKey] = useState(0);

  const form = useForm<CaptchaValues>({
    resolver: async (data) => {
      try {
        const result = captchaSchema.safeParse(data);
        if (!result.success) {
          return {
            values: {},
            errors: result.error.issues.reduce(
              (acc, issue) => {
                const path = issue.path[0] as string;
                acc[path] = {
                  type: issue.code,
                  message: issue.message,
                };
                return acc;
              },
              {} as Record<string, { type: string; message: string }>,
            ),
          };
        }
        return { values: result.data, errors: {} };
      } catch {
        return { values: {}, errors: {} };
      }
    },
    defaultValues: { captcha: "" },
  });

  useEffect(() => {
    if (captchaImageUrl) {
      setKey((k) => k + 1);
      form.reset({ captcha: "" });
    }
  }, [captchaImageUrl, form]);

  const handleSubmit = (data: CaptchaValues) => {
    onSubmitCaptcha(data.captcha);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-semibold">
            Подтверждение входа в hh.ru
          </DialogTitle>
          <DialogDescription className="text-base">
            Введите символы с картинки ниже
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {captchaImageUrl && (
              <div className="flex justify-center">
                {/* biome-ignore lint/performance/noImgElement: captcha from external hh.ru URL */}
                <img
                  key={key}
                  src={captchaImageUrl}
                  alt="Капча"
                  className="rounded border bg-muted"
                  style={{ maxHeight: 80 }}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Символы с картинки
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Введите символы"
                      disabled={isLoading}
                      autoComplete="off"
                      autoCapitalize="off"
                      className="text-center font-mono tracking-widest uppercase"
                    />
                  </FormControl>
                  {error && (
                    <FormMessage className="text-center">
                      <span className="text-destructive">{error}</span>
                    </FormMessage>
                  )}
                  {!error && form.formState.errors.captcha && <FormMessage />}
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="h-11"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.watch("captcha")?.trim()}
                className="h-11"
              >
                {isLoading ? "Проверка…" : "Подтвердить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
