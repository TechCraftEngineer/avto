import { paths } from "@qbs-autonaim/config";
import {
  createOrganizationSchema,
  createWorkspaceSchema,
} from "@qbs-autonaim/validators";
import slugify from "@sindresorhus/slugify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type OnboardingStep = "welcome" | "organization" | "workspace";

interface CreatedOrganization {
  id: string;
  slug: string;
  name: string;
}

export function useOnboarding() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<OnboardingStep>("welcome");

  // Данные организации
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(true);

  // Ошибка создания организации (показывается на форме)
  const [organizationError, setOrganizationError] = useState<string | null>(null);

  // Созданная организация
  const [createdOrganization, setCreatedOrganization] =
    useState<CreatedOrganization | null>(null);

  // Данные workspace
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [isGeneratingWorkspaceSlug, setIsGeneratingWorkspaceSlug] =
    useState(true);

  const createOrganization = useMutation(
    trpc.organization.create.mutationOptions({
      onSuccess: (organization) => {
        toast.success("Организация создана", {
          description: `Организация "${organization.name}" успешно создана`,
        });
        setCreatedOrganization({
          id: organization.id,
          slug: organization.slug,
          name: organization.name,
        });
        setStep("workspace");

        // Инвалидация кэша списка организаций
        void queryClient.invalidateQueries({
          queryKey: trpc.organization.list.queryKey(),
        });
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          setOrganizationError("Организация с таким слагом уже существует. Попробуйте другой слаг.");
        } else {
          setOrganizationError(error.message);
        }
      },
    }),
  );

  const createWorkspace = useMutation(
    trpc.organization.createWorkspace.mutationOptions({
      onSuccess: (workspace) => {
        toast.success("Воркспейс создан", {
          description: `Воркспейс "${workspace.name}" успешно создан`,
        });

        // Инвалидация кэша воркспейсов
        if (createdOrganization) {
          void queryClient.invalidateQueries({
            queryKey: trpc.organization.listWorkspaces.queryKey({
              organizationId: createdOrganization.id,
            }),
          });
        }

        if (createdOrganization && workspace.slug) {
          router.push(
            paths.workspace.root(createdOrganization.slug, workspace.slug),
          );
          router.refresh();
        }
      },
      onError: (error) => {
        if (
          error.message.includes("уже существует") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("CONFLICT")
        ) {
          toast.error("Воркспейс с таким slug уже существует", {
            description: "Попробуйте другой slug",
          });
        } else {
          toast.error("Ошибка при создании воркспейса", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleNameChange = (value: string) => {
    setName(value);
    setOrganizationError(null);
    if (isGeneratingSlug) {
      const generatedSlug = slugify(value);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setIsGeneratingSlug(false);
    setSlug(value);
    setOrganizationError(null);
  };

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrganizationError(null);

    // Формируем payload для валидации
    const payload = {
      name,
      slug,
      description: description || undefined,
      website: website || undefined,
    };

    // Валидация с помощью Zod safeParse
    const result = createOrganizationSchema.safeParse(payload);

    if (!result.success) {
      // Обработка ошибок валидации — показываем на форме
      const errors = result.error.flatten();
      const firstError =
        errors.fieldErrors.name?.[0] ||
        errors.fieldErrors.slug?.[0] ||
        errors.fieldErrors.description?.[0] ||
        errors.fieldErrors.website?.[0];
      setOrganizationError(firstError ?? "Ошибка валидации");
      return;
    }

    // Если валидация прошла успешно, отправляем данные
    createOrganization.mutate(result.data);
  };

  const handleWorkspaceNameChange = (value: string) => {
    setWorkspaceName(value);
    if (isGeneratingWorkspaceSlug) {
      const generatedSlug = slugify(value);
      setWorkspaceSlug(generatedSlug);
    }
  };

  const handleWorkspaceSlugChange = (value: string) => {
    setIsGeneratingWorkspaceSlug(false);
    setWorkspaceSlug(value);
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdOrganization) return;

    // Формируем payload для валидации
    const payload = {
      name: workspaceName,
      slug: workspaceSlug,
      description: workspaceDescription || undefined,
    };

    // Валидация с помощью Zod safeParse
    const result = createWorkspaceSchema.safeParse(payload);

    if (!result.success) {
      // Обработка ошибок валидации
      const errors = result.error.flatten();

      // Показываем первую ошибку валидации
      const firstError =
        errors.fieldErrors.name?.[0] ||
        errors.fieldErrors.slug?.[0] ||
        errors.fieldErrors.description?.[0];

      if (firstError) {
        toast.error("Ошибка валидации", {
          description: firstError,
        });
      }

      return;
    }

    // Если валидация прошла успешно, отправляем данные
    createWorkspace.mutate({
      organizationId: createdOrganization.id,
      workspace: result.data,
    });
  };

  const handleSkipWorkspace = () => {
    if (!createdOrganization) return;
    router.push(paths.organization.workspaces(createdOrganization.slug));
    router.refresh();
  };

  const handleGetStarted = () => {
    setStep("organization");
  };

  return {
    step,
    organization: {
      name,
      slug,
      description,
      website,
      isGeneratingSlug,
      isPending: createOrganization.isPending,
      error: organizationError,
      onNameChange: handleNameChange,
      onSlugChange: handleSlugChange,
      onDescriptionChange: (v) => {
        setDescription(v);
        setOrganizationError(null);
      },
      onWebsiteChange: (v) => {
        setWebsite(v);
        setOrganizationError(null);
      },
      onSubmit: handleOrganizationSubmit,
    },
    workspace: {
      name: workspaceName,
      slug: workspaceSlug,
      description: workspaceDescription,
      isGeneratingSlug: isGeneratingWorkspaceSlug,
      isPending: createWorkspace.isPending,
      organizationSlug: createdOrganization?.slug ?? "",
      onNameChange: handleWorkspaceNameChange,
      onSlugChange: handleWorkspaceSlugChange,
      onDescriptionChange: setWorkspaceDescription,
      onSubmit: handleWorkspaceSubmit,
      onSkip: handleSkipWorkspace,
    },
    onGetStarted: handleGetStarted,
  };
}
