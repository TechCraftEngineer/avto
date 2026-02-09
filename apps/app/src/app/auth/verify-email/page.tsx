import { APP_CONFIG } from "@qbs-autonaim/config";
import { GalleryVerticalEnd } from "lucide-react";
import type { Metadata } from "next";
import { EmailVerificationForm } from "~/components/auth";

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
      <div className="flex w-full max-w-xs flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd
              className="size-4"
              aria-label="Логотип компании"
            />
          </div>
          {APP_CONFIG.name}
        </a>
        <EmailVerificationForm email={email} />
      </div>
    </div>
  );
}
