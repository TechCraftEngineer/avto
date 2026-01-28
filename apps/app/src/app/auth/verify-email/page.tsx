import { APP_CONFIG } from "@qbs-autonaim/config";
import { AlertCircle, GalleryVerticalEnd, Mail } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmailVerificationForm } from "~/components/auth/email-verification-form";

export const metadata: Metadata = {
  title: "Подтверждение email",
  description: "Подтвердите ваш email адрес",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string | string[] }>;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;

  // Нормализуем email: если массив - берем первый элемент, обрезаем пробелы, пустую строку в undefined
  let email: string | undefined;
  if (params.email) {
    const rawEmail = Array.isArray(params.email)
      ? params.email[0]
      : params.email;
    const trimmedEmail = rawEmail?.trim();
    email = trimmedEmail && trimmedEmail.length > 0 ? trimmedEmail : undefined;
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd
              className="size-4"
              aria-label="Логотип компании"
            />
          </div>
          {APP_CONFIG.name}
        </Link>

        <div className="bg-card text-card-foreground rounded-xl border shadow-sm">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
              <Mail className="text-primary size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight">
                Подтвердите ваш email
              </h1>
              <p className="text-muted-foreground text-sm">
                Для продолжения работы необходимо подтвердить ваш email адрес.
                Мы отправим вам код подтверждения на почту.
              </p>
            </div>

            {email ? (
              <div className="bg-muted w-full rounded-lg p-3">
                <p className="text-sm font-medium">{email}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="size-4" />
                <p className="text-sm">Email не указан</p>
              </div>
            )}

            <EmailVerificationForm email={email} />

            <div className="text-muted-foreground text-xs">
              <p>
                Не получили код? Проверьте папку "Спам" или запросите новый код.
              </p>
            </div>

            <div className="border-t w-full pt-4">
              <Link
                href="/auth/signin"
                className="text-primary text-sm underline-offset-4 hover:underline"
              >
                Вернуться ко входу
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
