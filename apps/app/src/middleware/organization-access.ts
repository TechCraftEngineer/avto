import { OrganizationRepository } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";

import type { OrganizationMember } from "@qbs-autonaim/db/schema";
import { getSession } from "../auth/server";

const organizationRepository = new OrganizationRepository(db);

/**
 * Проверяет доступ пользователя к организации
 * Возвращает информацию об участнике если доступ есть, иначе null
 */
export async function checkOrganizationAccess(
  orgId: string,
): Promise<OrganizationMember | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const member = await organizationRepository.checkAccess(
    orgId,
    session.user.id,
  );

  return member;
}

/**
 * Проверяет доступ пользователя к организации по slug
 * Возвращает информацию об участнике если доступ есть, иначе null
 */
export async function checkOrganizationAccessBySlug(
  orgSlug: string,
): Promise<{ member: OrganizationMember; orgId: string } | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  // Получаем организацию по slug
  const org = await organizationRepository.findBySlug(orgSlug);

  if (!org) {
    return null;
  }

  // Проверяем доступ пользователя
  const member = await organizationRepository.checkAccess(
    org.id,
    session.user.id,
  );

  if (!member) {
    return null;
  }

  return { member, orgId: org.id };
}

/**
 * Требует доступ к организации, иначе выбрасывает ошибку
 * Используется в API endpoints и server actions
 */
export async function requireOrganizationAccess(
  orgId: string,
): Promise<OrganizationMember> {
  const member = await checkOrganizationAccess(orgId);

  if (!member) {
    throw new Error("Доступ к организации запрещен");
  }

  return member;
}

/**
 * Требует доступ к организации по slug, иначе выбрасывает ошибку
 */
export async function requireOrganizationAccessBySlug(
  orgSlug: string,
): Promise<{ member: OrganizationMember; orgId: string }> {
  const result = await checkOrganizationAccessBySlug(orgSlug);

  if (!result) {
    throw new Error("Доступ к организации запрещен");
  }

  return result;
}
