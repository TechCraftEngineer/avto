import { db, eq, like, or } from "@qbs-autonaim/db";
import {
  organization,
  organizationMember,
  user,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db/schema";

/**
 * Утилита для очистки тестового пользователя и всех связанных данных
 */
export async function cleanupTestUser(email: string): Promise<void> {
  // Находим пользователя
  const foundUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!foundUser) {
    return; // Пользователь не найден, нечего удалять
  }

  // Удаляем в правильном порядке (от зависимых к независимым)

  // 1. Удаляем членства в организациях и воркспейсах
  await db
    .delete(organizationMember)
    .where(eq(organizationMember.userId, foundUser.id));
  await db
    .delete(workspaceMember)
    .where(eq(workspaceMember.userId, foundUser.id));

  // 2. Удаляем воркспейсы, принадлежащие организациям пользователя
  const userOrganizations = await db.query.organization.findMany({
    with: {
      members: {
        where: eq(organizationMember.userId, foundUser.id),
      },
    },
  });

  for (const org of userOrganizations) {
    // Проверяем, является ли пользователь владельцем организации
    const isOwner = org.members.some(
      (member) => member.userId === foundUser.id && member.role === "owner",
    );

    if (isOwner) {
      // Удаляем все воркспейсы организации
      await db.delete(workspace).where(eq(workspace.organizationId, org.id));
      // Удаляем саму организацию
      await db.delete(organization).where(eq(organization.id, org.id));
    }
  }

  // 3. Удаляем самого пользователя
  await db.delete(user).where(eq(user.id, foundUser.id));
}

/**
 * Утилита для очистки всех тестовых данных
 * ВНИМАНИЕ: Работает только в test/development окружении
 */
export async function cleanupAllTestData(): Promise<void> {
  // Защита от случайного запуска в production
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.FORCE_TEST_CLEANUP
  ) {
    throw new Error(
      "cleanupAllTestData не может быть запущена в production окружении. " +
        "Установите FORCE_TEST_CLEANUP=true если действительно необходимо.",
    );
  }

  // Используем строгие префиксы для тестовых данных
  // Удаляем только организации с явными тестовыми префиксами
  const testOrgs = await db.query.organization.findMany({
    where: or(
      like(organization.slug, "e2e-test-%"),
      like(organization.slug, "ci-test-%"),
      like(organization.slug, "playwright-test-%"),
    ),
  });

  for (const org of testOrgs) {
    // Удаляем воркспейсы организации
    await db.delete(workspace).where(eq(workspace.organizationId, org.id));

    // Удаляем членства в организации
    await db
      .delete(organizationMember)
      .where(eq(organizationMember.organizationId, org.id));

    // Удаляем саму организацию
    await db.delete(organization).where(eq(organization.id, org.id));
  }

  // Удаляем только пользователей с явными тестовыми email-адресами
  const testUsers = await db.query.user.findMany({
    where: or(
      like(user.email, "e2e-test-%"),
      like(user.email, "ci-test-%"),
      like(user.email, "playwright-test-%"),
    ),
  });

  for (const testUser of testUsers) {
    // Удаляем оставшиеся членства пользователя
    await db
      .delete(organizationMember)
      .where(eq(organizationMember.userId, testUser.id));
    await db
      .delete(workspaceMember)
      .where(eq(workspaceMember.userId, testUser.id));

    // Удаляем пользователя
    await db.delete(user).where(eq(user.id, testUser.id));
  }
}
