"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from "@qbs-autonaim/ui";
import { IconDeviceFloppy, IconLoader2, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspace } from "~/hooks/use-workspace";
import { useTRPC } from "~/trpc/react";

interface InterviewScenarioFormProps {
  scenarioId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function InterviewScenarioForm({
  scenarioId,
  onCancel,
  onSuccess,
}: InterviewScenarioFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    customBotInstructions: "",
    customScreeningPrompt: "",
    customInterviewQuestions: "",
    customOrganizationalQuestions: "",
  });

  const isEditing = !!scenarioId;

  // Загружаем данные сценария при редактировании
  const { data: scenario, isLoading: isLoadingScenario } = useQuery({
    ...trpc.interviewScenarios.get.queryOptions({
      id: scenarioId ?? "",
      workspaceId: workspace?.id ?? "",
    }),
    enabled: isEditing && !!workspace?.id && !!scenarioId,
  });

  useEffect(() => {
    if (scenario) {
      setFormData({
        name: scenario.name,
        description: scenario.description ?? "",
        customBotInstructions: scenario.customBotInstructions ?? "",
        customScreeningPrompt: scenario.customScreeningPrompt ?? "",
        customInterviewQuestions: scenario.customInterviewQuestions ?? "",
        customOrganizationalQuestions:
          scenario.customOrganizationalQuestions ?? "",
      });
    }
  }, [scenario]);

  const { mutate: createScenario, isPending: isCreating } = useMutation(
    trpc.interviewScenarios.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.interviewScenarios.list.queryKey({
            workspaceId: workspace?.id ?? "",
            limit: 50,
            offset: 0,
          }),
        });
        toast.success("Сценарий создан");
        onSuccess();
      },
      onError: (error) => {
        toast.error(`Ошибка создания сценария: ${error.message}`);
      },
    }),
  );

  const { mutate: updateScenario, isPending: isUpdating } = useMutation(
    trpc.interviewScenarios.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.interviewScenarios.list.queryKey({
            workspaceId: workspace?.id ?? "",
            limit: 50,
            offset: 0,
          }),
        });
        toast.success("Сценарий обновлен");
        onSuccess();
      },
      onError: (error) => {
        toast.error(`Ошибка обновления сценария: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!workspace?.id) return;

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      customBotInstructions: formData.customBotInstructions.trim() || null,
      customScreeningPrompt: formData.customScreeningPrompt.trim() || null,
      customInterviewQuestions:
        formData.customInterviewQuestions.trim() || null,
      customOrganizationalQuestions:
        formData.customOrganizationalQuestions.trim() || null,
    };

    if (isEditing && scenarioId) {
      updateScenario({
        id: scenarioId,
        workspaceId: workspace.id,
        data: {
          ...data,
          description: data.description ?? undefined,
        },
      });
    } else {
      createScenario({
        workspaceId: workspace.id,
        name: data.name,
        description: data.description ?? undefined,
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoadingScenario) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <IconLoader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Загрузка сценария...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {isEditing ? "Редактирование сценария" : "Создание сценария"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Измените настройки сценария интервью"
                : "Создайте новый сценарий для проведения интервью"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Название сценария *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Например: Техническое интервью разработчика"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Краткое описание сценария и его назначения"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customBotInstructions">
              Общие инструкции для бота
            </Label>
            <Textarea
              id="customBotInstructions"
              value={formData.customBotInstructions}
              onChange={(e) =>
                handleChange("customBotInstructions", e.target.value)
              }
              placeholder="Опишите общий стиль общения, тон, особые требования к поведению бота"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customScreeningPrompt">Промпт для скрининга</Label>
            <Textarea
              id="customScreeningPrompt"
              value={formData.customScreeningPrompt}
              onChange={(e) =>
                handleChange("customScreeningPrompt", e.target.value)
              }
              placeholder="Критерии оценки кандидата, на что обращать внимание при скрининге"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customOrganizationalQuestions">
              Организационные вопросы
            </Label>
            <Textarea
              id="customOrganizationalQuestions"
              value={formData.customOrganizationalQuestions}
              onChange={(e) =>
                handleChange("customOrganizationalQuestions", e.target.value)
              }
              placeholder="Вопросы о доступности, сроках, условиях работы"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInterviewQuestions">
              Вопросы для интервью
            </Label>
            <Textarea
              id="customInterviewQuestions"
              value={formData.customInterviewQuestions}
              onChange={(e) =>
                handleChange("customInterviewQuestions", e.target.value)
              }
              placeholder="Список вопросов, которые бот должен задать кандидату"
              rows={5}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isCreating || isUpdating || !formData.name.trim()}
              className="flex-1"
            >
              {isCreating || isUpdating ? (
                <>
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Сохранение..." : "Создание..."}
                </>
              ) : (
                <>
                  <IconDeviceFloppy className="h-4 w-4 mr-2" />
                  {isEditing ? "Сохранить изменения" : "Создать сценарий"}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
