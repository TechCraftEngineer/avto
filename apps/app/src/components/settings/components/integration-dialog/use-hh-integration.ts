/**
 * Упрощённый хук для интеграции с hh.ru
 * Использует машину состояний вместо множества ref'ов
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useReducer } from "react";
import { toast } from "sonner";
import { triggerVerifyHHCredentials } from "~/actions/integration";
import { useTRPC } from "~/trpc/react";
import {
  hhIntegrationReducer,
  initialHHIntegrationState,
} from "./hh-integration-state";
import type { VerificationResult } from "./verification-subscription";

interface UseHHIntegrationProps {
  workspaceId: string;
}

export function useHHIntegration({ workspaceId }: UseHHIntegrationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(
    hhIntegrationReducer,
    initialHHIntegrationState,
  );

  const saveHH2FACodeMutation = useMutation(
    trpc.integration.saveHH2FACode.mutationOptions(),
  );

  const saveHHCaptchaMutation = useMutation(
    trpc.integration.saveHHCaptcha.mutationOptions(),
  );

  const requestHHResendCodeMutation = useMutation(
    trpc.integration.requestHHResendCode.mutationOptions({
      onSuccess: () => {
        toast.success("Новый код отправлен. Проверьте почту или SMS.");
      },
      onError: (err) => {
        toast.error(err.message || "Ошибка повторной отправки");
      },
    }),
  );

  const startVerification = useCallback(
    async (login: string, password: string, authType: "password" | "code") => {
      if (!login.trim()) {
        toast.error("Электронная почта или телефон обязательны");
        return;
      }

      if (authType === "password" && !password.trim()) {
        toast.error("Пароль обязателен");
        return;
      }

      dispatch({
        type: "START_VERIFICATION",
        credentials: { login, password, authType },
      });

      toast.info(
        "Проверка данных может занять до 2 минут. Пожалуйста, подождите…",
        { duration: 5000 },
      );

      try {
        await triggerVerifyHHCredentials(
          login,
          password,
          workspaceId,
          authType,
        );
      } catch (error) {
        dispatch({
          type: "ERROR",
          error:
            error instanceof Error ? error.message : "Ошибка отправки запроса",
        });
        toast.error(
          error instanceof Error ? error.message : "Ошибка отправки запроса",
        );
      }
    },
    [workspaceId],
  );

  const handleVerificationResult = useCallback(
    (result: VerificationResult) => {
      console.log("🔍 HH Verification Result:", result);

      // Капча
      if (result.captchaRequired && result.captchaImageUrl) {
        dispatch({
          type: "REQUIRE_CAPTCHA",
          imageUrl: result.captchaImageUrl,
          message: result.message,
        });
        if (result.message) {
          toast.info(result.message);
        }
        return;
      }

      // 2FA
      if (result.requiresTwoFactor) {
        dispatch({ type: "REQUIRE_2FA", message: result.message });
        if (result.message) toast.info(result.message);
        return;
      }

      // Успех
      if (result.success === true && result.isValid === true) {
        console.log("✅ Успешная авторизация HH");
        dispatch({ type: "SUCCESS" });
        queryClient.invalidateQueries({
          queryKey: trpc.integration.list.queryKey({ workspaceId }),
        });
        toast.success("Интеграция с HeadHunter успешно настроена");
        return;
      }

      // Ошибка
      if (
        result.error ||
        (result.success === false && result.isValid === false)
      ) {
        const errorMsg = result.error || "Ошибка проверки данных";
        console.error("❌ Ошибка HH верификации:", errorMsg);
        dispatch({
          type: "ERROR",
          error: errorMsg,
        });
        toast.error(errorMsg);
        return;
      }

      // Неожиданный результат
      console.warn("⚠️ Неожиданный результат верификации HH:", result);
    },
    [workspaceId, queryClient, trpc.integration.list],
  );

  const submitCaptcha = useCallback(
    async (captcha: string) => {
      try {
        await saveHHCaptchaMutation.mutateAsync({
          workspaceId,
          captcha,
        });
        // После капчи возвращаемся к проверке
        dispatch({
          type: "START_VERIFICATION",
          credentials: state.credentials,
        });
      } catch (error) {
        dispatch({
          type: "ERROR",
          error:
            error instanceof Error ? error.message : "Ошибка проверки капчи",
        });
      }
    },
    [workspaceId, state.credentials, saveHHCaptchaMutation],
  );

  const submit2FACode = useCallback(
    async (code: string) => {
      if (!state.credentials?.login) {
        dispatch({
          type: "ERROR",
          error: "Электронная почта или телефон не найден. Попробуйте заново.",
        });
        return;
      }

      dispatch({ type: "CODE_SUBMITTED" });

      try {
        await saveHH2FACodeMutation.mutateAsync({
          workspaceId,
          email: state.credentials.login,
          verificationCode: code,
        });
        // Успех обработается через handleVerificationResult
      } catch (error) {
        dispatch({
          type: "ERROR",
          error:
            error instanceof Error
              ? error.message
              : "Ошибка проверки кода. Попробуйте снова.",
        });
      }
    },
    [workspaceId, state.credentials, saveHH2FACodeMutation],
  );

  const resendCode = useCallback(async () => {
    try {
      await requestHHResendCodeMutation.mutateAsync({ workspaceId });
    } catch {
      // Ошибка обработана в onError мутации
    }
  }, [workspaceId, requestHHResendCodeMutation]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    startVerification,
    handleVerificationResult,
    submitCaptcha,
    submit2FACode,
    resendCode,
    reset,
    isLoading:
      state.step === "verifying" ||
      state.step === "processing" ||
      state.step === "captcha" ||
      state.step === "twoFactor" ||
      state.step === "success" || // Оставляем подписку активной до закрытия диалога
      saveHHCaptchaMutation.isPending ||
      saveHH2FACodeMutation.isPending,
    isResending: requestHHResendCodeMutation.isPending,
  };
}
