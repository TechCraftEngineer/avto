import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@qbs-autonaim/ui/components/empty";
import { MessageCircle } from "lucide-react";
import { PageHeader } from "~/components/layout";
import { env } from "~/env";

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2 px-4 lg:px-6">
        <PageHeader
          title="Чаты"
          description="Обмен сообщениями с участниками"
          tooltipContent={`Здесь вы можете обмениваться сообщениями с кандидатами и участниками проектов. Чаты сохраняются и привязаны к конкретным вакансиям или заданиям.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/ai-assistant/chat)`}
        />
        <div className="flex h-full items-center justify-center p-6 w-full">
          <Empty className="border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageCircle className="size-6" />
              </EmptyMedia>
              <EmptyDescription>
                Выберите чат для начала переписки
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </div>
    </div>
  );
}
