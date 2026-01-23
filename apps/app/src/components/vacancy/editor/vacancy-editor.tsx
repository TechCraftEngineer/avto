"use client";

import { Button, Input, Label, Separator, Textarea } from "@qbs-autonaim/ui";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

interface VacancyData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  conditions: string[];
  salary?: {
    from?: number;
    to?: number;
    currency: string;
  };
}

interface VacancyEditorProps {
  data: VacancyData;
  onChange: (data: VacancyData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function VacancyEditor({
  data,
  onChange,
  onSave,
  onCancel,
}: VacancyEditorProps) {
  const [newRequirement, setNewRequirement] = useState("");
  const [newResponsibility, setNewResponsibility] = useState("");
  const [newCondition, setNewCondition] = useState("");

  const addItem = (
    field: "requirements" | "responsibilities" | "conditions",
    value: string,
    setter: (value: string) => void,
  ) => {
    if (!value.trim()) return;
    onChange({
      ...data,
      [field]: [...data[field], value.trim()],
    });
    setter("");
  };

  const removeItem = (
    field: "requirements" | "responsibilities" | "conditions",
    index: number,
  ) => {
    onChange({
      ...data,
      [field]: data[field].filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Название вакансии</Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="Например, Senior Frontend Developer"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryFrom">Зарплата от</Label>
          <Input
            id="salaryFrom"
            type="number"
            value={data.salary?.from ?? ""}
            onChange={(e) =>
              onChange({
                ...data,
                salary: {
                  ...data.salary,
                  from: Number(e.target.value),
                  currency: data.salary?.currency ?? "₽",
                },
              })
            }
            placeholder="200000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryTo">Зарплата до</Label>
          <Input
            id="salaryTo"
            type="number"
            value={data.salary?.to ?? ""}
            onChange={(e) =>
              onChange({
                ...data,
                salary: {
                  ...data.salary,
                  to: Number(e.target.value),
                  currency: data.salary?.currency ?? "₽",
                },
              })
            }
            placeholder="300000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Краткое описание вакансии…"
          rows={3}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Требования</Label>
        <div className="space-y-2">
          {data.requirements.map((req, idx) => (
            <div key={req} className="flex items-center gap-2">
              <Input value={req} readOnly className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem("requirements", idx)}
                aria-label={`Удалить требование: ${req}`}
              >
                <IconTrash className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("requirements", newRequirement, setNewRequirement);
                }
              }}
              placeholder="Добавить требование…"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                addItem("requirements", newRequirement, setNewRequirement)
              }
              disabled={!newRequirement.trim()}
              aria-label="Добавить требование"
            >
              <IconPlus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Обязанности</Label>
        <div className="space-y-2">
          {data.responsibilities.map((resp, idx) => (
            <div key={resp} className="flex items-center gap-2">
              <Input value={resp} readOnly className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem("responsibilities", idx)}
                aria-label={`Удалить обязанность: ${resp}`}
              >
                <IconTrash className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(
                    "responsibilities",
                    newResponsibility,
                    setNewResponsibility,
                  );
                }
              }}
              placeholder="Добавить обязанность…"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                addItem(
                  "responsibilities",
                  newResponsibility,
                  setNewResponsibility,
                )
              }
              disabled={!newResponsibility.trim()}
              aria-label="Добавить обязанность"
            >
              <IconPlus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Условия</Label>
        <div className="space-y-2">
          {data.conditions.map((cond, idx) => (
            <div key={cond} className="flex items-center gap-2">
              <Input value={cond} readOnly className="flex-1" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem("conditions", idx)}
                aria-label={`Удалить условие: ${cond}`}
              >
                <IconTrash className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem("conditions", newCondition, setNewCondition);
                }
              }}
              placeholder="Добавить условие…"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                addItem("conditions", newCondition, setNewCondition)
              }
              disabled={!newCondition.trim()}
              aria-label="Добавить условие"
            >
              <IconPlus className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button onClick={onSave} className="flex-1">
          Сохранить изменения
        </Button>
        <Button onClick={onCancel} variant="outline">
          Отмена
        </Button>
      </div>
    </div>
  );
}
