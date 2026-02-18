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

  const { latestData, error, data, state } = useInngestSubscription({
    refreshToken,
    key: `${workspaceId}-${verifyingType}`,
    enabled: isVerifying,
  });

  // Логирование состояния подписки
  useEffect(() => {
    console.log(`📡 Subscription state for ${verifyingType}:`, {
      state,
      isVerifying,
      dataLength: data?.length ?? 0,
      hasLatestData: !!latestData,
      latestData,
    });
  }, [state, isVerifying, data, latestData, verifyingType]);

  useEffect(() => {
    if (error && isVerifying) {
      console.error(`❌ Subscription error for ${verifyingType}:`, error);
      onError();
    }
  }, [error, isVerifying, onError, verifyingType]);

  useEffect(() => {
    if (latestData?.topic === "result") {
      console.log(`🔔 WebSocket message received for ${verifyingType}:`, latestData);
      const result = latestData.data as VerificationResult;
      onResult(result);
    } else if (latestData) {
      console.log(`⚠️ Unexpected WebSocket topic for ${verifyingType}:`, latestData.topic, latestData);
    }
  }, [latestData, onResult, verifyingType]);

  return null;
}
