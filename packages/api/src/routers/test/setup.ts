import {
  db,
  organization,
  organizationMember,
  user,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db";
import { eq } from "@qbs-autonaim/db";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

/**
 * Создание тестового пользователя с организацией и workspace
 * Доступно только в dev режиме
 */
export const setupTestUser = publicProcedure
  .input(
    z.object({
      email: z.email(),
      password: z.string().min(8),
      name: z.string().optional(),
      orgName: z.string().optional(),
      workspaceName: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверяем что мы в dev режиме
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test API is only available in development");
    }

    // Проверяем что authApi доступен
    if (!ctx.authApi) {
      throw new Error("Auth API is not available in this context");
    }

    const { email, password, name, orgName, workspaceName } = input;

    // Создаем пользователя через better-auth
    let signUpResult:
      | Awaited<ReturnType<typeof ctx.authApi.signUpEmail>>
      | undefined;
    try {
      signUpResult = await ctx.authApi.signUpEmail({
        body: {
          email,
          password,
          name: name || email.split("@")[0] || "Test User",
        },
      });
    } catch (error) {
      console.error("Ошибка при создании пользователя через better-auth:", {
        error,
        email,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Не удалось создать пользователя: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (!signUpResult) {
      throw new Error("Failed to create user");
    }

    // Получаем созданного пользователя
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord[0]) {
      throw new Error("User not found after creation");
    }

    const userId = userRecord[0].id;

    // Создаем организацию
    const timestamp = Date.now();
    const orgSlug = `test-org-${timestamp}`;

    const orgResult = await db
      .insert(organization)
      .values({
        name: orgName || "Test Organization",
        slug: orgSlug,
      })
      .returning();

    const org = orgResult[0];
    if (!org) {
      throw new Error("Failed to create organization");
    }

    // Добавляем пользователя в организацию как владельца
    await db.insert(organizationMember).values({
      organizationId: org.id,
      userId,
      role: "owner",
    });

    // Создаем workspace
    const workspaceSlug = `test-workspace-${timestamp}`;

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
      throw new Error("Failed to create workspace");
    }

    // Добавляем пользователя в workspace как владельца
    await db.insert(workspaceMember).values({
      userId,
      workspaceId: ws.id,
      role: "owner",
    });

    // Возвращаем данные для тестов
    return {
      success: true,
      user: {
        id: userId,
        email: userRecord[0].email,
        name: userRecord[0].name,
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
  });

/**
 * Удаление тестового пользователя и всех связанных данных
 */
export const cleanupTestUser = publicProcedure
  .input(
    z.object({
      email: z.email(),
    }),
  )
  .mutation(async ({ input }) => {
    // Проверяем что мы в dev режиме
    if (process.env.NODE_ENV === "production") {
      throw new Error("Test API is only available in development");
    }

    const { email } = input;

    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (userRecord[0]) {
      const userOrgs = await db
        .select({ organizationId: organizationMember.organizationId })
        .from(organizationMember)
        .where(eq(organizationMember.userId, userRecord[0].id));

      for (const { organizationId } of userOrgs) {
        await db
          .delete(workspace)
          .where(eq(workspace.organizationId, organizationId));
        await db
          .delete(organizationMember)
          .where(eq(organizationMember.organizationId, organizationId));
        await db
          .delete(organization)
          .where(eq(organization.id, organizationId));
      }

      await db.delete(user).where(eq(user.id, userRecord[0].id));
    }

    return { success: true };
  });
