"use client";

import { APP_CONFIG } from "@qbs-autonaim/config";
import {
  Button,
  Input,
  Label,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@qbs-autonaim/ui";
import { Building2, HelpCircle, Loader2 } from "lucide-react";
import type { FormEvent } from "react";

interface OrganizationFormProps {
  name: string;
  slug: string;
  description: string;
  website: string;
  isGeneratingSlug: boolean;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onWebsiteChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function OrganizationForm({
  name,
  slug,
  description,
  website,
  isPending,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onWebsiteChange,
  onSubmit,
}: OrganizationFormProps) {
  const appDomain = new URL(APP_CONFIG.url).host;

  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
          <Building2 className="size-8 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold">Создайте организацию</h1>
        <p className="text-muted-foreground mt-2">
          Настройте организацию для управления командами и рабочими
          пространствами
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Название организации</Label>
          <Input
            id="name"
            name="organization-name"
            placeholder="Моя компания"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            maxLength={100}
            autoFocus
            autoComplete="organization"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="slug">Слаг организации</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground inline-flex"
                    aria-label="Информация о слаге"
                  >
                    <HelpCircle className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Слаг — это уникальный идентификатор для адреса. Например,
                    для организации "Моя Компания" слаг может быть
                    "moya-kompaniya". Используется только латиница, цифры и
                    дефисы.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-stretch overflow-hidden rounded-md border">
            <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
              {appDomain}/orgs/
            </div>
            <Input
              id="slug"
              name="organization-slug"
              placeholder="пример-организации…"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              required
              maxLength={50}
              pattern="[a-z0-9-]+"
              title="Только строчные буквы, цифры и дефис"
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Вы сможете изменить это позже в настройках организации.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Описание (опционально)</Label>
          <Textarea
            id="description"
            name="organization-description"
            placeholder="Краткое описание организации…"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Веб-сайт (опционально)</Label>
          <Input
            id="website"
            name="organization-website"
            type="url"
            placeholder="https://пример.рф…"
            value={website}
            onChange={(e) => onWebsiteChange(e.target.value)}
            maxLength={200}
            autoComplete="url"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending && (
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          )}
          Создать организацию
        </Button>
      </form>
    </>
  );
}
