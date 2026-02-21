"use client";

import { Button } from "@qbs-autonaim/ui/components/button";
import { ArrowLeft, Home, ShieldX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-8 shadow-lg shadow-destructive/5">
            <ShieldX className="h-24 w-24 text-destructive" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold tracking-tight">403</h1>
            <h2 className="text-2xl font-semibold tracking-tight">
              Доступ запрещён
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            У вас нет прав для просмотра этой страницы. Если вы считаете, что
            это ошибка, обратитесь к администратору системы.
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
            Нужна помощь? Свяжитесь с поддержкой для получения доступа
          </p>
        </div>
      </div>
    </div>
  );
}
