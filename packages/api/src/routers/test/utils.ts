import {
  account,
  db,
  eq,
  like,
  or,
  organization,
  organizationMember,
  user,
  workspace,
  workspaceMember,
} from "@qbs-autonaim/db";

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

  // 3. Удаляем аккаунты пользователя
  await db.delete(account).where(eq(account.userId, foundUser.id));

  // 4. Удаляем самого пользователя
  await db.delete(user).where(eq(user.id, foundUser.id));
}

/**
 * Утилита для очистки всех тестовых данных
 */
export async function cleanupAllTestData(): Promise<void> {
  // Удаляем все тестовые организации (по префиксу или паттерну)
  const testOrgs = await db.query.organization.findMany({
    where: or(
      like(organization.name, "%Test%"),
      like(organization.slug, "test-%"),
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

  // Удаляем тестовых пользователей
  const testUsers = await db.query.user.findMany({
    where: or(
      like(user.email, "%test%"),
      like(user.email, "%example.com%"),
      like(user.name, "%Test%"),
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

    // Удаляем аккаунты пользователя
    await db.delete(account).where(eq(account.userId, testUser.id));

    // Удаляем пользователя
    await db.delete(user).where(eq(user.id, testUser.id));
  }
}
