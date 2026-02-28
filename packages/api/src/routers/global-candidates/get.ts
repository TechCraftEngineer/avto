import { ORPCError } from "@orpc/server";
import { and, desc, eq, inArray } from "@qbs-autonaim/db";
import {
  candidateOrganization,
  globalCandidate,
  responseComment,
  responseHistory,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../orpc";

export const get = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      organizationId: organizationIdSchema,
    }),
  )
  .handler(async ({ input, context }) => {
    // Проверяем доступ к организации
    const hasAccess = await context.organizationRepository.checkAccess(
      input.organizationId,
      context.session.user.id,
    );

    if (!hasAccess) {
      throw new ORPCError("FORBIDDEN", {
        message: "Нет доступа к организации",
      });
    }

    // Получаем глобального кандидата
    const candidate = await context.db.query.globalCandidate.findFirst({
      where: eq(globalCandidate.id, input.candidateId),
    });

    if (!candidate) {
      throw new ORPCError("NOT_FOUND", { message: "Кандидат не найден" });
    }

    // Получаем связь с организацией
    const orgLink = await context.db.query.candidateOrganization.findFirst({
      where: and(
        eq(candidateOrganization.candidateId, input.candidateId),
        eq(candidateOrganization.organizationId, input.organizationId),
      ),
    });

    if (!orgLink) {
      throw new ORPCError("NOT_FOUND", {
        message: "Кандидат не найден в базе организации",
      });
    }

    // Получаем все отклики кандидата в организации
    const responses = await context.db.query.response.findMany({
      where: and(
        eq(responseTable.globalCandidateId, input.candidateId),
        eq(responseTable.entityType, "vacancy"),
      ),
      with: {
        vacancy: {
          columns: { id: true, title: true },
          with: {
            workspace: {
              columns: { slug: true },
              with: {
                organization: {
                  columns: { slug: true },
                },
              },
            },
          },
        },
      },
      orderBy: [desc(responseTable.updatedAt)],
    });

    // Получаем ID откликов для загрузки комментариев и истории
    const responseIds = responses.map((r) => r.id);

    // Загружаем комментарии
    const comments =
      responseIds.length > 0
        ? await context.db.query.responseComment.findMany({
            where: inArray(responseComment.responseId, responseIds),
            with: {
              author: {
                columns: { id: true, name: true, image: true },
              },
            },
            orderBy: [desc(responseComment.createdAt)],
          })
        : [];

    // Загружаем историю изменений
    const history =
      responseIds.length > 0
        ? await context.db.query.responseHistory.findMany({
            where: inArray(responseHistory.responseId, responseIds),
            orderBy: [desc(responseHistory.createdAt)],
          })
        : [];

    // Группируем данные по откликам
    const responsesWithDetails = responses.map((response) => ({
      id: response.id,
      vacancyId: response.entityId,
      vacancyTitle: response.vacancy?.title || "Неизвестная вакансия",
      workspaceSlug: response.vacancy?.workspace?.slug || "",
      orgSlug: response.vacancy?.workspace?.organization?.slug || "",
      status: response.status,
      hrSelectionStatus: response.hrSelectionStatus,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      comments: comments
        .filter((c) => c.responseId === response.id)
        .map((c) => ({
          id: c.id,
          content: c.content,
          author: c.author?.name || "Неизвестный автор",
          authorId: c.authorId,
          isPrivate: c.isPrivate,
          createdAt: c.createdAt,
        })),
      history: history
        .filter((h) => h.responseId === response.id)
        .map((h) => ({
          id: h.id,
          eventType: h.eventType,
          oldValue: h.oldValue,
          newValue: h.newValue,
          userId: h.userId,
          createdAt: h.createdAt,
        })),
    }));

    // Формируем полный профиль
    return {
      id: candidate.id,
      fullName: candidate.fullName,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      middleName: candidate.middleName,
      headline: candidate.headline,
      email: candidate.email,
      phone: candidate.phone,
      telegramUsername: candidate.telegramUsername,
      location: candidate.location,
      citizenship: candidate.citizenship,
      birthDate: candidate.birthDate,
      gender: candidate.gender,
      skills: candidate.skills || [],
      experienceYears: candidate.experienceYears,
      salaryExpectationsAmount: candidate.salaryExpectationsAmount,
      workFormat: candidate.workFormat,
      englishLevel: candidate.englishLevel,
      readyForRelocation: candidate.readyForRelocation,
      avatarFileId: candidate.photoFileId,
      resumeUrl: candidate.resumeUrl,
      profileData: candidate.profileData,
      source: candidate.source,
      originalSource: candidate.originalSource,
      tags: candidate.tags || [],
      notes: candidate.notes,
      isSearchable: candidate.isSearchable,
      // Данные связи с организацией
      orgStatus: orgLink.status,
      orgTags: orgLink.tags || [],
      orgNotes: orgLink.notes,
      appliedAt: orgLink.appliedAt,
      linkedAt: orgLink.createdAt,
      // Отклики и активность
      responses: responsesWithDetails,
      totalResponses: responses.length,
      lastActivity:
        responses.length > 0
          ? responses[0]?.updatedAt || orgLink.updatedAt
          : orgLink.updatedAt,
    };
  });
