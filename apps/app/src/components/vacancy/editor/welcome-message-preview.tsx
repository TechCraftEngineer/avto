"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qbs-autonaim/ui";
import { Eye, MessageSquare } from "lucide-react";
import { useState } from "react";

interface WelcomeMessagePreviewProps {
  vacancyTitle?: string;
  webChatTemplate?: string;
  telegramTemplate?: string;
}

const DEFAULT_WEB_CHAT_TEMPLATE = `Здравствуйте! 👋

Спасибо, что откликнулись на вакансию "{{vacancyTitle}}".

Я помогу вам пройти первичное собеседование и ответить на ваши вопросы. Расскажите, пожалуйста, немного о себе и вашем опыте работы.

Что вас интересует в этой позиции?`;

const DEFAULT_TELEGRAM_TEMPLATE = `Здравствуйте! 👋

Вы откликнулись на вакансию "{{vacancyTitle}}".

Давайте начнем собеседование. Расскажите о своем опыте работы и почему вас заинтересовала эта вакансия.

Готовы начать?`;

export function WelcomeMessagePreview({
  vacancyTitle,
  webChatTemplate,
  telegramTemplate,
}: WelcomeMessagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Функция для замены переменных в шаблоне
  const renderTemplate = (template: string | undefined, channel: "webChat" | "telegram") => {
    if (!template?.trim()) {
      template = channel === "webChat" ? DEFAULT_WEB_CHAT_TEMPLATE : DEFAULT_TELEGRAM_TEMPLATE;
    }

    return template.replace(/\{\{vacancyTitle\}\}/g, vacancyTitle || "[Название вакансии]");
  };

  const webChatPreview = renderTemplate(webChatTemplate, "webChat");
  const telegramPreview = renderTemplate(telegramTemplate, "telegram");

  return (
    <>
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-linear-to-br from-blue-500/20 to-blue-600/10 p-3">
                <Eye
                  className="size-6 text-blue-600"
                  aria-hidden="true"
                />
              </div>
              <div>
                <CardTitle className="text-lg text-foreground">
                  Превью приветствий
                </CardTitle>
                <CardDescription>
                  Посмотрите, как будут выглядеть ваши приветственные сообщения
                </CardDescription>
              </div>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Eye className="size-4" />
                  Посмотреть превью
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageSquare className="size-5" />
                    Превью приветственных сообщений
                  </DialogTitle>
                  <DialogDescription>
                    Так кандидаты увидят ваши приветственные сообщения
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Веб-чат превью */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      Веб-чат
                    </h3>
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="size-2 rounded-full bg-green-500"></div>
                          Онлайн-чат на сайте
                        </div>
                        <div className="rounded-lg bg-muted p-3">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {webChatPreview}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telegram превью */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      Telegram
                    </h3>
                    <div className="rounded-lg border bg-card p-4 shadow-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="size-2 rounded-full bg-blue-500"></div>
                          Telegram бот
                        </div>
                        <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-3">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {telegramPreview}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Информация о переменных */}
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-4">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Переменные в шаблонах
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li><code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-xs">{"{{vacancyTitle}}"}</code> - Название вакансии</li>
                      <li>Переменные автоматически заменяются при отправке сообщения</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Веб-чат превью (краткое) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Веб-чат
              </h4>
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {webChatPreview}
                </div>
              </div>
            </div>

            {/* Telegram превью (краткое) */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Telegram
              </h4>
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                  {telegramPreview}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}