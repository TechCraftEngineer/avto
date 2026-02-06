import { Sparkles } from "lucide-react";
import type { SupportedEntityType, WelcomeMessageConfig } from "~/app/api/interview/chat/stream/strategies/types";

interface InterviewGreetingProps {
  entityType?: SupportedEntityType;
  customMessage?: WelcomeMessageConfig;
}

function getDefaultMessage(entityType: SupportedEntityType): WelcomeMessageConfig {
  if (entityType === "gig") {
    return {
      title: "Добро пожаловать!",
      subtitle: "Готовы обсудить это задание?",
      placeholder: "Расскажите о вашем опыте…",
      greeting: "Напишите сообщение, чтобы начать разговор о задании",
    };
  }
  
  // vacancy по умолчанию
  return {
    title: "Добро пожаловать!",
    subtitle: "Ответьте на несколько вопросов о себе",
    placeholder: "Расскажите о себе…",
    greeting: "Напишите сообщение, чтобы начать разговор",
  };
}

export function InterviewGreeting({ entityType = "vacancy", customMessage }: InterviewGreetingProps) {
  const message = customMessage || getDefaultMessage(entityType);
  
  return (
    <div className="mx-auto mt-8 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Sparkles className="size-6 text-primary" aria-hidden="true" />
      </div>
      <div className="font-semibold text-xl md:text-2xl">{message.title}</div>
      <div className="mt-1 text-muted-foreground text-xl md:text-2xl">
        {message.subtitle}
      </div>
      <p className="mt-4 text-muted-foreground text-sm">
        {message.greeting}
      </p>
      {message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-muted-foreground text-xs font-medium">Примеры вопросов:</p>
          <ul className="space-y-1.5">
            {message.suggestedQuestions.map((question, idx) => (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
