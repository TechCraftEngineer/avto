import { Card, CardContent, CardHeader } from "@qbs-autonaim/ui/card";

export function VacancySkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {/* ЛЕВАЯ КОЛОНКА - СКЕЛЕТОН */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col gap-4">
          {/* Бейджи */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
            <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          </div>

          {/* Заголовок */}
          <div className="space-y-2">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>

          {/* Кнопка */}
          <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        </div>

        {/* Карточка описания */}
        <Card className="border-l-4 border-l-primary/50 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-muted/50 pb-4 border-b">
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="pt-6 space-y-2">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>

        {/* Карточка требований */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4 border-b">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>

      {/* ПРАВАЯ КОЛОНКА - СКЕЛЕТОН */}
      <div className="space-y-6">
        {/* Кнопка импорта */}
        <div className="h-10 w-full bg-muted animate-pulse rounded" />

        {/* Карточка AI-интервью */}
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
            <div className="h-3 w-40 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>

        {/* Карточка статистики */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-5 w-8 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>

        {/* Карточка шортлиста */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
