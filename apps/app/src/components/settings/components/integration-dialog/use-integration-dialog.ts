"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  triggerVerifyHHCredentials,
  triggerVerifyKworkCredentials,
} from "~/actions/integration";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";
import {
  INTEGRATION_TYPES,
  type IntegrationFormValues,
  integrationFormSchema,
} from "./integration-form-schema";

interface Integration {
  type: string;
  name?: string | null;
  email?: string | null;
  login?: string | null;
}

interface UseIntegrationDialogProps {
  open: boolean;
  selectedType: string | null;
  isEditing: boolean;
  onClose: () => void;
  onVerify?: (type: string) => void;
}

export function useIntegrationDialog({
  open,
  selectedType,
  isEditing,
  onClose,
  onVerify,
}: UseIntegrationDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingType, setVerifyingType] = useState<"hh" | "kwork">("hh");

  const workspaceId = useMemo(() => workspace?.id || "", [workspace?.id]);

  const { data: integrations } = useQuery({
    ...trpc.integration.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId && isEditing,
  });

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
        if (selectedType === "kwork") {
          form.setValue("login", existingIntegration.login || "");
          form.setValue("email", "");
        } else {
          form.setValue("email", existingIntegration.email || "");
          form.setValue("login", "");
        }
      } else if (!isEditing) {
        form.setValue("name", "");
        form.setValue("email", "");
        form.setValue("login", "");
        form.setValue("password", "");
      }
    }
  }, [selectedType, isEditing, existingIntegration, form]);

  const currentType = form.watch("type");
  useEffect(() => {
    if (currentType === "kwork") {
      form.setValue("email", "");
    } else {
      form.setValue("login", "");
    }
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

  const handleClose = useCallback(() => {
    form.reset();
    setShowPassword(false);
    setIsVerifying(false);
    onClose();
  }, [form, onClose]);

  const handleVerificationResult = useCallback(
    (result: { success?: boolean; isValid?: boolean; error?: string }) => {
      setIsVerifying(false);

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

  const handleVerificationError = useCallback(() => {
    setIsVerifying(false);
    toast.error("Ошибка подключения к серверу");
  }, []);

  const onSubmit = async (data: IntegrationFormValues) => {
    if (!workspaceId) {
      toast.error("Workspace не найден");
      return;
    }

    const credentials =
      data.type === "kwork"
        ? { login: data.login ?? "", password: data.password }
        : { email: data.email ?? "", password: data.password };

    const payload = {
      workspaceId,
      type: data.type,
      name: data.name || integrationType?.label || "",
      credentials,
    };

    if (data.type === "hh") {
      setIsVerifying(true);
      setVerifyingType("hh");
      toast.info(
        "Проверка данных может занять до 2 минут. Пожалуйста, подождите…",
        { duration: 5000 },
      );

      try {
        await triggerVerifyHHCredentials(
          data.email ?? "",
          data.password,
          workspaceId,
        );
      } catch (error) {
        setIsVerifying(false);
        toast.error(
          error instanceof Error ? error.message : "Ошибка отправки запроса",
        );
        return;
      }
      return;
    }

    if (data.type === "kwork") {
      setIsVerifying(true);
      setVerifyingType("kwork");
      toast.info("Проверка данных Kwork…", { duration: 3000 });

      try {
        await triggerVerifyKworkCredentials(
          data.login ?? "",
          data.password,
          workspaceId,
        );
      } catch (error) {
        setIsVerifying(false);
        toast.error(
          error instanceof Error ? error.message : "Ошибка отправки запроса",
        );
        return;
      }
      return;
    }

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return {
    form,
    integrationType,
    showPassword,
    setShowPassword,
    isVerifying,
    workspaceId,
    verifyingType,
    createMutation,
    updateMutation,
    handleClose,
    handleVerificationResult,
    handleVerificationError,
    onSubmit,
  };
}
