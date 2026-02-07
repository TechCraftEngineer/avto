import { Button } from "@qbs-autonaim/ui/button";
import { Card, CardContent } from "@qbs-autonaim/ui/card";
import { Download, Inbox, RefreshCw } from "lucide-react";

interface EmptyResponsesProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function EmptyResponses({
  onRefresh,
  isRefreshing = false,
}: EmptyResponsesProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-6 max-w-lg px-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-6">
                <Inbox className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Отклики ещё не загружены
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Вакансия успешно импортирована, но отклики нужно загрузить
              отдельно. Нажмите кнопку ниже, чтобы начать загрузку откликов с
              платформы
            </p>
          </div>

          {onRefresh && (
            <div className="flex flex-col items-center gap-3 pt-2">
              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                size="lg"
                className="gap-2 min-w-[200px]"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Загрузить отклики
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground/70">
                Это может занять несколько минут
              </p>
            </div>
          )}

          <div className="pt-2 space-y-2 border-t">
            <p className="text-xs text-muted-foreground/80 font-medium">
              💡 Что произойдёт дальше:
            </p>
            <ul className="text-xs text-muted-foreground/70 space-y-1 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Система загрузит все отклики с платформы HeadHunter</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Отклики появятся в таблице и будут доступны для анализа
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Вы сможете использовать AI для оценки и приоритизации
                  кандидатов
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
