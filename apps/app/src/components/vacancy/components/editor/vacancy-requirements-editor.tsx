"use client";

import type { VacancyRequirements } from "@qbs-autonaim/db";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormDescription,
  FormLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@qbs-autonaim/ui";
import { Plus, X } from "lucide-react";
import React from "react";
import type { UseFormReturn } from "react-hook-form";

interface VacancyRequirementsEditorProps<
  T extends { requirements?: VacancyRequirements },
> {
  form: UseFormReturn<T>;
  requirements: VacancyRequirements | null | undefined;
}

type ArrayFieldKey =
  | "mandatory_requirements"
  | "nice_to_have_skills"
  | "tech_stack"
  | "keywords_for_matching";

export function VacancyRequirementsEditor<
  T extends { requirements?: VacancyRequirements },
>({ form, requirements }: VacancyRequirementsEditorProps<T>) {
  const currentRequirements: VacancyRequirements = (form.watch(
    "requirements" as any,
  ) as VacancyRequirements | undefined) ||
    requirements || {
      job_title: "",
      summary: "",
      mandatory_requirements: [],
      nice_to_have_skills: [],
      tech_stack: [],
      experience_years: { min: null, description: "" },
      languages: [],
      location_type: "",
      keywords_for_matching: [],
    };

  const addArrayItem = (field: ArrayFieldKey, value: string) => {
    if (!value.trim()) return;
    const current = currentRequirements[field] || [];
    form.setValue(
      "requirements" as any,
      {
        ...currentRequirements,
        [field]: [...current, value.trim()],
      } as any,
    );
  };

  const removeArrayItem = (field: ArrayFieldKey, index: number) => {
    const current = currentRequirements[field] || [];
    form.setValue(
      "requirements" as any,
      {
        ...currentRequirements,
        [field]: current.filter((_: string, i: number) => i !== index),
      } as any,
    );
  };

  const addLanguage = (language: string, level: string) => {
    if (!language.trim() || !level.trim()) return;
    const current = currentRequirements.languages || [];
    form.setValue(
      "requirements" as any,
      {
        ...currentRequirements,
        languages: [
          ...current,
          { language: language.trim(), level: level.trim() },
        ],
      } as any,
    );
  };

  const removeLanguage = (index: number) => {
    const current = currentRequirements.languages || [];
    form.setValue(
      "requirements" as any,
      {
        ...currentRequirements,
        languages: current.filter(
          (_: { language: string; level: string }, i: number) => i !== index,
        ),
      } as any,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Требования к кандидату</CardTitle>
        <CardDescription>
          Структурированные требования помогут ИИ точнее оценивать кандидатов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Название должности */}
        <div className="space-y-2">
          <FormLabel>Название должности</FormLabel>
          <Input
            value={currentRequirements.job_title}
            onChange={(e) =>
              form.setValue(
                "requirements" as any,
                {
                  ...currentRequirements,
                  job_title: e.target.value,
                } as any,
              )
            }
            placeholder="Например: Senior Frontend Developer"
            className="bg-background"
          />
          <FormDescription>
            Точное название позиции для поиска кандидатов
          </FormDescription>
        </div>

        {/* Краткое описание */}
        <div className="space-y-2">
          <FormLabel>Краткое описание позиции</FormLabel>
          <Textarea
            value={currentRequirements.summary}
            onChange={(e) =>
              form.setValue(
                "requirements" as any,
                {
                  ...currentRequirements,
                  summary: e.target.value,
                } as any,
              )
            }
            placeholder="Краткое описание роли и основных обязанностей..."
            className="min-h-[80px] resize-y bg-background"
          />
          <FormDescription>
            Основная суть позиции в 2-3 предложениях
          </FormDescription>
        </div>

        {/* Обязательные требования */}
        <ArrayFieldEditor
          label="Обязательные требования"
          description="Навыки и опыт, без которых кандидат не подходит"
          items={currentRequirements.mandatory_requirements || []}
          onAdd={(value) => addArrayItem("mandatory_requirements", value)}
          onRemove={(index) => removeArrayItem("mandatory_requirements", index)}
          placeholder="Например: Опыт работы с React от 3 лет"
        />

        {/* Желательные навыки */}
        <ArrayFieldEditor
          label="Желательные навыки"
          description="Навыки, которые будут плюсом, но не обязательны"
          items={currentRequirements.nice_to_have_skills || []}
          onAdd={(value) => addArrayItem("nice_to_have_skills", value)}
          onRemove={(index) => removeArrayItem("nice_to_have_skills", index)}
          placeholder="Например: Знание TypeScript"
        />

        {/* Технологический стек */}
        <ArrayFieldEditor
          label="Технологический стек"
          description="Технологии, с которыми предстоит работать"
          items={currentRequirements.tech_stack || []}
          onAdd={(value) => addArrayItem("tech_stack", value)}
          onRemove={(index) => removeArrayItem("tech_stack", index)}
          placeholder="Например: React, Next.js, PostgreSQL"
        />

        {/* Опыт работы */}
        <div className="space-y-4">
          <FormLabel>Требуемый опыт работы</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal">
                Минимальный опыт (лет)
              </FormLabel>
              <Input
                type="number"
                min="0"
                value={currentRequirements.experience_years?.min ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "requirements" as any,
                    {
                      ...currentRequirements,
                      experience_years: {
                        ...currentRequirements.experience_years,
                        min: e.target.value ? Number(e.target.value) : null,
                      },
                    } as any,
                  )
                }
                placeholder="3"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal">
                Описание опыта
              </FormLabel>
              <Input
                value={currentRequirements.experience_years?.description ?? ""}
                onChange={(e) =>
                  form.setValue(
                    "requirements" as any,
                    {
                      ...currentRequirements,
                      experience_years: {
                        ...currentRequirements.experience_years,
                        description: e.target.value,
                      },
                    } as any,
                  )
                }
                placeholder="Коммерческая разработка"
                className="bg-background"
              />
            </div>
          </div>
          <FormDescription>
            Укажите минимальный опыт и его характер
          </FormDescription>
        </div>

        {/* Языки */}
        <LanguageFieldEditor
          languages={currentRequirements.languages || []}
          onAdd={addLanguage}
          onRemove={removeLanguage}
        />

        {/* Тип локации */}
        <div className="space-y-2">
          <FormLabel>Формат работы</FormLabel>
          <Select
            value={currentRequirements.location_type}
            onValueChange={(value) =>
              form.setValue(
                "requirements" as any,
                {
                  ...currentRequirements,
                  location_type: value,
                } as any,
              )
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Выберите формат работы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Удаленная работа</SelectItem>
              <SelectItem value="office">Офис</SelectItem>
              <SelectItem value="hybrid">Гибридный формат</SelectItem>
              <SelectItem value="flexible">Гибкий график</SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>Где будет работать кандидат</FormDescription>
        </div>

        {/* Ключевые слова */}
        <ArrayFieldEditor
          label="Ключевые слова для поиска"
          description="Слова, по которым можно найти подходящих кандидатов"
          items={currentRequirements.keywords_for_matching || []}
          onAdd={(value) => addArrayItem("keywords_for_matching", value)}
          onRemove={(index) => removeArrayItem("keywords_for_matching", index)}
          placeholder="Например: frontend, react, javascript"
        />
      </CardContent>
    </Card>
  );
}

interface ArrayFieldEditorProps {
  label: string;
  description: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
}

function ArrayFieldEditor({
  label,
  description,
  items,
  onAdd,
  onRemove,
  placeholder,
}: ArrayFieldEditorProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleAdd = () => {
    onAdd(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <FormLabel>{label}</FormLabel>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-background"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          aria-label="Добавить требование"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, itemIndex) => (
            <div
              key={item}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(itemIndex)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Удалить требование ${itemIndex + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <FormDescription>{description}</FormDescription>
    </div>
  );
}

interface LanguageFieldEditorProps {
  languages: Array<{ language: string; level: string }>;
  onAdd: (language: string, level: string) => void;
  onRemove: (index: number) => void;
}

function LanguageFieldEditor({
  languages,
  onAdd,
  onRemove,
}: LanguageFieldEditorProps) {
  const [language, setLanguage] = React.useState("");
  const [level, setLevel] = React.useState("");

  const handleAdd = () => {
    onAdd(language, level);
    setLanguage("");
    setLevel("");
  };

  return (
    <div className="space-y-3">
      <FormLabel>Знание языков</FormLabel>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
        <Input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Язык (например: Английский)"
          className="bg-background"
        />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Уровень" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A1">A1 - Начальный</SelectItem>
            <SelectItem value="A2">A2 - Элементарный</SelectItem>
            <SelectItem value="B1">B1 - Средний</SelectItem>
            <SelectItem value="B2">B2 - Выше среднего</SelectItem>
            <SelectItem value="C1">C1 - Продвинутый</SelectItem>
            <SelectItem value="C2">C2 - Свободное владение</SelectItem>
            <SelectItem value="Native">Родной</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={!language.trim() || !level}
          aria-label="Добавить язык"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {languages.length > 0 && (
        <div className="space-y-2">
          {languages.map((lang, index) => (
            <div
              key={`${lang.language}-${lang.level}-${index}`}
              className="flex items-center justify-between bg-secondary text-secondary-foreground px-3 py-2 rounded-md"
            >
              <span className="text-sm">
                {lang.language} — {lang.level}
              </span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="hover:text-destructive transition-colors"
                aria-label={`Удалить язык ${lang.language}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <FormDescription>Требования к знанию иностранных языков</FormDescription>
    </div>
  );
}
