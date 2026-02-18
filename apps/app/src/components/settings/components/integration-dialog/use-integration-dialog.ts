"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { triggerVerifyKworkCredentials } from "~/actions/integration";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import {
  INTEGRATION_TYPES,
  type IntegrationFormValues,
  integrationFormSchema,
} from "./integration-form-schema";
import { useHHIntegration } from "./use-hh-integration";

interface Integration {
  type: string;
  name?: string | null;
  email?: string | null;
  login?: string | null;
  isActive?: boolean;
}

interface UseIntegrationDialogProps {
  open: boolean;
  selectedType: string | null;
  isEditing: boolean;
  onClose: () => void;
  onVerify?: (type: string) => void;
}

export function useIntegrationDialog({
  open: _open,
  selectedType,
  isEditing,
  onClose,
  onVerify,
}: UseIntegrationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingKwork, setIsVerifyingKwork] = useState(false);

  const workspaceId = useMemo(() => workspace?.id || "", [workspace?.id]);

  // HH интеграция с машиной состояний
  const hhIntegration = useHHIntegration({ workspaceId });

  const { data: integrations } = useQuery(
    trpc.integration.list.queryOptions(
      workspaceId && isEditing ? { workspaceId } : skipToken,
    ),
  );

  const existingIntegration = integrations?.find(
    (i) => i.type === selectedType,
  ) as Integration | undefined;

  const form = useForm<IntegrationFormValues>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      type: selectedType || "hh",
      name: "",
      email: "",
      login: "",
      password: "",
      authType: "password",
      enabled: true,
    },
  });

  const integrationType = INTEGRATION_TYPES.find(
    (t) => t.value === form.watch("type"),
  );

  useEffect(() => {
    if (selectedType) {
      form.setValue("type", selectedType);
      if (isEditing && existingIntegration) {
        form.setValue("name", existingIntegration.name || "");
        form.setValue("enabled", existingIntegration.isActive ?? true);
        if (selectedType === "kwork") {
          form.setValue("login", existingIntegration.login || "");
          form.setValue("email", "");
        } else {
          // HH использует login (email или телефон)
          form.setValue("login", existingIntegration.email || "");
          form.setValue("email", "");
        }
      } else if (!isEditing) {
        form.setValue("name", "");
        form.setValue("email", "");
        form.setValue("login", "");
        form.setValue("password", "");
        form.setValue("enabled", true);
      }
    }
  }, [selectedType, isEditing, existingIntegration, form]);

  const currentType = form.watch("type");
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run when currentType changes to clear email on integration type switch
  useEffect(() => {
    // Очищаем поле email при смене типа - HH использует login
    form.setValue("email", "");
  }, [currentType, form]);

  const createMutation = useMutation(
    trpc.integration.create.mutationOptions({
      onSuccess: (_, variables) => {
        toast.success("Интеграция успешно создана");
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: trpc.integration.list.queryKey({ workspaceId }),
          });
        }
        handleClose();
        if (onVerify) {
          setTimeout(() => onVerify(variables.type), 500);
        }
      },
      onError: (err) => {
        const message = err.message || "Не удалось создать интеграцию";
        if (message.includes("unique") || message.includes("уже существует")) {
          toast.error(
            "Интеграция этого типа уже подключена к workspace. Удалите существующую интеграцию перед добавлением новой.",
          );
        } else {
          toast.error(message);
        }
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.integration.update.mutationOptions({
      onSuccess: () => {
        toast.success("Интеграция успешно обновлена");
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: trpc.integration.list.queryKey({ workspaceId }),
          });
        }
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Не удалось обновить интеграцию");
      },
    }),
  );

  const { reset: resetHH } = hhIntegration;
  const handleClose = useCallback(() => {
    form.reset();
    setShowPassword(false);
    setIsVerifyingKwork(false);
    resetHH();
    onClose();
  }, [form, onClose, resetHH]);

  const handleHHSuccessClose = useCallback(() => {
    handleClose();
    if (onVerify) {
      setTimeout(() => onVerify("hh"), 300);
    }
  }, [handleClose, onVerify]);

  const onSubmit = async (data: IntegrationFormValues) => {
    if (!workspaceId) {
      toast.error("Workspace не найден");
      return;
    }

    // HH интеграция
    if (data.type === "hh") {
      await hhIntegration.startVerification(
        data.login?.trim() ?? "",
        data.password?.trim() ?? "",
        data.authType,
      );
      return;
    }

    // Kwork интеграция
    if (data.type === "kwork") {
      setIsVerifyingKwork(true);
      toast.info("Проверка данных Kwork…", { duration: 3000 });

      try {
        await triggerVerifyKworkCredentials(
          data.login ?? "",
          data.password ?? "",
          workspaceId,
        );
      } catch (error) {
        setIsVerifyingKwork(false);
        toast.error(
          error instanceof Error ? error.message : "Ошибка отправки запроса",
        );
        return;
      }
      return;
    }

    // Остальные интеграции
    const credentials =
      data.type === "kwork"
        ? { login: data.login ?? "", password: data.password }
        : { login: data.login ?? "", password: data.password };

    const payload = {
      workspaceId,
      type: data.type,
      name: data.name || integrationType?.label || "",
      credentials: credentials as unknown as Record<string, string>,
      authType: data.authType,
      isActive: data.enabled,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  // Обработчик результатов для Kwork
  const handleKworkVerificationResult = useCallback(
    (result: {
      success?: boolean;
      isValid?: boolean;
      error?: string;
      message?: string;
    }) => {
      setIsVerifyingKwork(false);

      if (result.success && result.isValid) {
        toast.success("Данные успешно проверены");
        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: trpc.integration.list.queryKey({ workspaceId }),
          });
        }
        handleClose();
      } else {
        toast.error(result.error || "Ошибка проверки данных");
      }
    },
    [workspaceId, queryClient, trpc.integration.list, handleClose],
  );

  return {
    form,
    integrationType,
    showPassword,
    setShowPassword,
    workspaceId,
    createMutation,
    updateMutation,
    handleClose,
    onSubmit,
    // HH интеграция
    hhState: hhIntegration.state,
    isVerifyingHH: hhIntegration.isLoading,
    handleHHVerificationResult: hhIntegration.handleVerificationResult,
    handleHHVerificationError: () => {
      hhIntegration.reset();
      toast.error("Ошибка подключения к серверу");
    },
    handleHHCaptchaSubmit: hhIntegration.submitCaptcha,
    handleHH2FACodeSubmit: hhIntegration.submit2FACode,
    handleHHResendCode: hhIntegration.resendCode,
    isResendingHHCode: hhIntegration.isResending,
    handleHHSuccessClose,
    // Kwork интеграция
    isVerifyingKwork,
    handleKworkVerificationResult,
    handleKworkVerificationError: () => {
      setIsVerifyingKwork(false);
      toast.error("Ошибка подключения к серверу");
    },
  };
}
