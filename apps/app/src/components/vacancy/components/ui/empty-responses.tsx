import { Card } from "@qbs-autonaim/ui/card";
import { CardContent } from "@qbs-autonaim/ui/cardcontent";
import { Inbox } from "lucide-react";

export function EmptyResponses() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
              <div className="relative bg-linear-to-br from-primary/20 to-primary/5 rounded-full p-6">
                <Inbox className="h-12 w-12 text-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Пока нет откликов
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Отклики появятся здесь автоматически после парсинга данных с
              платформы. Убедитесь, что интеграция настроена и вакансия активна
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-muted-foreground/80">
              💡 Совет: проверьте настройки интеграции в разделе "Интеграции"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

