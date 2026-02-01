"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from "@qbs-autonaim/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import type { FunnelCandidate, FunnelCandidateDetail } from "../types";

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: FunnelCandidate | FunnelCandidateDetail | null;
  workspaceId: string;
}

const offerFormSchema = z.object({
  position: z
    .string()
    .min(1, "Укажите должность")
    .max(200, "Название должности слишком длинное"),
  salary: z
    .string()
    .min(1, "Укажите зарплату")
    .refine(
      (val) => {
        // Проверяем, что строка содержит хотя бы одно число
        const hasNumber = /\d/.test(val);
        return hasNumber;
      },
      { message: "Зарплата должна содержать числовое значение" },
    ),
  startDate: z
    .string()
    .min(1, "Укажите дату начала работы")
    .refine(
      (val) => {
        const date = new Date(val);
        return !Number.isNaN(date.getTime());
      },
      { message: "Некорректная дата" },
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      { message: "Дата начала работы не может быть в прошлом" },
    ),
  benefits: z.string().optional(),
  message: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;

export function SendOfferDialog({
  open,
  onOpenChange,
  candidate,
  workspaceId,
}: SendOfferDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setFocus,
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      position: candidate?.position ?? "",
      salary: "",
      startDate: "",
      benefits: "",
      message: "",
    },
  });

  // Сбрасываем форму при открытии диалога
  useEffect(() => {
    if (open && candidate) {
      reset({
        position: candidate.position,
        salary: "",
        startDate: "",
        benefits: "",
        message: "",
      });
    }
  }, [open, candidate, reset]);

  // Фокусируемся на первой ошибке при валидации
  useEffect(() => {
    const firstError = Object.keys(errors)[0] as keyof OfferFormData;
    if (firstError) {
      setFocus(firstError);
    }
  }, [errors, setFocus]);

  const { mutate: sendOffer, isPending: isSendingOffer } = useMutation(
    trpc.candidates.sendOffer.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.candidates.list.queryKey(),
        });
        toast.success("Оффер успешно отправлен");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Не удалось отправить оффер");
      },
    }),
  );

  const onSubmit = (data: OfferFormData) => {
    if (!candidate) return;
    sendOffer({
      workspaceId,
      candidateId: candidate.id,
      offerDetails: {
        position: data.position.trim(),
        salary: data.salary.trim(),
        startDate: data.startDate,
        benefits: data.benefits?.trim() || "",
        message: data.message?.trim() || "",
      },
    });
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Отправить оффер</DialogTitle>
          <DialogDescription>
            Отправьте предложение о работе кандидату {candidate.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position">
              Должность <span className="text-destructive">*</span>
            </Label>
            <Input
              id="position"
              {...register("position")}
              placeholder="Например, Senior Frontend Developer"
              autoComplete="off"
              aria-invalid={!!errors.position}
            />
            {errors.position && (
              <p className="text-sm text-destructive" role="alert">
                {errors.position.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">
              Зарплата <span className="text-destructive">*</span>
            </Label>
            <Input
              id="salary"
              {...register("salary")}
              placeholder="Например, 200 000 - 250 000 ₽"
              autoComplete="off"
              aria-invalid={!!errors.salary}
            />
            {errors.salary && (
              <p className="text-sm text-destructive" role="alert">
                {errors.salary.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">
              Дата начала работы <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startDate"
              type="date"
              {...register("startDate")}
              autoComplete="off"
              aria-invalid={!!errors.startDate}
            />
            {errors.startDate && (
              <p className="text-sm text-destructive" role="alert">
                {errors.startDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefits">Бенефиты</Label>
            <Textarea
              id="benefits"
              {...register("benefits")}
              placeholder="ДМС, удаленная работа, гибкий график…"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Дополнительное сообщение</Label>
            <Textarea
              id="message"
              {...register("message")}
              placeholder="Персональное сообщение кандидату…"
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSendingOffer}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSendingOffer}>
              {isSendingOffer && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Отправить оффер
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
