import { db, eq, sql } from "@qbs-autonaim/db";
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
  .mutation(async ({ input }) => {
    if (!isTestMode) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Тестовые эндпоинты доступны только в режиме разработки",
      });
    }

    const { email, name, orgName, workspaceName } = input;

    try {
      // Проверяем, что пользователь не существует
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, email),
      });

      if (existingUser) {
        // Удаляем существующего пользователя и все связанные данные
        await cleanupTestUser(email);
      }

      // Создаем пользователя с генерацией ID через SQL функцию
      const [createdUser] = await db
        .insert(user)
        .values({
          id: sql`uuid_generate_v7()`,
          email,
          name: name || "Test User",
          emailVerified: true,
        })
        .returning();

      if (!createdUser) {
        throw new Error("Не удалось создать пользователя");
      }

      // Создаем организацию (ID генерируется автоматически)
      const orgSlug = (orgName || `test-org-${Date.now()}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      const [createdOrg] = await db
        .insert(organization)
        .values({
          name: orgName || "Test Organization",
          slug: orgSlug,
        })
        .returning();

      if (!createdOrg) {
        throw new Error("Не удалось создать организацию");
      }

      // Создаем воркспейс (ID генерируется автоматически)
      const workspaceSlug = (workspaceName || `test-workspace-${Date.now()}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      const [createdWorkspace] = await db
        .insert(workspace)
        .values({
          name: workspaceName || "Test Workspace",
          slug: workspaceSlug,
          organizationId: createdOrg.id,
        })
        .returning();

      if (!createdWorkspace) {
        throw new Error("Не удалось создать воркспейс");
      }

      // Добавляем пользователя в организацию и воркспейс
      await db.insert(organizationMember).values({
        userId: createdUser.id,
        organizationId: createdOrg.id,
        role: "owner",
      });

      await db.insert(workspaceMember).values({
        userId: createdUser.id,
        workspaceId: createdWorkspace.id,
        role: "owner",
      });

      return {
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        },
        organization: {
          id: createdOrg.id,
          name: createdOrg.name,
          slug: createdOrg.slug,
        },
        workspace: {
          id: createdWorkspace.id,
          name: createdWorkspace.name,
          slug: createdWorkspace.slug,
        },
        dashboardUrl: `/orgs/${createdOrg.slug}/workspaces/${createdWorkspace.slug}`,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при создании тестового пользователя",
        cause: error,
      });
    }
  });
