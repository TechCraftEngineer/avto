import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui";
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconMessage,
  IconRobot,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";

interface AIInterviewCardProps {
  interviewLink: {
    url: string;
  };
  vacancyTitle: string;
  vacancyDescription?: string | null;
}

export function AIInterviewCard({
  interviewLink,
  vacancyTitle,
  vacancyDescription,
}: AIInterviewCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink.url);
      setCopiedLink(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleCopyTemplate = async () => {
    const template = `${vacancyDescription || vacancyTitle}

Для отклика пройдите короткое AI-интервью (10–15 минут):
${interviewLink.url}

После прохождения интервью мы свяжемся с вами при положительном решении.`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(true);
      toast.success("Шаблон скопирован");
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-1">
          <IconRobot className="size-4 text-primary" />
          <CardTitle className="text-sm">AI-интервью</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Ссылка для кандидатов из внешних источников
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 rounded-md border bg-background px-3 py-1.5 font-mono text-[11px] truncate flex items-center shadow-sm">
            {interviewLink.url}
          </div>
          <Button
            onClick={handleCopyLink}
            variant="secondary"
            size="icon"
            className="h-8 w-8 shrink-0"
          >
            {copiedLink ? (
              <IconCheck className="size-3.5 text-green-600" />
            ) : (
              <IconCopy className="size-3.5" />
            )}
          </Button>
        </div>
        <Button
          onClick={handleCopyTemplate}
          variant="ghost"
          size="sm"
          className="w-full h-8 justify-between text-xs px-2"
        >
          <span className="flex items-center gap-2">
            <IconMessage className="size-3.5" />
            Копировать шаблон
          </span>
          {copiedTemplate ? (
            <IconCheck className="size-3.5" />
          ) : (
            <IconArrowRight className="size-3.5" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
