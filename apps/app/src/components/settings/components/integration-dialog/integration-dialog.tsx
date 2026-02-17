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
import { HHIntegrationSuccessDialog } from "../hh-integration-success-dialog/hh-integration-success-dialog";
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
    workspaceId,
    createMutation,
    updateMutation,
    handleClose,
    onSubmit,
    hhState,
    isVerifyingHH,
    handleHHVerificationResult,
    handleHHVerificationError,
    handleHHCaptchaSubmit,
    handleHH2FACodeSubmit,
    handleHHResendCode,
    isResendingHHCode,
    handleHHSuccessClose,
    isVerifyingKwork,
    handleKworkVerificationResult,
    handleKworkVerificationError,
  } = useIntegrationDialog({
    open,
    selectedType,
    isEditing,
    onClose,
    onVerify,
  });

  const isVerifying = isVerifyingHH || isVerifyingKwork;
  const verifyingType = isVerifyingHH ? "hh" : "kwork";

  return (
    <>
      {open && workspaceId && (
        <VerificationSubscription
          key={workspaceId}
          workspaceId={workspaceId}
          isVerifying={isVerifying}
          verifyingType={verifyingType}
          onResult={
            verifyingType === "hh"
              ? handleHHVerificationResult
              : handleKworkVerificationResult
          }
          onError={
            verifyingType === "hh"
              ? handleHHVerificationError
              : handleKworkVerificationError
          }
        />
      )}

      {/* Диалог капчи для HH.ru */}
      {hhState.step === "captcha" && workspaceId && (
        <HHCaptchaDialog
          open={true}
          onClose={() => handleClose()}
          captchaImageUrl={hhState.captchaImageUrl}
          onSubmitCaptcha={handleHHCaptchaSubmit}
          isLoading={isVerifyingHH}
          error={hhState.error}
        />
      )}

      {/* Диалог успешной интеграции с hh.ru */}
      {hhState.step === "success" && (
        <HHIntegrationSuccessDialog
          open={true}
          onClose={handleHHSuccessClose}
        />
      )}

      {/* Диалог 2FA для HH.ru */}
      {(hhState.step === "twoFactor" || hhState.step === "processing") &&
        workspaceId && (
          <HHVerificationCodeDialog
            open={true}
            onClose={() => handleClose()}
            email={hhState.credentials?.login ?? ""}
            onSubmitCode={handleHH2FACodeSubmit}
            isLoading={isVerifyingHH}
            isCodeAccepted={hhState.step === "processing"}
            error={hhState.error}
            onResendCode={handleHHResendCode}
            isResending={isResendingHHCode}
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
