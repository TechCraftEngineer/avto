import { Sparkles } from "lucide-react";

export function InterviewGreeting() {
  return (
    <div className="mx-auto mt-8 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Sparkles className="size-6 text-primary" />
      </div>
      <div className="font-semibold text-xl md:text-2xl">Добро пожаловать!</div>
      <div className="mt-1 text-muted-foreground text-xl md:text-2xl">
        Готовы начать интервью?
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        Напишите сообщение, чтобы начать диалог с AI-ассистентом
      </p>
    </div>
  );
}
