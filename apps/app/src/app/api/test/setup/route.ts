import {
  db,
  organization,
  organizationMember,
  user,
  workspace,
} from "@qbs-autonaim/db";
import { eq } from "@qbs-autonaim/db";
import { NextResponse } from "next/server";
import { auth } from "~/auth/server";

/**
 * API endpoint для быстрого создания тестовых данных
 * Используется только в Playwright тестах
 */
export async function POST(request: Request) {
  // Проверяем что мы в dev режиме
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test API is only available in development" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, orgName, workspaceName } = body;

    // Проверяем обязательные поля
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Создаем пользователя через better-auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: name || email.split("@")[0],
      },
    });

    if (!signUpResult) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Получаем созданного пользователя
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!userRecord[0]) {
      return NextResponse.json(
        { error: "User not found after creation" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "Failed to create workspace" },
        { status: 500 },
      );
    }

    // Возвращаем данные для тестов
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Test setup error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * Удаление тестовых данных
 */
export async function DELETE(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test API is only available in development" },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test cleanup error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
