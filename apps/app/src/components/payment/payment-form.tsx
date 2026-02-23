"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { Input } from "@qbs-autonaim/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@qbs-autonaim/ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useORPC } from "~/orpc/react";

interface PaymentFormProps {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  defaultWorkspaceId?: string;
  onSuccess?: (confirmationUrl: string) => void;
}

export function PaymentForm({
  workspaces,
  defaultWorkspaceId,
  onSuccess,
}: PaymentFormProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId ?? "");
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    workspaceId?: string;
  }>({});

  const firstErrorRef = useRef<HTMLInputElement>(null);

  const { mutate: createPayment, isPending } = useMutation(
    orpc.payment.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: orpc.payment.list.queryKey({
            input: { limit: 20, offset: 0 },
          }),
        });

        if (data.confirmationUrl) {
          if (onSuccess) {
            onSuccess(data.confirmationUrl);
          } else {
            window.location.href = data.confirmationUrl;
          }
        }
      },
      onError: (error) => {
        setErrors({
          amount: error.message.includes("сумма") ? error.message : undefined,
          workspaceId: error.message.includes("workspace")
            ? error.message
            : undefined,
        });
      },
    }),
  );

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const amountNum = Number.parseFloat(amount);

    if (!amount || Number.isNaN(amountNum)) {
      newErrors.amount = "Укажите сумму платежа";
    } else if (amountNum <= 0) {
      newErrors.amount = "Сумма должна быть больше нуля";
    } else if (amountNum < 0.01) {
      newErrors.amount = "Минимальная сумма: 0.01 ₽";
    }

    if (!workspaceId) {
      newErrors.workspaceId = "Выберите рабочее пространство";
    }

    if (description.length > 128) {
      newErrors.description = "Описание не может превышать 128 символов";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Фокус на первую ошибку
      setTimeout(() => {
        firstErrorRef.current?.focus();
      }, 0);
      return;
    }

    const trimmedDescription = description.trim();
    const returnUrl = `${window.location.origin}/payment/return`;

    createPayment({
      amount: Number.parseFloat(amount),
      currency: "RUB",
      description: trimmedDescription || undefined,
      returnUrl,
      workspaceId,
    });
  };

  // Фокус на первую ошибку при изменении errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      firstErrorRef.current?.focus();
    }
  }, [errors]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
      style={{ touchAction: "manipulation" }}
    >
      {/* Сумма */}
      <div className="space-y-2">
        <label
          htmlFor="payment-amount"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Сумма <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Input
            id="payment-amount"
            name="amount"
            type="text"
            inputMode="decimal"
            placeholder="1000.00"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setAmount(e.target.value);
              if (errors.amount) {
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }
            }}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "amount-error" : undefined}
            autoComplete="transaction-amount"
            disabled={isPending}
            ref={errors.amount ? firstErrorRef : undefined}
            className="pr-12"
            style={{
              fontSize: "16px", // Предотвращает zoom на мобильных
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            ₽
          </span>
        </div>
        {errors.amount && (
          <p
            id="amount-error"
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errors.amount}
          </p>
        )}
      </div>

      {/* Описание */}
      <div className="space-y-2">
        <label
          htmlFor="payment-description"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Описание
        </label>
        <Input
          id="payment-description"
          name="description"
          type="text"
          placeholder="Оплата подписки…"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            if (value.length <= 128) {
              setDescription(value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }
          }}
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
          autoComplete="off"
          disabled={isPending}
          maxLength={128}
          style={{
            fontSize: "16px",
          }}
        />
        <div className="flex items-center justify-between">
          {errors.description && (
            <p
              id="description-error"
              className="text-sm text-destructive"
              role="alert"
              aria-live="polite"
            >
              {errors.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            {description.length}/128
          </p>
        </div>
      </div>

      {/* Рабочее пространство */}
      <div className="space-y-2">
        <label
          htmlFor="payment-workspace"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Рабочее пространство <span className="text-destructive">*</span>
        </label>
        <Select
          value={workspaceId}
          onValueChange={(value: string) => {
            setWorkspaceId(value);
            if (errors.workspaceId) {
              setErrors((prev) => ({ ...prev, workspaceId: undefined }));
            }
          }}
          disabled={isPending}
        >
          <SelectTrigger
            id="payment-workspace"
            aria-invalid={!!errors.workspaceId}
            aria-describedby={
              errors.workspaceId ? "workspace-error" : undefined
            }
            className="w-full min-h-[44px] md:min-h-[36px]"
          >
            <SelectValue placeholder="Выберите рабочее пространство" />
          </SelectTrigger>
          <SelectContent>
            {workspaces.map((workspace) => (
              <SelectItem key={workspace.id} value={workspace.id}>
                {workspace.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.workspaceId && (
          <p
            id="workspace-error"
            className="text-sm text-destructive"
            role="alert"
            aria-live="polite"
          >
            {errors.workspaceId}
          </p>
        )}
      </div>

      {/* Кнопка отправки */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[44px] md:min-h-[36px]"
        style={{ touchAction: "manipulation" }}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Оплата…
          </>
        ) : (
          "Оплатить"
        )}
      </Button>
    </form>
  );
}
