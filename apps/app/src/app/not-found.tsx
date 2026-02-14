"use client";

import { Button } from "@qbs-autonaim/ui";
import { ArrowLeft, FileQuestion, Home } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-8">
            <FileQuestion className="h-24 w-24 text-muted-foreground" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tight">404</h1>
            <h2 className="text-2xl font-semibold tracking-tight">
              Страница не найдена
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            К сожалению, запрашиваемая страница не существует или была удалена.
            Проверьте правильность адреса или вернитесь на главную.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              На главную
            </Link>
          </Button>
        </div>

        {/* Additional help */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Если проблема повторяется, свяжитесь с поддержкой
          </p>
        </div>
      </div>
    </div>
  );
}
