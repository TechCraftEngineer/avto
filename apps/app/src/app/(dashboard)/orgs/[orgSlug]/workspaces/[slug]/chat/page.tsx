import { PageHeader } from "~/components/layout";

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Чаты"
          description="Обмен сообщениями с участниками"
          tooltipContent="[Подробнее в документации](https://docs.hh.qbs.ru/chat)"
        />
        <div className="flex h-full items-center justify-center p-4 w-full">
          <div className="text-center text-muted-foreground">
            <p className="text-sm md:text-base">
              Выберите чат для начала переписки
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
