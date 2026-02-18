"use client";

import { useInngestSubscription } from "@bunworks/inngest-realtime/hooks";
import { useCallback, useEffect } from "react";
import {
  fetchVerifyHHCredentialsToken,
  fetchVerifyKworkCredentialsToken,
} from "~/actions/integration";

export interface VerificationResult {
  success?: boolean;
  isValid?: boolean;
  error?: string;
  requiresTwoFactor?: boolean;
  twoFactorType?: "email" | "phone";
  message?: string;
  captchaRequired?: boolean;
  captchaImageUrl?: string;
}

interface VerificationSubscriptionProps {
  workspaceId: string;
  isVerifying: boolean;
  verifyingType: "hh" | "kwork";
  onResult: (result: VerificationResult) => void;
  onError: () => void;
}

export function VerificationSubscription({
  workspaceId,
  isVerifying,
  verifyingType,
  onResult,
  onError,
}: VerificationSubscriptionProps) {
  const refreshToken = useCallback(
    () =>
      verifyingType === "kwork"
        ? fetchVerifyKworkCredentialsToken(workspaceId)
        : fetchVerifyHHCredentialsToken(workspaceId),
    [workspaceId, verifyingType],
  );

  const { latestData, error } = useInngestSubscription({
    refreshToken,
    key: `${workspaceId}-${verifyingType}`,
    enabled: true,
  });

  useEffect(() => {
    if (error && isVerifying) {
      onError();
    }
  }, [error, isVerifying, onError]);

  useEffect(() => {
    if (latestData?.topic === "result") {
      const result = latestData.data as VerificationResult;
      onResult(result);
    }
  }, [latestData, onResult]);

  return null;
}
