import { Card, CardContent } from "@qbs-autonaim/ui";
import { User } from "lucide-react";

export function EmptyResponses() {
  return (
    <Card>
      <CardContent className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Нет откликов</h3>
          <p className="text-sm text-muted-foreground">
            Отклики появятся после парсинга
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
