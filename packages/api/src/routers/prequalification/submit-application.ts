/**
 * Submit Application Procedure
 *
 * Подаёт заявку кандидата после успешной преквалификации.
 * Создаёт response и связывает с сессией.
 * Публичная процедура - не требует авторизации пользователя.
 */

import { and, eq, GlobalCandidateRepository, globalCandidate } from "@qbs-autonaim/db";
import {
  prequalificationSession,
  type Response,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { CandidateService } from "../../services/candidate.service";
import { ContactCandidateSyncService } from "../../services/contact-candidate-sync.service";
import { SessionManager } from "../../services/prequalification";
import { PrequalificationError } from "../../services/prequalification/types";
import { publicProcedure } from "../../trpc";

const submitApplicationInputSchema = z.object({
  sessionId: z.uuid("sessionId должен быть UUID"),
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  /** Required contact email from parsed resume */
  email: z.string().email("Укажите корректный email").optional(),
  /** Optional additional message from candidate - minimum 10 characters for meaningful content */
  coverLetter: z
    .string()
    .trim()
    .min(10, "Сопроводительное письмо должно содержать минимум 10 символов")
    .max(5000, "Сопроводительное письмо не может превышать 5000 символов")
    .optional()
    .or(z.literal("")),
  /** Optional contact preferences */
  contactPreferences: z
    .object({
      preferredContact: z.enum(["email", "phone", "telegram"]).optional(),
      availableFrom: z.string().optional(),
    })
    .optional(),
});

export const submitApplication = publicProcedure
  .input(submitApplicationInputSchema)
  .mutation(async ({ ctx, input }) => {
    // Validate that session has required data
    const sessionManager = new SessionManager(ctx.db);

    // Get session
    const session = await sessionManager.getSession(
      input.sessionId,
      input.workspaceId,
    );

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сессия не найдена",
      });
    }

    // Verify session is in completed status
    if (session.status !== "completed") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Подача заявки недоступна в статусе: ${session.status}`,
      });
    }

    // Verify candidate can proceed (not_fit cannot submit)
    if (session.fitDecision === "not_fit") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message:
          "К сожалению, ваш профиль не соответствует требованиям вакансии",
      });
    }

    // Check if already submitted
    if (session.responseId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Заявка уже была подана",
      });
    }

    try {
      // Get vacancy data
      const [vacancyData] = await ctx.db
        .select()
        .from(vacancy)
        .where(eq(vacancy.id, session.vacancyId))
        .limit(1);

      if (!vacancyData) {
        throw new PrequalificationError(
          "VACANCY_NOT_FOUND",
          "Вакансия не найдена",
        );
      }

      // Get workspace to obtain organizationId
      const workspaceData = await ctx.db.query.workspace.findFirst({
        where: (ws, { eq }) => eq(ws.id, vacancyData.workspaceId),
        columns: { organizationId: true },
      });

      if (!workspaceData) {
        throw new PrequalificationError(
          "TENANT_MISMATCH",
          "Workspace не найден",
        );
      }

      // Extract candidate info from parsed resume
      const candidateInfo = session.parsedResume?.structured?.personalInfo;
      const evaluation = session.evaluation as {
        aiSummary?: string;
        strengths?: string[];
        risks?: string[];
        recommendation?: string;
        dimensions?: {
          hardSkills?: { score: number; notes: string };
          softSkills?: { score: number; notes: string };
          cultureFit?: { score: number; notes: string };
          salaryAlignment?: { score: number; notes: string };
        };
      } | null;

      // Generate a unique resume ID for the prequalification response
      const resumeId = `preq_${nanoid(16)}`;

      // Prepare evaluationReasoning from dimensions
      const _evaluationReasoning = evaluation?.dimensions
        ? {
            hardSkills: evaluation.dimensions.hardSkills,
            softSkills: evaluation.dimensions.softSkills,
            cultureFit: evaluation.dimensions.cultureFit,
            salaryAlignment: evaluation.dimensions.salaryAlignment,
          }
        : null;

      // Create or find candidate in database
      let globalCandidateId: string | null = null;
      try {
        const candidateSync = new ContactCandidateSyncService(ctx.db);

        // Синхронизируем кандидата с контактными данными
        const syncResult = await candidateSync.syncCandidateFromContacts({
          name: candidateInfo?.name,
          email: candidateInfo?.email || input.email || undefined,
          phone: candidateInfo?.phone || undefined,
          telegramUsername: undefined,
          organizationId: workspaceData.organizationId,
          source: "APPLICANT",
          originalSource: "WEB_LINK",
          additionalData: (() => {
            const pi = session.parsedResume?.structured?.personalInfo;
            const exp = session.parsedResume?.structured?.experience;
            const headline = exp?.length
              ? exp[exp.length - 1]?.position
              : undefined;
            if (!pi && !headline) return undefined;
            return {
              ...(pi && {
                location: pi.location,
                gender: pi.gender?.toLowerCase() as
                  | "male"
                  | "female"
                  | "other"
                  | undefined,
                citizenship: pi.citizenship,
              }),
              headline,
            };
          })(),
        });

        if (syncResult.hasContacts) {
          globalCandidateId = syncResult.candidateId;

          // Если есть дополнительные данные из резюме, обновляем кандидата
          if (session.parsedResume?.structured) {
            const candidateService = new CandidateService();

            const tempResponse: Partial<Response> = {
              candidateName: candidateInfo?.name ?? null,
              email: candidateInfo?.email ?? null,
              phone: candidateInfo?.phone ?? null,
              telegramUsername: null,
              profileUrl: null,
              skills: null,
              importSource: "WEB_LINK",
              profileData: null,
              contacts: {
                email: candidateInfo?.email,
                phone: candidateInfo?.phone,
                prequalificationSessionId: session.id,
                fitScore: session.fitScore,
                fitDecision: session.fitDecision,
                aiSummary: evaluation?.aiSummary,
                strengths: evaluation?.strengths,
                risks: evaluation?.risks,
                recommendation: evaluation?.recommendation,
                contactPreferences: input.contactPreferences,
              },
            };

            const candidateData =
              candidateService.extractCandidateDataFromResponse(
                tempResponse,
                workspaceData.organizationId,
              );

            const enrichedData = candidateService.enrichCandidateFromResume(
              candidateData,
              session.parsedResume,
            );

            const normalizedData =
              candidateService.normalizeCandidateData(enrichedData);

            // Обновляем глобального кандидата дополнительными данными
            const existingCandidate =
              await ctx.db.query.globalCandidate.findFirst({
                where: eq(globalCandidate.id, globalCandidateId),
              });

            if (existingCandidate) {
              const globalCandidateRepository = new GlobalCandidateRepository(
                ctx.db,
              );
              const { organizationId: _orgId, ...candidateData } =
                normalizedData;
              const mergedData =
                globalCandidateRepository.mergeGlobalCandidateData(
                  existingCandidate,
                  candidateData,
                );
              if (Object.keys(mergedData).length > 0) {
                await ctx.db
                  .update(globalCandidate)
                  .set(mergedData)
                  .where(eq(globalCandidate.id, globalCandidateId));
              }
            }
          }
        }
      } catch (error) {
        // Log error but don't block response creation
        console.error("Ошибка при создании/поиске кандидата:", error);
      }

      // Create vacancy response
      // Note: response schema requires candidateId and entityType/entityId
      // For prequalification, we use the session ID as reference
      const [newResponse] = await ctx.db
        .insert(responseTable)
        .values({
          entityType: "vacancy",
          entityId: session.vacancyId,
          candidateId: resumeId,
          candidateName: candidateInfo?.name ?? null,
          phone: candidateInfo?.phone ?? null,
          coverLetter: input.coverLetter ?? null,
          status: "NEW",
          importSource: "WEB_LINK", // Using existing enum value for web submissions
          globalCandidateId,
          // Store prequalification metadata in contacts field
          contacts: {
            email: candidateInfo?.email || input.email,
            prequalificationSessionId: session.id,
            fitScore: session.fitScore,
            fitDecision: session.fitDecision,
            aiSummary: evaluation?.aiSummary,
            strengths: evaluation?.strengths,
            risks: evaluation?.risks,
            recommendation: evaluation?.recommendation,
            contactPreferences: input.contactPreferences,
          },
        })
        .returning();

      if (!newResponse) {
        throw new Error("Не удалось создать отклик");
      }

      // Update session with responseId and status
      await ctx.db
        .update(prequalificationSession)
        .set({
          status: "submitted",
          responseId: newResponse.id,
        })
        .where(
          and(
            eq(prequalificationSession.id, input.sessionId),
            eq(prequalificationSession.workspaceId, input.workspaceId),
          ),
        );

      // Log audit event
      try {
        await ctx.auditLogger.logAccess({
          workspaceId: input.workspaceId,
          userId: ctx.session?.user?.id ?? "anonymous",
          action: "CREATE",
          resourceType: "VACANCY_RESPONSE",
          resourceId: newResponse.id,
          metadata: {
            sessionId: input.sessionId,
            responseId: newResponse.id,
            status: "submitted",
            fitScore: session.fitScore,
            fitDecision: session.fitDecision,
            importSource: "MANUAL",
            candidateName: candidateInfo?.name,
            candidateEmail: candidateInfo?.email,
          },
        });
      } catch (auditError) {
        // Log audit error but don't block the main flow
        console.error("Failed to log audit event:", auditError);
      }

      return {
        success: true,
        responseId: newResponse.id,
        status: "submitted" as const,
        message:
          "Ваша заявка успешно отправлена! Рекрутер свяжется с вами в ближайшее время.",
      };
    } catch (error) {
      if (error instanceof PrequalificationError) {
        const codeMap: Record<
          string,
          "BAD_REQUEST" | "NOT_FOUND" | "FORBIDDEN"
        > = {
          VACANCY_NOT_FOUND: "NOT_FOUND",
          ALREADY_SUBMITTED: "BAD_REQUEST",
        };

        throw new TRPCError({
          code: codeMap[error.code] ?? "INTERNAL_SERVER_ERROR",
          message: error.userMessage,
          cause: error,
        });
      }

      throw error;
    }
  });
