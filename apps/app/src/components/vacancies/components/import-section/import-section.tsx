"use client";

/**
 * Ссылка на установку расширения «Помощник рекрутера».
 * Замените на актуальный URL после публикации в Chrome Web Store.
 */
const EXTENSION_INSTALL_URL =
  "https://chromewebstore.google.com/detail/recruitment-assistant";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@qbs-autonaim/ui/components/card";
import { ExternalLink, Puzzle } from "lucide-react";

/**
 * Информация о расширении «Помощник рекрутера» для импорта вакансий.
 * Ранее использовался веб-интерфейс импорта — он перенесён в _archived/import-section.
 */
export function VacancyImportSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>Импорт вакансий — через расширение</CardTitle>
            <CardDescription>
              Используйте расширение «Помощник рекрутера» для импорта вакансий с
              HeadHunter прямо со страницы работодателя
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-2 font-semibold">Как импортировать вакансии</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">1.</span>
              <span>
                Установите расширение «Помощник рекрутера» в браузер Chrome
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">2.</span>
              <span>
                Откройте страницу вакансий работодателя на hh.ru (активные или
                архивные)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">3.</span>
              <span>
                Отметьте галочками нужные вакансии и нажмите «Загрузить
                выбранные» в расширении
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-foreground">4.</span>
              <span>
                Вакансии появятся в системе с автоматическим отслеживанием
                откликов
              </span>
            </li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={EXTENSION_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Установить расширение в Chrome
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Расширение работает на страницах hh.ru/employer — для активных и
          архивных вакансий. Убедитесь, что интеграция с HeadHunter настроена в
          настройках рабочего пространства.
        </p>
      </CardContent>
    </Card>
  );
}
