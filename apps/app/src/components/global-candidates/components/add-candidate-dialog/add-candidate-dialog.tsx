"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@qbs-autonaim/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@qbs-autonaim/ui/components/tabs";
import {
  type CreateGlobalCandidateFormValues,
  createGlobalCandidateFormSchema,
} from "@qbs-autonaim/validators";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useWorkspaceContext } from "~/contexts/workspace-context";
import { useORPC } from "~/orpc/react";
import { CandidateForm } from "./candidate-form";
import { MAX_FILE_SIZE } from "./constants";
import { parsedResumeToFormValues } from "./parsed-resume-utils";
import { PdfUploadTab } from "./pdf-upload-tab";

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_DEFAULTS: Partial<CreateGlobalCandidateFormValues> = {
  fullName: "",
  firstName: "",
  lastName: "",
  middleName: "",
  email: "",
  phone: undefined,
  telegramUsername: "",
  headline: "",
  location: "",
  gender: undefined,
  citizenship: "",
  skills: undefined,
  experienceYears: undefined,
  salaryExpectationsAmount: undefined,
  workFormat: undefined,
  englishLevel: undefined,
  readyForRelocation: undefined,
  notes: "",
  tags: undefined,
  experience: undefined,
  education: undefined,
};

export function AddCandidateDialog({
  open,
  onOpenChange,
}: AddCandidateDialogProps) {
  const orpc = useORPC();
  const queryClient = useQueryClient();
  const { workspaceId, workspace } = useWorkspaceContext();
  const organizationId = workspace?.organizationId;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"manual" | "pdf">("manual");

  const form = useForm<CreateGlobalCandidateFormValues>({
    resolver: zodResolver(
      createGlobalCandidateFormSchema,
    ) as Resolver<CreateGlobalCandidateFormValues>,
    defaultValues: FORM_DEFAULTS,
  });

  const parseResumeMutation = useMutation(
    orpc.globalCandidates.parseResume.mutationOptions({
      onSuccess: (parsed) => {
        const values = parsedResumeToFormValues(parsed);
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            form.setValue(key as keyof CreateGlobalCandidateFormValues, value);
          }
        });
        toast.success("Резюме распознано", {
          description:
            "Данные заполнены. Проверьте и отредактируйте при необходимости.",
        });
        setActiveTab("manual");
      },
      onError: (error) => {
        toast.error("Ошибка парсинга", {
          description: error.message,
        });
      },
    }),
  );

  const createMutation = useMutation(
    orpc.globalCandidates.create.mutationOptions({
      onSuccess: async (result) => {
        toast.success("Кандидат добавлен", {
          description: `${result.candidate.fullName} успешно добавлен в базу`,
        });
        if (organizationId) {
          await queryClient.invalidateQueries({
            queryKey: orpc.globalCandidates.list.queryKey({
              input: { organizationId },
            }),
          });
        }
        onOpenChange(false);
        form.reset(FORM_DEFAULTS);
      },
      onError: (error) => {
        toast.error("Ошибка при добавлении", {
          description: error.message,
        });
      },
    }),
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !workspaceId) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("Файл слишком большой", {
          description: "Максимальный размер: 10 МБ",
        });
        e.target.value = "";
        return;
      }

      if (!/\.(pdf|docx)$/i.test(file.name)) {
        toast.error("Неподдерживаемый формат", {
          description: "Поддерживаются только PDF и DOCX",
        });
        e.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        if (!base64) {
          toast.error("Не удалось прочитать файл");
          return;
        }
        parseResumeMutation.mutate({
          workspaceId,
          fileContent: base64,
          filename: file.name,
        });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [workspaceId, parseResumeMutation],
  );

  const handleSubmit = useCallback(
    (values: CreateGlobalCandidateFormValues) => {
      if (!workspaceId) return;

      const tags = values.tags ?? [];
      const skills = values.skills ?? [];
      const experience = values.experience ?? [];
      const education = values.education ?? [];

      createMutation.mutate({
        workspaceId,
        fullName: values.fullName,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        middleName: values.middleName || undefined,
        email: values.email?.trim() || undefined,
        phone: values.phone || undefined,
        telegramUsername: values.telegramUsername?.trim() || undefined,
        headline: values.headline || undefined,
        location: values.location || undefined,
        birthDate:
          values.birthDate instanceof Date ? values.birthDate : undefined,
        gender: values.gender,
        citizenship: values.citizenship || undefined,
        skills: skills.length > 0 ? skills : undefined,
        experienceYears: values.experienceYears,
        salaryExpectationsAmount: values.salaryExpectationsAmount,
        workFormat: values.workFormat,
        englishLevel: values.englishLevel,
        readyForRelocation: values.readyForRelocation,
        notes: values.notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        experience: experience.length > 0 ? experience : undefined,
        education: education.length > 0 ? education : undefined,
      });
    },
    [workspaceId, createMutation],
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset(FORM_DEFAULTS);
        parseResumeMutation.reset();
      }
    },
    [onOpenChange, form, parseResumeMutation],
  );

  const isPending = createMutation.isPending || parseResumeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1.5rem)] sm:max-w-2xl lg:max-w-4xl w-[calc(100vw-1.5rem)] sm:w-[42rem] lg:w-[56rem] max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">
                Добавить кандидата
              </DialogTitle>
              <DialogDescription className="text-sm">
                Заполните данные вручную или загрузите резюме PDF для
                автозаполнения
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "manual" | "pdf")}
        >
          <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
            <TabsTrigger value="manual" className="text-sm sm:text-base">
              Вручную
            </TabsTrigger>
            <TabsTrigger value="pdf" className="text-sm sm:text-base">
              Из PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4">
            <PdfUploadTab
              fileInputRef={fileInputRef}
              onFileSelect={handleFileSelect}
              isPending={parseResumeMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <CandidateForm
              form={form}
              onSubmit={handleSubmit}
              onCancel={() => handleOpenChange(false)}
              isPending={isPending}
              isSubmitting={createMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
