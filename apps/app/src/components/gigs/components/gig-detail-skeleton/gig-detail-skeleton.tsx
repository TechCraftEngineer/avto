import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@qbs-autonaim/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function GigDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl py-4 px-4 sm:py-6 sm:px-6">
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-2 min-w-0 flex-1">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function GigNotFound({
  orgSlug,
  workspaceSlug,
}: {
  orgSlug: string;
  workspaceSlug: string;
}) {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 sm:py-16 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Задание не найдено</CardTitle>
          <CardDescription>
            Задание, которое вы ищете, не существует или было удалено
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Button asChild className="min-h-[44px] touch-manipulation">
            <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}>
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Вернуться к заданиям
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function GigError({
  orgSlug,
  workspaceSlug,
  error,
}: {
  orgSlug: string;
  workspaceSlug: string;
  error: Error | null;
}) {
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4 sm:py-16 sm:px-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ошибка загрузки</CardTitle>
          <CardDescription>
            Не удалось загрузить задание. Попробуйте обновить страницу
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {error?.message && (
            <p className="text-sm text-muted-foreground text-center">
              {error.message}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              asChild
              className="min-h-[44px] touch-manipulation"
            >
              <Link href={`/orgs/${orgSlug}/workspaces/${workspaceSlug}/gigs`}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />К
                заданиям
              </Link>
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="min-h-[44px] touch-manipulation"
            >
              Обновить страницу
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { GigDetailSkeleton, GigNotFound, GigError };
