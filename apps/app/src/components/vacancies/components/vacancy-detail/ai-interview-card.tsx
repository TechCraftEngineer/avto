import { Button } from "@qbs-autonaim/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import {
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconMessage,
  IconRobot,
  IconSparkles,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AIInterviewCardProps {
  interviewLink: {
    url: string;
  };
  vacancyTitle: string;
  vacancyDescription?: string | null;
}

/**
 * Карточка с AI-интервью для кандидатов
 * Позволяет быстро скопировать ссылку или готовый шаблон для публикации
 */
export function AIInterviewCard({
  interviewLink,
  vacancyTitle,
  vacancyDescription,
}: AIInterviewCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const copyLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyLinkTimeoutRef.current) {
        clearTimeout(copyLinkTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink.url);
      setCopiedLink(true);
      toast.success("Ссылка скопирована в буфер обмена");
      copyLinkTimeoutRef.current = setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const handleCopyTemplate = async () => {
    const template = `${vacancyDescription || vacancyTitle}

📋 Для отклика пройдите короткое AI-интервью (10–15 минут):
${interviewLink.url}

✅ После успешного прохождения интервью мы свяжемся с вами в течение 2-3 рабочих дней.

Удачи! 🚀`;

    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(true);
      toast.success("Шаблон скопирован в буфер обмена");
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      toast.error("Не удалось скопировать шаблон");
    }
  };

  return (
    <Card className="border-primary/30 bg-linear-to-br from-primary/5 to-primary/10 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-primary/20 rounded-full p-1.5">
            <IconRobot className="size-4 text-primary" />
          </div>
          <CardTitle className="text-sm font-semibold">
            AI-интервью для кандидатов
          </CardTitle>
        </div>
        <CardDescription className="text-xs leading-relaxed">
          Отправьте эту ссылку кандидатам с внешних площадок для автоматической
          предварительной оценки
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ссылка */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <IconSparkles className="size-3 text-primary" />
            Ссылка на интервью
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border-2 border-primary/20 bg-background px-3 py-2 font-mono text-[11px] truncate flex items-center shadow-sm">
              {interviewLink.url}
            </div>
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              size="icon"
              className="h-9 w-9 shrink-0 shadow-sm"
              title="Скопировать ссылку"
            >
              {copiedLink ? (
                <IconCheck className="size-4 text-green-600" />
              ) : (
                <IconCopy className="size-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Кнопка копирования шаблона */}
        <Button
          onClick={handleCopyTemplate}
          variant="outline"
          size="sm"
          className="w-full h-10 justify-between text-xs font-semibold px-3 border-primary/30 hover:bg-primary/10"
        >
          <span className="flex items-center gap-2">
            <IconMessage className="size-4" />
            Скопировать готовый шаблон для публикации
          </span>
          {copiedTemplate ? (
            <IconCheck className="size-4 text-green-600" />
          ) : (
            <IconArrowRight className="size-4" />
          )}
        </Button>

        {/* Подсказка */}
        <div className="pt-2 border-t border-primary/20">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Совет:</span>{" "}
            Используйте шаблон при публикации вакансии на внешних площадках,
            чтобы автоматизировать первичный отбор кандидатов
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
