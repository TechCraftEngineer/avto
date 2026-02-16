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
} from "@qbs-autonaim/ui";
import { Briefcase } from "lucide-react";
import { HHCaptchaDialog } from "../hh-captcha-dialog/hh-captcha-dialog";
import { HHVerificationCodeDialog } from "../hh-verification-code-dialog/hh-verification-code-dialog";
import { IntegrationFormFields } from "./integration-form-fields";
import { useIntegrationDialog } from "./use-integration-dialog";
import { VerificationSubscription } from "./verification-subscription";

interface IntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  selectedType: string | null;
  isEditing: boolean;
  onVerify?: (type: string) => void;
}

export function IntegrationDialog({
  open,
  onClose,
  selectedType,
  isEditing,
  onVerify,
}: IntegrationDialogProps) {
  const {
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
    show2FADialog,
    setShow2FADialog,
    twoFactorError,
    handle2FACodeSubmit,
    handleResendCode,
    isResendingCode,
    resendCountdownReset,
    showCaptchaDialog,
    setShowCaptchaDialog,
    captchaImageUrl,
    captchaError,
    handleCaptchaSubmit,
  } = useIntegrationDialog({
    open,
    selectedType,
    isEditing,
    onClose,
    onVerify,
  });

  return (
    <>
      {open && workspaceId && (
        <VerificationSubscription
          key={workspaceId}
          workspaceId={workspaceId}
          isVerifying={isVerifying}
          verifyingType={verifyingType}
          onResult={handleVerificationResult}
          onError={handleVerificationError}
        />
      )}

      {/* Диалог капчи для HH.ru */}
      {showCaptchaDialog && workspaceId && (
        <HHCaptchaDialog
          open={showCaptchaDialog}
          onClose={() => setShowCaptchaDialog(false)}
          captchaImageUrl={captchaImageUrl}
          onSubmitCaptcha={handleCaptchaSubmit}
          isLoading={isVerifying}
          error={captchaError}
        />
      )}

      {/* Диалог 2FA для HH.ru */}
      {show2FADialog && workspaceId && (
        <HHVerificationCodeDialog
          open={show2FADialog}
          onClose={() => setShow2FADialog(false)}
          email={form.getValues("login") ?? ""}
          onSubmitCode={handle2FACodeSubmit}
          isLoading={isVerifying}
          error={twoFactorError}
          onResendCode={handleResendCode}
          isResending={isResendingCode}
          resendCountdownReset={resendCountdownReset}
        />
      )}

      <Dialog
        open={open}
        onOpenChange={(isOpen: boolean) => !isOpen && handleClose()}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              {isEditing ? "Редактировать" : "Подключить"} интеграцию
            </DialogTitle>
            <DialogDescription className="text-base">
              {isEditing
                ? "Обновите данные интеграции для продолжения работы"
                : "Подключите внешний сервис для автоматизации работы с вакансиями и откликами"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pt-2"
            >
              <IntegrationFormFields
                control={form.control}
                integrationType={integrationType}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((p) => !p)}
                isEditing={isEditing}
                authType={form.watch("authType")}
              />

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-11"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    isVerifying
                  }
                  className="h-11"
                >
                  {isVerifying
                    ? "Проверка данных…"
                    : isEditing
                      ? updateMutation.isPending
                        ? "Обновление…"
                        : "Обновить"
                      : createMutation.isPending
                        ? "Подключение…"
                        : "Подключить"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
