import { db, eq } from "@qbs-autonaim/db";
import {
  organization,
  organizationMember,
  user,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { cleanupTestUser } from "./utils";

// Только в development/test режиме
const isTestMode =
  process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

export const setup = publicProcedure
  .input(
    z.object({
      email: z.string().email("Некорректный email адрес"),
      password: z.string().min(8, "Пароль должен содержать минимум 8 символов"),
      name: z.string().optional(),
      orgName: z.string().optional(),
      workspaceName: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    if (!isTestMode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }

    if (!ctx.authApi) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Auth API недоступен",
      });
    }

    const { email, password, name, orgName, workspaceName } = input;

    try {
      // Проверяем, что пользователь не существует
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (existingUser) {
        // Удаляем существующего пользователя и все связанные данные
        await cleanupTestUser(email);
      }

      // Создаем пользователя через better-auth
      const signUpResult = await ctx.authApi.signUpEmail({
        body: {
          email,
          password,
          name: name ?? email.split("@")[0] ?? "Test User",
        },
      });

      if (!signUpResult) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать пользователя",
        });
      }

      // Получаем созданного пользователя
      const userRecord = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (!userRecord) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Пользователь не найден после создания",
        });
      }

      const userId = userRecord.id;

      // Создаем организацию
      const timestamp = Date.now();
      const orgSlug = (orgName || `test-org-${timestamp}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      const orgResult = await db
        .insert(organization)
        .values({
          name: orgName || "Test Organization",
          slug: orgSlug,
        })
        .returning();

      const org = orgResult[0];
      if (!org) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать организацию",
        });
      }

      // Добавляем пользователя в организацию как владельца
      await db.insert(organizationMember).values({
        organizationId: org.id,
        userId,
        role: "owner",
      });

      // Создаем воркспейс
      const workspaceSlug = (workspaceName || `test-workspace-${timestamp}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      const wsResult = await db
        .insert(workspace)
        .values({
          name: workspaceName || "Test Workspace",
          slug: workspaceSlug,
          organizationId: org.id,
        })
        .returning();

      const ws = wsResult[0];
      if (!ws) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать воркспейс",
        });
      }

      // Добавляем пользователя в воркспейс как владельца
      await db.insert(workspaceMember).values({
        userId,
        workspaceId: ws.id,
        role: "owner",
      });

      return {
        user: {
          id: userId,
          email: userRecord.email,
          name: userRecord.name,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        workspace: {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
        },
        dashboardUrl: `/orgs/${org.slug}/workspaces/${ws.slug}`,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при создании тестового пользователя",
        cause: error,
      });
    }
  });
