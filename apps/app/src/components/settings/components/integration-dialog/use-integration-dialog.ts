"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingType, setVerifyingType] = useState<"hh" | "kwork">("hh");
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  /** Код 2FA успешно отправлен — ждём результат от job (Realtime или fallback polling) */
  const [isCodeAccepted, setIsCodeAccepted] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [showCaptchaDialog, setShowCaptchaDialog] = useState(false);
  const [captchaImageUrl, setCaptchaImageUrl] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [resendCountdownReset, setResendCountdownReset] = useState(0);
  const resendTriggeredRef = useRef(false);
  /** Код отправлен, ждём результат от job — не показывать повторный toast requiresTwoFactor */
  const codeSubmittedRef = useRef(false);
  /** Сохраняем логин при submit для 2FA — форма может сброситься до отправки кода (useEffect, refetch) */
  const twoFactorCredentialsRef = useRef<{
    login: string;
    password: string;
    authType: "password" | "code";
  } | null>(null);

  const workspaceId = useMemo(() => workspace?.id || "", [workspace?.id]);

  const { data: integrations } = useQuery({
    ...trpc.integration.list.queryOptions({ workspaceId }),
    enabled: !!workspaceId && (isEditing || isCodeAccepted),
    refetchInterval: isCodeAccepted ? 3000 : false,
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
      authType: "password",
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
          // HH использует login (email или телефон)
          form.setValue("login", existingIntegration.email || "");
          form.setValue("email", "");
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
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run when currentType changes to clear email on integration type switch
  useEffect(() => {
    // Очищаем поле email при смене типа - HH использует login
    form.setValue("email", "");
  }, [currentType, form]);

  const saveHH2FACodeMutation = useMutation(
    trpc.integration.saveHH2FACode.mutationOptions({
      onError: (err) => {
        setTwoFactorError(err.message);
      },
    }),
  );

  const requestHHResendCodeMutation = useMutation(
    trpc.integration.requestHHResendCode.mutationOptions({
      onSuccess: () => {
        setResendCountdownReset((prev) => prev + 1);
        toast.success("Новый код отправлен. Проверьте почту или SMS.");
      },
      onError: (err) => {
        toast.error(err.message || "Ошибка повторной отправки");
      },
    }),
  );

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
    twoFactorCredentialsRef.current = null;
    setShowPassword(false);
    setIsVerifying(false);
    setShow2FADialog(false);
    setTwoFactorError(null);
    setIsCodeAccepted(false);
    setShowCaptchaDialog(false);
    setCaptchaImageUrl(null);
    setCaptchaError(null);
    onClose();
  }, [form, onClose]);

  const saveHHCaptchaMutation = useMutation(
    trpc.integration.saveHHCaptcha.mutationOptions({
      onError: (err) => {
        setCaptchaError(err.message);
      },
    }),
  );

  const handleVerificationResult = useCallback(
    (result: {
      success?: boolean;
      isValid?: boolean;
      error?: string;
      requiresTwoFactor?: boolean;
      twoFactorType?: "email" | "phone";
      message?: string;
      captchaRequired?: boolean;
      captchaImageUrl?: string;
    }) => {
      setIsResendingCode(false);

      // Проверяем, требуется ли капча
      if (result.captchaRequired && result.captchaImageUrl) {
        setShowCaptchaDialog(true);
        setCaptchaImageUrl(result.captchaImageUrl);
        setCaptchaError(result.message ?? null);
        if (result.message) {
          toast.info(result.message);
        }
        return;
      }

      // Проверяем, требуется ли 2FA
      if (result.requiresTwoFactor) {
        setShow2FADialog(true);
        if (codeSubmittedRef.current) {
          codeSubmittedRef.current = false;
          return;
        }
        setIsVerifying(false);
        if (resendTriggeredRef.current) {
          resendTriggeredRef.current = false;
          setResendCountdownReset((prev) => prev + 1);
          toast.success("Новый код отправлен. Проверьте почту или SMS.");
        } else if (result.message) {
          toast.info(result.message);
        }
        return;
      }

      codeSubmittedRef.current = false;
      setIsVerifying(false);
      setIsCodeAccepted(false);

      if (result.success && result.isValid) {
        toast.success(
          verifyingType === "hh"
            ? "Подключение к hh.ru выполнено успешно"
            : "Данные успешно проверены",
        );

        if (workspaceId) {
          queryClient.invalidateQueries({
            queryKey: trpc.integration.list.queryKey({ workspaceId }),
          });
        }
        handleClose();
      } else {
        setIsCodeAccepted(false);
        toast.error(result.error || "Ошибка проверки данных");
      }
    },
    [
      workspaceId,
      queryClient,
      trpc.integration.list,
      handleClose,
      verifyingType,
    ],
  );

  const handleVerificationError = useCallback(() => {
    setIsVerifying(false);
    toast.error("Ошибка подключения к серверу");
  }, []);

  // Fallback: после отправки 2FA проверяем интеграцию — job сохраняет cookies при успехе
  useEffect(() => {
    if (!isCodeAccepted || !integrations) return;
    const hh = integrations.find((i) => i.type === "hh");
    if (hh?.hasCookies) {
      setIsCodeAccepted(false);
      codeSubmittedRef.current = false;
      setIsVerifying(false);
      toast.success("Подключение к hh.ru выполнено успешно");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: trpc.integration.list.queryKey({ workspaceId }),
        });
      }
      handleClose();
      if (onVerify) {
        setTimeout(() => onVerify("hh"), 500);
      }
    }
  }, [
    isCodeAccepted,
    integrations,
    workspaceId,
    queryClient,
    trpc.integration.list,
    handleClose,
    onVerify,
  ]);

  const onSubmit = async (data: IntegrationFormValues) => {
    if (!workspaceId) {
      toast.error("Workspace не найден");
      return;
    }

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
    };

    if (data.type === "hh") {
      twoFactorCredentialsRef.current = {
        login: data.login ?? "",
        password: data.password ?? "",
        authType: data.authType,
      };
      setIsVerifying(true);
      setVerifyingType("hh");
      toast.info(
        "Проверка данных может занять до 2 минут. Пожалуйста, подождите…",
        { duration: 5000 },
      );

      try {
        await triggerVerifyHHCredentials(
          data.login ?? "",
          data.password,
          workspaceId,
          data.authType,
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
          data.password ?? "", 
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

  const handle2FACodeSubmit = async (code: string) => {
    if (!workspaceId) {
      setTwoFactorError("Workspace не найден");
      return;
    }

    // Берём из формы, fallback — сохранённые при submit (форма может сброситься из-за useEffect/refetch)
    const login =
      form.getValues("login") ??
      twoFactorCredentialsRef.current?.login ??
      "";
    const password =
      form.getValues("password") ??
      twoFactorCredentialsRef.current?.password ??
      "";
    const authType =
      form.getValues("authType") ?? twoFactorCredentialsRef.current?.authType;

    if (!login.trim()) {
      setTwoFactorError("Email или телефон не найден. Попробуйте заново.");
      return;
    }

    if (authType === "password" && !password.trim()) {
      setTwoFactorError("Данные не найдены. Попробуйте заново.");
      return;
    }

    codeSubmittedRef.current = true;
    setIsVerifying(true);
    setTwoFactorError(null);

    try {
      await saveHH2FACodeMutation.mutateAsync({
        workspaceId,
        email: login,
        verificationCode: code,
      });
      setIsCodeAccepted(true);
    } catch (error) {
      codeSubmittedRef.current = false;
      setIsVerifying(false);
      const fallback =
        error instanceof Error ? error.message : String(error);
      setTwoFactorError(fallback || "Ошибка проверки кода. Попробуйте снова.");
    }
  };

  const handleCaptchaSubmit = useCallback(
    async (captcha: string) => {
      if (!workspaceId) return;

      setIsVerifying(true);
      setCaptchaError(null);

      try {
        await saveHHCaptchaMutation.mutateAsync({
          workspaceId,
          captcha,
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [workspaceId, saveHHCaptchaMutation],
  );

  const handleResendCode = useCallback(async () => {
    if (!workspaceId) return;

    resendTriggeredRef.current = true;
    setIsResendingCode(true);
    setTwoFactorError(null);

    try {
      await requestHHResendCodeMutation.mutateAsync({ workspaceId });
    } finally {
      resendTriggeredRef.current = false;
      setIsResendingCode(false);
    }
  }, [workspaceId, requestHHResendCodeMutation]);

  const twoFactorLogin =
    form.getValues("login") ??
    twoFactorCredentialsRef.current?.login ??
    "";

  return {
    form,
    integrationType,
    twoFactorLogin,
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
    show2FADialog,
    setShow2FADialog,
    twoFactorError,
    isCodeAccepted,
    handle2FACodeSubmit,
    handleResendCode,
    isResendingCode,
    resendCountdownReset,
    showCaptchaDialog,
    setShowCaptchaDialog,
    captchaImageUrl,
    captchaError,
    handleCaptchaSubmit,
    isSavingCaptcha: saveHHCaptchaMutation.isPending,
  };
}
