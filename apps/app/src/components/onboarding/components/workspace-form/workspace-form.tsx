"use client";

import { APP_CONFIG, env } from "@qbs-autonaim/config";
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
import { Briefcase, HelpCircle, Loader2 } from "lucide-react";
import type { FormEvent } from "react";

interface WorkspaceFormProps {
  organizationSlug: string;
  name: string;
  slug: string;
  description: string;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSkip: () => void;
}

interface TooltipHelpProps {
  content: string;
  label?: string;
}

function TooltipHelp({ content, label = "Узнать больше" }: TooltipHelpProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="cursor-help border-b border-dotted border-current"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FormHeaderProps {
  title: string;
  description: string;
  tooltipContent: string;
}

function FormHeader({ title, description, tooltipContent }: FormHeaderProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-sm">
        <Briefcase className="size-8 text-primary" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">
        {description} <TooltipHelp content={tooltipContent} />
      </p>
    </div>
  );
}

interface NameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function NameField({ value, onChange }: NameFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="workspace-name">Название пространства</Label>
      <Input
        id="workspace-name"
        name="workspace-name"
        placeholder="Основной проект…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={100}
        autoFocus
        autoComplete="off"
      />
    </div>
  );
}

interface SlugFieldProps {
  organizationSlug: string;
  value: string;
  onChange: (value: string) => void;
}

function SlugField({ organizationSlug, value, onChange }: SlugFieldProps) {
  const appDomain = new URL(APP_CONFIG.url).host;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor="workspace-slug">Адрес пространства</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground inline-flex"
                aria-label="Информация об адресе"
              >
                <HelpCircle className="size-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Адрес — это уникальный идентификатор для URL. Например, для
                пространства "Основной проект" адрес может быть
                "osnovnoy-proekt". Используется только латиница, цифры и дефисы.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-stretch overflow-hidden rounded-md border">
        <div className="bg-muted text-muted-foreground flex items-center px-3 text-sm">
          {appDomain}/orgs/{organizationSlug}/workspaces/
        </div>
        <Input
          id="workspace-slug"
          name="workspace-slug"
          placeholder="osnovnoy-proekt…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
        Вы сможете изменить это позже в настройках пространства.
      </p>
    </div>
  );
}

interface DescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function DescriptionField({ value, onChange }: DescriptionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="workspace-description">Описание (опционально)</Label>
      <Textarea
        id="workspace-description"
        name="workspace-description"
        placeholder="Краткое описание пространства…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={500}
        className="resize-none"
      />
    </div>
  );
}

interface FormActionsProps {
  isPending: boolean;
  onSkip: () => void;
}

function FormActions({ isPending, onSkip }: FormActionsProps) {
  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        onClick={onSkip}
        disabled={isPending}
      >
        Пропустить
      </Button>
      <Button type="submit" className="flex-1" disabled={isPending}>
        {isPending && (
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        )}
        Создать пространство
      </Button>
    </div>
  );
}

export function WorkspaceForm({
  organizationSlug,
  name,
  slug,
  description,
  isPending,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onSubmit,
  onSkip,
}: WorkspaceFormProps) {
  return (
    <>
      <FormHeader
        title="Создайте пространство"
        description="Настройте общее пространство для управления проектами с вашей командой."
        tooltipContent={`Что такое рабочее пространство? Это изолированная среда внутри организации для работы над конкретным проектом или направлением. В каждом пространстве могут быть свои участники, настройки и данные.\n\n[Подробнее в документации](${env.NEXT_PUBLIC_DOCS_URL}/workspaces)`}
      />

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border bg-card p-8 shadow-lg backdrop-blur-sm"
      >
        <NameField value={name} onChange={onNameChange} />
        <SlugField
          organizationSlug={organizationSlug}
          value={slug}
          onChange={onSlugChange}
        />
        <DescriptionField value={description} onChange={onDescriptionChange} />
        <FormActions isPending={isPending} onSkip={onSkip} />
      </form>
    </>
  );
}
