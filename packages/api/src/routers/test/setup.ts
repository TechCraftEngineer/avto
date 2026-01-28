import {
  account,
  db,
  eq,
  organization,
  organizationMember,
  user,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { generateId } from "lucia";
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

      // Создаем пользователя
      const userId = generateId(15);
      const hashedPassword = await hash(password, 12);

      await db.insert(user).values({
        id: userId,
        email,
        name: name || "Test User",
        emailVerified: true,
      });

      // Создаем аккаунт с паролем
      await db.insert(account).values({
        id: generateId(15),
        userId,
        type: "credentials",
        provider: "credentials",
        providerAccountId: userId,
        password: hashedPassword,
      });

      // Создаем организацию
      const orgId = generateId(15);
      const orgSlug = (orgName || `test-org-${Date.now()}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      await db.insert(organization).values({
        id: orgId,
        name: orgName || "Test Organization",
        slug: orgSlug,
      });

      // Создаем воркспейс
      const workspaceId = generateId(15);
      const workspaceSlug = (workspaceName || `test-workspace-${Date.now()}`)
        .toLowerCase()
        .replace(/\s+/g, "-");

      await db.insert(workspace).values({
        id: workspaceId,
        name: workspaceName || "Test Workspace",
        slug: workspaceSlug,
        organizationId: orgId,
      });

      // Добавляем пользователя в организацию и воркспейс
      await db.insert(organizationMember).values({
        userId,
        organizationId: orgId,
        role: "owner",
      });

      await db.insert(workspaceMember).values({
        userId,
        workspaceId,
        role: "owner",
      });

      return {
        user: {
          id: userId,
          email,
          name: name || "Test User",
        },
        organization: {
          id: orgId,
          name: orgName || "Test Organization",
          slug: orgSlug,
        },
        workspace: {
          id: workspaceId,
          name: workspaceName || "Test Workspace",
          slug: workspaceSlug,
        },
        dashboardUrl: `/orgs/${orgSlug}/workspaces/${workspaceSlug}`,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ошибка при создании тестового пользователя",
        cause: error,
      });
    }
  });
