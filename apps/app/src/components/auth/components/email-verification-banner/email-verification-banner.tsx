"use client";

import { paths } from "@qbs-autonaim/config";
import { Alert, AlertDescription, AlertTitle } from "@qbs-autonaim/ui";
import { Button } from "@qbs-autonaim/ui";
import { Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Session } from "~/types/session";

interface EmailVerificationBannerProps {
  session: Session;
}

export function EmailVerificationBanner({
  session,
}: EmailVerificationBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(() => {
    // Проверяем localStorage при инициализации
    if (typeof window !== "undefined") {
      return localStorage.getItem("email-verification-dismissed") === "true";
    }
    return false;
  });

  // Проверяем, подтвержден ли email
  const isEmailVerified = session.user.emailVerified;

  // Если email подтвержден или баннер закрыт - не показываем
  if (isEmailVerified || dismissed) {
    return null;
  }

  const handleVerify = () => {
    router.push(
      `${paths.auth.verifyEmail}?email=${encodeURIComponent(session.user.email)}`,
    );
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Сохраняем в localStorage, чтобы не показывать снова в этой сессии
    localStorage.setItem("email-verification-dismissed", "true");
  };

  return (
    <Alert className="relative mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
      <Mail className="size-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-900 dark:text-amber-100">
        Подтвердите ваш email
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200">
        Для полного доступа ко всем функциям платформы подтвердите ваш email
        адрес.
      </AlertDescription>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleVerify} variant="default">
          Подтвердить email
        </Button>
        <Button
          size="sm"
          onClick={handleDismiss}
          variant="ghost"
          className="text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900"
        >
          Позже
        </Button>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-2 top-2 size-6 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900"
        onClick={handleDismiss}
      >
        <X className="size-4" />
        <span className="sr-only">Закрыть</span>
      </Button>
    </Alert>
  );
}
