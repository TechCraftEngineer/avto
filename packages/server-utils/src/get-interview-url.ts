import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { customDomain, gig, vacancy, workspace } from "@qbs-autonaim/db/schema";

/**
 * Получает primary interview domain для workspace по customDomainId
 */
async function getWorkspaceInterviewDomain(
  workspaceId: string,
): Promise<string | null> {
  const ws = await db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
    columns: {
      customDomainId: true,
    },
    with: {
      customDomain: {
        columns: {
          domain: true,
          isVerified: true,
        },
      },
    },
  });

  const custom = ws?.customDomain;

  if (!custom?.isVerified) {
    return null;
  }

  return custom.domain;
}

/**
 * Получает базовый URL для интервью
 * Использует кастомный домен workspace, если он указан, иначе NEXT_PUBLIC_INTERVIEW_URL
 */
export function getInterviewBaseUrl(
  workspaceInterviewDomain?: string | null,
): string {
  if (workspaceInterviewDomain) {
    // Убираем trailing slash если есть
    return workspaceInterviewDomain.replace(/\/$/, "");
  }

  const interviewUrl = env.NEXT_PUBLIC_INTERVIEW_URL;

  if (!interviewUrl || interviewUrl.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_INTERVIEW_URL environment variable is not set or empty. " +
        "Please configure it in your .env file.",
    );
  }

  return interviewUrl.replace(/\/$/, "");
}

/**
 * Генерирует полный URL интервью с токеном
 */
export function getInterviewUrl(
  token: string,
  workspaceInterviewDomain?: string | null,
): string {
  const baseUrl = getInterviewBaseUrl(workspaceInterviewDomain);
  return `${baseUrl}/${token}`;
}

/**
 * Получает домен для интервью по типу entity
 */
async function getEntityInterviewDomain(
  entityType: "vacancy" | "gig",
  entityId: string,
): Promise<string | null> {
  if (entityType === "gig") {
    // Для gig получаем домен из gig.customDomainId с preset fallback
    const gigData = await db.query.gig.findFirst({
      where: eq(gig.id, entityId),
      columns: {
        customDomainId: true,
        workspaceId: true,
      },
    });

    if (!gigData) {
      return null;
    }

    // Если у gig указан кастомный домен, используем его
    if (gigData.customDomainId) {
      // Проверяем, является ли это предустановленным доменом
      const { getPresetDomain } = await import("@qbs-autonaim/db/schema");
      const presetDomain = getPresetDomain(gigData.customDomainId);

      if (presetDomain) {
        return presetDomain.domain;
      }

      // Иначе ищем в кастомных доменах
      const domain = await db.query.customDomain.findFirst({
        where: eq(customDomain.id, gigData.customDomainId),
        columns: {
          domain: true,
          isVerified: true,
        },
      });

      if (domain?.isVerified) {
        return domain.domain;
      }
    }

    // Иначе ищем primary домен workspace
    const primaryDomain = await db.query.customDomain.findFirst({
      where: (domain, { eq, and }) =>
        and(
          eq(domain.workspaceId, gigData.workspaceId),
          eq(domain.type, "interview"),
          eq(domain.isPrimary, true),
          eq(domain.isVerified, true),
        ),
      columns: {
        domain: true,
      },
    });

    if (primaryDomain) {
      return primaryDomain.domain;
    }

    // Для gig всегда должен быть доступен preset домен
    const { presetInterviewDomains } = await import("@qbs-autonaim/db/schema");
    const defaultPresetDomain = presetInterviewDomains[0];
    if (!defaultPresetDomain) {
      throw new Error("No preset domain available for gig interviews");
    }

    return defaultPresetDomain.domain;
  } else if (entityType === "vacancy") {
    // Для vacancy получаем домен из workspace
    const vacancyData = await db.query.vacancy.findFirst({
      where: eq(vacancy.id, entityId),
      columns: {
        workspaceId: true,
      },
    });

    if (!vacancyData) {
      return null;
    }

    return await getWorkspaceInterviewDomain(vacancyData.workspaceId);
  }

  return null;
}

/**
 * Генерирует полный URL интервью с токеном, получая домен из БД
 * @deprecated Используйте getInterviewUrlFromEntity для новых реализаций
 */
export async function getInterviewUrlFromDb(
  token: string,
  workspaceId: string,
): Promise<string> {
  const domain = await getWorkspaceInterviewDomain(workspaceId);
  return getInterviewUrl(token, domain);
}

/**
 * Генерирует полный URL интервью с токеном по типу entity
 */
export async function getInterviewUrlFromEntity(
  token: string,
  entityType: "vacancy" | "gig",
  entityId: string,
): Promise<string> {
  const domain = await getEntityInterviewDomain(entityType, entityId);
  return getInterviewUrl(token, domain);
}
